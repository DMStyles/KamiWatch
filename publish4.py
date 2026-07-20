import subprocess, os, sys

env = {k: v for k, v in os.environ.items() if k not in ('GITHUB_TOKEN', 'GH_TOKEN')}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True, env=env)
    print("CMD:", " ".join(args))
    print("OUT:", r.stdout.strip())
    print("ERR:", r.stderr.strip())
    return r.returncode

run(["git", "add", "-A"])
run(["git", "commit", "-m", "KamiWatch v2.0.3: Fix auto-updater by bumping package.json version"])
run(["git", "push", "origin", "main"])
run(["git", "tag", "v2.0.3"])
run(["git", "push", "origin", "v2.0.3"])

# Create GitHub release
r = subprocess.run([
    "gh", "release", "create", "v2.0.3",
    r"release\KamiWatch-Setup-2.0.3.exe",
    r"release\latest.yml",
    "--title", "KamiWatch v2.0.3 - Updater Fix",
    "--notes", """KamiWatch v2.0.3 — Updater Fix Release

🐛 **Bug Fixes:**
- Fixed a bug where the in-app auto-updater wouldn't detect versions newer than v2.0.0 due to an unbumped version flag in the manifest."""
], capture_output=True, text=True, env=env)

print("Release STDOUT:", r.stdout)
print("Release STDERR:", r.stderr)
print("Release code:", r.returncode)
