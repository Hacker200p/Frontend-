from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
import py360convert
import numpy as np
import io
import os
from werkzeug.utils import secure_filename
import uuid

# Fix for NumPy 1.20+ compatibility
if not hasattr(np, 'bool'):
    np.bool = bool
if not hasattr(np, 'int'):
    np.int = int
if not hasattr(np, 'float'):
    np.float = float
if not hasattr(np, 'complex'):
    np.complex = complex
if not hasattr(np, 'object'):
    np.object = object
if not hasattr(np, 'str'):
    np.str = str

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads/panoramas'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max for panoramas

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_to_equirectangular(image_path, output_path, target_width=4096):
    """
    Convert image to equirectangular format using py360convert
    Supports various input formats: fisheye, cubemap, perspective, etc.
    """
    try:
        # Load image
        img = Image.open(image_path)
        img_array = np.array(img)
        
        # Determine input format based on aspect ratio
        height, width = img_array.shape[:2]
        aspect_ratio = width / height
        
        # If already close to 2:1, just resize
        if 1.9 <= aspect_ratio <= 2.1:
            target_height = target_width // 2
            equirect_img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
            equirect_array = np.array(equirect_img)
        
        # If it's a fisheye image (roughly square)
        elif 0.9 <= aspect_ratio <= 1.1:
            # Convert fisheye to equirectangular
            target_height = target_width // 2
            equirect_array = py360convert.e2e(
                img_array,
                h=target_height,
                w=target_width,
                mode='bilinear'
            )
        
        # If it's a cubemap (6:1 or 3:4 ratio)
        elif aspect_ratio > 5.5:  # Horizontal cubemap
            target_height = target_width // 2
            equirect_array = py360convert.c2e(
                img_array,
                h=target_height,
                w=target_width,
                mode='bilinear'
            )
        
        else:
            # For other formats, use perspective conversion
            target_height = target_width // 2
            equirect_array = py360convert.e2e(
                img_array,
                h=target_height,
                w=target_width,
                mode='bilinear'
            )
        
        # Convert back to PIL Image and save
        equirect_img = Image.fromarray(equirect_array.astype('uint8'))
        equirect_img.save(output_path, 'JPEG', quality=95, optimize=True)
        
        return True, None
    
    except Exception as e:
        return False, str(e)

def crop_to_center_square(img, target_size=None):
    """
    Crop image to center square to remove edges and reduce overlapping artifacts.
    This helps make stitching appear more flush by using only the central portion.
    """
    width, height = img.size
    min_dim = min(width, height)
    
    # Calculate crop box to get center square
    left = (width - min_dim) // 2
    top = (height - min_dim) // 2
    right = left + min_dim
    bottom = top + min_dim
    
    cropped = img.crop((left, top, right, bottom))
    
    # If target size specified, resize to it
    if target_size:
        cropped = cropped.resize((target_size, target_size), Image.Resampling.LANCZOS)
    
    return cropped

def adjust_perspective_distortion(img, fov_correction=0.80):
    """
    Apply aggressive center crop to reduce perspective distortion at edges.
    This creates a more flush appearance by using the less distorted central area.
    """
    width, height = img.size
    
    # Calculate new dimensions (crop edges by fov_correction factor)
    new_width = int(width * fov_correction)
    new_height = int(height * fov_correction)
    
    left = (width - new_width) // 2
    top = (height - new_height) // 2
    right = left + new_width
    bottom = top + new_height
    
    cropped = img.crop((left, top, right, bottom))
    # Resize back to original dimensions
    return cropped.resize((width, height), Image.Resampling.LANCZOS)

def stitch_cubemap_to_equirectangular(front, back, left, right, top, bottom, output_width=4096):
    """
    Stitch 6 individual photos (cubemap faces) into an equirectangular panorama.
    Includes preprocessing to reduce overlapping and improve flush appearance.
    
    Args:
        front, back, left, right, top, bottom: PIL Image objects
        output_width: Width of output equirectangular image (height will be width/2)
    
    Returns:
        PIL Image object in equirectangular format
    """
    # Find the target size based on the smallest dimension
    sizes = [img.size[0] for img in [front, back, left, right, top, bottom]]
    target_size = min(sizes)
    
    # Preprocess all images to improve stitching quality
    images = [front, back, left, right, top, bottom]
    processed_images = []
    
    for img in images:
        # Step 1: Crop to center square to remove edge distortion
        img_square = crop_to_center_square(img, target_size)
        
        # Step 2: Apply aggressive perspective correction to wall images only (not ceiling/floor)
        if img in [front, back, left, right]:
            img_corrected = adjust_perspective_distortion(img_square, fov_correction=0.80)
        else:
            img_corrected = img_square
        
        processed_images.append(img_corrected)
    
    front, back, left, right, top, bottom = processed_images
    
    # Convert PIL images to numpy arrays as a list (not stacked)
    # py360convert expects cubemap in specific order: [F, R, B, L, U, D]
    cube_faces = [
        np.array(front),   # Front
        np.array(right),   # Right
        np.array(back),    # Back
        np.array(left),    # Left
        np.array(top),     # Up (ceiling)
        np.array(bottom)   # Down (floor)
    ]
    
    # Convert cubemap to equirectangular with smoother interpolation
    output_height = output_width // 2
    equirect = py360convert.c2e(
        cubemap=cube_faces,
        h=output_height,
        w=output_width,
        mode='bilinear',
        cube_format='list'
    )
    
    # Convert back to PIL Image
    return Image.fromarray(equirect.astype('uint8'))

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Panorama Conversion Service',
        'endpoints': {
            '/convert': 'Convert single panorama image',
            '/upload-panorama': 'Upload and convert panorama (alias for /convert)',
            '/stitch': 'Stitch 6 photos (cubemap) into panorama',
            '/panorama/<filename>': 'Get converted panorama'
        }
    }), 200

@app.route('/convert', methods=['POST'])
def convert_panorama():
    """Convert single panorama image to equirectangular format"""
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file'}), 400
    
    try:
        # Read image
        image = Image.open(file.stream).convert('RGB')
        
        # Get custom width from request or use default
        output_width = int(request.form.get('width', 4096))
        output_width = min(output_width, 8192)  # Max 8K
        
        # Check if already equirectangular (2:1 ratio)
        img_array = np.array(image)
        height, width = img_array.shape[:2]
        
        if abs(width / height - 2.0) < 0.1:
            # Already equirectangular, just resize
            output_height = output_width // 2
            equirect_image = image.resize((output_width, output_height), Image.Resampling.LANCZOS)
        else:
            # Convert to equirectangular
            output_height = output_width // 2
            equirect = py360convert.e2e(
                img_array,
                h=output_height,
                w=output_width,
                mode='bilinear'
            )
            equirect_image = Image.fromarray(equirect.astype('uint8'))
        
        # Generate unique filename
        output_filename = f"{uuid.uuid4()}.jpg"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        
        # Save with high quality
        equirect_image.save(output_path, 'JPEG', quality=95, optimize=True)
        
        return jsonify({
            'success': True,
            'filename': output_filename,
            'url': f'/panorama/{output_filename}',
            'width': equirect_image.width,
            'height': equirect_image.height
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stitch', methods=['POST'])
def stitch_panorama():
    """Stitch 6 individual photos (cubemap) into equirectangular panorama"""
    
    # Check if all 6 faces are provided
    required_faces = ['front', 'back', 'left', 'right', 'top', 'bottom']
    
    for face in required_faces:
        if face not in request.files:
            return jsonify({'error': f'Missing {face} image'}), 400
    
    try:
        # Load all 6 images
        front = Image.open(request.files['front'].stream).convert('RGB')
        back = Image.open(request.files['back'].stream).convert('RGB')
        left = Image.open(request.files['left'].stream).convert('RGB')
        right = Image.open(request.files['right'].stream).convert('RGB')
        top = Image.open(request.files['top'].stream).convert('RGB')
        bottom = Image.open(request.files['bottom'].stream).convert('RGB')
        
        # Get custom width from request or use default
        output_width = int(request.form.get('width', 4096))
        output_width = min(output_width, 8192)  # Max 8K
        
        # Stitch into equirectangular
        equirect_image = stitch_cubemap_to_equirectangular(
            front, back, left, right, top, bottom, output_width
        )
        
        # Convert image to bytes buffer
        img_buffer = io.BytesIO()
        equirect_image.save(img_buffer, 'JPEG', quality=95, optimize=True)
        img_buffer.seek(0)
        
        # Return the image data directly
        return jsonify({
            'success': True,
            'width': equirect_image.width,
            'height': equirect_image.height,
            'message': 'Successfully stitched 6 photos into panorama',
            'imageData': 'binary'  # Placeholder - actual binary will be handled differently
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stitch-base64', methods=['POST'])
def stitch_panorama_base64():
    """Stitch 6 individual photos (cubemap) and return as base64"""
    
    # Check if all 6 faces are provided
    required_faces = ['front', 'back', 'left', 'right', 'top', 'bottom']
    
    for face in required_faces:
        if face not in request.files:
            return jsonify({'error': f'Missing {face} image'}), 400
    
    try:
        import base64
        
        # Load all 6 images
        front = Image.open(request.files['front'].stream).convert('RGB')
        back = Image.open(request.files['back'].stream).convert('RGB')
        left = Image.open(request.files['left'].stream).convert('RGB')
        right = Image.open(request.files['right'].stream).convert('RGB')
        top = Image.open(request.files['top'].stream).convert('RGB')
        bottom = Image.open(request.files['bottom'].stream).convert('RGB')
        
        # Get custom width from request or use default
        output_width = int(request.form.get('width', 4096))
        output_width = min(output_width, 8192)  # Max 8K
        
        # Stitch into equirectangular
        equirect_image = stitch_cubemap_to_equirectangular(
            front, back, left, right, top, bottom, output_width
        )
        
        # Convert image to base64
        img_buffer = io.BytesIO()
        equirect_image.save(img_buffer, 'JPEG', quality=95, optimize=True)
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.read()).decode('utf-8')
        
        return jsonify({
            'success': True,
            'width': equirect_image.width,
            'height': equirect_image.height,
            'message': 'Successfully stitched 6 photos into panorama',
            'imageBase64': img_base64
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/upload-panorama', methods=['POST'])
def upload_panorama():
    """Upload and convert a single panorama image (alias for /convert)"""
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file'}), 400
    
    try:
        # Read image
        image = Image.open(file.stream).convert('RGB')
        
        # Get custom width from request or use default
        output_width = int(request.form.get('width', 4096))
        output_width = min(output_width, 8192)  # Max 8K
        
        # Check if already equirectangular (2:1 ratio)
        img_array = np.array(image)
        height, width = img_array.shape[:2]
        
        if abs(width / height - 2.0) < 0.1:
            # Already equirectangular, just resize
            output_height = output_width // 2
            equirect_image = image.resize((output_width, output_height), Image.Resampling.LANCZOS)
        else:
            # Convert to equirectangular
            output_height = output_width // 2
            equirect = py360convert.e2e(
                img_array,
                h=output_height,
                w=output_width,
                mode='bilinear'
            )
            equirect_image = Image.fromarray(equirect.astype('uint8'))
        
        # Generate unique filename
        output_filename = f"{uuid.uuid4()}.jpg"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        
        # Save with high quality
        equirect_image.save(output_path, 'JPEG', quality=95, optimize=True)
        
        return jsonify({
            'success': True,
            'filename': output_filename,
            'url': f'/panorama/{output_filename}',
            'dimensions': {
                'width': equirect_image.width,
                'height': equirect_image.height
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/panorama/<filename>', methods=['GET'])
def get_panorama(filename):
    """Serve the converted panorama image with CORS headers"""
    try:
        response = send_file(
            os.path.join(OUTPUT_FOLDER, filename),
            mimetype='image/jpeg'
        )
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Cache-Control'] = 'public, max-age=31536000'
        return response
    except Exception as e:
        return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    print("Panorama Conversion Service Starting...")
    print("Endpoints:")
    print("   - POST /convert - Convert single panorama")
    print("   - POST /upload-panorama - Upload and convert panorama")
    print("   - POST /stitch - Stitch 6 photos into panorama")
    print("   - GET /panorama/<filename> - Get panorama")
    print("   - GET /health - Health check")
    app.run(debug=True, host='0.0.0.0', port=5001)
