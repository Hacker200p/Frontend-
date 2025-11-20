import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Shield, FileText, Camera, Utensils, Phone, MapPin, DollarSign, Users } from 'lucide-react'
import { hostelAPI } from '../services/api'

export default function Home() {
  const navigate = useNavigate()
  const [searchLocation, setSearchLocation] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const features = [
    {
      icon: Shield,
      title: 'Police-Verified Listings',
      description: 'All hostels are verified by police authorities for your safety',
    },
    {
      icon: Phone,
      title: 'SOS Emergency Button',
      description: '24/7 emergency support with one-click assistance',
    },
    {
      icon: FileText,
      title: 'Digital Contracts',
      description: 'Secure, transparent, and legally binding digital contracts',
    },
    {
      icon: Camera,
      title: 'AR Room Tours',
      description: 'Experience 360° virtual room tours before booking',
    },
    {
      icon: Utensils,
      title: 'Food Delivery',
      description: 'On-campus canteen with healthy meal options',
    },
    {
      icon: Users,
      title: 'Real-time Support',
      description: 'Chat with hostel managers and support team anytime',
    },
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Tenant',
      rating: 5,
      comment: 'SafeStay Hub made finding a safe hostel so easy. The verification process gives me peace of mind.',
    },
    {
      name: 'Raj Patel',
      role: 'Hostel Owner',
      rating: 5,
      comment: 'Great platform to manage my hostel and connect with reliable tenants. The tools are intuitive.',
    },
    {
      name: 'Priya Singh',
      role: 'Tenant',
      rating: 4,
      comment: 'Love the canteen food delivery system. Very convenient for busy students.',
    },
  ]

  const handleSearch = async () => {
    setSearching(true)
    setSearched(true)
    try {
      const params = {}
      if (searchLocation) params.search = searchLocation
      if (priceRange) {
        const [min, max] = priceRange.split('-')
        if (min) params.minPrice = min
        if (max) params.maxPrice = max
      }
      const response = await hostelAPI.search(params)
      setSearchResults(response.data.data || [])
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleBookClick = (hostelId) => {
    // Store the hostel ID in sessionStorage to redirect after login
    console.log('Storing hostel ID in sessionStorage:', hostelId)
    sessionStorage.setItem('redirectHostelId', hostelId)
    console.log('Stored value:', sessionStorage.getItem('redirectHostelId'))
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary">SafeStay Hub</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-text-dark hover:text-primary transition">
              Features
            </a>
            <a href="#testimonials" className="text-text-dark hover:text-primary transition">
              Testimonials
            </a>
            <a href="#contact" className="text-text-dark hover:text-primary transition">
              Contact
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary">
              Login
            </Link>
            <Link to="/register" className="btn-primary">
              Register
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-primary text-white py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto px-4"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Find Safe & Verified Hostels Near You
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Your trusted platform for secure hostel accommodation with verified owners, transparent contracts, and 24/7 support
          </p>

          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto mb-8">
            <input
              type="text"
              placeholder="Search location, city, or hostel name..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-text-dark focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <select 
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="px-4 py-3 rounded-lg text-text-dark focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Prices</option>
              <option value="5000-10000">₹5000 - ₹10000</option>
              <option value="10000-15000">₹10000 - ₹15000</option>
              <option value="15000-">₹15000+</option>
            </select>
            <button 
              onClick={handleSearch}
              disabled={searching}
              className="btn-accent px-8"
            >
              {searching ? 'Searching...' : 'Search Now'}
            </button>
          </div>

          <Link to="/register" className="inline-block btn-accent">
            Get Started →
          </Link>
        </motion.div>
      </section>

      {/* Search Results Section */}
      {searched && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8 text-text-dark">
            {searchResults.length > 0 
              ? `Found ${searchResults.length} hostel${searchResults.length > 1 ? 's' : ''}`
              : 'No hostels found'}
          </h2>

          {searchResults.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((hostel) => (
                <motion.div
                  key={hostel._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card hover:shadow-lg transition"
                >
                  {hostel.images && hostel.images.length > 0 && (
                    <img
                      src={hostel.images[0]}
                      alt={hostel.name}
                      className="w-full h-48 object-cover rounded-t-lg mb-4"
                    />
                  )}
                  
                  <h3 className="text-xl font-bold text-text-dark mb-2">{hostel.name}</h3>
                  
                  <div className="flex items-center gap-2 text-text-muted mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      {hostel.address?.city || hostel.city}, {hostel.address?.state || hostel.state}
                    </span>
                  </div>

                  {hostel.description && (
                    <p className="text-text-muted text-sm mb-4 line-clamp-2">
                      {hostel.description}
                    </p>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-text-dark font-semibold mb-2">
                      <DollarSign className="w-4 h-4" />
                      Starting from ₹{hostel.minRent || 'N/A'}/month
                    </div>
                    
                    {hostel.amenities && hostel.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {hostel.amenities.slice(0, 3).map((amenity, idx) => (
                          <span 
                            key={idx}
                            className="text-xs bg-blue-100 text-primary px-2 py-1 rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                        {hostel.amenities.length > 3 && (
                          <span className="text-xs text-text-muted">
                            +{hostel.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    {hostel.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="text-sm font-semibold">{hostel.rating}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleBookClick(hostel._id)}
                      className="btn-primary text-sm"
                    >
                      Book Now
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-muted mb-4">
                No hostels match your search criteria. Try adjusting your filters.
              </p>
              <button 
                onClick={() => {
                  setSearchLocation('')
                  setPriceRange('')
                  setSearched(false)
                  setSearchResults([])
                }}
                className="btn-secondary"
              >
                Clear Search
              </button>
            </div>
          )}
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-24">
        <h2 className="text-4xl font-bold text-center mb-16 text-text-dark">Why Choose SafeStay Hub?</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="card text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-text-dark">{feature.title}</h3>
                <p className="text-text-muted">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* AR Tour Preview */}
      <section className="bg-blue-50 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-text-dark">Explore with AR Room Tours</h2>
              <p className="text-lg text-text-muted mb-4">
                Experience 360° virtual walkthroughs of hostel rooms before making a decision. See every detail from the comfort of your home.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-text-dark">High-resolution 360° photos</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-text-dark">Virtual room walkthrough</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-text-dark">Amenity showcase</span>
                </li>
              </ul>
              <button className="btn-primary">View Tour Demo</button>
            </div>
            <div className="bg-gray-300 rounded-2xl h-96 flex items-center justify-center">
              <p className="text-text-muted">360° AR Tour Preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-7xl mx-auto px-4 py-24">
        <h2 className="text-4xl font-bold text-center mb-16 text-text-dark">What Users Say</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="card"
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-text-muted mb-4 italic">"{testimonial.comment}"</p>
              <div>
                <p className="font-semibold text-text-dark">{testimonial.name}</p>
                <p className="text-sm text-text-muted">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Find Your Perfect Hostel?</h2>
        <p className="text-xl text-blue-100 mb-8">Join thousands of satisfied tenants and hostel owners</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-accent">
            Get Started Today
          </Link>
          <Link to="/login" className="bg-white text-primary px-8 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">
            Sign In
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">SafeStay Hub</h3>
              <p className="text-blue-200">Making hostel living safe and secure for everyone</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-blue-200">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-blue-200">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-blue-200">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Report Issue</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-blue-200">
            <p>&copy; 2025 SafeStay Hub. All rights reserved. | Police-Verified Hostels for Safe Living</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
