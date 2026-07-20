import subprocess, os, sys

env = {k: v for k, v in os.environ.items() if k not in ('GITHUB_TOKEN', 'GH_TOKEN')}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True, env=env)
    print("CMD:", " ".join(args))
    print("OUT:", r.stdout.strip())
    print("ERR:", r.stderr.strip())
    return r.returncode

run(["git", "add", "-A"])
run(["git", "commit", "-m", "KamiWatch v2.0.2: Fix manga chapters limit & add genre browsing"])
run(["git", "push", "origin", "main"])
run(["git", "tag", "v2.0.2"])
run(["git", "push", "origin", "v2.0.2"])

# Create GitHub release
r = subprocess.run([
    "gh", "release", "create", "v2.0.2",
    r"release\KamiWatch-Setup-2.0.0.exe",
    r"release\latest.yml",
    "--title", "KamiWatch v2.0.2 - Genre Browsing & Manga Fixes",
    "--notes", """KamiWatch v2.0.2 — Feature & Bugfix Release

✨ **New Features:**
- **Genre Browsing**: Added a comprehensive list of genres on the Manga page! You can now browse MangaDex by Action, Romance, Comedy, Isekai, Shounen, and many more.
- **Fallback Button**: If MangaDex doesn't have English chapters for a highly-licensed series, a button will appear to instantly search for the manga on MangaKakalot.

🐛 **Bug Fixes:**
- Fixed a bug where MangaDex would return 0 chapters for *all* manga due to API limit restrictions."""
], capture_output=True, text=True, env=env)

print("Release STDOUT:", r.stdout)
print("Release STDERR:", r.stderr)
print("Release code:", r.returncode)
