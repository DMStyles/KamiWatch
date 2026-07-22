import subprocess, os

env = {k: v for k, v in os.environ.items() if k not in ('GITHUB_TOKEN', 'GH_TOKEN')}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True, env=env)
    print("CMD:", " ".join(args))
    print("OUT:", r.stdout.strip())
    print("ERR:", r.stderr.strip())
    return r.returncode

run(["git", "add", "-A"])
run(["git", "commit", "-m", "KamiWatch v2.1.5: MangaDict & Webtoons sources + Pagination support"])
run(["git", "push", "origin", "main"])
run(["git", "tag", "v2.1.5"])
run(["git", "push", "origin", "v2.1.5"])

r = subprocess.run([
    "gh", "release", "create", "v2.1.5",
    r"release\KamiWatch-Setup-2.1.5.exe",
    r"release\latest.yml",
    "--title", "KamiWatch v2.1.5 - New Manga Sources & Pagination",
    "--notes", """KamiWatch v2.1.5 — Major Manga Features Update

✨ **What's New:**
- **New Manga Sources:** Added MangaDict (`mangaddict.com`) and Webtoons (`webtoons.com`) directly into the Manga Reader!
- **Webtoons Image Proxy:** Custom backend streaming proxy to bypass Webtoons referrer checks & hotlinking restrictions.
- **Page-by-Page Pagination:** Full pagination controls (`1, 2, 3, 4...`, `← Prev`, `Next →`) for manga search and genre browsing.
- **UI Fixes:** Refactored source tabs and genre tags styling so they are clear, legible, and don't squish when scrolling."""
], capture_output=True, text=True, env=env)

print("Release STDOUT:", r.stdout)
print("Release STDERR:", r.stderr)
print("Release code:", r.returncode)
