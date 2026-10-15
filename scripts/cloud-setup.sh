#!/bin/bash
# Cloud environment setup script for HyperFrames video work and Scrapling.
# Paste into: cloud environment menu > Edit > Setup script.
# Also add these under Environment variables:
#   HYPERFRAMES_PYTHON=/opt/hf-venv/bin/python
#   HYPERFRAMES_WHISPER_PATH=/usr/local/bin/whisper-cli
#   HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
# Every step ends in "|| true" so one failed install never blocks a session.

VENV=/opt/hf-venv

# Python tools: Scrapling, Kokoro voice, MusicGen music.
# Needs these under Allowed domains: huggingface.co, *.huggingface.co, *.hf.co, download.pytorch.org
python3 -m venv "$VENV" || true
"$VENV/bin/pip" install -q --upgrade pip || true
"$VENV/bin/pip" install -q "scrapling[fetchers]" kokoro-onnx soundfile numpy || true &
PY_LIGHT=$!

# whisper-cpp, built from source. HyperFrames looks for the whisper-cli binary.
(
  rm -rf /opt/whisper.cpp
  git clone --depth 1 https://github.com/ggml-org/whisper.cpp.git /opt/whisper.cpp &&
  cmake -S /opt/whisper.cpp -B /opt/whisper.cpp/build -DCMAKE_BUILD_TYPE=Release \
    -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_SERVER=OFF &&
  cmake --build /opt/whisper.cpp/build -j"$(nproc)" --target whisper-cli &&
  ln -sf /opt/whisper.cpp/build/bin/whisper-cli /usr/local/bin/whisper-cli
) || true &
WHISPER=$!

# HyperFrames skills, installed to ~/.claude/skills so every session loads them.
npx -y hyperframes skills update || true &
SKILLS=$!

wait $PY_LIGHT
# MusicGen runs after the light installs so pip doesn't fight over the same venv.
# CPU-only PyTorch: the PyPI build is the CUDA one, about 6 GB, which pushed this script
# to 11m43s and past the ~5 minute limit for the environment cache. If the CPU index is
# unreachable, MusicGen is skipped rather than falling back to that download.
"$VENV/bin/pip" install -q torch --index-url https://download.pytorch.org/whl/cpu &&
  "$VENV/bin/pip" install -q transformers || true

wait $WHISPER $SKILLS
exit 0
