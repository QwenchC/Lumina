#!/bin/bash
# Lumina 明见量化 - Linux 服务安装脚本
# 用于在服务器上长期稳定运行

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Lumina 明见量化 - 服务安装脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 root 用户或 sudo 运行此脚本${NC}"
    exit 1
fi

# 获取安装目录
INSTALL_DIR=$(dirname $(dirname $(realpath $0)))
BACKEND_DIR="$INSTALL_DIR/backend"
FRONTEND_DIR="$INSTALL_DIR/frontend"

echo -e "${YELLOW}安装目录: $INSTALL_DIR${NC}"

# 创建用户
if ! id "lumina" &>/dev/null; then
    echo "创建 lumina 用户..."
    useradd -r -s /bin/false lumina
fi

# 创建虚拟环境
echo "创建 Python 虚拟环境..."
cd $BACKEND_DIR
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 创建数据目录
mkdir -p $INSTALL_DIR/data $INSTALL_DIR/logs
chown -R lumina:lumina $INSTALL_DIR/data $INSTALL_DIR/logs

# 复制环境变量文件
if [ ! -f "$INSTALL_DIR/.env" ]; then
    cp $INSTALL_DIR/.env.example $INSTALL_DIR/.env
    echo -e "${YELLOW}请编辑 $INSTALL_DIR/.env 配置 API 密钥${NC}"
fi

# 创建 systemd 服务文件
echo "创建 systemd 服务..."

cat > /etc/systemd/system/lumina-backend.service << EOF
[Unit]
Description=Lumina 明见量化 - 后端服务
After=network.target

[Service]
Type=simple
User=lumina
Group=lumina
WorkingDirectory=$BACKEND_DIR
Environment=PATH=$BACKEND_DIR/venv/bin:/usr/bin
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=$BACKEND_DIR/venv/bin/python main.py
Restart=always
RestartSec=10
StandardOutput=append:$INSTALL_DIR/logs/backend.log
StandardError=append:$INSTALL_DIR/logs/backend-error.log

# 资源限制
LimitNOFILE=65535
MemoryMax=2G
CPUQuota=80%

[Install]
WantedBy=multi-user.target
EOF

# 重新加载 systemd
systemctl daemon-reload

# 启用并启动服务
echo "启动服务..."
systemctl enable lumina-backend
systemctl start lumina-backend

# 检查服务状态
sleep 3
if systemctl is-active --quiet lumina-backend; then
    echo -e "${GREEN}✅ 后端服务启动成功${NC}"
else
    echo -e "${RED}❌ 后端服务启动失败，请检查日志${NC}"
    journalctl -u lumina-backend -n 20
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  安装完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "常用命令:"
echo "  查看状态: systemctl status lumina-backend"
echo "  查看日志: journalctl -u lumina-backend -f"
echo "  重启服务: systemctl restart lumina-backend"
echo "  停止服务: systemctl stop lumina-backend"
echo ""
echo -e "${YELLOW}请确保已配置 .env 文件中的 API 密钥${NC}"
