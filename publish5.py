import subprocess, os, sys

env = {k: v for k, v in os.environ.items() if k not in ('GITHUB_TOKEN', 'GH_TOKEN')}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True, env=env)
    print("CMD:", " ".join(args))
    print("OUT:", r.stdout.strip())
    print("ERR:", r.stderr.strip())
    return r.returncode

run(["git", "add", "-A"])
run(["git", "commit", "-m", "KamiWatch v2.0.4: Fix missing UI updates by rebuilding React frontend"])
run(["git", "push", "origin", "main"])
run(["git", "tag", "v2.0.4"])
run(["git", "push", "origin", "v2.0.4"])

# Create GitHub release
r = subprocess.run([
    "gh", "release", "create", "v2.0.4",
    r"release\KamiWatch-Setup-2.0.4.exe",
    r"release\latest.yml",
    "--title", "KamiWatch v2.0.4 - UI Update Fix",
    "--notes", """KamiWatch v2.0.4 — UI Update Fix

🐛 **Bug Fixes:**
- Fixed a massive packaging error where previous v2.0.2/v2.0.3 installers did not include the newly compiled React UI! The new Genre tags and MangaKakalot fallback button are actually visible now!"""
], capture_output=True, text=True, env=env)

print("Release STDOUT:", r.stdout)
print("Release STDERR:", r.stderr)
print("Release code:", r.returncode)
