import subprocess, os

env = {k: v for k, v in os.environ.items() if k not in ('GITHUB_TOKEN', 'GH_TOKEN')}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True, env=env)
    print("CMD:", " ".join(args))
    print("OUT:", r.stdout.strip())
    print("ERR:", r.stderr.strip())
    return r.returncode

run(["git", "add", "-A"])
run(["git", "commit", "-m", "KamiWatch v2.0.7: Add manga shortcut card on anime details page"])
run(["git", "push", "origin", "main"])
run(["git", "tag", "v2.0.7"])
run(["git", "push", "origin", "v2.0.7"])

r = subprocess.run([
    "gh", "release", "create", "v2.0.7",
    r"release\KamiWatch-Setup-2.0.7.exe",
    r"release\latest.yml",
    "--title", "KamiWatch v2.0.7 - Manga Shortcut on Anime Pages",
    "--notes", """KamiWatch v2.0.7 — Manga Shortcut on Anime Pages

✨ **New Features:**
- **📚 Read the Manga card** — Every anime detail page now automatically searches MangaDex for the manga adaptation and shows a shortcut card below the Synopsis (when found). Click the cover or "📖 Start Reading" to go directly to the manga reader.
- Smart title cleaning strips season suffixes ("Season 2", "Part 3", etc.) before searching for best manga match.

> **Note:** v2.0.6 is the first version with a correctly bundled backend. Install v2.0.6 first if upgrading from older versions, then this update will apply automatically."""
], capture_output=True, text=True, env=env)

print("Release STDOUT:", r.stdout)
print("Release STDERR:", r.stderr)
print("Release code:", r.returncode)
