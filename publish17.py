import subprocess, os

env = {k: v for k, v in os.environ.items() if k not in ('GITHUB_TOKEN', 'GH_TOKEN')}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True, env=env)
    print("CMD:", " ".join(args))
    print("OUT:", r.stdout.strip())
    print("ERR:", r.stderr.strip())
    return r.returncode

run(["git", "add", "-A"])
run(["git", "commit", "-m", "KamiWatch v2.1.6: Fix broken manga reader images by proxying all sources"])
run(["git", "push", "origin", "main"])
run(["git", "tag", "v2.1.6"])
run(["git", "push", "origin", "v2.1.6"])

r = subprocess.run([
    "gh", "release", "create", "v2.1.6",
    r"release\KamiWatch-Setup-2.1.6.exe",
    r"release\latest.yml",
    "--title", "KamiWatch v2.1.6 - Manga Reader Image Fix",
    "--notes", """KamiWatch v2.1.6 — Reader Image Fix

🐛 **Hotfix:**
- **Manga Reader Image Load Fix:** Routed all manga chapter images (including MangaDex, MangaKakalot, MangaDict, and Webtoons) through our backend proxy with domain-specific Referer and User-Agent headers. This fixes the broken image placeholders when reading chapters!"""
], capture_output=True, text=True, env=env)

print("Release STDOUT:", r.stdout)
print("Release STDERR:", r.stderr)
print("Release code:", r.returncode)
