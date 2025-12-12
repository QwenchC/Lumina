"""
Lumina 明见量化 - 核心配置
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from functools import lru_cache

# 获取项目根目录（backend 目录）
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """应用配置"""
    
    # 应用信息
    app_name: str = "Lumina 明见量化"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # 服务配置
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    
    # LLM 提供商选择: github / openai / deepseek / azure
    llm_provider: str = "deepseek"
    
    # LLM 配置 - GitHub Models (推荐)
    github_token: Optional[str] = None
    github_models_endpoint: str = "https://models.github.ai/inference"
    
    # OpenAI 配置 (备用)
    openai_api_key: Optional[str] = None
    openai_base_url: str = "https://api.openai.com/v1"
    
    # DeepSeek 配置 (备用)
    deepseek_api_key: Optional[str] = None
    deepseek_base_url: str = "https://api.deepseek.com"
    
    # Azure OpenAI 配置 (备用)
    azure_openai_api_key: Optional[str] = None
    azure_openai_endpoint: Optional[str] = None
    
    # 默认 LLM 模型
    default_llm_model: str = "openai/gpt-4.1-mini"
    
    # 数据源配置
    tushare_token: Optional[str] = None
    
    # 数据库配置
    database_url: str = "sqlite:///./data/lumina.db"
    
    # Redis 配置
    redis_url: Optional[str] = None
    
    # 交易配置
    initial_capital: float = 1000000.0  # 初始资金
    trading_mode: str = "simulation"     # simulation / live
    max_position_ratio: float = 0.2      # 单只股票最大持仓比例
    max_holdings: int = 10               # 最大持股数量
    stop_loss_ratio: float = 0.08        # 止损比例
    take_profit_ratio: float = 0.20      # 止盈比例
    max_daily_trades: int = 10           # 每日最大交易次数
    
    # 决策配置
    decision_interval: int = 3600        # 决策间隔 (秒)
    
    # 日志配置
    log_level: str = "INFO"
    log_file: str = "./logs/lumina.log"
    
    # 安全配置
    api_secret_key: str = "lumina-secret-key-change-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    class Config:
        env_file = str(BASE_DIR / ".env")  # 使用绝对路径
        env_file_encoding = "utf-8"
        extra = "ignore"
    
    def get_llm_api_key(self) -> Optional[str]:
        """获取当前 LLM 提供商的 API 密钥，优先从环境变量读取"""
        provider = self.llm_provider.lower()
        
        if provider == "github":
            return os.environ.get("GITHUB_TOKEN") or self.github_token
        elif provider == "openai":
            return os.environ.get("OPENAI_API_KEY") or self.openai_api_key
        elif provider == "deepseek":
            return os.environ.get("DEEPSEEK_API_KEY") or self.deepseek_api_key
        elif provider == "azure":
            return os.environ.get("AZURE_OPENAI_API_KEY") or self.azure_openai_api_key
        return None
    
    def get_llm_base_url(self) -> str:
        """获取当前 LLM 提供商的 API 地址"""
        provider = self.llm_provider.lower()
        
        if provider == "github":
            return self.github_models_endpoint
        elif provider == "openai":
            return self.openai_base_url
        elif provider == "deepseek":
            return self.deepseek_base_url
        elif provider == "azure":
            return self.azure_openai_endpoint or ""
        return ""


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


def check_api_key_interactive() -> bool:
    """
    检查 API 密钥，如果没有则交互式提示用户输入
    返回 True 表示有可用密钥，False 表示用户取消
    """
    settings = get_settings()
    api_key = settings.get_llm_api_key()
    
    if api_key and api_key not in ["your_deepseek_api_key", "your_openai_api_key", 
                                     "your_github_personal_access_token"]:
        return True
    
    provider = settings.llm_provider.upper()
    env_var_name = {
        "github": "GITHUB_TOKEN",
        "openai": "OPENAI_API_KEY",
        "deepseek": "DEEPSEEK_API_KEY",
        "azure": "AZURE_OPENAI_API_KEY"
    }.get(settings.llm_provider.lower(), "LLM_API_KEY")
    
    print("\n" + "=" * 60)
    print(f"⚠️  未检测到 {provider} API 密钥")
    print("=" * 60)
    print(f"\n您可以通过以下方式配置密钥：")
    print(f"  1. 设置系统环境变量: {env_var_name}")
    print(f"  2. 在 backend/.env 文件中设置")
    print(f"  3. 现在输入密钥（不会保存到文件）\n")
    
    try:
        user_input = input(f"请输入 {provider} API 密钥 (直接回车跳过): ").strip()
        if user_input:
            # 临时设置到环境变量（仅当前进程有效）
            os.environ[env_var_name] = user_input
            print(f"✅ 密钥已设置（仅本次运行有效）\n")
            # 清除缓存以重新加载配置
            get_settings.cache_clear()
            return True
        else:
            print("⚠️  未设置密钥，LLM 功能将不可用\n")
            return False
    except (EOFError, KeyboardInterrupt):
        print("\n⚠️  已取消，LLM 功能将不可用\n")
        return False


# 全局配置实例
settings = get_settings()
