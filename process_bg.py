import os
from rembg import remove
from PIL import Image

images = ['messi-v2.png', 'ronaldo-v2.png', 'neymar-v2.png', 'mbappe-v2.png']

for img in images:
    print(f'Processing {img}...')
    input_path = os.path.join('public', img)
    output_path = os.path.join('public', img.replace('v2', 'v3'))
    
    input_image = Image.open(input_path)
    output_image = remove(input_image)
    output_image.save(output_path)
    print(f'Saved {output_path}')
