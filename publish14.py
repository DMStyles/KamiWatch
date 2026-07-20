import subprocess, os

env = {k: v for k, v in os.environ.items() if k not in ('GITHUB_TOKEN', 'GH_TOKEN')}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True, env=env)
    print("CMD:", " ".join(args))
    print("OUT:", r.stdout.strip())
    print("ERR:", r.stderr.strip())
    return r.returncode

run(["git", "add", "-A"])
run(["git", "commit", "-m", "KamiWatch v2.1.3: Widen genre bar"])
run(["git", "push", "origin", "main"])
run(["git", "tag", "v2.1.3"])
run(["git", "push", "origin", "v2.1.3"])

r = subprocess.run([
    "gh", "release", "create", "v2.1.3",
    r"release\KamiWatch-Setup-2.1.3.exe",
    r"release\latest.yml",
    "--title", "KamiWatch v2.1.3 - UI Polish",
    "--notes", """KamiWatch v2.1.3 — UI Polish

✨ **Minor Improvements:**
- Widened the manga genre scroll bar to take up the full width of the screen instead of being constrained to the middle. This allows you to see more genres on screen at once!"""
], capture_output=True, text=True, env=env)

print("Release STDOUT:", r.stdout)
print("Release STDERR:", r.stderr)
print("Release code:", r.returncode)
