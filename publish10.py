import subprocess, os

env = {k: v for k, v in os.environ.items() if k not in ('GITHUB_TOKEN', 'GH_TOKEN')}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True, env=env)
    print("CMD:", " ".join(args))
    print("OUT:", r.stdout.strip())
    print("ERR:", r.stderr.strip())
    return r.returncode

run(["git", "add", "-A"])
run(["git", "commit", "-m", "KamiWatch v2.0.9: Increase manga limits and handle external chapters"])
run(["git", "push", "origin", "main"])
run(["git", "tag", "v2.0.9"])
run(["git", "push", "origin", "v2.0.9"])

r = subprocess.run([
    "gh", "release", "create", "v2.0.9",
    r"release\KamiWatch-Setup-2.0.9.exe",
    r"release\latest.yml",
    "--title", "KamiWatch v2.0.9 - Better Manga & External Chapters",
    "--notes", """KamiWatch v2.0.9 — More Manga, Better Chapters

✨ **New Features:**
- **Expanded Library:** The Manga tab now shows the **Top 60** most popular manga on MangaDex by default instead of a handful of hardcoded titles.
- **Deeper Genres:** Genre browsing has been upgraded to load up to 100 manga per genre!
- **External Chapter Support:** Series like *One Piece* only have official chapters linking out to publishers (like MangaPlus). If you click an external chapter, you will now get a beautiful UI with a button to open the official publisher's site directly instead of a confusing "No pages found" error!
- **Missing Chapters Fix:** Added a handy "🔄 Try MangaKakalot" toggle right inside the Chapter List if your manga is missing chapters on MangaDex."""
], capture_output=True, text=True, env=env)

print("Release STDOUT:", r.stdout)
print("Release STDERR:", r.stderr)
print("Release code:", r.returncode)
