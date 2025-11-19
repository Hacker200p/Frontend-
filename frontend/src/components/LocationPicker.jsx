import { useState, useEffect, useRef } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, X, Navigation } from 'lucide-react'
import api from '../services/api'

export default function LocationPicker({ initialLocation, onLocationSelect, onClose, hostelPhoto }) {
  const [mapboxToken, setMapboxToken] = useState('')
  const [viewState, setViewState] = useState({
    longitude: initialLocation?.longitude || 77.5946,
    latitude: initialLocation?.latitude || 12.9716,
    zoom: 12
  })
  const [markerPosition, setMarkerPosition] = useState(initialLocation || null)
  const [addressDetails, setAddressDetails] = useState(null)
  const [fetchingAddress, setFetchingAddress] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [tokenError, setTokenError] = useState(null)
  const mapRef = useRef(null)

  // Fetch Mapbox token from backend
  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log('LocationPicker: Fetching Mapbox token...')
        const response = await api.get('/config/mapbox-token')
        const token = response.data.token || response.data?.data?.token
        console.log('LocationPicker: Token received:', token ? 'Yes' : 'No')
        if (token) {
          setMapboxToken(token)
        } else {
          setTokenError('No token received from server')
          console.error('LocationPicker: No token in response:', response.data)
        }
      } catch (error) {
        console.error('LocationPicker: Error fetching Mapbox token:', error)
        setTokenError(error.message || 'Failed to fetch token')
      }
    }
    fetchToken()
  }, [])

  // Get user location on mount
  useEffect(() => {
    if (!initialLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
          }
          setUserLocation(loc) // Store user location
          setViewState(prev => ({
            ...prev,
            ...loc,
            zoom: 13
          }))
          setMarkerPosition(loc)
          // Fetch address for detected location
          if (mapboxToken) {
            fetchAddressFromCoordinates(loc.longitude, loc.latitude)
          }
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [initialLocation, mapboxToken])

  const fetchAddressFromCoordinates = async (lng, lat) => {
    if (!mapboxToken) return
    
    setFetchingAddress(true)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
      )
      const data = await response.json()
      
      if (data.features && data.features.length > 0) {
        // Extract address components
        let street = ''
        let city = ''
        let state = ''
        let pincode = ''
        
        // Try to find the most specific address information
        for (const feature of data.features) {
          const context = feature.context || []
          
          // Get street/address
          if (!street) {
            if (feature.place_type.includes('address')) {
              street = feature.place_name.split(',')[0] || feature.text || ''
            } else if (feature.place_type.includes('poi') || feature.place_type.includes('locality')) {
              street = feature.text || ''
            }
          }
          
          // Extract from context
          context.forEach(item => {
            if (!pincode && item.id.startsWith('postcode')) {
              pincode = item.text
            } else if (!city && item.id.startsWith('place')) {
              city = item.text
            } else if (!state && item.id.startsWith('region')) {
              state = item.text
            } else if (!city && item.id.startsWith('district')) {
              city = item.text
            }
          })
          
          // If city is still not found, check the feature itself
          if (!city && feature.place_type.includes('place')) {
            city = feature.text
          }
          
          // Stop if we have all components
          if (street && city && state && pincode) break
        }
        
        console.log('Address extracted:', { street, city, state, pincode })
        setAddressDetails({ street, city, state, pincode })
      }
    } catch (error) {
      console.error('Error fetching address:', error)
    } finally {
      setFetchingAddress(false)
    }
  }

  const handleMapClick = (event) => {
    const { lngLat } = event
    const position = {
      longitude: lngLat.lng,
      latitude: lngLat.lat
    }
    setMarkerPosition(position)
    fetchAddressFromCoordinates(lngLat.lng, lngLat.lat)
  }

  const goToMyLocation = () => {
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
            ...loc,
            zoom: 15,
          }))
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get your current location. Please check your browser permissions.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser')
    }
  }

  const handleConfirm = () => {
    if (markerPosition) {
      onLocationSelect(markerPosition, addressDetails)
    }
  }

  if (!mapboxToken) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 max-w-md">
          <div className="text-center">
            {tokenError ? (
              <>
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Map Error</h3>
                <p className="text-gray-600 text-sm mb-4">{tokenError}</p>
                <p className="text-xs text-gray-500 mb-4">Please check that the backend server is running and the Mapbox token is configured.</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-700">Loading map...</p>
                <p className="text-xs text-gray-500 mt-2">Fetching Mapbox token from server</p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Additional safety check before rendering map
  if (!mapboxToken) {
    console.log('LocationPicker: Waiting for token before rendering map...')
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-center text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  console.log('LocationPicker: Rendering map with token')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Select Hostel Location</h3>
            <p className="text-sm text-gray-600">Click on the map to place your hostel marker</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onClick={handleMapClick}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={mapboxToken}
            style={{ width: '100%', height: '100%' }}
          >
            {/* User's Current Location Marker */}
            {userLocation && (
              <Marker
                longitude={userLocation.longitude}
                latitude={userLocation.latitude}
                anchor="center"
              >
                <div className="relative w-12 h-12 flex items-center justify-center">
                  {/* Pulsing outer ring */}
                  <div className="absolute w-12 h-12 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
                  {/* Middle ring */}
                  <div className="absolute w-8 h-8 bg-blue-500 rounded-full opacity-30"></div>
                  {/* Inner dot */}
                  <div className="absolute w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
                </div>
              </Marker>
            )}

            {/* Hostel Location Marker */}
            {markerPosition && (
              <Marker
                longitude={markerPosition.longitude}
                latitude={markerPosition.latitude}
                anchor="bottom"
                draggable
                onDragEnd={(event) => {
                  const position = {
                    longitude: event.lngLat.lng,
                    latitude: event.lngLat.lat
                  }
                  setMarkerPosition(position)
                  fetchAddressFromCoordinates(event.lngLat.lng, event.lngLat.lat)
                }}
              >
                <div className="relative cursor-move">
                  {/* Marker Circle with hostel photo */}
                  <div className="relative w-[60px] h-[60px] rounded-full border-4 border-blue-500 overflow-hidden shadow-xl"
                    style={{ boxShadow: 'rgba(0,0,0,0.4) 0px 4px 12px' }}
                  >
                    {hostelPhoto ? (
                      <img
                        src={hostelPhoto}
                        alt="Hostel"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                        <span className="text-white text-2xl">🏠</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Pin pointer */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-blue-500"></div>
                </div>
              </Marker>
            )}

            <NavigationControl position="top-right" />
          </Map>

          {/* My Location Button */}
          <button
            onClick={goToMyLocation}
            className="absolute top-4 right-4 bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg transition border border-gray-200 z-10"
            title="Go to my location"
          >
            <Navigation size={20} className="text-blue-600" />
          </button>

          {/* Coordinates Display */}
          {markerPosition && (
            <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200 max-w-md">
              <p className="text-xs text-gray-600">Selected Location:</p>
              <p className="text-sm font-mono text-gray-800">
                {markerPosition.latitude.toFixed(6)}, {markerPosition.longitude.toFixed(6)}
              </p>
              {fetchingAddress && (
                <p className="text-xs text-blue-600 mt-1">Fetching address...</p>
              )}
              {addressDetails && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">Address:</p>
                  <p className="text-sm text-gray-800">
                    {[addressDetails.street, addressDetails.city, addressDetails.state, addressDetails.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            {markerPosition ? (
              fetchingAddress ? (
                <span className="text-blue-600 font-semibold">🔄 Fetching address...</span>
              ) : addressDetails ? (
                <span className="text-green-600 font-semibold">✓ Location & address selected</span>
              ) : (
                <span className="text-green-600 font-semibold">✓ Location selected</span>
              )
            ) : (
              <span>Click on the map to select a location</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!markerPosition}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
