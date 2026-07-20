import subprocess, os

env = {k: v for k, v in os.environ.items() if k not in ('GITHUB_TOKEN', 'GH_TOKEN')}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True, env=env)
    print("CMD:", " ".join(args))
    print("OUT:", r.stdout.strip())
    print("ERR:", r.stderr.strip())
    return r.returncode

run(["git", "add", "-A"])
run(["git", "commit", "-m", "KamiWatch v2.0.8: Fix orphaned backend bug, fix genre fallback"])
run(["git", "push", "origin", "main"])
run(["git", "tag", "v2.0.8"])
run(["git", "push", "origin", "v2.0.8"])

r = subprocess.run([
    "gh", "release", "create", "v2.0.8",
    r"release\KamiWatch-Setup-2.0.8.exe",
    r"release\latest.yml",
    "--title", "KamiWatch v2.0.8 - Ultimate Backend & Genre Fix",
    "--notes", """KamiWatch v2.0.8 — Ultimate Backend & Genre Fix

🐛 **Critical Bug Fixes:**
- **Orphaned Process Bug:** Fixed an issue where the background `kamiwatch-backend.exe` would keep running invisibly after closing the app. This prevented updates from installing the new backend properly, causing users to get stuck on broken older versions.
- **Genre Browsing Fix:** Re-routed the Manga Genre browser (Action, Adventure, etc.) to hit MangaDex directly if the backend fails. This means genres will now **always** work even if your backend installation is broken.

> **Why were my chapters showing 0 before?** When you closed KamiWatch, the background server didn't close. When you installed an update, the new server couldn't start because the old one was still hogging the port. This release fixes that forever!"""
], capture_output=True, text=True, env=env)

print("Release STDOUT:", r.stdout)
print("Release STDERR:", r.stderr)
print("Release code:", r.returncode)
