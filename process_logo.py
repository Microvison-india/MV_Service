import os
from PIL import Image, ImageOps

def process():
    input_path = r"C:\Users\arpit\.gemini\antigravity\brain\c5614bdc-4dcf-49d9-96ad-a3484d6221c0\media__1782819083162.jpg"
    out_dir = r"e:\Projects\MV_service\Project\microvison-frontend\public"
    
    img = Image.open(input_path).convert("RGBA")
    
    # 1. Convert to grayscale and threshold to make it black & white
    gray = img.convert('L')
    bw = gray.point(lambda x: 255 if x > 200 else 0, mode='1')
    bw_rgba = bw.convert("RGBA")
    
    # 2. Find the bounding box of the non-white area
    # Invert the BW image so the content (black) becomes white and background (white) becomes black
    inverted = ImageOps.invert(bw.convert('L'))
    bbox = inverted.getbbox()
    
    if bbox:
        bw_rgba = bw_rgba.crop(bbox)
        inverted = inverted.crop(bbox)
        
    # The logo now has the red box (which is black now) taking up the whole image,
    # except maybe some padding.
    # Actually, the original image is a big red rectangle with text.
    # The inverted image's bounding box will perfectly bound the red rectangle.
    
    width, height = bw_rgba.size
    
    # 3. We want to remove "LED TV". It's in the bottom right corner.
    # Let's crop the bottom 25% of the image to remove "LED TV"
    # To be safer, let's crop 32% from the bottom.
    crop_h = int(height * 0.68)
    horizontal_logo = bw_rgba.crop((0, 0, width, crop_h))
    
    # We should also make the white background outside the logo transparent.
    # But since it's a solid block, it doesn't matter much.
    
    # Save the horizontal logo
    horizontal_logo.save(os.path.join(out_dir, "logo-horizontal.png"))
    
    # 4. Now for the small 'M' logo, it's on the left side.
    # The 'M' is inside a white square, which is inside the red box.
    # It's roughly the left side of the horizontal logo.
    # Let's crop a square from the left.
    m_box_size = crop_h
    small_logo = horizontal_logo.crop((0, 0, m_box_size, m_box_size))
    
    small_logo.save(os.path.join(out_dir, "logo-small.png"))
    print("Logos re-processed with tight cropping and saved to public folder.")

if __name__ == "__main__":
    process()
