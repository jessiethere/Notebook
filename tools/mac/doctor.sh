#!/bin/bash
# Capiday · Mac environment check (read-only: installs nothing, changes nothing).
#   bash tools/mac/doctor.sh
cd "$(dirname "$0")/../.." || exit 1
ok() { printf "  ✅ %s\n" "$1"; }
no() { printf "  ❌ %s\n" "$1"; }
info() { printf "  · %s\n" "$1"; }
has() { command -v "$1" >/dev/null 2>&1; }

echo "== Mac"
info "Chip: $(sysctl -n machdep.cpu.brand_string 2>/dev/null)"
info "Memory: $(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1073741824 )) GB"
info "macOS: $(sw_vers -productVersion 2>/dev/null) ($(sw_vers -buildVersion 2>/dev/null))"
info "Free disk: $(df -h / | awk 'NR==2 {print $4}')"

echo "== Tools"
for tool in brew git node npm python3; do
  if has "$tool"; then ok "$tool $($tool --version 2>&1 | head -1)"; else no "$tool not found"; fi
done

echo "== Ollama"
if has ollama; then
  ok "ollama $(ollama --version 2>&1 | tail -1)"
  if curl -s --max-time 2 http://127.0.0.1:11434/api/version >/dev/null; then
    ok "server answering on 127.0.0.1:11434 ($(curl -s http://127.0.0.1:11434/api/version))"
    echo "  Models on this Mac:"; ollama list | sed 's/^/    /'
    echo "  Loaded right now:"; ollama ps | sed 's/^/    /'
  else
    no "server not answering on 127.0.0.1:11434 (open the Ollama app, or: ollama serve)"
  fi
  if lsof -nP -iTCP:11434 -sTCP:LISTEN 2>/dev/null | grep -q '\*:11434'; then
    no "Ollama listens on ALL addresses (*:11434) — check OLLAMA_HOST; for Capiday keep it on 127.0.0.1"
  fi
else
  no "ollama not found (download from ollama.com, or: brew install --cask ollama)"
fi

echo "== Xcode"
if xcode-select -p >/dev/null 2>&1; then ok "developer dir: $(xcode-select -p)"; else no "Command Line Tools not set (xcode-select --install)"; fi
if has xcodebuild && xcodebuild -version >/dev/null 2>&1; then
  ok "$(xcodebuild -version | tr '\n' ' ')"
  echo "  iOS Simulator runtimes:"; xcrun simctl list runtimes 2>/dev/null | grep -i ios | sed 's/^/    /'
  echo "  iPhone simulators:"; xcrun simctl list devices available 2>/dev/null | grep -i iphone | head -8 | sed 's/^/    /'
else
  no "Xcode not installed or not selected (install Xcode from the App Store, then: sudo xcode-select -s /Applications/Xcode.app)"
fi

echo "== Capiday repository"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ok "$(pwd)"
  info "branch: $(git branch --show-current) · last commit: $(git log -1 --format='%h %s' | cut -c1-70)"
  changes=$(git status --porcelain | wc -l | tr -d ' ')
  if [ "$changes" = "0" ]; then ok "no uncommitted changes"; else no "$changes uncommitted change(s) — commit or stash before pulling"; git status --short | head -10 | sed 's/^/    /'; fi
  [ -d Native/LittleDays.xcodeproj ] && ok "Xcode project: Native/LittleDays.xcodeproj" || no "Native/LittleDays.xcodeproj missing"
else
  no "not inside the Capiday repository"
fi
