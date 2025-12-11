# Lumina / 明见量化

<div align="center">

![Lumina Logo](docs/assets/logo.png)

**AI驱动的智能量化交易系统**

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

## 📖 项目简介

Lumina（明见量化）是一个基于大语言模型（LLM）的智能量化交易系统。系统实时读取股票市场数据，利用 AI 大模型进行选股决策和持仓策略调整，支持长期稳定运行，并提供实时的盈亏曲线和持仓情况展示。

## ✨ 核心特性

- 🤖 **AI 驱动决策**: 集成多种大模型（GPT-4.1、DeepSeek、Grok 等），智能分析市场行情
- 📊 **实时数据**: 支持 A股/港股/美股 实时行情数据获取
- 💹 **策略回测**: 完整的历史数据回测功能
- 📈 **实时监控**: WebSocket 实时推送盈亏曲线和持仓变化
- 🛡️ **风险控制**: 内置止损、止盈、仓位控制等风险管理功能
- 🔄 **自动交易**: 支持模拟交易和实盘交易（需配置券商接口）
- 📱 **多端访问**: 响应式 Web 界面，支持 PC 和移动设备

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ 实时盈亏曲线  │  │   持仓展示   │  │   交易历史/策略配置   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ WebSocket / REST API
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  API 服务层  │  │  业务逻辑层   │  │      数据持久层       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                         Core Services                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  数据获取模块 │  │  LLM 决策引擎 │  │      交易执行模块     │  │
│  │  - AKShare   │  │  - GPT-4.1   │  │  - 模拟交易          │  │
│  │  - Tushare   │  │  - DeepSeek  │  │  - 实盘交易          │  │
│  │  - Yahoo     │  │  - Grok      │  │  - 风险控制          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Data Storage                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   SQLite     │  │    Redis     │  │      日志文件         │  │
│  │  (持仓/交易)  │  │  (缓存/队列)  │  │   (运行日志)          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- Redis (可选，用于缓存)

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/Lumina.git
cd Lumina
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的 API 密钥
```

### 3. 启动后端服务

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
python main.py
```

### 4. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

### 5. 访问系统

打开浏览器访问 `http://localhost:5173`

## 📁 项目结构

```
Lumina/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── api/               # API 路由
│   │   ├── core/              # 核心配置
│   │   ├── models/            # 数据模型
│   │   ├── services/          # 业务服务
│   │   │   ├── data/          # 数据获取
│   │   │   ├── llm/           # LLM 决策引擎
│   │   │   ├── trading/       # 交易执行
│   │   │   └── strategy/      # 策略管理
│   │   └── utils/             # 工具函数
│   ├── tests/                 # 测试文件
│   ├── main.py                # 入口文件
│   └── requirements.txt       # Python 依赖
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/        # React 组件
│   │   ├── pages/             # 页面组件
│   │   ├── hooks/             # 自定义 Hooks
│   │   ├── services/          # API 服务
│   │   └── stores/            # 状态管理
│   ├── package.json           # Node 依赖
│   └── vite.config.ts         # Vite 配置
├── docs/                       # 文档
├── scripts/                    # 部署脚本
├── docker-compose.yml          # Docker 配置
└── README.md                   # 项目说明
```

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `GITHUB_TOKEN` | GitHub PAT，用于调用 GitHub Models | 是 |
| `OPENAI_API_KEY` | OpenAI API Key（可选） | 否 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key（可选） | 否 |
| `TUSHARE_TOKEN` | Tushare Pro Token | 否 |
| `DATABASE_URL` | 数据库连接 URL | 否 |
| `REDIS_URL` | Redis 连接 URL | 否 |

### LLM 模型配置

系统支持多种 LLM 模型，推荐使用 GitHub Models（免费）：

- **GPT-4.1-mini**: 性价比高，推荐用于日常决策
- **GPT-4.1**: 更强的推理能力
- **DeepSeek-R1**: 强大的推理能力，适合复杂分析
- **Grok-3-mini**: 快速响应，适合高频决策

## 📊 功能模块

### 数据获取

- 支持 AKShare（免费）获取 A股实时/历史数据
- 支持 Tushare Pro 获取更全面的金融数据
- 支持 Yahoo Finance 获取美股数据

### LLM 决策引擎

- 基于市场数据和技术指标生成分析报告
- 智能选股建议
- 持仓策略调整建议
- 风险评估

### 交易执行

- 模拟交易（默认）
- 支持接入券商 API 进行实盘交易
- 内置风险控制：最大持仓、止损止盈、交易频率限制

## 🛡️ 风险控制

- **仓位控制**: 单只股票最大持仓比例限制
- **止损机制**: 自动止损，防止大幅亏损
- **止盈机制**: 保护利润，及时止盈
- **交易频率**: 限制每日交易次数，避免过度交易
- **资金管理**: 保留现金比例，避免满仓操作

## 📈 部署说明

### Docker 部署（推荐）

```bash
docker-compose up -d
```

### 手动部署

请参考 [部署文档](docs/deployment.md)

### 长期运行

使用 systemd 或 supervisor 保证服务长期稳定运行：

```bash
# 使用提供的脚本
./scripts/install_service.sh
```

## ⚠️ 免责声明

1. 本项目仅供学习和研究使用
2. 股票投资有风险，入市需谨慎
3. LLM 的建议仅供参考，不构成投资建议
4. 实盘交易请自行承担风险

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

- 项目主页: https://github.com/yourusername/Lumina
- 问题反馈: https://github.com/yourusername/Lumina/issues
