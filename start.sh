#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if ! command -v swift >/dev/null 2>&1; then
    printf '%s\n' '未找到 Swift。请先按照 https://www.swift.org/install/ 安装 Swift 6.0 或更新版本的工具链，再重新运行。' >&2
    exit 1
fi

port="${PORT:-8080}"
case "$port" in
    ''|*[!0-9]*) printf '%s\n' 'PORT 必须是 1–65535 之间的整数。' >&2; exit 1 ;;
esac
if [ "${#port}" -gt 5 ] || (( 10#$port < 1 || 10#$port > 65535 )); then
    printf '%s\n' 'PORT 必须是 1–65535 之间的整数。' >&2
    exit 1
fi
port=$((10#$port))

printf '服务就绪后，请在浏览器打开 http://localhost:%s\n' "$port"
printf '%s\n' '首次运行需要联网下载依赖并编译，可能需要几分钟。保持此终端打开，按 Ctrl+C 停止服务。'
exec swift run --jobs 4 NotebookServer serve --hostname 127.0.0.1 --port "$port"
