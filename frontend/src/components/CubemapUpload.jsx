import React, { useState } from 'react';
import axios from 'axios';
import PanoramaViewer from './PanoramaViewer';

const CubemapUpload = ({ onUploadSuccess }) => {
  const [faces, setFaces] = useState({
    front: null,
    back: null,
    left: null,
    right: null
  });
  
  const [previews, setPreviews] = useState({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Debug: Log when showPreview changes
  React.useEffect(() => {
    console.log('showPreview changed to:', showPreview);
  }, [showPreview]);

  const faceLabels = {
    front: '🧱 Front Wall',
    back: '🧱 Back Wall',
    left: '🧱 Left Wall',
    right: '🧱 Right Wall'
  };

  const handleFileChange = (face, file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(`${face} must be an image file`);
      return;
    }

    // Validate file size (max 10MB per image)
    if (file.size > 10 * 1024 * 1024) {
      setError(`${face} image must be less than 10MB`);
      return;
    }

    setFaces(prev => ({ ...prev, [face]: file }));
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({ ...prev, [face]: reader.result }));
    };
    reader.readAsDataURL(file);
    
    setError(null);
  };

  const handleStitch = async () => {
    // Validate all faces are uploaded
    const missingFaces = Object.keys(faces).filter(face => !faces[face]);
    if (missingFaces.length > 0) {
      setError(`Please upload all 4 photos. Missing: ${missingFaces.join(', ')}`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      
      // Helper function to flip an image horizontally
      const flipImageHorizontally = async (file) => {
        return new Promise((resolve) => {
          const img = new Image();
          const reader = new FileReader();
          
          reader.onload = (e) => {
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              
              // Flip horizontally
              ctx.scale(-1, 1);
              ctx.drawImage(img, -img.width, 0, img.width, img.height);
              
              canvas.toBlob((blob) => {
                resolve(blob);
              }, file.type, 0.95);
            };
            img.src = e.target.result;
          };
          
          reader.readAsDataURL(file);
        });
      };
      
      // Add the 4 uploaded images - flip back and right, keep front and left as-is
      for (const face of Object.keys(faces)) {
        if (face === 'back' || face === 'right') {
          // Flip back and right wall images
          const flippedBlob = await flipImageHorizontally(faces[face]);
          formData.append(face, flippedBlob, faces[face].name);
        } else {
          // Keep front and left as-is
          formData.append(face, faces[face]);
        }
      }
      
      // Create a white ceiling image
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 512);
      
      // Convert canvas to blob and append as top face (ceiling)
      await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          formData.append('top', blob, 'ceiling-white.jpg');
          resolve();
        }, 'image/jpeg', 0.95);
      });
      
      // Append same white image as bottom face (floor)
      await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          formData.append('bottom', blob, 'floor-white.jpg');
          resolve();
        }, 'image/jpeg', 0.95);
      });

      const response = await axios.post(
        'http://localhost:5001/stitch',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
          }
        }
      );

      console.log('Stitch response:', response.data);
      setResult(response.data);
      const panoramaUrl = `http://localhost:5001${response.data.url}`;
      console.log('Setting preview URL:', panoramaUrl);
      setPreviewUrl(panoramaUrl);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to stitch panorama');
      console.error('Stitch error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmUpload = () => {
    console.log('handleConfirmUpload called');
    if (onUploadSuccess && result) {
      onUploadSuccess(result);
    }
    setShowPreview(false);
  };

  const handleCancelPreview = () => {
    console.log('handleCancelPreview called');
    setShowPreview(false);
    setPreviewUrl(null);
  };

  const resetAll = () => {
    setFaces({
      front: null,
      back: null,
      left: null,
      right: null
    });
    setPreviews({});
    setError(null);
    setResult(null);
    setProgress(0);
    setShowPreview(false);
    setPreviewUrl(null);
  };

  const allFacesUploaded = Object.values(faces).every(face => face !== null);

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '700' }}>
          📸 Upload Room Photos
        </h3>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
          Upload 4 photos (4 walls) to create a 360° panorama
        </p>
        <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: '12px' }}>
          Ceiling and floor will be automatically added as white
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        {Object.keys(faces).map(face => (
          <div key={face} style={{ aspectRatio: '1' }}>
            <label style={{ display: 'block', cursor: 'pointer', height: '100%' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(face, e.target.files[0])}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              
              {previews[face] ? (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <img 
                    src={previews[face]} 
                    alt={face}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                    <span>✓ {faceLabels[face]}</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '2px dashed rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}>
                  <span style={{ fontSize: '40px' }}>📷</span>
                  <span style={{ fontSize: '12px' }}>{faceLabels[face]}</span>
                </div>
              )}
            </label>
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          background: 'rgba(220, 38, 38, 0.2)',
          border: '1px solid rgba(220, 38, 38, 0.5)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          ⚠️ {error}
        </div>
      )}

      {uploading && (
        <div style={{ marginBottom: '15px', textAlign: 'center' }}>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #34d399, #10b981)',
              width: `${progress}%`,
              transition: 'width 0.3s'
            }} />
          </div>
          <p style={{ fontSize: '14px', margin: 0 }}>Stitching panorama... {progress}%</p>
        </div>
      )}

      {result && !showPreview && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.2)',
          border: '1px solid rgba(34, 197, 94, 0.5)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          ✅ Panorama created successfully! ({result.width}x{result.height})
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={handleStitch}
          disabled={!allFacesUploaded || uploading}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: allFacesUploaded && !uploading ? 'pointer' : 'not-allowed',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            opacity: allFacesUploaded && !uploading ? 1 : 0.5,
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            if (allFacesUploaded && !uploading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 20px rgba(16, 185, 129, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {uploading ? '⏳ Stitching...' : '🎨 Stitch Panorama'}
        </button>
        
        {result && previewUrl && (
          <button
            type="button"
            onClick={() => {
              console.log('Opening preview modal');
              setShowPreview(true);
            }}
            disabled={uploading}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              opacity: uploading ? 0.5 : 1,
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            👁️ View Panorama
          </button>
        )}
        
        <button
          type="button"
          onClick={resetAll}
          disabled={uploading}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            if (!uploading) e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          🔄 Reset All
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && previewUrl && (
        <div 
          key="panorama-modal"
          onClick={(e) => {
            // Only log, don't close - user must use buttons
            console.log('Modal background clicked - use buttons to close');
            e.stopPropagation();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '1200px',
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textAlign: 'center',
              position: 'relative'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>
                🎯 Preview Your 360° Panorama
              </h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                Use mouse to rotate • Scroll to zoom • Click Confirm to save
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(false);
                }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
            </div>

            <div 
              style={{ 
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '500px',
                position: 'relative'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <PanoramaViewer
                panoramaUrl={previewUrl}
                width="100%"
                height="500px"
                autoRotate={true}
                showControls={true}
              />
            </div>

            <div style={{
              padding: '20px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              background: '#f8f9fa'
            }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmUpload();
                }}
                style={{
                  padding: '14px 32px',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                ✅ Confirm & Save
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelPreview();
                }}
                style={{
                  padding: '14px 32px',
                  border: '2px solid #dc2626',
                  borderRadius: '25px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'white',
                  color: '#dc2626',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#dc2626';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#dc2626';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ❌ Close Preview
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetAll();
                }}
                style={{
                  padding: '14px 32px',
                  border: '2px solid #6b7280',
                  borderRadius: '25px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'white',
                  color: '#6b7280',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#6b7280';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#6b7280';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🔄 Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CubemapUpload;
