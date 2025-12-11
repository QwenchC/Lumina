"""
Lumina 明见量化 - LLM 决策引擎
使用大模型进行选股和持仓策略决策
"""
import json
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from loguru import logger
import httpx

from app.core.config import settings


@dataclass
class TradingDecision:
    """交易决策"""
    symbol: str
    name: str
    action: str  # buy / sell / hold
    quantity: int
    reason: str
    confidence: float  # 0-1
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None


@dataclass
class AnalysisResult:
    """分析结果"""
    market_sentiment: str  # bullish / bearish / neutral
    market_summary: str
    decisions: List[TradingDecision]
    risk_assessment: str
    model_used: str
    tokens_used: int
    latency_ms: int


class LLMClient:
    """LLM 客户端基类"""
    
    def __init__(self, model: str):
        self.model = model
    
    async def chat(self, messages: List[Dict], **kwargs) -> Dict:
        raise NotImplementedError


class GitHubModelsClient(LLMClient):
    """GitHub Models 客户端 (推荐 - 免费)"""
    
    def __init__(self, model: str = "openai/gpt-4.1-mini"):
        super().__init__(model)
        self.endpoint = settings.github_models_endpoint
    
    async def chat(self, messages: List[Dict], **kwargs) -> Dict:
        token = settings.get_llm_api_key()
        if not token:
            raise ValueError("GitHub Token 未配置，请设置环境变量 GITHUB_TOKEN")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": kwargs.get("temperature", 0.7),
            "max_tokens": kwargs.get("max_tokens", 4096),
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.endpoint}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()


class OpenAIClient(LLMClient):
    """OpenAI / DeepSeek 兼容客户端"""
    
    def __init__(self, model: str = "gpt-4o", base_url: str = None):
        super().__init__(model)
        self.base_url = base_url or settings.openai_base_url
    
    async def chat(self, messages: List[Dict], **kwargs) -> Dict:
        api_key = settings.get_llm_api_key()
        if not api_key:
            provider = settings.llm_provider.upper()
            raise ValueError(f"{provider} API Key 未配置，请设置对应的环境变量")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": kwargs.get("temperature", 0.7),
            "max_tokens": kwargs.get("max_tokens", 4096),
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()


class LLMDecisionEngine:
    """LLM 决策引擎"""
    
    # 系统提示词
    SYSTEM_PROMPT = """你是一个专业的量化交易分析师，名叫"明见"。你的任务是分析股票市场数据，提供选股建议和持仓策略调整。

## 你的能力：
1. 分析技术指标（MA、MACD、RSI、布林带等）
2. 理解市场情绪和趋势
3. 评估风险收益比
4. 制定具体的交易建议

## 分析原则：
1. 稳健为主，控制风险
2. 分散投资，不要把所有资金集中在单只股票
3. 尊重趋势，顺势而为
4. 严格止损，保护本金
5. 只在有明确信号时建议交易

## 输出格式：
请严格按照以下 JSON 格式输出，不要包含其他内容：

```json
{
    "market_sentiment": "bullish|bearish|neutral",
    "market_summary": "简短的市场总结",
    "risk_assessment": "当前风险评估",
    "decisions": [
        {
            "symbol": "股票代码",
            "name": "股票名称",
            "action": "buy|sell|hold",
            "quantity": 建议数量（股）,
            "reason": "决策理由",
            "confidence": 0.0-1.0,
            "target_price": 目标价（可选）,
            "stop_loss": 止损价（可选）
        }
    ]
}
```

## 注意事项：
- quantity 必须是 100 的整数倍（A股交易规则）
- confidence 表示你对这个决策的信心程度
- 如果没有好的交易机会，可以返回空的 decisions 数组
- 要考虑当前持仓和可用资金
"""

    def __init__(self, model: Optional[str] = None):
        self.model = model or settings.default_llm_model
        self.client = self._create_client()
    
    def _create_client(self) -> LLMClient:
        """根据配置创建 LLM 客户端"""
        provider = settings.llm_provider.lower()
        
        if provider == "github":
            # GitHub Models
            return GitHubModelsClient(self.model)
        elif provider == "deepseek":
            # DeepSeek API
            return OpenAIClient(self.model, settings.deepseek_base_url)
        elif provider == "openai":
            # OpenAI API
            return OpenAIClient(self.model, settings.openai_base_url)
        elif provider == "azure":
            # Azure OpenAI (使用 OpenAI 兼容客户端)
            return OpenAIClient(self.model, settings.azure_openai_endpoint)
        else:
            # 默认使用 DeepSeek
            return OpenAIClient(self.model, settings.deepseek_base_url)
    
    def _build_analysis_prompt(
        self,
        market_data: Dict,
        portfolio: Dict,
        candidates: List[Dict]
    ) -> str:
        """构建分析提示词"""
        
        # 当前日期
        current_date = datetime.now().strftime("%Y-%m-%d %H:%M")
        
        # 持仓情况
        positions_str = ""
        if portfolio.get("positions"):
            positions_str = "\n".join([
                f"- {p['symbol']} {p['name']}: {p['quantity']}股, 成本{p['avg_cost']:.2f}, "
                f"现价{p['current_price']:.2f}, 盈亏{p['unrealized_pnl_ratio']*100:.2f}%"
                for p in portfolio["positions"]
            ])
        else:
            positions_str = "暂无持仓"
        
        # 候选股票信息
        candidates_str = ""
        for stock in candidates[:10]:  # 最多分析 10 只
            candidates_str += f"""
### {stock['symbol']} {stock['name']}
- 当前价格: {stock.get('price', 'N/A')}
- 涨跌幅: {stock.get('change_pct', 'N/A')}%
- 成交额: {stock.get('amount', 'N/A')}
- 换手率: {stock.get('turnover_rate', 'N/A')}%
- PE: {stock.get('pe_ratio', 'N/A')}
- 技术指标: MA5={stock.get('ma5', 'N/A')}, RSI={stock.get('rsi', 'N/A')}, MACD={stock.get('macd', 'N/A')}
"""
        
        prompt = f"""
# 市场分析请求

## 当前时间
{current_date}

## 账户状态
- 总资产: ¥{portfolio.get('total_value', 0):,.2f}
- 可用资金: ¥{portfolio.get('cash', 0):,.2f}
- 持仓市值: ¥{portfolio.get('market_value', 0):,.2f}
- 今日盈亏: ¥{portfolio.get('daily_pnl', 0):,.2f}

## 当前持仓
{positions_str}

## 市场概况
- 上证指数: {market_data.get('sh_index', 'N/A')}
- 涨跌幅: {market_data.get('sh_change', 'N/A')}%
- 市场情绪: {market_data.get('sentiment', 'N/A')}

## 候选股票分析
{candidates_str}

## 交易规则
- 单只股票最大持仓: {settings.max_position_ratio * 100}%
- 最大持股数量: {settings.max_holdings} 只
- 止损线: {settings.stop_loss_ratio * 100}%
- 止盈线: {settings.take_profit_ratio * 100}%

## ⚠️ 重要资金约束
- 当前可用资金: ¥{portfolio.get('cash', 0):,.2f}
- 所有买入建议的总金额（quantity × 当前价格）必须小于可用资金
- 每次建议买入的金额不要超过可用资金的 {settings.max_position_ratio * 100}%
- 如果资金不足，请减少买入数量或不建议买入

请根据以上信息，给出你的分析和交易建议。注意必须确保建议的买入总金额在可用资金范围内。
"""
        return prompt
    
    async def analyze_and_decide(
        self,
        market_data: Dict,
        portfolio: Dict,
        candidates: List[Dict]
    ) -> AnalysisResult:
        """
        分析市场数据并做出交易决策
        
        Args:
            market_data: 市场数据（指数、情绪等）
            portfolio: 当前投资组合状态
            candidates: 候选股票列表
        
        Returns:
            AnalysisResult: 分析结果和交易决策
        """
        start_time = datetime.now()
        
        try:
            # 构建消息
            user_prompt = self._build_analysis_prompt(market_data, portfolio, candidates)
            messages = [
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
            
            # 调用 LLM
            logger.info(f"调用 LLM: {self.model}")
            response = await self.client.chat(messages, temperature=0.3)
            
            # 解析响应
            content = response["choices"][0]["message"]["content"]
            usage = response.get("usage", {})
            
            # 提取 JSON
            result = self._parse_response(content)
            
            # 计算延迟
            latency = int((datetime.now() - start_time).total_seconds() * 1000)
            
            # 构建决策列表
            decisions = []
            for d in result.get("decisions", []):
                decisions.append(TradingDecision(
                    symbol=d["symbol"],
                    name=d.get("name", ""),
                    action=d["action"],
                    quantity=d.get("quantity", 0),
                    reason=d.get("reason", ""),
                    confidence=d.get("confidence", 0.5),
                    target_price=d.get("target_price"),
                    stop_loss=d.get("stop_loss")
                ))
            
            return AnalysisResult(
                market_sentiment=result.get("market_sentiment", "neutral"),
                market_summary=result.get("market_summary", ""),
                decisions=decisions,
                risk_assessment=result.get("risk_assessment", ""),
                model_used=self.model,
                tokens_used=usage.get("total_tokens", 0),
                latency_ms=latency
            )
            
        except Exception as e:
            logger.error(f"LLM 分析失败: {e}")
            latency = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return AnalysisResult(
                market_sentiment="neutral",
                market_summary=f"分析失败: {str(e)}",
                decisions=[],
                risk_assessment="无法评估",
                model_used=self.model,
                tokens_used=0,
                latency_ms=latency
            )
    
    def _parse_response(self, content: str) -> Dict:
        """解析 LLM 响应"""
        try:
            # 尝试直接解析
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
        # 尝试提取 JSON 块
        import re
        json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass
        
        # 尝试查找 JSON 对象
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        
        logger.warning(f"无法解析 LLM 响应: {content[:500]}")
        return {"market_sentiment": "neutral", "decisions": []}
    
    async def evaluate_position(
        self,
        position: Dict,
        current_price: float,
        market_trend: str
    ) -> TradingDecision:
        """
        评估单个持仓
        
        Args:
            position: 持仓信息
            current_price: 当前价格
            market_trend: 市场趋势
        
        Returns:
            TradingDecision: 持仓调整建议
        """
        # 计算盈亏比例
        pnl_ratio = (current_price - position["avg_cost"]) / position["avg_cost"]
        
        # 触发止损
        if pnl_ratio <= -settings.stop_loss_ratio:
            return TradingDecision(
                symbol=position["symbol"],
                name=position.get("name", ""),
                action="sell",
                quantity=position["quantity"],
                reason=f"触发止损 (亏损 {pnl_ratio*100:.2f}%)",
                confidence=0.9
            )
        
        # 触发止盈
        if pnl_ratio >= settings.take_profit_ratio:
            return TradingDecision(
                symbol=position["symbol"],
                name=position.get("name", ""),
                action="sell",
                quantity=position["quantity"] // 2,  # 先卖一半
                reason=f"触发止盈 (盈利 {pnl_ratio*100:.2f}%)",
                confidence=0.8
            )
        
        # 默认持有
        return TradingDecision(
            symbol=position["symbol"],
            name=position.get("name", ""),
            action="hold",
            quantity=0,
            reason="继续持有",
            confidence=0.6
        )


# 全局决策引擎实例
llm_engine = LLMDecisionEngine()
