const Contract = require('../models/Contract');
const Room = require('../models/Room');
const Hostel = require('../models/Hostel');
const cloudinary = require('../config/cloudinary');
const sendEmail = require('../utils/sendEmail');

// @desc    Create contract
// @route   POST /api/contract
// @access  Private/Owner
const createContract = async (req, res) => {
	try {
		const { tenant, hostel, room, startDate, endDate, monthlyRent, securityDeposit, terms, penalties } = req.body;

		// Verify room and hostel ownership
		const roomData = await Room.findById(room).populate('hostel');
		if (!roomData) {
			return res.status(404).json({ success: false, message: 'Room not found' });
		}

		if (roomData.hostel.owner.toString() !== req.user.id) {
			return res.status(403).json({ success: false, message: 'Not authorized' });
		}

		// Generate contract number
		const contractNumber = `CNT${Date.now()}${Math.floor(Math.random() * 1000)}`;

		const contract = await Contract.create({
			contractNumber,
			tenant,
			hostel,
			room,
			owner: req.user.id,
			startDate,
			endDate,
			monthlyRent,
			securityDeposit,
			terms,
			penalties,
			status: 'pending_signatures',
		});

		// Send email to tenant
		const tenantUser = await require('../models/User').findById(tenant);
		await sendEmail({
			email: tenantUser.email,
			subject: 'New Contract - SafeStay Hub',
			message: `<h2>New Contract Created</h2><p>Contract Number: ${contractNumber}</p><p>Please review and sign the contract.</p>`,
		});

		res.status(201).json({ success: true, data: contract });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc    Get contract by ID
// @route   GET /api/contract/:id
// @access  Private
const getContract = async (req, res) => {
	try {
		const contract = await Contract.findById(req.params.id)
			.populate('tenant', 'name email phone')
			.populate('owner', 'name email phone')
			.populate('hostel', 'name address')
			.populate('room', 'roomNumber floor');

		if (!contract) {
			return res.status(404).json({ success: false, message: 'Contract not found' });
		}

		// Check if user is authorized to view
		if (
			contract.tenant.toString() !== req.user.id &&
			contract.owner.toString() !== req.user.id &&
			req.user.role !== 'master_admin'
		) {
			return res.status(403).json({ success: false, message: 'Not authorized' });
		}

		res.json({ success: true, data: contract });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc    Sign contract
// @route   PUT /api/contract/:id/sign
// @access  Private/Tenant/Owner
const signContract = async (req, res) => {
	try {
		const contract = await Contract.findById(req.params.id);

		if (!contract) {
			return res.status(404).json({ success: false, message: 'Contract not found' });
		}

		const ipAddress = req.ip || req.connection.remoteAddress;

		// Check if tenant is signing
		if (contract.tenant.toString() === req.user.id) {
			contract.tenantSignature = {
				signed: true,
				signedAt: Date.now(),
				ipAddress,
			};
		}
		// Check if owner is signing
		else if (contract.owner.toString() === req.user.id) {
			contract.ownerSignature = {
				signed: true,
				signedAt: Date.now(),
				ipAddress,
			};
		} else {
			return res.status(403).json({ success: false, message: 'Not authorized to sign this contract' });
		}

		// If both signed, activate contract
		if (contract.tenantSignature.signed && contract.ownerSignature.signed) {
			contract.status = 'active';

			// Update room occupancy
			const room = await Room.findById(contract.room);
			room.tenants.push(contract.tenant);
			room.currentOccupancy += 1;
			if (room.currentOccupancy >= room.capacity) {
				room.isAvailable = false;
			}
			await room.save();

			// Update tenant's current hostel and room
			const tenant = await require('../models/User').findById(contract.tenant);
			tenant.currentHostel = contract.hostel;
			tenant.currentRoom = contract.room;
			await tenant.save();
		}

		await contract.save();

		res.json({ success: true, data: contract });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc    Upload contract document
// @route   POST /api/contract/:id/upload
// @access  Private/Owner
const uploadContractDocument = async (req, res) => {
	try {
		const contract = await Contract.findById(req.params.id);

		if (!contract) {
			return res.status(404).json({ success: false, message: 'Contract not found' });
		}

		if (contract.owner.toString() !== req.user.id) {
			return res.status(403).json({ success: false, message: 'Not authorized' });
		}

		const file = req.file;

		const uploadPromise = new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				{ resource_type: 'auto', folder: 'safestay/contracts' },
				(error, result) => {
					if (error) reject(error);
					else resolve({ url: result.secure_url, publicId: result.public_id });
				}
			);
			stream.end(file.buffer);
		});

		const uploadedFile = await uploadPromise;

		contract.contractDocument = uploadedFile;
		await contract.save();

		res.json({ success: true, data: contract });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc    Terminate contract
// @route   PUT /api/contract/:id/terminate
// @access  Private/Owner
const terminateContract = async (req, res) => {
	try {
		const { reason } = req.body;

		const contract = await Contract.findById(req.params.id);

		if (!contract) {
			return res.status(404).json({ success: false, message: 'Contract not found' });
		}

		if (contract.owner.toString() !== req.user.id && req.user.role !== 'master_admin') {
			return res.status(403).json({ success: false, message: 'Not authorized' });
		}

		contract.status = 'terminated';
		contract.terminationReason = reason;
		contract.terminatedAt = Date.now();

		await contract.save();

		// Update room occupancy
		const room = await Room.findById(contract.room);
		room.tenants = room.tenants.filter(t => t.toString() !== contract.tenant.toString());
		room.currentOccupancy -= 1;
		room.isAvailable = true;
		await room.save();

		// Clear tenant's current hostel and room
		const tenant = await require('../models/User').findById(contract.tenant);
		tenant.currentHostel = null;
		tenant.currentRoom = null;
		await tenant.save();

		res.json({ success: true, data: contract });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc    Get all contracts for owner
// @route   GET /api/contract/owner/contracts
// @access  Private/Owner
const getOwnerContracts = async (req, res) => {
	try {
		const { status } = req.query;
		const query = { owner: req.user.id };

		if (status) query.status = status;

		const contracts = await Contract.find(query)
			.populate('tenant', 'name email phone')
			.populate('hostel', 'name')
			.populate('room', 'roomNumber')
			.sort({ createdAt: -1 });

		res.json({ success: true, data: contracts });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

module.exports = {
	createContract,
	getContract,
	signContract,
	uploadContractDocument,
	terminateContract,
	getOwnerContracts,
};