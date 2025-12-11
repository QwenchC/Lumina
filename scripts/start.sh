#!/bin/bash
# Lumina 明见量化 - 启动脚本

set -e

SCRIPT_DIR=$(dirname $(realpath $0))
PROJECT_DIR=$(dirname $SCRIPT_DIR)
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "=========================================="
echo "  Lumina 明见量化 - 启动脚本"
echo "=========================================="

# 检查 .env 文件
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "未找到 .env 文件，从模板创建..."
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    echo "请编辑 $PROJECT_DIR/.env 配置 API 密钥"
fi

# 导出环境变量
export $(grep -v '^#' $PROJECT_DIR/.env | xargs)

# 启动后端
echo ""
echo "启动后端服务..."
cd $BACKEND_DIR

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建 Python 虚拟环境..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# 后台启动后端
nohup python main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务已启动 (PID: $BACKEND_PID)"

# 启动前端
echo ""
echo "启动前端服务..."
cd $FRONTEND_DIR

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

# 后台启动前端
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务已启动 (PID: $FRONTEND_PID)"

# 保存 PID
echo $BACKEND_PID > "$PROJECT_DIR/logs/backend.pid"
echo $FRONTEND_PID > "$PROJECT_DIR/logs/frontend.pid"

echo ""
echo "=========================================="
echo "  启动完成！"
echo "=========================================="
echo ""
echo "后端地址: http://localhost:8000"
echo "前端地址: http://localhost:5173"
echo "API 文档: http://localhost:8000/docs"
echo ""
echo "查看日志:"
echo "  后端: tail -f $PROJECT_DIR/logs/backend.log"
echo "  前端: tail -f $PROJECT_DIR/logs/frontend.log"
