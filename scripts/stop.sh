#!/bin/bash
# Lumina 明见量化 - 停止脚本

SCRIPT_DIR=$(dirname $(realpath $0))
PROJECT_DIR=$(dirname $SCRIPT_DIR)

echo "停止 Lumina 服务..."

# 停止后端
if [ -f "$PROJECT_DIR/logs/backend.pid" ]; then
    PID=$(cat "$PROJECT_DIR/logs/backend.pid")
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "后端服务已停止 (PID: $PID)"
    fi
    rm "$PROJECT_DIR/logs/backend.pid"
fi

# 停止前端
if [ -f "$PROJECT_DIR/logs/frontend.pid" ]; then
    PID=$(cat "$PROJECT_DIR/logs/frontend.pid")
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "前端服务已停止 (PID: $PID)"
    fi
    rm "$PROJECT_DIR/logs/frontend.pid"
fi

echo "所有服务已停止"
