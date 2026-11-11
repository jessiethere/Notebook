#!/bin/bash
# Little Days · everyday Mac commands. Nothing starts at login; the model loads only when asked.
#   bash tools/mac/dev.sh web        # Web preview at http://127.0.0.1:8080 (this Mac only)
#   bash tools/mac/dev.sh web-ai     # same, with Captain's local-model chat switched on (dev only)
#   bash tools/mac/dev.sh sim [name] # build the iPhone app and run it in the Simulator (default: first iPhone)
#   bash tools/mac/dev.sh ai         # is Ollama up? which models? (does not load a model)
#   bash tools/mac/dev.sh eval [...] # Captain × local Qwen test set (tools/captain-eval.mjs)
#   bash tools/mac/dev.sh test       # Node + Python + shell-sync tests
#   bash tools/mac/dev.sh stop       # stop the Web preview; unload models from memory
set -e
cd "$(dirname "$0")/../.."
MODEL="${LD_MODEL:-qwen3.5:4b}"
cmd="${1:-help}"; shift || true

web() {
  if ! lsof -nP -iTCP:8080 -sTCP:LISTEN >/dev/null 2>&1; then
    nohup python3 tools/preview.py --host 127.0.0.1 --port 8080 > /tmp/little-days-preview.log 2>&1 &
    sleep 1
  fi
  open "http://127.0.0.1:8080/$1"
}
case "$cmd" in
  web) web "" ;;
  web-ai) web "?dev-local-ai=$MODEL" ;;
  ai)
    curl -s --max-time 2 http://127.0.0.1:11434/api/version || { echo "Ollama is not running: open the Ollama app (or run: ollama serve)"; exit 1; }
    echo; ollama list; echo "-- loaded now:"; ollama ps ;;
  eval) node tools/captain-eval.mjs --model "$MODEL" "$@" ;;
  sim)
    python3 tools/sync_native_web.py
    NAME="${1:-$(xcrun simctl list devices available | grep -m1 -o 'iPhone [^(]*' | sed 's/ *$//')}"
    echo "Building for: $NAME"
    xcodebuild -project Native/LittleDays.xcodeproj -scheme LittleDays -configuration Debug \
      -destination "platform=iOS Simulator,name=$NAME" -derivedDataPath build/DerivedData build | tail -20
    APP=$(find build/DerivedData/Build/Products/Debug-iphonesimulator -maxdepth 1 -name '*.app' | head -1)
    xcrun simctl boot "$NAME" 2>/dev/null || true
    open -a Simulator
    xcrun simctl install "$NAME" "$APP"
    xcrun simctl launch "$NAME" com.jessiethere.littledays ;;
  test)
    npm test
    python3 -m unittest discover -s tests ;;
  stop)
    pkill -f "tools/preview.py" || true
    for m in $(ollama ps 2>/dev/null | awk 'NR>1 {print $1}'); do ollama stop "$m"; done ;;
  *) sed -n '2,10p' "$0" ;;
esac
