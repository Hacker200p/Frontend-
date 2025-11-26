import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LogOut, Menu, X } from 'lucide-react'
import { ownerAPI, authAPI } from '../../services/api'
import LocationPicker from '../../components/LocationPicker'
import PanoramaViewer from '../../components/PanoramaViewer'
import CubemapUpload from '../../components/CubemapUpload'

export default function OwnerDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [createMessage, setCreateMessage] = useState('')
  const [createForm, setCreateForm] = useState({
    name: '',
    address: { street: '', city: '', state: '', pincode: '' },
    description: '',
    hostelType: 'boys',
    priceRange: { min: '', max: '' },
    location: null, // { longitude, latitude }
  })
  const [mediaFiles, setMediaFiles] = useState([]) // {file, url, type}
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [editingHostel, setEditingHostel] = useState(null)
  const [showEditHostelModal, setShowEditHostelModal] = useState(false)
  const [editHostelForm, setEditHostelForm] = useState({
    name: '',
    address: { street: '', city: '', state: '', pincode: '' },
    description: '',
    hostelType: 'boys',
    priceRange: { min: '', max: '' },
    location: null,
  })
  const [editHostelMessage, setEditHostelMessage] = useState('')
  const [showEditLocationPicker, setShowEditLocationPicker] = useState(false)
  const [profile, setProfile] = useState({ 
    displayName: '', 
    contact: '', 
    email: '',
    bio: '',
    address: '',
    city: '',
    state: ''
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await authAPI.getProfile()
        const u = res.data?.data || res.data || res
        if (!mounted) return
        setProfile((p) => ({
          ...p,
          displayName: u.name || '',
          contact: u.phone || '',
          email: u.email || '',
          bio: u.bio || '',
          address: u.addressString || u.address || '',
          city: u.city || '',
          state: u.state || '',
        }))
        if (u.profileImage) {
          setProfilePicturePreview(u.profileImage)
        }
      } catch (err) {
        // silent
      }
    })()

    return () => {
      mounted = false
    }
  }, [])
  const [feedbacks, setFeedbacks] = useState([])
  const [feedbacksLoading, setFeedbacksLoading] = useState(false)
  const [hostels, setHostels] = useState([])
  const [selectedHostelId, setSelectedHostelId] = useState('')
  const selectedHostel = hostels.find((h) => h._id === selectedHostelId)
  const [roomsOpen, setRoomsOpen] = useState(false)
  const [rooms, setRooms] = useState([])
  const [roomCapacityFilter, setRoomCapacityFilter] = useState('all')
  const [roomsTab, setRoomsTab] = useState('rooms') // rooms | security
  const [editingRoom, setEditingRoom] = useState(null)
  const [editRoomForm, setEditRoomForm] = useState({
    roomNumber: '',
    roomType: 'single',
    floor: '',
    capacity: '',
    rent: '',
    securityDeposit: '',
    amenities: [],
    isAvailable: true,
    photos: [],
    videoUrl: '',
    view360Url: ''
  })
  const [editRoomMessage, setEditRoomMessage] = useState('')
  const [editRoomLoading, setEditRoomLoading] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState([])
  const [uploadedVideo, setUploadedVideo] = useState(null)
  const [uploaded360View, setUploaded360View] = useState(null)
  const [uploadedEditPanorama, setUploadedEditPanorama] = useState(null)
  const [showEditPanoramaPreview, setShowEditPanoramaPreview] = useState(false)
  const [allRooms, setAllRooms] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState({}) // Track current image for each room
  const [tenants, setTenants] = useState([])
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const [selectedTenantHostel, setSelectedTenantHostel] = useState('all')
  const [tenantSearchQuery, setTenantSearchQuery] = useState('')
  
  // Deletion requests state
  const [deletionRequests, setDeletionRequests] = useState([])
  const [pendingDeletionCount, setPendingDeletionCount] = useState(0)
  const [selectedDeletionRequest, setSelectedDeletionRequest] = useState(null)
  const [showDeletionModal, setShowDeletionModal] = useState(false)
  const [deletionResponse, setDeletionResponse] = useState('')
  const [processingDeletion, setProcessingDeletion] = useState(false)
  
  // Video modal state
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = useState('')
  
  // Add Room form state
  const [roomForm, setRoomForm] = useState({
    hostelId: '',
    roomName: '',
    roomType: 'triple',
    floor: '1',
    numberOfRooms: '1',
    pricePerNight: '',
    securityDeposit: '',
    maxOccupancy: '',
    amenities: [],
    isAvailable: true,
    panoramaData: null,
  })
  const [roomMessage, setRoomMessage] = useState('')
  const [roomLoading, setRoomLoading] = useState(false)
  
  // Panorama preview state
  const [panoramaPreview, setPanoramaPreview] = useState(null) // { file, url }
  const [showPanoramaPreview, setShowPanoramaPreview] = useState(false)

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalData, setConfirmModalData] = useState({ title: '', message: '', onConfirm: null, type: 'approve' })

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  // Preset amenity options
  const amenityOptions = [
    'WiFi',
    'AC',
    'Attached Bathroom',
    'Balcony',
    'Study Table',
    'Cupboard',
    'Window',
    'Geyser',
    'Fan',
    'LED TV',
    'Refrigerator',
    'Microwave',
    'Water Purifier',
    'Washing Machine',
    'Parking',
    'CCTV',
    '24/7 Security',
    'Elevator',
    'Power Backup',
    'Laundry Service'
  ]

  // Derived dashboard stats from real hostels data
  const stats = {
    activeHostels: hostels.length,
    roomsAvailable: hostels.reduce((sum, h) => sum + (h.availableRooms || 0), 0),
    pendingVerifications: hostels.filter((h) => h.verificationStatus === 'pending').length,
    activeTenants: tenants.filter(t => t.status === 'active').length,
  }
  const handlePickMedia = (e) => {
    const files = Array.from(e.target.files || [])
    const prepared = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
    }))
    setMediaFiles((prev) => [...prev, ...prepared])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || [])
    const prepared = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
    }))
    setMediaFiles((prev) => [...prev, ...prepared])
  }

  const removeMedia = (idx) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const fakeUpload = async () => {
    if (!selectedHostelId) {
      setCreateMessage('Please select a hostel to upload media.')
      setTimeout(() => setCreateMessage(''), 2000)
      return
    }
    try {
      const files = mediaFiles.map((m) => m.file)
      await ownerAPI.uploadHostelMedia(selectedHostelId, files)
      setCreateMessage('Media uploaded successfully.')
      setMediaFiles([])
      // refresh hostels to reflect new media
      const res = await ownerAPI.getMyHostels()
      const list = res.data?.data || []
      setHostels(list)
      if (list.length > 0 && !list.find(h => h._id === selectedHostelId)) {
        setSelectedHostelId(list[0]._id)
      }
      setTimeout(() => setCreateMessage(''), 2000)
    } catch (e) {
      setCreateMessage(e.response?.data?.message || 'Upload failed')
      setTimeout(() => setCreateMessage(''), 2500)
    }
  }

  useEffect(() => {
    // Load owner's hostels
    ownerAPI.getMyHostels()
      .then((res) => {
        const list = res.data?.data || []
        setHostels(list)
        if (list.length > 0) setSelectedHostelId(list[0]._id)
        
        // Fetch all rooms from all hostels
        fetchAllRooms(list)
      })
      .catch(() => {
        // If API fails, keep empty list; UI will still function
      })
    
    // Load tenants
    fetchTenants()
    
    // Load deletion requests
    fetchDeletionRequests()
    
    // Load feedbacks
    fetchFeedbacks()
  }, [])

  const fetchFeedbacks = async () => {
    try {
      setFeedbacksLoading(true)
      const res = await ownerAPI.getHostelFeedbacks()
      setFeedbacks(res.data?.data || [])
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
      setFeedbacks([])
    } finally {
      setFeedbacksLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      setTenantsLoading(true)
      const res = await ownerAPI.getMyTenants()
      setTenants(res.data?.data || [])
    } catch (error) {
      console.error('Error fetching tenants:', error)
      setTenants([])
    } finally {
      setTenantsLoading(false)
    }
  }

  const fetchDeletionRequests = async () => {
    try {
      const res = await ownerAPI.getDeletionRequests()
      const requests = res.data?.data || []
      setDeletionRequests(requests)
      setPendingDeletionCount(requests.filter(r => r.status === 'pending').length)
    } catch (error) {
      console.error('Error fetching deletion requests:', error)
      setDeletionRequests([])
      setPendingDeletionCount(0)
    }
  }

  const handleViewDeletionRequest = (request) => {
    setSelectedDeletionRequest(request)
    setShowDeletionModal(true)
    setDeletionResponse('')
    setActiveTab('tenants')
  }

  const handleApproveDeletionRequest = async () => {
    if (!selectedDeletionRequest) return
    
    setProcessingDeletion(true)
    try {
      await ownerAPI.approveDeletionRequest(selectedDeletionRequest._id, deletionResponse || 'Approved')
      alert('Account deletion request approved. Tenant account has been deactivated.')
      setShowDeletionModal(false)
      setSelectedDeletionRequest(null)
      setDeletionResponse('')
      await fetchDeletionRequests()
      await fetchTenants()
    } catch (error) {
      console.error('Error approving deletion request:', error)
      alert(error.response?.data?.message || 'Failed to approve deletion request')
    } finally {
      setProcessingDeletion(false)
    }
  }

  const handleRejectDeletionRequest = async () => {
    if (!selectedDeletionRequest) return
    
    if (!deletionResponse || deletionResponse.trim().length === 0) {
      alert('Please provide a reason for rejection')
      return
    }
    
    setProcessingDeletion(true)
    try {
      await ownerAPI.rejectDeletionRequest(selectedDeletionRequest._id, deletionResponse)
      alert('Account deletion request rejected')
      setShowDeletionModal(false)
      setSelectedDeletionRequest(null)
      setDeletionResponse('')
      await fetchDeletionRequests()
    } catch (error) {
      console.error('Error rejecting deletion request:', error)
      alert(error.response?.data?.message || 'Failed to reject deletion request')
    } finally {
      setProcessingDeletion(false)
    }
  }

  const handleApproveTenant = async (contractId) => {
    setConfirmModalData({
      title: 'Approve Booking',
      message: 'Are you sure you want to approve this booking? The tenant will be notified via email and SMS.',
      onConfirm: async () => {
        try {
          await ownerAPI.approveTenantContract(contractId)
          showToast('Booking approved successfully! Tenant has been notified.', 'success')
          await fetchTenants() // Refresh tenant list
        } catch (error) {
          showToast(error.response?.data?.message || 'Failed to approve booking', 'error')
        }
      },
      type: 'approve'
    })
    setShowConfirmModal(true)
  }

  const handleTerminateTenant = async (contractId) => {
    setConfirmModalData({
      title: 'Terminate Contract',
      message: 'Are you sure you want to terminate this tenant contract? This action will make the room available again and notify the tenant.',
      onConfirm: async () => {
        try {
          await ownerAPI.terminateTenantContract(contractId)
          showToast('Contract terminated successfully. Room is now available.', 'success')
          
          // Refresh data without affecting hostels list
          await fetchTenants()
          
          // Refresh rooms for all hostels
          if (hostels && hostels.length > 0) {
            await fetchAllRooms(hostels)
          }
        } catch (error) {
          showToast(error.response?.data?.message || 'Failed to terminate contract', 'error')
        }
      },
      type: 'terminate'
    })
    setShowConfirmModal(true)
  }

  const fetchAllRooms = async (hostelList) => {
    try {
      const roomsPromises = hostelList.map(hostel => 
        ownerAPI.getHostelRooms(hostel._id)
          .then(res => ({
            hostelName: hostel.name,
            hostelId: hostel._id,
            rooms: res.data?.data || []
          }))
          .catch(() => ({ hostelName: hostel.name, hostelId: hostel._id, rooms: [] }))
      )
      const results = await Promise.all(roomsPromises)
      const flatRooms = results.flatMap(item => 
        item.rooms.map(room => ({ ...room, hostelName: item.hostelName, hostelId: item.hostelId }))
      )
      setAllRooms(flatRooms)
      
      // Initialize image indices for rooms with photos
      const indices = {}
      flatRooms.forEach(room => {
        if (room.photos && room.photos.length > 0) {
          indices[room._id] = 0
        }
      })
      setCurrentImageIndex(indices)
    } catch (error) {
      console.error('Error fetching all rooms:', error)
    }
  }

  const openRoomsPanel = async (hostelId) => {
    setSelectedHostelId(hostelId)
    setRoomsOpen(true)
    setRoomsTab('rooms')
    try {
      const res = await ownerAPI.getHostelRooms(hostelId)
      setRooms(res.data?.data || [])
    } catch {
      setRooms([])
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'hostels', label: 'My Hostels', icon: '🏢' },
    { id: 'allrooms', label: 'All Rooms', icon: '🏠' },
    { id: 'create', label: 'Create Hostel', icon: '➕' },
    { id: 'addroom', label: 'Add Room', icon: '🛏️' },
    { id: 'tenants', label: 'Tenant Management', icon: '👥' },
    { id: 'media', label: 'Upload 360° Media', icon: '📸' },
    { id: 'feedback', label: 'Feedback', icon: '⭐' },
    { id: 'profile', label: 'Profile', icon: '⚙️' },
  ]

  return (
    <>
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-primary text-white transition-all duration-300 overflow-hidden fixed md:relative z-40 h-full flex flex-col`}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-8">SafeStay Hub</h1>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id ? 'bg-white text-primary font-semibold' : 'hover:bg-blue-600'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-blue-400">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-primary"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h2 className="text-2xl font-bold text-text-dark">
            {menuItems.find((item) => item.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-text-muted">Welcome, {user?.name}</div>
            <div 
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setActiveTab('profile')}
              title="View Profile"
            >
              {profilePicturePreview || user?.profileImage ? (
                <img src={profilePicturePreview || user?.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'O'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="stats-card">
                  <p className="text-text-muted text-sm mb-2">Active Hostels</p>
                  <h3 className="text-3xl font-bold text-primary">{stats.activeHostels}</h3>
                </div>
                <div className="stats-card">
                  <p className="text-text-muted text-sm mb-2">Rooms Available</p>
                  <h3 className="text-3xl font-bold text-accent">{stats.roomsAvailable}</h3>
                </div>
                <div className="stats-card">
                  <p className="text-text-muted text-sm mb-2">Pending Verifications</p>
                  <h3 className="text-3xl font-bold text-orange-500">{stats.pendingVerifications}</h3>
                </div>
                <div className="stats-card">
                  <p className="text-text-muted text-sm mb-2">Active Tenants</p>
                  <h3 className="text-3xl font-bold text-blue-600">{stats.activeTenants}</h3>
                </div>
              </div>

              <div className="card">
                <h3 className="text-2xl font-bold mb-4 text-text-dark">Quick Actions</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    className="btn-primary"
                    onClick={() => setActiveTab('create')}
                  >
                    Create New Hostel
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setActiveTab('tenants')}
                  >
                    View Tenant Requests
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setActiveTab('media')}
                  >
                    Upload Media
                  </button>
                </div>
              </div>

              {pendingDeletionCount > 0 && (
                <div className="card border-2 border-orange-300 bg-orange-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-orange-800 mb-2">⚠️ Pending Account Deletion Requests</h3>
                      <p className="text-orange-700 mb-4">
                        You have <strong>{pendingDeletionCount}</strong> tenant{pendingDeletionCount > 1 ? 's' : ''} requesting account deletion
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('tenants')}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
                    >
                      Review Requests
                    </button>
                  </div>
                </div>
              )}

              <div className="card">
                <h3 className="text-2xl font-bold mb-4 text-text-dark">Recent Activity</h3>
                <div className="chart">
                  <p className="p-4">Activity chart coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hostels' && (
            <div className="card">
              <h3 className="text-2xl font-bold mb-4 text-text-dark">My Hostels</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">City</th>
                      <th className="px-4 py-2 text-left">Rooms</th>
                      <th className="px-4 py-2 text-left">Available</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hostels.map((h) => (
                      <tr className="border-b" key={h._id}>
                        <td className="px-4 py-2">{h._id}</td>
                        <td className="px-4 py-2">{h.name}</td>
                        <td className="px-4 py-2">{h.address?.city || '-'}</td>
                        <td className="px-4 py-2">{h.totalRooms ?? '-'}</td>
                        <td className="px-4 py-2">{h.availableRooms ?? '-'}</td>
                        <td className="px-4 py-2 space-x-2">
                          <button
                            className="text-primary text-sm hover:underline"
                            onClick={() => {
                              setEditingHostel(h)
                              setEditHostelForm({
                                name: h.name || '',
                                address: h.address || { street: '', city: '', state: '', pincode: '' },
                                description: h.description || '',
                                hostelType: h.hostelType || 'boys',
                                priceRange: h.priceRange || { min: '', max: '' },
                                location: h.location?.coordinates ? {
                                  longitude: h.location.coordinates[0],
                                  latitude: h.location.coordinates[1]
                                } : null,
                              })
                              setShowEditHostelModal(true)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="reject-btn text-xs"
                            onClick={async () => {
                              if (!confirm('Delete this hostel? This will remove its rooms and media.')) return
                              await ownerAPI.deleteHostel(h._id)
                              const res = await ownerAPI.getMyHostels()
                              const list = res.data?.data || []
                              setHostels(list)
                            }}
                          >
                            Delete
                          </button>
                          <button
                            className="btn-secondary text-xs"
                            onClick={() => openRoomsPanel(h._id)}
                          >
                            Manage Rooms
                          </button>
                          <button
                            className="approve-btn text-xs"
                            onClick={async () => {
                              setSelectedHostelId(h._id)
                              setActiveTab('media')
                            }}
                          >
                            Manage Media
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'allrooms' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-text-dark">All Rooms ({allRooms.length})</h3>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('=== DEBUG INFO ===')
                      console.log('All Rooms Data:', allRooms)
                      console.log('Hostels:', hostels)
                      console.log('Current Image Indices:', currentImageIndex)
                      console.log('Total Rooms:', allRooms.length)
                      
                      // Show first 5 rooms in detail
                      console.log('\n=== FIRST 5 ROOMS DETAILED ===')
                      allRooms.slice(0, 5).forEach(room => {
                        console.log(`\n--- Room ${room.roomNumber} ---`)
                        console.log('Hostel Name:', room.hostelName)
                        console.log('Photos Array:', room.photos)
                        console.log('Photos Count:', room.photos?.length || 0)
                        if (room.photos && room.photos.length > 0) {
                          room.photos.forEach((photo, idx) => {
                            console.log(`  Photo ${idx + 1}:`, photo)
                            console.log(`    URL: ${photo.url || photo}`)
                          })
                        }
                        console.log('Has Photos:', !!(room.photos && room.photos.length > 0))
                        console.log('Video URL:', room.videoUrl || 'None')
                        console.log('360 URL:', room.view360Url || 'None')
                      })
                      
                      // Count rooms with/without photos
                      const withPhotos = allRooms.filter(r => r.photos && r.photos.length > 0).length
                      const withoutPhotos = allRooms.length - withPhotos
                      console.log('\n=== SUMMARY ===')
                      console.log(`Rooms with photos: ${withPhotos}`)
                      console.log(`Rooms without photos: ${withoutPhotos}`)
                      
                      alert(`Debug info logged!\n\nTotal: ${allRooms.length} rooms\nWith Photos: ${withPhotos}\nWithout Photos: ${withoutPhotos}\n\nCheck console (F12) for details.`)
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-semibold cursor-pointer"
                  >
                    🔍 Debug
                  </button>
                  <button 
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('Refreshing all rooms...')
                      await fetchAllRooms(hostels)
                      console.log('Rooms refreshed!')
                      alert('Rooms refreshed successfully!')
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm font-semibold cursor-pointer"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
              
              {allRooms.length === 0 ? (
                <div className="card text-center py-12">
                  <div className="text-6xl mb-4">🏠</div>
                  <h4 className="text-xl font-semibold text-text-dark mb-2">No Rooms Available</h4>
                  <p className="text-text-muted">Add rooms to your hostels to see them here</p>
                  <button 
                    onClick={() => setActiveTab('addroom')}
                    className="btn-primary mt-4"
                  >
                    Add Room
                  </button>
                </div>
              ) : (
                <>
                  {/* Group rooms by hostel */}
                  {hostels.map((hostel) => {
                    const hostelRooms = allRooms.filter(room => room.hostelId === hostel._id)
                    
                    if (hostelRooms.length === 0) return null
                    
                    return (
                      <div key={hostel._id} className="space-y-4">
                        {/* Hostel Header */}
                        <div className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl p-6 shadow-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-2xl font-bold mb-2">🏢 {hostel.name}</h4>
                              <p className="text-blue-100">
                                📍 {hostel.address?.city}, {hostel.address?.state} | 
                                🛏️ {hostelRooms.length} Room{hostelRooms.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => openRoomsPanel(hostel._id)}
                              className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-gray-100 transition font-semibold"
                            >
                              Manage Rooms →
                            </button>
                          </div>
                        </div>
                        
                        {/* Rooms Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {hostelRooms.map((room) => {
                            const hasPhotos = room.photos && room.photos.length > 0
                            const hasVideo = room.videoUrl
                            const currentIdx = currentImageIndex[room._id] || 0
                            
                            // Debug: log room data to check photo structure
                            if (hasPhotos) {
                              console.log(`Room ${room.roomNumber} photos:`, room.photos)
                            }
                    
                    return (
                      <div key={room._id} className="card overflow-hidden hover:shadow-xl transition-shadow">
                        {/* Image/Video Section */}
                        <div className="relative bg-gray-100 h-56">
                          {hasPhotos ? (
                            <>
                              <img 
                                src={room.photos[currentIdx]?.url || room.photos[currentIdx]} 
                                alt={`Room ${room.roomNumber}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Image failed to load:', room.photos[currentIdx])
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
                                }}
                              />
                              
                              {/* Image Counter Badge */}
                              {room.photos.length > 1 && (
                                <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                  {currentIdx + 1} / {room.photos.length}
                                </div>
                              )}
                              
                              {/* Navigation Arrows */}
                              {room.photos.length > 1 && (
                                <>
                                  <button
                                    onClick={() => {
                                      setCurrentImageIndex(prev => ({
                                        ...prev,
                                        [room._id]: currentIdx === 0 ? room.photos.length - 1 : currentIdx - 1
                                      }))
                                    }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                                  >
                                    ←
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCurrentImageIndex(prev => ({
                                        ...prev,
                                        [room._id]: currentIdx === room.photos.length - 1 ? 0 : currentIdx + 1
                                      }))
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                                  >
                                    →
                                  </button>
                                </>
                              )}
                              
                              {/* Media Indicators */}
                              <div className="absolute bottom-3 left-3 flex gap-2">
                                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                                  📷 {room.photos.length}
                                </span>
                                {hasVideo && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCurrentVideoUrl(room.videoUrl)
                                      setShowVideoModal(true)
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition cursor-pointer"
                                  >
                                    🎥 Video
                                  </button>
                                )}
                                {room.panorama?.url && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPanoramaPreview({
                                        file: null,
                                        url: room.panorama.url
                                      })
                                      setShowPanoramaPreview(true)
                                    }}
                                    className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-2 py-1 rounded transition cursor-pointer"
                                  >
                                    🎯 360° View
                                  </button>
                                )}
                                {room.view360Url && (
                                  <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded">
                                    🌐 360°
                                  </span>
                                )}
                              </div>
                            </>
                          ) : hasVideo ? (
                            <div 
                              className="relative w-full h-full cursor-pointer group"
                              onClick={() => {
                                setCurrentVideoUrl(room.videoUrl)
                                setShowVideoModal(true)
                              }}
                            >
                              <video 
                                src={room.videoUrl} 
                                className="w-full h-full object-cover"
                                muted
                              />
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition flex items-center justify-center">
                                <div className="bg-white rounded-full p-4 group-hover:scale-110 transition">
                                  <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                  </svg>
                                </div>
                              </div>
                              <div className="absolute bottom-3 left-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentVideoUrl(room.videoUrl)
                                    setShowVideoModal(true)
                                  }}
                                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition cursor-pointer"
                                >
                                  🎥 Video
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
                              <div className="text-center p-4">
                                <div className="text-6xl mb-2">📷</div>
                                <p className="text-sm font-semibold text-gray-600 mb-1">No photos uploaded</p>
                                <p className="text-xs text-gray-500">Click Edit to add media</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Availability Badge */}
                          <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${
                            room.isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {room.isAvailable ? '✓ Available' : '✗ Occupied'}
                          </div>
                        </div>
                        
                        {/* Room Details */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-lg font-bold text-text-dark">
                                Room {room.roomNumber}
                              </h4>
                              <p className="text-sm text-text-muted">{room.hostelName}</p>
                            </div>
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold uppercase">
                              {room.roomType}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm text-text-muted mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">🏢 Floor:</span>
                              <span>{room.floor}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">👥 Capacity:</span>
                              <span>{room.capacity} persons</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">💰 Rent:</span>
                              <span className="text-green-600 font-bold">₹{room.rent}/month</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">🔒 Deposit:</span>
                              <span>₹{room.securityDeposit}</span>
                            </div>
                          </div>
                          
                          {/* Amenities */}
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-text-dark mb-2">Amenities:</p>
                              <div className="flex flex-wrap gap-1">
                                {room.amenities.slice(0, 4).map((amenity, idx) => (
                                  <span 
                                    key={idx}
                                    className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                                {room.amenities.length > 4 && (
                                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                    +{room.amenities.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="space-y-2 pt-3 border-t">
                            {/* Debug - Show all room data */}
                            {console.log('Room', room.roomNumber, 'Full Data:', JSON.stringify({
                              id: room._id,
                              roomNumber: room.roomNumber,
                              panorama: room.panorama,
                              hasPanorama: !!room.panorama,
                              panoramaUrl: room.panorama?.url
                            }, null, 2))}
                            
                            {/* Primary Actions Row */}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoom(room)
                                  setEditRoomForm({
                                    roomNumber: room.roomNumber,
                                    roomType: room.roomType,
                                    floor: room.floor,
                                    capacity: room.capacity,
                                    rent: room.rent,
                                    securityDeposit: room.securityDeposit,
                                    amenities: room.amenities || [],
                                    isAvailable: room.isAvailable,
                                    photos: room.photos || [],
                                    videoUrl: room.videoUrl || '',
                                    view360Url: room.view360Url || ''
                                  })
                                  setUploadedPhotos([])
                                  setUploadedVideo(null)
                                  setUploaded360View(null)
                                  setEditRoomMessage('')
                                }}
                                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm font-semibold"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => openRoomsPanel(room.hostelId)}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
                              >
                                🏢 View Hostel
                              </button>
                            </div>
                            
                            {/* View 360° Panorama Button - Show if panorama exists */}
                            {(room.panorama && room.panorama.url) ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  console.log('Opening panorama for room:', room.roomNumber)
                                  console.log('Panorama URL:', room.panorama.url)
                                  setPanoramaPreview({
                                    file: null,
                                    url: room.panorama.url
                                  })
                                  setShowPanoramaPreview(true)
                                }}
                                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2.5 rounded-lg hover:from-purple-600 hover:to-purple-700 transition text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
                              >
                                <span className="text-lg">🎯</span>
                                <span>View 360° Panorama</span>
                              </button>
                            ) : (
                              <div className="w-full bg-gray-100 text-gray-500 py-2 rounded-lg text-xs text-center italic">
                                <div>No 360° panorama - Room ID: {room._id}</div>
                                <div className="mt-1 text-[10px]">Panorama: {JSON.stringify(room.panorama)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="card max-w-4xl">
              <h3 className="text-2xl font-bold mb-4 text-text-dark">Create New Hostel</h3>
              {createMessage && (
                <div className="mb-4 p-3 bg-success/10 border border-success text-success rounded-lg text-sm">
                  {createMessage}
                </div>
              )}
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault()
                  try {
                    const payload = {
                      name: createForm.name,
                      address: createForm.address,
                      description: createForm.description,
                      hostelType: createForm.hostelType,
                      priceRange: {
                        min: Number(createForm.priceRange.min) || 0,
                        max: Number(createForm.priceRange.max) || 0,
                      },
                    }
                    
                    // Add location if selected
                    if (createForm.location) {
                      payload.location = {
                        type: 'Point',
                        coordinates: [createForm.location.longitude, createForm.location.latitude]
                      }
                    }
                    
                    await ownerAPI.createHostel(payload)
                    setCreateMessage('Hostel created successfully.')
                    // reload list
                    const res = await ownerAPI.getMyHostels()
                    const list = res.data?.data || []
                    setHostels(list)
                    if (list.length > 0) setSelectedHostelId(list[0]._id)
                    // reset form
                    setCreateForm({
                      name: '',
                      address: { street: '', city: '', state: '', pincode: '' },
                      description: '',
                      hostelType: 'boys',
                      priceRange: { min: '', max: '' },
                      location: null,
                    })
                    setTimeout(() => setCreateMessage(''), 2500)
                  } catch (err) {
                    setCreateMessage(err.response?.data?.message || 'Failed to create hostel')
                    setTimeout(() => setCreateMessage(''), 3000)
                  }
                }}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Hostel Name"
                    className="input"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Street"
                      className="input"
                      value={createForm.address.street}
                      onChange={(e) => setCreateForm((f) => ({ ...f, address: { ...f.address, street: e.target.value } }))}
                    />
                    {createForm.address.street && createForm.location && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600">Auto-filled</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="City"
                      className="input"
                      value={createForm.address.city}
                      onChange={(e) => setCreateForm((f) => ({ ...f, address: { ...f.address, city: e.target.value } }))}
                    />
                    {createForm.address.city && createForm.location && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600">Auto-filled</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="State"
                      className="input"
                      value={createForm.address.state}
                      onChange={(e) => setCreateForm((f) => ({ ...f, address: { ...f.address, state: e.target.value } }))}
                    />
                    {createForm.address.state && createForm.location && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600">Auto-filled</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Pincode"
                      className="input"
                      value={createForm.address.pincode}
                      onChange={(e) => setCreateForm((f) => ({ ...f, address: { ...f.address, pincode: e.target.value } }))}
                    />
                    {createForm.address.pincode && createForm.location && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600">Auto-filled</span>
                    )}
                  </div>
                  <select
                    className="input"
                    value={createForm.hostelType}
                    onChange={(e) => setCreateForm((f) => ({ ...f, hostelType: e.target.value }))}
                  >
                    <option value="boys">Boys Only</option>
                    <option value="girls">Girls Only</option>
                    <option value="coed">Co-ed</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Min Price (₹)"
                    className="input"
                    value={createForm.priceRange.min}
                    onChange={(e) => setCreateForm((f) => ({ ...f, priceRange: { ...f.priceRange, min: e.target.value } }))}
                  />
                  <input
                    type="number"
                    placeholder="Max Price (₹)"
                    className="input"
                    value={createForm.priceRange.max}
                    onChange={(e) => setCreateForm((f) => ({ ...f, priceRange: { ...f.priceRange, max: e.target.value } }))}
                  />
                </div>
                <textarea
                  placeholder="Description"
                  className="input w-full h-32"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                />
                
                {/* Photo Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <h4 className="font-semibold text-gray-700 mb-3">Hostel Photos (First photo will be used on map)</h4>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files)
                      const prepared = files.map((file) => ({
                        file,
                        url: URL.createObjectURL(file),
                        type: 'photo'
                      }))
                      setMediaFiles((prev) => [...prev, ...prepared])
                    }}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                  />
                  
                  {/* Photo Preview Grid */}
                  {mediaFiles.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {mediaFiles.map((m, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={m.url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                          />
                          {idx === 0 && (
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                              Map Pin
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setMediaFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location Picker Button */}
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-700">Hostel Location on Map</h4>
                    {createForm.location && (
                      <span className="text-sm text-green-600 font-semibold">✓ Location Set</span>
                    )}
                  </div>
                  {createForm.location && (
                    <p className="text-xs text-gray-600 mb-3">
                      Coordinates: {createForm.location.latitude.toFixed(6)}, {createForm.location.longitude.toFixed(6)}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition font-semibold flex items-center justify-center gap-2"
                  >
                    <span>📍</span>
                    {createForm.location ? 'Change Location' : 'Select Location on Map'}
                  </button>
                </div>

                <button type="submit" className="submit-btn">Create Hostel</button>
              </form>
            </div>
          )}

          {activeTab === 'tenants' && (
            <div className="space-y-6">
              {/* Deletion Requests Section */}
              {deletionRequests.filter(r => r.status === 'pending').length > 0 && (
                <div className="card border-2 border-orange-300 bg-orange-50">
                  <h3 className="text-xl font-bold text-orange-800 mb-4">🚨 Account Deletion Requests</h3>
                  <div className="space-y-3">
                    {deletionRequests.filter(r => r.status === 'pending').map((request) => (
                      <div key={request._id} className="bg-white p-4 rounded-lg border border-orange-200 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{request.tenant?.name}</p>
                          <p className="text-sm text-gray-600">📧 {request.tenant?.email} • 📞 {request.tenant?.phone}</p>
                          <p className="text-sm text-gray-600 mt-1">🏢 {request.hostel?.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Requested: {new Date(request.requestedAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewDeletionRequest(request)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
                        >
                          Review Request
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-800">Tenant Management</h3>
                      <p className="text-sm text-gray-600">Monitor and manage your tenant contracts</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Filter by Hostel</label>
                      <select
                        value={selectedTenantHostel}
                        onChange={(e) => setSelectedTenantHostel(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                      >
                        <option value="all">🏢 All Hostels</option>
                        {hostels.map((h) => (
                          <option key={h._id} value={h._id}>🏨 {h.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[250px]">
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Search Tenants</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={tenantSearchQuery}
                          onChange={(e) => setTenantSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                      </div>
                    </div>
                  </div>
                </div>

                {tenantsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                      <p className="text-text-muted">Loading tenants...</p>
                    </div>
                  </div>
                ) : tenants.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-dashed border-blue-200">
                    <div className="text-7xl mb-4">👥</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No Tenants Yet</h3>
                    <p className="text-gray-600 mb-4">You don't have any active tenants at the moment.</p>
                    <p className="text-sm text-gray-500">Tenants will appear here once they book a room</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tenants
                      .filter(t => {
                        if (selectedTenantHostel !== 'all' && t.hostel._id !== selectedTenantHostel) return false
                        if (tenantSearchQuery && !(
                          t.tenant?.name?.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
                          t.tenant?.email?.toLowerCase().includes(tenantSearchQuery.toLowerCase())
                        )) return false
                        return true
                      })
                      .map((contract) => (
                        <div 
                          key={contract._id} 
                          className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300"
                        >
                          <div className="flex flex-wrap items-start gap-6">
                            {/* Tenant Info */}
                            <div className="flex items-center gap-4 flex-1 min-w-[250px]">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">
                                {contract.tenant?.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-lg text-gray-800 mb-1">{contract.tenant?.name || 'N/A'}</h4>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <span>📧</span>
                                    <span className="truncate">{contract.tenant?.email || 'N/A'}</span>
                                  </p>
                                  <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <span>📞</span>
                                    <span>{contract.tenant?.phone || 'N/A'}</span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Room & Hostel Info */}
                            <div className="flex-1 min-w-[200px]">
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">🏨</span>
                                  <div>
                                    <p className="font-semibold text-gray-800">{contract.hostel?.name || 'N/A'}</p>
                                    <p className="text-xs text-gray-600">{contract.hostel?.address?.city}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-200">
                                  <span className="text-2xl">🚪</span>
                                  <div>
                                    <p className="font-bold text-blue-600 text-xl">Room {contract.room?.roomNumber || 'N/A'}</p>
                                    <p className="text-xs text-gray-600 capitalize">{contract.room?.roomType} • Floor {contract.room?.floor}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Status & Financial Info */}
                            <div className="flex-1 min-w-[200px]">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Status</p>
                                  <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                                    contract.status === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                                    contract.status === 'pending_signatures' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                                    'bg-gray-200 text-gray-700'
                                  }`}>
                                    {contract.status === 'active' ? '✓ Active' : 
                                     contract.status === 'pending_signatures' ? '⏳ Pending' : 
                                     contract.status}
                                  </span>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                                  <p className="text-xs text-gray-600 mb-1">Monthly Rent</p>
                                  <p className="font-bold text-2xl text-green-600">₹{contract.monthlyRent || 'N/A'}</p>
                                  <p className="text-xs text-gray-600 mt-1">Deposit: ₹{contract.securityDeposit || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Start Date</p>
                                  <p className="text-sm font-semibold text-gray-800">
                                    📅 {contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-IN', { 
                                      day: '2-digit', 
                                      month: 'short', 
                                      year: 'numeric' 
                                    }) : 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 min-w-[150px]">
                              {(contract.status === 'pending_signatures' || contract.status === 'draft') && (
                                <button
                                  onClick={() => handleApproveTenant(contract._id)}
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                  <span>✓</span>
                                  <span>Accept</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleTerminateTenant(contract._id)}
                                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                              >
                                <span>✕</span>
                                <span>Terminate</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Summary Cards */}
              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl">👥</span>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">✓</span>
                    </div>
                  </div>
                  <p className="text-blue-100 text-sm mb-2 font-medium">Total Active Tenants</p>
                  <h3 className="text-5xl font-bold">{tenants.filter(t => t.status === 'active').length}</h3>
                  <p className="text-blue-100 text-xs mt-2">Currently residing in your hostels</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl">⏳</span>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📋</span>
                    </div>
                  </div>
                  <p className="text-yellow-100 text-sm mb-2 font-medium">Pending Contracts</p>
                  <h3 className="text-5xl font-bold">{tenants.filter(t => t.status === 'pending_signatures').length}</h3>
                  <p className="text-yellow-100 text-xs mt-2">Awaiting approval or signatures</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-xl text-white transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl">💰</span>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">₹</span>
                    </div>
                  </div>
                  <p className="text-green-100 text-sm mb-2 font-medium">Monthly Revenue</p>
                  <h3 className="text-4xl font-bold">₹{tenants.filter(t => t.status === 'active').reduce((sum, t) => sum + (t.monthlyRent || 0), 0).toLocaleString()}</h3>
                  <p className="text-green-100 text-xs mt-2">From active tenant contracts</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="card">
              <h3 className="text-2xl font-bold mb-4 text-text-dark">Upload 360° Media</h3>

              <div className="mb-3">
                <label className="block text-sm font-medium text-text-dark mb-1">Select Hostel</label>
                <select
                  className="input"
                  value={selectedHostelId}
                  onChange={(e) => setSelectedHostelId(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">-- Choose a hostel --</option>
                  {hostels.map((h) => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div
                className="upload-btn mb-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('mediaPicker')?.click()}
              >
                <p className="text-text-muted text-center">
                  Drag & drop photos/videos here or click to select
                </p>
                <input
                  id="mediaPicker"
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={handlePickMedia}
                />
              </div>

              {mediaFiles.length > 0 && (
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  {mediaFiles.map((m, idx) => (
                    <div className="relative" key={idx}>
                      {m.type === 'video' ? (
                        <video src={m.url} className="w-full rounded-lg" controls />
                      ) : (
                        <img src={m.url} alt="preview" className="w-full rounded-lg" />
                      )}
                      <button
                        className="reject-btn absolute top-2 right-2 text-xs px-2 py-1"
                        onClick={() => removeMedia(idx)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedHostel && (selectedHostel.photos?.length > 0 || selectedHostel.video360?.length > 0) && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2 text-text-dark">
                    Current Media ({selectedHostel.photos?.length || 0} photos, {selectedHostel.video360?.length || 0} videos)
                  </h4>
                  <div className="grid md:grid-cols-4 gap-3">
                    {(selectedHostel.photos || []).slice(0, 8).map((p) => (
                      <div key={p.publicId} className="relative">
                        <img src={p.url} className="w-full rounded-lg" alt="hostel" />
                        <button
                          className="reject-btn absolute top-2 right-2 text-xs px-2 py-1"
                          type="button"
                          onClick={async () => {
                            await ownerAPI.deleteMedia(selectedHostel._id, p.publicId)
                            const res = await ownerAPI.getMyHostels()
                            setHostels(res.data?.data || [])
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    {(selectedHostel.video360 || []).slice(0, 4).map((v) => (
                      <div key={v.publicId} className="relative">
                        <video src={v.url} className="w-full rounded-lg" controls />
                        <button
                          className="reject-btn absolute top-2 right-2 text-xs px-2 py-1"
                          type="button"
                          onClick={async () => {
                            await ownerAPI.deleteMedia(selectedHostel._id, v.publicId)
                            const res = await ownerAPI.getMyHostels()
                            setHostels(res.data?.data || [])
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  className="btn-accent"
                  onClick={fakeUpload}
                  type="button"
                  disabled={mediaFiles.length === 0}
                >
                  Upload Selected ({mediaFiles.length})
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => setMediaFiles([])}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-text-dark">⭐ Tenant Feedbacks</h3>
                  <p className="text-sm text-gray-600 mt-1">Reviews and ratings from your tenants</p>
                </div>
                <button
                  onClick={fetchFeedbacks}
                  className="btn-secondary text-sm"
                >
                  🔄 Refresh
                </button>
              </div>

              {feedbacksLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-text-muted">Loading feedbacks...</p>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⭐</div>
                  <p className="text-text-muted text-lg">No feedbacks yet</p>
                  <p className="text-sm text-gray-500 mt-2">Tenant reviews will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <div key={feedback._id} className="border-2 rounded-xl p-5 hover:shadow-lg transition bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-lg text-text-dark">{feedback.user?.name || 'Anonymous'}</h4>
                            <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                              <span className="text-yellow-600 font-bold">★ {feedback.rating}</span>
                            </div>
                          </div>
                          <div className="text-sm text-text-muted space-y-1">
                            <p><span className="font-semibold">🏠 Hostel:</span> {feedback.targetId?.name || 'Unknown'}</p>
                            <p><span className="font-semibold">📅 Date:</span> {new Date(feedback.createdAt).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric'
                            })}</p>
                          </div>
                        </div>
                      </div>

                      {/* Review Comment */}
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <p className="text-gray-700 text-sm leading-relaxed">{feedback.comment}</p>
                      </div>

                      {/* Star Rating Visual */}
                      <div className="flex items-center gap-1 mt-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span 
                            key={star} 
                            className={`text-xl ${star <= feedback.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addroom' && (
            <div className="p-8 bg-background min-h-screen">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add Room</h2>
              
              <div className="card max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-md">
                {roomMessage && (
                  <div className={`mb-4 p-3 rounded-lg ${roomMessage.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {roomMessage}
                  </div>
                )}

                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setRoomLoading(true)
                    setRoomMessage('')
                    
                    try {
                      console.log('Form submitted')
                      console.log('Hostel ID:', roomForm.hostelId)
                      
                      if (!roomForm.hostelId) {
                        setRoomMessage('Please select a hostel')
                        setRoomLoading(false)
                        return
                      }

                      // Prepare room data for API
                      const roomData = {
                        roomNumber: roomForm.roomName,
                        roomType: roomForm.roomType.toLowerCase(),
                        capacity: parseInt(roomForm.maxOccupancy),
                        rent: parseFloat(roomForm.pricePerNight),
                        securityDeposit: parseFloat(roomForm.securityDeposit),
                        numberOfRooms: parseInt(roomForm.numberOfRooms),
                        floor: parseInt(roomForm.floor),
                        amenities: roomForm.amenities,
                        isAvailable: roomForm.isAvailable,
                      }

                      console.log('Room data to send:', roomData)

                      // Call API to create room(s)
                      const response = await ownerAPI.createRoom(roomForm.hostelId, roomData)
                      
                      console.log('API Response:', response)
                      
                      // Upload panorama if available
                      if (roomForm.panoramaData && response.data?.data) {
                        const createdRooms = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
                        
                        // Upload panorama to the first created room
                        if (createdRooms.length > 0) {
                          try {
                            console.log('Uploading panorama to room:', createdRooms[0]._id)
                            
                            // Fetch the panorama image from Python service
                            const panoramaUrl = `http://localhost:5001${roomForm.panoramaData.url}`
                            const panoramaBlob = await fetch(panoramaUrl).then(r => r.blob())
                            
                            // Upload to room
                            const formData = new FormData()
                            formData.append('panorama', panoramaBlob, 'panorama.jpg')
                            
                            await ownerAPI.uploadRoomMedia(createdRooms[0]._id, formData)
                            console.log('Panorama uploaded successfully')
                          } catch (panoramaErr) {
                            console.error('Failed to upload panorama:', panoramaErr)
                          }
                        }
                      }
                      
                      setRoomMessage(`${roomForm.numberOfRooms} room(s) added successfully!`)
                      setPanoramaPreview(null)
                      
                      // Refresh hostels list
                      const hostelResp = await ownerAPI.getMyHostels()
                      if (hostelResp?.data?.data) {
                        setHostels(hostelResp.data.data)
                        // Refresh all rooms list
                        fetchAllRooms(hostelResp.data.data)
                      }
                      
                      setTimeout(() => {
                        setRoomMessage('')
                        setRoomForm({
                          hostelId: roomForm.hostelId,
                          roomName: '',
                          roomType: 'triple',
                          floor: '1',
                          numberOfRooms: '1',
                          pricePerNight: '',
                          securityDeposit: '',
                          maxOccupancy: '',
                          amenities: [],
                          isAvailable: true,
                          panoramaData: null,
                        })
                      }, 2000)
                    } catch (err) {
                      console.error('Error adding room:', err)
                      console.error('Error response:', err.response)
                      const errorMessage = err.response?.data?.message || err.message || 'Failed to add room(s)'
                      setRoomMessage(errorMessage)
                    } finally {
                      setRoomLoading(false)
                    }
                  }}
                >
                  {/* Select Hostel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Hostel <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input w-full"
                      value={roomForm.hostelId}
                      onChange={(e) => setRoomForm({ ...roomForm, hostelId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose a Hostel --</option>
                      {hostels.map((hostel) => (
                        <option key={hostel._id} value={hostel._id}>
                          {hostel.name} - {hostel.address?.city || hostel.address?.street || 'No address'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room Number/Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Number/Name
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      value={roomForm.roomName}
                      onChange={(e) => setRoomForm({ ...roomForm, roomName: e.target.value })}
                      placeholder="A-101"
                      required
                    />
                  </div>

                  {/* Room Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Type
                    </label>
                    <select
                      className="input w-full"
                      value={roomForm.roomType}
                      onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                      required
                    >
                      <option value="single">Single</option>
                      <option value="double">Double</option>
                      <option value="triple">Triple</option>
                      <option value="quad">Quad</option>
                    </select>
                  </div>

                  {/* Floor Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Floor Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="input w-full"
                      value={roomForm.floor}
                      onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                      placeholder="1"
                      min="0"
                      max="50"
                      required
                    />
                  </div>

                  {/* Number of Rooms to Add */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Rooms to Add
                    </label>
                    <input
                      type="number"
                      className="input w-full"
                      value={roomForm.numberOfRooms}
                      onChange={(e) => setRoomForm({ ...roomForm, numberOfRooms: e.target.value })}
                      placeholder="100"
                      min="1"
                      max="500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will create {roomForm.numberOfRooms} room(s) of this type
                    </p>
                  </div>

                  {/* Monthly Rent */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Rent (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="input w-full"
                      value={roomForm.pricePerNight}
                      onChange={(e) => setRoomForm({ ...roomForm, pricePerNight: e.target.value })}
                      placeholder="30000"
                      min="0"
                      required
                    />
                  </div>

                  {/* Security Deposit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Security Deposit (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="input w-full"
                      value={roomForm.securityDeposit}
                      onChange={(e) => setRoomForm({ ...roomForm, securityDeposit: e.target.value })}
                      placeholder="4000"
                      min="0"
                      required
                    />
                  </div>

                  {/* Max Occupancy */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Occupancy
                    </label>
                    <input
                      type="number"
                      className="input w-full"
                      value={roomForm.maxOccupancy}
                      onChange={(e) => setRoomForm({ ...roomForm, maxOccupancy: e.target.value })}
                      placeholder="3"
                      min="1"
                      required
                    />
                  </div>

                  {/* Amenities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amenities (Optional)
                    </label>
                    
                    {/* Display selected amenities as tags */}
                    {roomForm.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        {roomForm.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-full text-sm"
                          >
                            {amenity}
                            <button
                              type="button"
                              onClick={() => {
                                setRoomForm({
                                  ...roomForm,
                                  amenities: roomForm.amenities.filter((_, i) => i !== index)
                                })
                              }}
                              className="hover:bg-red-500 rounded-full p-0.5 ml-1"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Dropdown to add amenities */}
                    <select
                      className="input w-full"
                      value=""
                      onChange={(e) => {
                        const selectedAmenity = e.target.value
                        if (selectedAmenity && !roomForm.amenities.includes(selectedAmenity)) {
                          setRoomForm({
                            ...roomForm,
                            amenities: [...roomForm.amenities, selectedAmenity]
                          })
                        }
                      }}
                    >
                      <option value="">-- Select Amenity to Add --</option>
                      {amenityOptions
                        .filter(option => !roomForm.amenities.includes(option))
                        .map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select amenities from the dropdown. Click ✕ to remove.
                    </p>
                  </div>

                  {/* Availability Toggle */}
                  <div className="flex items-center gap-3 py-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={roomForm.isAvailable}
                        onChange={(e) => setRoomForm({ ...roomForm, isAvailable: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-700">
                      Available
                    </span>
                  </div>

                  {/* Cubemap Upload Section */}
                  <div className="border-t pt-6 mt-6">
                    <CubemapUpload 
                      onUploadSuccess={(data) => {
                        console.log('Panorama created from cubemap:', data);
                        // Store the panorama data to be sent with room creation
                        setRoomForm({
                          ...roomForm,
                          panoramaData: data
                        });
                        setPanoramaPreview({ 
                          file: null, 
                          url: `http://localhost:5001${data.url}` 
                        });
                      }}
                    />
                    
                    {/* Show panorama status */}
                    {roomForm.panoramaData && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 text-purple-700">
                          <span className="text-lg">✓</span>
                          <span className="text-sm font-semibold">360° Panorama Ready ({roomForm.panoramaData.width}x{roomForm.panoramaData.height})</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button 
                    className="btn-primary w-full mt-6 py-3 text-base font-medium" 
                    type="submit"
                    disabled={roomLoading}
                  >
                    {roomLoading ? 'Adding Room(s)...' : 'Add Room(s)'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card">
              <h3 className="text-2xl font-bold mb-4 text-text-dark">Profile Settings</h3>
              <form
                className="space-y-6 max-w-2xl"
                onSubmit={async (e) => {
                  e.preventDefault()
                  try {
                    setProfileLoading(true)
                    let uploadedImageUrl = null

                    // Upload profile picture first if a new file was selected
                    if (profilePicture && profilePicture instanceof File) {
                      try {
                        showToast('Uploading profile photo...', 'info')
                        const photoResponse = await authAPI.uploadProfilePhoto(profilePicture)
                        if (photoResponse.data?.data?.profileImage) {
                          uploadedImageUrl = photoResponse.data.data.profileImage
                          setProfilePicturePreview(uploadedImageUrl)
                          showToast('Profile photo uploaded successfully!', 'success')
                        }
                      } catch (photoError) {
                        console.error('Error uploading profile photo:', photoError)
                        showToast(photoError.response?.data?.message || 'Failed to upload profile photo', 'error')
                      }
                    }

                    const payload = {}
                    if (profile.displayName) payload.name = profile.displayName
                    if (profile.contact) payload.phone = profile.contact
                    if (profile.email) payload.email = profile.email
                    if (profile.bio) payload.bio = profile.bio
                    if (profile.address) payload.addressString = profile.address
                    if (profile.city) payload.city = profile.city
                    if (profile.state) payload.state = profile.state

                    await authAPI.updateProfile(payload)
                    setProfileMessage('Profile saved successfully.')
                    showToast('Profile updated successfully!', 'success')
                    setProfilePicture(null)
                    setTimeout(() => setProfileMessage(''), 2000)
                  } catch (err) {
                    setProfileMessage(err.response?.data?.message || 'Failed to save profile')
                    showToast(err.response?.data?.message || 'Failed to save profile', 'error')
                    setTimeout(() => setProfileMessage(''), 2500)
                  } finally {
                    setProfileLoading(false)
                  }
                }}
              >
                {/* Profile Picture Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <label className="block text-sm font-bold text-gray-800 mb-4">Profile Picture</label>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                        {profilePicturePreview ? (
                          <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                            {user?.name?.charAt(0).toUpperCase() || 'O'}
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        id="owner-profile-picture"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            setProfilePicture(file)
                            const reader = new FileReader()
                            reader.onloadend = () => setProfilePicturePreview(reader.result)
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-3">Upload a profile picture to personalize your account</p>
                      <div className="flex gap-3">
                        <label
                          htmlFor="owner-profile-picture"
                          className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition cursor-pointer"
                        >
                          📷 Choose Photo
                        </label>
                        {profilePicturePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setProfilePicture(null)
                              setProfilePicturePreview(null)
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">
                      Display Name
                    </label>
                    <input
                      className="input w-full"
                      value={profile.displayName}
                      onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                      placeholder={user?.name || 'Your name'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">
                      Contact Number
                    </label>
                    <input
                      className="input w-full"
                      value={profile.contact}
                      onChange={(e) => setProfile((p) => ({ ...p, contact: e.target.value }))}
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Email</label>
                    <input
                      className="input w-full"
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Bio</label>
                  <textarea
                    className="input w-full h-24"
                    value={profile.bio}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Short bio or description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Address</label>
                  <input
                    className="input w-full"
                    value={profile.address}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Street / locality"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">City</label>
                    <input
                      className="input w-full"
                      value={profile.city}
                      onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">State</label>
                    <input
                      className="input w-full"
                      value={profile.state}
                      onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))}
                      placeholder="State"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="submit-btn" type="submit">
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  {profileMessage && <div className="text-sm text-text-muted">{profileMessage}</div>}
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>

    {/* Rooms Drawer/Modal */}
    {roomsOpen && (
      <div className="fixed inset-0 bg-black/40 z-50 flex">
        <div className="ml-auto w-full md:w-[720px] h-full bg-white shadow-xl flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-xl font-bold text-text-dark">
              {hostels.find(h => h._id === selectedHostelId)?.name} - Rooms & Security
            </h3>
            <button className="text-primary" onClick={() => setRoomsOpen(false)}>
              Close
            </button>
          </div>

          <div className="px-4 pt-3 flex gap-2">
            <button
              className={`px-3 py-2 rounded ${roomsTab === 'rooms' ? 'bg-primary text-white' : 'bg-gray-100 text-text-dark'}`}
              onClick={() => setRoomsTab('rooms')}
            >
              Rooms
            </button>
            <button
              className={`px-3 py-2 rounded ${roomsTab === 'security' ? 'bg-primary text-white' : 'bg-gray-100 text-text-dark'}`}
              onClick={() => setRoomsTab('security')}
            >
              Security & Emergency
            </button>
          </div>

          {roomsTab === 'rooms' && (
            <div className="p-4 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-text-muted">Capacity</label>
                  <select
                    className="input"
                    value={roomCapacityFilter}
                    onChange={(e) => setRoomCapacityFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => {
                    // Pre-select the current hostel and switch to Add Room tab
                    setRoomForm({
                      ...roomForm,
                      hostelId: selectedHostelId
                    })
                    setRoomsOpen(false)
                    setActiveTab('addroom')
                  }}
                >
                  Add Room
                </button>
              </div>

              <div className="space-y-4">
                {rooms
                  .filter(r => roomCapacityFilter === 'all' || String(r.capacity) === roomCapacityFilter)
                  .map((r) => (
                  <div key={r._id} className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-text-dark">
                          Room {r.roomNumber} • {r.roomType.toUpperCase()} • Capacity {r.capacity}
                        </h4>
                        <p className="text-text-muted text-sm">
                          Floor {r.floor} • Rent ₹{r.rent} • Deposit ₹{r.securityDeposit} • {r.isAvailable ? 'Available' : 'Occupied'}
                        </p>
                        <p className="text-sm mt-1">
                          Amenities: {(r.amenities || []).length > 0 ? r.amenities.join(', ') : '—'}
                          {r.amenities?.includes('Attached Bathroom') ? ' • Washroom: Attached' : ' • Washroom: Common/Not specified'}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <button
                          className="text-primary text-sm hover:underline"
                          onClick={() => {
                            setEditingRoom(r)
                            setEditRoomForm({
                              roomNumber: r.roomNumber,
                              roomType: r.roomType,
                              floor: r.floor,
                              capacity: r.capacity,
                              rent: r.rent,
                              securityDeposit: r.securityDeposit,
                              amenities: r.amenities || [],
                              isAvailable: r.isAvailable,
                              photos: r.photos || [],
                              videoUrl: r.videoUrl || '',
                              view360Url: r.view360Url || ''
                            })
                            // Clear uploaded media state
                            setUploadedPhotos([])
                            setUploadedVideo(null)
                            setUploaded360View(null)
                            setEditRoomMessage('')
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="reject-btn text-xs"
                          onClick={async () => {
                            if (!confirm('Delete this room?')) return
                            await ownerAPI.deleteRoom(r._id)
                            const res = await ownerAPI.getHostelRooms(selectedHostelId)
                            setRooms(res.data?.data || [])
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {(r.photos || []).length > 0 && (
                      <div className="grid md:grid-cols-4 gap-3 mt-3">
                        {r.photos.slice(0, 8).map((p) => (
                          <img key={p.publicId} src={p.url} alt="room" className="w-full rounded-lg" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {roomsTab === 'security' && (
            <div className="p-4 overflow-auto space-y-4">
              <div className="card">
                <h4 className="text-xl font-bold text-text-dark mb-2">Hostel Security</h4>
                <ul className="list-disc pl-6 text-text-muted">
                  <li>CCTV coverage in common areas</li>
                  <li>24/7 on-site guard</li>
                  <li>Visitor logbook and ID verification</li>
                  <li>Emergency exit routes displayed on each floor</li>
                </ul>
              </div>

              <div className="card">
                <h4 className="text-xl font-bold text-text-dark mb-2">Nearby Emergency Services</h4>
                <p className="text-text-muted mb-2">
                  Based on city: {hostels.find(h => h._id === selectedHostelId)?.address?.city || '—'}
                </p>
                <ul className="list-disc pl-6 text-text-muted">
                  <li>Police Station: within 1.2 km</li>
                  <li>Hospital (Emergency): within 2.1 km</li>
                  <li>Fire Station: within 3.0 km</li>
                </ul>
                <p className="text-sm text-text-muted mt-2">Tip: We can integrate a live map and fetch exact nearby services if you provide a maps API key.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Edit Room Modal */}
    {editingRoom && (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Edit Room {editingRoom.roomNumber}</h3>
            <button
              onClick={() => setEditingRoom(null)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form
            className="p-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setEditRoomLoading(true)
              setEditRoomMessage('')
              
              try {
                // First, update the room details
                await ownerAPI.updateRoom(editingRoom._id, {
                  roomNumber: editRoomForm.roomNumber,
                  roomType: editRoomForm.roomType,
                  floor: parseInt(editRoomForm.floor),
                  capacity: parseInt(editRoomForm.capacity),
                  rent: parseFloat(editRoomForm.rent),
                  securityDeposit: parseFloat(editRoomForm.securityDeposit),
                  amenities: editRoomForm.amenities,
                  isAvailable: editRoomForm.isAvailable
                })
                
                // Upload photos if any
                if (uploadedPhotos.length > 0) {
                  const photoFiles = uploadedPhotos.map(p => p.file)
                  await ownerAPI.uploadRoomMedia(editingRoom._id, photoFiles, 'photos')
                  console.log('Photos uploaded successfully')
                }
                
                // Upload video if selected
                if (uploadedVideo) {
                  await ownerAPI.uploadRoomMedia(editingRoom._id, [uploadedVideo.file], 'video')
                  console.log('Video uploaded successfully')
                }
                
                // Upload 360 view if selected
                if (uploaded360View) {
                  await ownerAPI.uploadRoomMedia(editingRoom._id, [uploaded360View.file], 'view360')
                  console.log('360 view uploaded successfully')
                }
                
                // Upload panorama if selected
                if (uploadedEditPanorama && uploadedEditPanorama.file) {
                  try {
                    console.log('Uploading panorama to room:', editingRoom._id)
                    await ownerAPI.uploadRoomMedia(editingRoom._id, [uploadedEditPanorama.file], 'panorama')
                    console.log('Panorama uploaded successfully')
                  } catch (panoramaErr) {
                    console.error('Panorama upload failed:', panoramaErr)
                    throw panoramaErr
                  }
                }
                
                // Refresh rooms list
                const res = await ownerAPI.getHostelRooms(selectedHostelId)
                setRooms(res.data?.data || [])
                
                // Refresh hostels and all rooms list
                const hostelResp = await ownerAPI.getMyHostels()
                if (hostelResp?.data?.data) {
                  setHostels(hostelResp.data.data)
                  fetchAllRooms(hostelResp.data.data)
                }
                
                setEditRoomMessage('✓ Room updated successfully!')
                
                // Close modal after 1.5 seconds
                setTimeout(() => {
                  setEditingRoom(null)
                  setEditRoomMessage('')
                  // Clear uploaded media
                  setUploadedPhotos([])
                  setUploadedVideo(null)
                  setUploaded360View(null)
                  setUploadedEditPanorama(null)
                }, 1500)
              } catch (err) {
                console.error('Error updating room:', err)
                setEditRoomMessage(err.response?.data?.message || 'Failed to update room')
              } finally {
                setEditRoomLoading(false)
              }
            }}
          >
            {/* Success/Error Message */}
            {editRoomMessage && (
              <div className={`p-4 rounded-lg border-l-4 flex items-center gap-3 transition-all duration-300 ${
                editRoomMessage.includes('success') || editRoomMessage.includes('✓')
                  ? 'bg-green-50 border-green-500 text-green-800'
                  : 'bg-red-50 border-red-500 text-red-800'
              }`}
              style={{ animation: 'slideDown 0.3s ease-out' }}
              >
                <span className="text-2xl">
                  {editRoomMessage.includes('success') || editRoomMessage.includes('✓') ? '✓' : '⚠'}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">
                    {editRoomMessage.includes('success') || editRoomMessage.includes('✓') ? 'Success!' : 'Error'}
                  </p>
                  <p className="text-sm">{editRoomMessage}</p>
                </div>
              </div>
            )}

            {/* Room Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Number
              </label>
              <input
                type="text"
                className="input w-full"
                value={editRoomForm.roomNumber}
                onChange={(e) => setEditRoomForm({ ...editRoomForm, roomNumber: e.target.value })}
                required
              />
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Type
              </label>
              <select
                className="input w-full"
                value={editRoomForm.roomType}
                onChange={(e) => setEditRoomForm({ ...editRoomForm, roomType: e.target.value })}
                required
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
                <option value="quad">Quad</option>
              </select>
            </div>

            {/* Floor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor
              </label>
              <input
                type="number"
                className="input w-full"
                value={editRoomForm.floor}
                onChange={(e) => setEditRoomForm({ ...editRoomForm, floor: e.target.value })}
                min="0"
                required
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity
              </label>
              <input
                type="number"
                className="input w-full"
                value={editRoomForm.capacity}
                onChange={(e) => setEditRoomForm({ ...editRoomForm, capacity: e.target.value })}
                min="1"
                required
              />
            </div>

            {/* Monthly Rent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Rent (₹)
              </label>
              <input
                type="number"
                className="input w-full"
                value={editRoomForm.rent}
                onChange={(e) => setEditRoomForm({ ...editRoomForm, rent: e.target.value })}
                min="0"
                required
              />
            </div>

            {/* Security Deposit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Deposit (₹)
              </label>
              <input
                type="number"
                className="input w-full"
                value={editRoomForm.securityDeposit}
                onChange={(e) => setEditRoomForm({ ...editRoomForm, securityDeposit: e.target.value })}
                min="0"
                required
              />
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amenities
              </label>
              
              {/* Display selected amenities as tags */}
              {editRoomForm.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  {editRoomForm.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-full text-sm"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => {
                          setEditRoomForm({
                            ...editRoomForm,
                            amenities: editRoomForm.amenities.filter((_, i) => i !== index)
                          })
                        }}
                        className="hover:bg-red-500 rounded-full p-0.5 ml-1"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Dropdown to add amenities */}
              <select
                className="input w-full"
                value=""
                onChange={(e) => {
                  const selectedAmenity = e.target.value
                  if (selectedAmenity && !editRoomForm.amenities.includes(selectedAmenity)) {
                    setEditRoomForm({
                      ...editRoomForm,
                      amenities: [...editRoomForm.amenities, selectedAmenity]
                    })
                  }
                }}
              >
                <option value="">-- Select Amenity to Add --</option>
                {amenityOptions
                  .filter(option => !editRoomForm.amenities.includes(option))
                  .map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </select>
            </div>

            {/* Media Upload Section */}
            <div className="border-t pt-4 mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Room Media</h4>
              
              {/* Photos Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📷 Photos
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-600"
                  onChange={(e) => {
                    const files = Array.from(e.target.files)
                    // Create preview URLs
                    const previews = files.map(file => ({
                      file,
                      url: URL.createObjectURL(file),
                      name: file.name
                    }))
                    setUploadedPhotos([...uploadedPhotos, ...previews])
                    console.log('Photos selected:', files)
                    // TODO: Upload to server/cloudinary
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload multiple photos of the room (JPG, PNG)
                </p>
                
                {/* Newly Uploaded Photos Preview */}
                {uploadedPhotos.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Newly Added ({uploadedPhotos.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {uploadedPhotos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={photo.url} 
                            alt={photo.name}
                            className="w-24 h-24 object-cover rounded-lg border-2 border-green-500"
                          />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600"
                            onClick={() => {
                              URL.revokeObjectURL(photo.url)
                              setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== idx))
                            }}
                          >
                            ✕
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs px-1 py-0.5 text-center rounded-b-lg">
                            New
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Current Photos Preview */}
                {editingRoom?.photos && editingRoom.photos.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Current Photos ({editingRoom.photos.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {editingRoom.photos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={photo.url} 
                            alt={`Room photo ${idx + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              // TODO: Delete photo from server
                              console.log('Delete photo:', photo.publicId)
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎥 Video Tour
                </label>
                <input
                  type="file"
                  accept="video/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-600"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      setUploadedVideo({
                        file,
                        url: URL.createObjectURL(file),
                        name: file.name
                      })
                      console.log('Video selected:', file)
                      // TODO: Upload to server/cloudinary
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a video walkthrough of the room (MP4, max 50MB)
                </p>
                
                {/* Newly Uploaded Video Preview */}
                {uploadedVideo && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                      <span>✓</span> New Video Added
                    </p>
                    <div className="relative border-2 border-green-500 rounded-lg p-2">
                      <video 
                        src={uploadedVideo.url} 
                        controls 
                        className="w-full max-w-md rounded-lg"
                      />
                      <button
                        type="button"
                        className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                        onClick={() => {
                          URL.revokeObjectURL(uploadedVideo.url)
                          setUploadedVideo(null)
                        }}
                      >
                        ✕ Remove
                      </button>
                      <p className="text-xs text-gray-600 mt-2">{uploadedVideo.name}</p>
                    </div>
                  </div>
                )}
                
                {/* Current Video */}
                {editingRoom?.videoUrl && !uploadedVideo && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Current Video</p>
                    <video 
                      src={editingRoom.videoUrl} 
                      controls 
                      className="w-full max-w-md rounded-lg border"
                    />
                    <button
                      type="button"
                      className="text-red-500 text-sm hover:underline mt-1"
                      onClick={() => {
                        // TODO: Delete video from server
                        console.log('Delete video')
                      }}
                    >
                      Remove Video
                    </button>
                  </div>
                )}
              </div>

              {/* 360° View Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🌐 360° Virtual Tour
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-600"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      setUploaded360View({
                        file,
                        url: URL.createObjectURL(file),
                        name: file.name
                      })
                      console.log('360° image selected:', file)
                      // TODO: Upload to server/cloudinary
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a 360° panoramic image for virtual room tour
                </p>
                
                {/* Newly Uploaded 360° View Preview */}
                {uploaded360View && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                      <span>✓</span> New 360° View Added
                    </p>
                    <div className="relative border-2 border-green-500 rounded-lg p-2">
                      <img 
                        src={uploaded360View.url} 
                        alt="360° view"
                        className="w-full max-w-md rounded-lg"
                      />
                      <button
                        type="button"
                        className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                        onClick={() => {
                          URL.revokeObjectURL(uploaded360View.url)
                          setUploaded360View(null)
                        }}
                      >
                        ✕ Remove
                      </button>
                      <p className="text-xs text-gray-600 mt-2">{uploaded360View.name}</p>
                    </div>
                  </div>
                )}
                
                {/* Current 360 View */}
                {editingRoom?.view360Url && !uploaded360View && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Current 360° View</p>
                    <img 
                      src={editingRoom.view360Url} 
                      alt="360° view"
                      className="w-full max-w-md rounded-lg border"
                    />
                    <button
                      type="button"
                      className="text-red-500 text-sm hover:underline mt-1"
                      onClick={() => {
                        // TODO: Delete 360 view from server
                        console.log('Delete 360° view')
                      }}
                    >
                      Remove 360° View
                    </button>
                  </div>
                )}
              </div>

              {/* Cubemap Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎯 360° Room Panorama
                </label>
                
                {editingRoom?.panorama?.url && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Current Panorama</p>
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <img 
                        src={editingRoom.panorama.url} 
                        alt="Current panorama"
                        className="w-full max-w-md rounded-lg mb-2"
                      />
                      <button
                        type="button"
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                        onClick={() => {
                          setUploadedEditPanorama({
                            file: null,
                            url: editingRoom.panorama.url,
                            name: editingRoom.panorama.originalFilename || 'current-panorama.jpg'
                          })
                          setShowEditPanoramaPreview(true)
                        }}
                      >
                        🎯 Preview Current Panorama
                      </button>
                    </div>
                  </div>
                )}
                
                <CubemapUpload 
                  onUploadSuccess={async (data) => {
                    console.log('Edit room panorama created:', data);
                    try {
                      // Fetch the panorama image from Python service as blob
                      const panoramaUrl = `http://localhost:5001${data.url}`
                      const response = await fetch(panoramaUrl)
                      const blob = await response.blob()
                      const file = new File([blob], data.filename || 'panorama.jpg', { type: 'image/jpeg' })
                      
                      setUploadedEditPanorama({ 
                        file: file,
                        url: panoramaUrl,
                        name: data.filename
                      });
                      console.log('Panorama file prepared for upload:', file)
                    } catch (err) {
                      console.error('Failed to prepare panorama:', err)
                    }
                  }}
                />
                
                {/* Show panorama upload status */}
                {uploadedEditPanorama && uploadedEditPanorama.file && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-700">
                      <span className="text-lg">✓</span>
                      <span className="text-sm font-semibold">New 360° Panorama Ready - Will be uploaded on save</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-3 py-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={editRoomForm.isAvailable}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, isAvailable: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className="text-sm font-medium text-gray-700">
                {editRoomForm.isAvailable ? 'Available' : 'Not Available'}
              </span>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                className="btn-primary flex-1 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={editRoomLoading}
              >
                {editRoomLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  '✓ Update Room'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingRoom(null)
                  setEditRoomMessage('')
                }}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-700 disabled:opacity-50"
                disabled={editRoomLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Video Modal */}
    {showVideoModal && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={() => setShowVideoModal(false)}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4 flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              🎥 Room Video
            </h3>
            <button
              onClick={() => setShowVideoModal(false)}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-4 bg-black">
            <video
              src={currentVideoUrl}
              controls
              autoPlay
              className="w-full max-h-[70vh] rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    )}

    {/* Deletion Request Modal */}
    {showDeletionModal && selectedDeletionRequest && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-red-800">⚠️ Account Deletion Request</h3>
            <button
              onClick={() => {
                setShowDeletionModal(false)
                setSelectedDeletionRequest(null)
                setDeletionResponse('')
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Tenant Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Tenant Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-800">{selectedDeletionRequest.tenant?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-800">{selectedDeletionRequest.tenant?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-800">{selectedDeletionRequest.tenant?.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hostel</p>
                  <p className="font-semibold text-gray-800">{selectedDeletionRequest.hostel?.name}</p>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Request Details</h4>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Requested on:</strong> {new Date(selectedDeletionRequest.requestedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Reason:</strong>
              </p>
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="text-gray-800">{selectedDeletionRequest.reason}</p>
              </div>
            </div>

            {selectedDeletionRequest.contract && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">⚠️ Active Contract</h4>
                <p className="text-sm text-yellow-800">
                  This tenant has an active contract (Contract #{selectedDeletionRequest.contract.contractNumber}).
                  Approving this request will terminate the contract and deactivate their account.
                </p>
              </div>
            )}

            {/* Response Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Response (Optional for approval, Required for rejection)
              </label>
              <textarea
                value={deletionResponse}
                onChange={(e) => setDeletionResponse(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none resize-none"
                placeholder="Add any comments or reasons for your decision..."
                rows="4"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeletionModal(false)
                  setSelectedDeletionRequest(null)
                  setDeletionResponse('')
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDeletionRequest}
                disabled={processingDeletion}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold disabled:opacity-50"
              >
                {processingDeletion ? 'Processing...' : 'Reject Request'}
              </button>
              <button
                onClick={handleApproveDeletionRequest}
                disabled={processingDeletion}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50"
              >
                {processingDeletion ? 'Processing...' : 'Approve & Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Edit Hostel Modal */}
    {showEditHostelModal && editingHostel && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800">Edit Hostel</h3>
            <button
              onClick={() => {
                setShowEditHostelModal(false)
                setEditingHostel(null)
                setEditHostelMessage('')
              }}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {editHostelMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {editHostelMessage}
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault()
                try {
                  const payload = {
                    name: editHostelForm.name,
                    address: editHostelForm.address,
                    description: editHostelForm.description,
                    hostelType: editHostelForm.hostelType,
                    priceRange: {
                      min: Number(editHostelForm.priceRange.min) || 0,
                      max: Number(editHostelForm.priceRange.max) || 0,
                    },
                  }

                  if (editHostelForm.location) {
                    payload.location = {
                      type: 'Point',
                      coordinates: [editHostelForm.location.longitude, editHostelForm.location.latitude]
                    }
                  }

                  await ownerAPI.updateHostel(editingHostel._id, payload)
                  setEditHostelMessage('Hostel updated successfully!')
                  
                  const res = await ownerAPI.getMyHostels()
                  const list = res.data?.data || []
                  setHostels(list)
                  
                  setTimeout(() => {
                    setShowEditHostelModal(false)
                    setEditingHostel(null)
                    setEditHostelMessage('')
                  }, 1500)
                } catch (err) {
                  setEditHostelMessage(err.response?.data?.message || 'Failed to update hostel')
                }
              }}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Hostel Name"
                  className="input"
                  value={editHostelForm.name}
                  onChange={(e) => setEditHostelForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Street"
                    className="input"
                    value={editHostelForm.address.street}
                    onChange={(e) => setEditHostelForm((f) => ({ ...f, address: { ...f.address, street: e.target.value } }))}
                  />
                  {editHostelForm.address.street && editHostelForm.location && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600">Auto-filled</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="City"
                    className="input"
                    value={editHostelForm.address.city}
                    onChange={(e) => setEditHostelForm((f) => ({ ...f, address: { ...f.address, city: e.target.value } }))}
                  />
                  {editHostelForm.address.city && editHostelForm.location && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600">Auto-filled</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="State"
                    className="input"
                    value={editHostelForm.address.state}
                    onChange={(e) => setEditHostelForm((f) => ({ ...f, address: { ...f.address, state: e.target.value } }))}
                  />
                  {editHostelForm.address.state && editHostelForm.location && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600">Auto-filled</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Pincode"
                    className="input"
                    value={editHostelForm.address.pincode}
                    onChange={(e) => setEditHostelForm((f) => ({ ...f, address: { ...f.address, pincode: e.target.value } }))}
                  />
                  {editHostelForm.address.pincode && editHostelForm.location && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600">Auto-filled</span>
                  )}
                </div>
                <select
                  className="input"
                  value={editHostelForm.hostelType}
                  onChange={(e) => setEditHostelForm((f) => ({ ...f, hostelType: e.target.value }))}
                >
                  <option value="boys">Boys Only</option>
                  <option value="girls">Girls Only</option>
                  <option value="coed">Co-ed</option>
                </select>
                <input
                  type="number"
                  placeholder="Min Price (₹)"
                  className="input"
                  value={editHostelForm.priceRange.min}
                  onChange={(e) => setEditHostelForm((f) => ({ ...f, priceRange: { ...f.priceRange, min: e.target.value } }))}
                />
                <input
                  type="number"
                  placeholder="Max Price (₹)"
                  className="input"
                  value={editHostelForm.priceRange.max}
                  onChange={(e) => setEditHostelForm((f) => ({ ...f, priceRange: { ...f.priceRange, max: e.target.value } }))}
                />
              </div>

              <textarea
                placeholder="Description"
                className="input w-full h-32"
                value={editHostelForm.description}
                onChange={(e) => setEditHostelForm((f) => ({ ...f, description: e.target.value }))}
              />

              {/* Location Picker Button */}
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-700">Hostel Location on Map</h4>
                  {editHostelForm.location && (
                    <span className="text-sm text-green-600 font-semibold">✓ Location Set</span>
                  )}
                </div>
                {editHostelForm.location && (
                  <p className="text-xs text-gray-600 mb-3">
                    Coordinates: {editHostelForm.location.latitude.toFixed(6)}, {editHostelForm.location.longitude.toFixed(6)}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowEditLocationPicker(true)}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition font-semibold flex items-center justify-center gap-2"
                >
                  <span>📍</span>
                  {editHostelForm.location ? 'Change Location' : 'Select Location on Map'}
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditHostelModal(false)
                    setEditingHostel(null)
                    setEditHostelMessage('')
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                  Update Hostel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

    {/* Edit Location Picker Modal */}
    {showEditLocationPicker && (
      <LocationPicker
        initialLocation={editHostelForm.location}
        hostelPhoto={editingHostel?.photos?.[0]?.url || null}
        onLocationSelect={(location, addressDetails) => {
          console.log('Edit - Location selected:', location)
          console.log('Edit - Address details received:', addressDetails)

          setEditHostelForm((f) => {
            const newForm = {
              ...f,
              location
            }

            if (addressDetails) {
              newForm.address = {
                street: addressDetails.street || f.address.street,
                city: addressDetails.city || f.address.city,
                state: addressDetails.state || f.address.state,
                pincode: addressDetails.pincode || f.address.pincode,
              }
              console.log('Edit - Updated address:', newForm.address)
            }

            return newForm
          })

          setShowEditLocationPicker(false)
        }}
        onClose={() => setShowEditLocationPicker(false)}
      />
    )}

    {/* Location Picker Modal */}
    {showLocationPicker && (
      <LocationPicker
        initialLocation={createForm.location}
        hostelPhoto={mediaFiles.length > 0 ? mediaFiles[0].url : null}
        onLocationSelect={(location, addressDetails) => {
          console.log('Location selected:', location)
          console.log('Address details received:', addressDetails)
          
          // Update both location and address in one setState call
          setCreateForm((f) => {
            const newForm = {
              ...f,
              location
            }
            
            // Auto-fill address fields if address details are available
            if (addressDetails) {
              newForm.address = {
                street: addressDetails.street || f.address.street,
                city: addressDetails.city || f.address.city,
                state: addressDetails.state || f.address.state,
                pincode: addressDetails.pincode || f.address.pincode,
              }
              console.log('Updated address:', newForm.address)
            }
            
            return newForm
          })
          
          setShowLocationPicker(false)
        }}
        onClose={() => setShowLocationPicker(false)}
      />
    )}

    {/* Panorama Preview Modal */}
    {showPanoramaPreview && panoramaPreview && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800">🎯 360° Panorama Preview</h3>
              {panoramaPreview.file?.name && (
                <p className="text-sm text-gray-600 mt-1">{panoramaPreview.file.name}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowPanoramaPreview(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Viewer Container */}
          <div className="flex-1 p-6 bg-gray-900">
            <PanoramaViewer 
              panoramaUrl={panoramaPreview.url}
              width="100%"
              height="600px"
              autoRotate={true}
              showControls={true}
            />
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Controls:</p>
              <p>🖱️ Drag to look around • 🔍 Scroll to zoom • 🔁 Auto-rotate</p>
            </div>
            <div className="flex gap-3">
              {panoramaPreview.file && (
                <button
                  type="button"
                  onClick={() => {
                    if (panoramaPreview.url && panoramaPreview.url.startsWith('blob:')) {
                      URL.revokeObjectURL(panoramaPreview.url);
                    }
                    setPanoramaPreview(null);
                    setShowPanoramaPreview(false);
                    const input = document.getElementById('panorama-upload');
                    if (input) input.value = '';
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Remove & Close
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPanoramaPreview(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Edit Panorama Preview Modal */}
    {showEditPanoramaPreview && uploadedEditPanorama && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800">🎯 360° Cube View Preview</h3>
              <p className="text-sm text-gray-600 mt-1">{uploadedEditPanorama.name}</p>
            </div>
            <button
              onClick={() => setShowEditPanoramaPreview(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Viewer Container */}
          <div className="flex-1 p-6 bg-gray-900">
            <PanoramaViewer 
              panoramaUrl={uploadedEditPanorama.url}
              width="100%"
              height="600px"
            />
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Controls:</p>
              <p>🖱️ Drag to look around • 🔍 Scroll to zoom in/out</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (uploadedEditPanorama.file) {
                    URL.revokeObjectURL(uploadedEditPanorama.url);
                    setUploadedEditPanorama(null);
                  }
                  setShowEditPanoramaPreview(false);
                }}
                className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Remove & Close
              </button>
              <button
                onClick={() => setShowEditPanoramaPreview(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Looks Good!
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Confirmation Modal */}
    {showConfirmModal && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl transform transition-all animate-scale-in">
          {/* Modal Header */}
          <div className={`p-6 rounded-t-3xl ${
            confirmModalData.type === 'approve' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
              : 'bg-gradient-to-r from-red-500 to-rose-500'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-4xl">
                  {confirmModalData.type === 'approve' ? '✓' : '⚠️'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white">{confirmModalData.title}</h3>
                <p className="text-white/90 text-sm mt-1">Please confirm your action</p>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            <p className="text-gray-700 text-base leading-relaxed">
              {confirmModalData.message}
            </p>
            
            <div className={`mt-4 p-4 rounded-xl ${
              confirmModalData.type === 'approve' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                confirmModalData.type === 'approve' ? 'text-green-800' : 'text-red-800'
              }`}>
                {confirmModalData.type === 'approve' 
                  ? '📧 The tenant will receive a confirmation email and SMS notification.' 
                  : '⚠️ This action cannot be undone. The tenant will be notified immediately.'}
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 bg-gray-50 rounded-b-3xl flex gap-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowConfirmModal(false)
                if (confirmModalData.onConfirm) {
                  confirmModalData.onConfirm()
                }
              }}
              className={`flex-1 px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all ${
                confirmModalData.type === 'approve'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                  : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
              }`}
            >
              {confirmModalData.type === 'approve' ? 'Yes, Approve' : 'Yes, Terminate'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Toast Notification */}
    {toast.show && (
      <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
        <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-2 min-w-[350px] ${
          toast.type === 'success' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-300 text-white' 
            : 'bg-gradient-to-r from-red-500 to-rose-500 border-red-300 text-white'
        }`}>
          <div className="text-2xl">
            {toast.type === 'success' ? '✓' : '✕'}
          </div>
          <div className="font-semibold flex-1">{toast.message}</div>
          <button
            onClick={() => setToast({ show: false, message: '', type: 'success' })}
            className="ml-2 text-white/80 hover:text-white transition"
          >
            ✕
          </button>
        </div>
      </div>
    )}
    </>
  )
}
