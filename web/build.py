#!/usr/bin/env python3
"""Inline the app JS into src.html -> index.html (single portable file)."""
import pathlib

root = pathlib.Path(__file__).resolve().parent
shell = (root / 'src.html').read_text()
core = (root / 'app-core.js').read_text()
render = (root / 'app-render.js').read_text()
ui = (root / 'app-ui.js').read_text()

js = "\n".join([core, render, ui])
out = shell.replace('/*APP_JS*/', js)
(root / 'index.html').write_text(out)
print(f"built index.html: {len(out)/1024:.1f} KB")
