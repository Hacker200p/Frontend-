import { useState, useEffect, useRef, useCallback } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, Navigation, Search, X, Star, MapPinned } from 'lucide-react'
import api from '../services/api'

export default function HostelMapExplorer({ hostels = [], onHostelSelect, className = '' }) {
  const [mapboxToken, setMapboxToken] = useState('')
  const [viewState, setViewState] = useState({
    longitude: 77.5946,
    latitude: 12.9716,
    zoom: 12
  })

  // Debug hostels data
  useEffect(() => {
    console.log('=== HostelMapExplorer Debug ===')
    console.log('Total hostels received:', hostels.length)
    console.log('Hostels with location:', hostels.filter(h => h.location?.coordinates).length)
    console.log('Hostels with photos:', hostels.filter(h => h.photos?.length > 0).length)
    
    if (hostels.length > 0) {
      console.log('\nFull hostel data:', JSON.stringify(hostels, null, 2))
      
      // Log each hostel's photo URLs
      hostels.forEach((h, idx) => {
        const hasLocation = h.location?.coordinates && h.location.coordinates.length === 2
        const hasPhotos = h.photos && h.photos.length > 0
        console.log(`\nHostel ${idx + 1} (${h.name}):`)
        console.log(`  Location: ${hasLocation ? `[${h.location.coordinates[0]}, ${h.location.coordinates[1]}]` : 'MISSING'}`)
        console.log(`  Photos: ${h.photos?.length || 0}`)
        if (hasPhotos) {
          console.log(`  First photo URL: ${h.photos[0].url || h.photos[0]}`)
          console.log(`  Photo object:`, h.photos[0])
        }
      })
    }
    console.log('=== End Debug ===')
  }, [hostels])
  
  const [selectedHostel, setSelectedHostel] = useState(null)
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const mapRef = useRef(null)
  const [userLocation, setUserLocation] = useState(null)

  // Fetch Mapbox token from backend
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await api.get('/config/mapbox-token')
        setMapboxToken(response.data.token)
      } catch (error) {
        console.error('Error fetching Mapbox token:', error)
      }
    }
    fetchToken()
  }, [])

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
          }
          setUserLocation(loc)
          setViewState(prev => ({
            ...prev,
            longitude: loc.longitude,
            latitude: loc.latitude,
            zoom: 13
          }))
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  const handleMarkerClick = useCallback((hostel) => {
    setSelectedHostel(hostel)
    setSheetExpanded(true)
    
    // Animate map to hostel
    if (hostel.location?.coordinates) {
      setViewState(prev => ({
        ...prev,
        longitude: hostel.location.coordinates[0],
        latitude: hostel.location.coordinates[1],
        zoom: 15
      }))
    }
  }, [])

  const handleCenterMap = useCallback(() => {
    if (userLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: userLocation.longitude,
        latitude: userLocation.latitude,
        zoom: 13
      }))
    }
  }, [userLocation])

  const handleSearchThisArea = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (map) {
      const bounds = map.getBounds()
      console.log('Search in area:', bounds)
      // Trigger parent component to fetch hostels in this area
    }
  }, [])

  const calculateDistance = (hostel) => {
    if (!userLocation || !hostel.location?.coordinates) return null
    
    const [lng, lat] = hostel.location.coordinates
    const R = 6371 // Earth radius in km
    const dLat = (lat - userLocation.latitude) * Math.PI / 180
    const dLon = (lng - userLocation.longitude) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
  }

  const formatAddress = (address) => {
    if (!address) return 'Address not available'
    if (typeof address === 'string') return address
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`.trim()
  }

  // Don't render map until token is loaded
  if (!mapboxToken) {
    return (
      <div className={`relative w-full h-full ${className} flex items-center justify-center bg-[#0B1D2D]`}>
        <div className="text-white text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p>Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="center"
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
              <div className="relative w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
            </div>
          </Marker>
        )}

        {/* Hostel Markers */}
        {hostels.map((hostel) => {
          // Skip hostels without valid location coordinates
          if (!hostel.location?.coordinates || hostel.location.coordinates.length !== 2) return null
          
          let [lng, lat] = hostel.location.coordinates
          
          // If coordinates are [0,0] or invalid, place at default India location
          // This shows ALL hostels but indicates which need location setup
          const hasDefaultLocation = (lng === 0 && lat === 0) || !lng || !lat || isNaN(lng) || isNaN(lat)
          if (hasDefaultLocation) {
            // Default to Bangalore center
            lng = 77.5946
            lat = 12.9716
          }
          
          const distance = calculateDistance(hostel)
          const isSelected = selectedHostel?._id === hostel._id

          return (
            <Marker
              key={hostel._id}
              longitude={lng}
              latitude={lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                handleMarkerClick(hostel)
              }}
            >
              <div className="relative cursor-pointer group">
                {/* Location Warning Badge */}
                {hasDefaultLocation && (
                  <div className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs shadow-lg">
                    ⚠️
                  </div>
                )}
                
                {/* Marker Circle */}
                <div className={`relative w-[70px] h-[70px] rounded-full border-4 overflow-hidden transition-all
                  ${isSelected ? 'border-blue-500 shadow-2xl scale-110' : hasDefaultLocation ? 'border-yellow-500 shadow-lg hover:scale-105' : 'border-white shadow-lg hover:scale-105'}`}
                  style={{ boxShadow: 'rgba(0,0,0,0.4) 0px 4px 12px' }}
                >
                  {hostel.photos && hostel.photos.length > 0 ? (
                    <img
                      src={typeof hostel.photos[0] === 'string' ? hostel.photos[0] : hostel.photos[0].url}
                      alt={hostel.name}
                      className="w-full h-full object-cover object-center"
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                      onError={(e) => {
                        console.error(`Failed to load image for ${hostel.name}:`, e.target.src)
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center"><span class="text-white text-2xl">🏠</span></div>'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                      <span className="text-white text-2xl">🏠</span>
                    </div>
                  )}
                </div>
                
                {/* Label */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-[#0F0F10] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg border border-gray-700">
                    {hostel.name.length > 15 ? hostel.name.substring(0, 15) + '...' : hostel.name}
                    {distance && <span className="text-[10px] text-gray-400 ml-1">• {distance}</span>}
                  </div>
                </div>
              </div>
            </Marker>
          )
        })}

        <NavigationControl position="top-right" />
      </Map>

      {/* Info Badge for Default Locations */}
      {hostels.length > 0 && hostels.some(h => {
        const [lng, lat] = h.location?.coordinates || [0, 0]
        return lng === 0 && lat === 0
      }) && (
        <div className="absolute top-20 left-4 right-4 z-10 pointer-events-none">
          <div className="bg-yellow-500/90 backdrop-blur text-gray-900 px-4 py-2 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-2 max-w-md">
            <span>⚠️</span>
            <span>Some hostels (marked with ⚠️) are shown at a default location. Owners need to set their actual location.</span>
          </div>
        </div>
      )}

      {hostels.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Hostels Found</h3>
            <p className="text-gray-600 text-sm">
              There are no hostels available at the moment. Please check back later.
            </p>
          </div>
        </div>
      )}

      {/* Floating Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-[#0F0F10] text-white flex items-center justify-center shadow-lg hover:bg-gray-900 transition-colors pointer-events-auto"
          >
            <X size={20} />
          </button>
          
          {/* Hostel Count Badge */}
          <div className="bg-[#0F0F10]/90 backdrop-blur text-white px-3 py-2 rounded-full text-xs font-semibold shadow-lg pointer-events-none">
            {hostels.length} Hostels
          </div>
        </div>

        <button
          onClick={handleSearchThisArea}
          className="px-4 py-2 rounded-full bg-[#0F0F10]/90 backdrop-blur text-white text-sm font-semibold shadow-lg hover:bg-gray-900 transition-colors flex items-center gap-2 pointer-events-auto"
        >
          <Search size={16} />
          Search This Area
        </button>

        <button
          onClick={handleCenterMap}
          className="w-10 h-10 rounded-full bg-[#0F0F10] text-white flex items-center justify-center shadow-lg hover:bg-gray-900 transition-colors pointer-events-auto"
        >
          <Navigation size={20} />
        </button>
      </div>

      {/* Bottom Sheet */}
      {selectedHostel && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-[#0F0F10] rounded-t-3xl shadow-2xl z-20 transition-all duration-300
            ${sheetExpanded ? 'h-[45%]' : 'h-[30%]'}`}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div 
              className="w-12 h-1.5 bg-gray-600 rounded-full cursor-pointer"
              onClick={() => setSheetExpanded(!sheetExpanded)}
            ></div>
          </div>

          <div className="px-5 pb-5 overflow-y-auto h-[calc(100%-24px)]">
            {/* Hero Photo */}
            {selectedHostel.photos && selectedHostel.photos.length > 0 && (
              <div className="relative h-48 -mx-5 mb-4 overflow-hidden">
                <img
                  src={typeof selectedHostel.photos[0] === 'string' ? selectedHostel.photos[0] : selectedHostel.photos[0].url}
                  alt={selectedHostel.name}
                  className="w-full h-full object-contain"
                  style={{ maxWidth: '100%', objectFit: 'contain', backgroundColor: '#1a1a1a' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F10] to-transparent pointer-events-none"></div>
              </div>
            )}
            
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-white text-xl font-bold mb-1">{selectedHostel.name}</h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400">
                    ☀️ {selectedHostel.weather || '25°C'}
                  </span>
                  {calculateDistance(selectedHostel) && (
                    <span className="text-gray-400">
                      📍 {calculateDistance(selectedHostel)} away
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedHostel(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Address */}
            <div className="mb-4 p-3 bg-gray-900 rounded-lg">
              <p className="text-gray-300 text-sm flex items-start gap-2">
                <MapPinned size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
                {formatAddress(selectedHostel.address)}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="text-white font-semibold text-sm">
                  {selectedHostel.rating ? selectedHostel.rating.toFixed(1) : 'N/A'}
                </span>
              </div>
              <span className="text-gray-400 text-sm">
                ({selectedHostel.reviewCount || 0} reviews)
              </span>
            </div>

            {/* Price and Type */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-900 p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Rent Range</p>
                <p className="text-white font-bold">
                  ₹{selectedHostel.priceRange?.min} - ₹{selectedHostel.priceRange?.max}
                </p>
              </div>
              <div className="bg-gray-900 p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Type</p>
                <p className="text-white font-bold capitalize">
                  {selectedHostel.hostelType}
                </p>
              </div>
            </div>

            {/* Gallery */}
            {selectedHostel.photos && selectedHostel.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {selectedHostel.photos.slice(0, 3).map((photo, idx) => (
                  <div key={idx} className="relative h-24 rounded-xl overflow-hidden">
                    <img
                      src={photo.url}
                      alt={`${selectedHostel.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={() => onHostelSelect && onHostelSelect(selectedHostel)}
              className="w-full bg-[#1E3A8A] hover:bg-[#2749A8] text-white py-3 rounded-xl font-semibold transition-colors shadow-lg"
            >
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
