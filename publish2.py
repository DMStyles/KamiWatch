import subprocess, os, sys

env = {k: v for k, v in os.environ.items() if k not in ('GITHUB_TOKEN', 'GH_TOKEN')}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True, env=env)
    print("CMD:", " ".join(args))
    print("OUT:", r.stdout.strip())
    print("ERR:", r.stderr.strip())
    return r.returncode

run(["git", "add", "-A"])
run(["git", "commit", "-m", "KamiWatch v2.0.1: Hotfix for MangaDex Cloudflare block"])
run(["git", "push", "origin", "main"])
run(["git", "tag", "v2.0.1"])
run(["git", "push", "origin", "v2.0.1"])

# Create GitHub release
r = subprocess.run([
    "gh", "release", "create", "v2.0.1",
    r"release\KamiWatch-Setup-2.0.0.exe",
    r"release\latest.yml",
    "--title", "KamiWatch v2.0.1 - Hotfix",
    "--notes", """KamiWatch v2.0.1 — Hotfix Release

🐛 **Bug Fixes:**
- Fixed MangaDex search being blocked by Cloudflare (which caused the Popular Titles grid to be empty).
- Fixed chapter pages failing to load for MangaDex due to the same block."""
], capture_output=True, text=True, env=env)

print("Release STDOUT:", r.stdout)
print("Release STDERR:", r.stderr)
print("Release code:", r.returncode)
