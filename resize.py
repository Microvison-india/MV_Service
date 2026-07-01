import os
from PIL import Image

def resize_image(image_path, min_width=1500, min_height=1000):
    try:
        img = Image.open(image_path)
        original_width, original_height = img.size
        print(f"Original {os.path.basename(image_path)}: {original_width}x{original_height}")
        
        # Calculate scaling factors
        scale_w = min_width / original_width
        scale_h = min_height / original_height
        
        # To ensure both dimensions are AT LEAST the min, we take the max of the two scales
        scale = max(scale_w, scale_h)
        
        if scale > 1.0: # Only resize if we need to upscale
            new_width = int(original_width * scale)
            new_height = int(original_height * scale)
            
            # Use high-quality resampling (LANCZOS)
            resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save it with a new name
            dir_name = os.path.dirname(image_path)
            base_name = os.path.basename(image_path)
            name, ext = os.path.splitext(base_name)
            new_path = os.path.join(dir_name, f"{name}_large{ext}")
            
            resized_img.save(new_path)
            print(f"Saved {os.path.basename(new_path)}: {new_width}x{new_height}")
        else:
            print(f"Image is already larger than {min_width}x{min_height}. No resize needed.")
            
    except Exception as e:
        print(f"Failed to process {image_path}: {e}")

if __name__ == "__main__":
    folder = r"E:\Projects\MV_service\Project"
    
    img1 = os.path.join(folder, "Screenshot 2026-07-01 025610.png")
    img2 = os.path.join(folder, "resized_pan_card.png")
    
    if os.path.exists(img1):
        resize_image(img1, 1500, 1000)
    else:
        print(f"Could not find {img1}")
        
    if os.path.exists(img2):
        resize_image(img2, 1500, 1000)
    else:
        print(f"Could not find {img2}")
