import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const PanoramaViewer = ({ 
  panoramaUrl, 
  width = '100%', 
  height = '600px',
  autoRotate = true,
  showControls = true 
}) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    if (!panoramaUrl || !containerRef.current) return;

    const container = containerRef.current;
    let animationId;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0.01);
    cameraRef.current = camera;

    // Renderer setup with anti-aliasing and tone mapping
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create sphere geometry for panorama
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); // Flip inside out

    // Load equirectangular texture with CORS
    const textureLoader = new THREE.TextureLoader();
    console.log('Loading panorama from:', panoramaUrl);
    
    textureLoader.setCrossOrigin('anonymous');
    textureLoader.load(
      panoramaUrl,
      (texture) => {
        console.log('Texture loaded successfully:', texture);
        // Texture settings for better quality
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        // Material with improved settings
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          toneMapped: false
        });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
        console.log('Sphere added to scene');
        setLoading(false);
      },
      (progress) => {
        // Progress callback
        if (progress.total > 0) {
          const percent = (progress.loaded / progress.total * 100).toFixed(2);
          console.log('Loading panorama:', percent + '%');
        }
      },
      (err) => {
        // Error callback
        console.error('Error loading panorama:', err);
        console.error('Failed URL:', panoramaUrl);
        setError('Failed to load panorama image. Check console for details.');
        setLoading(false);
      }
    );

    // Enhanced OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.rotateSpeed = -0.5;
    controls.zoomSpeed = 1.2;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!container) return;
      
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (controls) {
        controls.dispose();
      }
      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      if (geometry) {
        geometry.dispose();
      }
    };
  }, [panoramaUrl, autoRotate]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Reset camera view
  const resetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 0, 0.1);
      controlsRef.current.reset();
    }
  };

  // Toggle auto-rotate
  const toggleAutoRotate = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
    }
  };

  if (!panoramaUrl) {
    return (
      <div style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        color: 'white'
      }}>
        <p>No panorama available</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        borderRadius: '12px',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '24px', margin: '0 0 10px 0' }}>⚠️</p>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{error}</p>
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', opacity: 0.8 }}>URL: {panoramaUrl}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Viewer Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#000',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.8)',
          borderRadius: '12px',
          color: 'white',
          zIndex: 10
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '20px', fontSize: '14px' }}>Loading panorama...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(220, 38, 38, 0.9)',
          borderRadius: '12px',
          color: 'white',
          zIndex: 10
        }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>⚠️ Error</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Control Panel */}
      {showControls && !loading && !error && (
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            background: 'rgba(0,0,0,0.7)',
            padding: '12px 20px',
            borderRadius: '50px',
            backdropFilter: 'blur(10px)',
            zIndex: 5
          }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              resetView();
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
          >
            🔄 Reset
          </button>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleAutoRotate();
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
          >
            🔁 Auto-Rotate
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFullscreen();
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
          >
            {isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      )}

      {/* Instructions */}
      {showControls && !loading && !error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.7)',
          padding: '10px 16px',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
          color: 'white',
          fontSize: '12px',
          zIndex: 5
        }}>
          <p style={{ margin: 0, fontWeight: '500' }}>🖱️ Drag to look around</p>
          <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>🔍 Scroll to zoom</p>
        </div>
      )}
    </div>
  );
};

export default PanoramaViewer;
