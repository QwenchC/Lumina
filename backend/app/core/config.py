"""
Lumina 明见量化 - 核心配置
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""
    
    # 应用信息
    app_name: str = "Lumina 明见量化"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # 服务配置
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    
    # LLM 配置 - GitHub Models (推荐)
    github_token: Optional[str] = None
    github_models_endpoint: str = "https://models.github.ai/inference"
    
    # OpenAI 配置 (备用)
    openai_api_key: Optional[str] = None
    openai_base_url: str = "https://api.openai.com/v1"
    
    # DeepSeek 配置 (备用)
    deepseek_api_key: Optional[str] = None
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    
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
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


# 全局配置实例
settings = get_settings()
