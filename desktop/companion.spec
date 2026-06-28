# -*- mode: python ; coding: utf-8 -*-
# 桌面悬浮伙伴「小H」PyInstaller 打包配置
# 构建（项目根目录运行）：npm run companion:build
#   等价于：python -m PyInstaller --noconfirm \
#            --distpath desktop/dist --workpath desktop/build desktop/companion.spec
# 产物：desktop/dist/小H.exe —— 单文件、免装 Python、双击即用（默认 emoji 模式）

import os

script = os.path.join(SPECPATH, "companion.py")

a = Analysis(
    [script],
    pathex=[],
    binaries=[],
    datas=[],
    # PIL 仅在图片 / GIF 模式下按需 import，显式声明确保打包时不被漏掉
    hiddenimports=["PIL.Image", "PIL.ImageTk", "PIL.ImageSequence"],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="小H",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,            # 窗口程序，无控制台黑框
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
