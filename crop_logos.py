from PIL import Image
import os

# Create assets directory if it doesn't exist
os.makedirs('assets', exist_ok=True)

img = Image.open('/Users/jonathanjaladi/Downloads/voice_agent_complete/jl.png')
width, height = img.size

# Crop square logo (top part)
# Based on visual inspection, the square logo takes up about the top 3/4 of the height
square_logo = img.crop((0, 0, width, int(height * 0.78)))
square_logo.save('assets/logo_square.png')

# Crop text logo (bottom part)
text_logo = img.crop((0, int(height * 0.79), width, height))
text_logo.save('assets/logo_text.png')
