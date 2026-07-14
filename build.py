#!/usr/bin/env python3
"""
AniVault Build Script
Automates the full production build:
  1. Bundles Python backend with PyInstaller
  2. Builds React frontend with Vite
  3. Packages everything into a Windows NSIS installer

Usage:
  python build.py
"""

import subprocess
import sys
import os
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT, "backend")
BACKEND_DIST = os.path.join(ROOT, "backend-dist")
BACKEND_BUILD = os.path.join(ROOT, "backend-build")


def run(cmd, cwd=None, shell=True):
    print(f"\n{'='*60}")
    print(f"  Running: {cmd}")
    print(f"{'='*60}")
    result = subprocess.run(cmd, cwd=cwd or ROOT, shell=shell)
    if result.returncode != 0:
        print(f"\n❌ Command failed with exit code {result.returncode}")
        sys.exit(result.returncode)
    print("✅ Done!")


def clean():
    """Remove previous build artifacts"""
    print("\n🧹 Cleaning previous builds...")
    for folder in [BACKEND_DIST, BACKEND_BUILD, os.path.join(ROOT, "dist"), os.path.join(ROOT, "release")]:
        if os.path.exists(folder):
            shutil.rmtree(folder)
            print(f"  Removed: {folder}")
    print("✅ Clean done!")


def build_backend():
    """Bundle Python backend with PyInstaller"""
    print("\n🐍 Building Python backend with PyInstaller...")
    run(
        f'pyinstaller anivault-backend.spec '
        f'--distpath "{BACKEND_DIST}" '
        f'--workpath "{BACKEND_BUILD}" '
        f'--clean',
        cwd=BACKEND_DIR
    )

    exe = os.path.join(BACKEND_DIST, "anivault-backend.exe")
    if not os.path.exists(exe):
        print("❌ Backend exe not found! Build failed.")
        sys.exit(1)
    size_mb = os.path.getsize(exe) / 1024 / 1024
    print(f"✅ Backend built: {exe} ({size_mb:.1f} MB)")


def build_frontend():
    """Build React frontend with Vite"""
    print("\n⚛️  Building React frontend with Vite...")
    run("npm run build:react", cwd=ROOT)


def build_installer():
    """Package everything with electron-builder"""
    print("\n📦 Packaging with electron-builder...")
    run("npx electron-builder --win --x64", cwd=ROOT)

    release_dir = os.path.join(ROOT, "release")
    installers = [f for f in os.listdir(release_dir) if f.endswith(".exe") and "Setup" in f]
    if installers:
        print(f"\n🎉 Installer created: release/{installers[0]}")
        print(f"   Path: {os.path.join(release_dir, installers[0])}")
    else:
        print("\n⚠️  Installer not found in release/ folder")


if __name__ == "__main__":
    print("""
╔═══════════════════════════════════════╗
║        AniVault Production Build      ║
╚═══════════════════════════════════════╝
""")
    clean()
    build_backend()
    build_frontend()
    build_installer()
    print("""
╔═══════════════════════════════════════╗
║  ✅  Build Complete!                  ║
║  📁  Check the release/ folder        ║
╚═══════════════════════════════════════╝
""")
