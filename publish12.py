import subprocess, os

env = {k: v for k, v in os.environ.items() if k not in ('GITHUB_TOKEN', 'GH_TOKEN')}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True, env=env)
    print("CMD:", " ".join(args))
    print("OUT:", r.stdout.strip())
    print("ERR:", r.stderr.strip())
    return r.returncode

run(["git", "add", "-A"])
run(["git", "commit", "-m", "KamiWatch v2.1.1: UI improvements, sticky glass header, scrollable genres"])
run(["git", "push", "origin", "main"])
run(["git", "tag", "v2.1.1"])
run(["git", "push", "origin", "v2.1.1"])

r = subprocess.run([
    "gh", "release", "create", "v2.1.1",
    r"release\KamiWatch-Setup-2.1.1.exe",
    r"release\latest.yml",
    "--title", "KamiWatch v2.1.1 - The Glass UI Update",
    "--notes", """KamiWatch v2.1.1 — The Glass UI Update

✨ **Sleek UI Improvements:**
- **Scrollable Genres:** Fixed an issue where the new 30+ genres took up half the screen. They are now beautifully contained in a single horizontally-scrollable row!
- **Sticky Glass Header:** The Manga Search bar and hero section now stick to the top of the screen when you scroll down, magically transforming into a sleek frosted glass panel! (Just like iOS or modern web apps)."""
], capture_output=True, text=True, env=env)

print("Release STDOUT:", r.stdout)
print("Release STDERR:", r.stderr)
print("Release code:", r.returncode)
