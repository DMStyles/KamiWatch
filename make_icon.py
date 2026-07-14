from PIL import Image

src = r'C:\Users\dilsh\.gemini\antigravity\scratch\anivault\public\icon.png'
dst = r'C:\Users\dilsh\.gemini\antigravity\scratch\anivault\public\icon.ico'

img = Image.open(src).convert('RGBA')
if img.size[0] < 256 or img.size[1] < 256:
    img = img.resize((256, 256), Image.LANCZOS)

sizes = [(256,256), (128,128), (64,64), (48,48), (32,32), (16,16)]
icons = [img.resize(s, Image.LANCZOS) for s in sizes]
icons[0].save(dst, format='ICO', sizes=[(s[0], s[1]) for s in sizes])
print('ICO created:', dst)
