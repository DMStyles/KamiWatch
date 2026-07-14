# AniVault Backend - PyInstaller Spec File
# Run: pyinstaller anivault-backend.spec

import sys
import os
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

block_cipher = None

# Collect all hidden imports for FastAPI, yt-dlp, httpx, bs4
hiddenimports = (
    collect_submodules('uvicorn') +
    collect_submodules('fastapi') +
    collect_submodules('starlette') +
    collect_submodules('httpx') +
    collect_submodules('bs4') +
    collect_submodules('yt_dlp') +
    collect_submodules('pydantic') +
    collect_submodules('anyio') +
    collect_submodules('sniffio') +
    [
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'scrapers.anikoto',
        'scrapers.animetake',
        'scrapers.schedule_api',
        'downloader',
        'database',
        'library',
        'sqlite3',
        'email.mime.text',
        'email.mime.multipart',
    ]
)

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=collect_data_files('yt_dlp') + collect_data_files('certifi'),
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='anivault-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # No console window shown to users
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
