import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings


SYSTEM_PROMPT = (
    "You are SecBlog's AI assistant. Write concise, practical Chinese unless the user asks otherwise. "
    "Focus on web development, information security, AI tooling, and project practice."
)


def deepseek_enabled() -> bool:
    return bool(get_settings().deepseek_api_key)


async def call_deepseek(messages: list[dict[str, str]], temperature: float = 0.4) -> str:
    settings = get_settings()
    if not settings.deepseek_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DeepSeek API is not configured",
        )

    endpoint = f"{settings.deepseek_base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": settings.deepseek_model,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *messages],
        "temperature": temperature,
    }
    headers = {
        "Authorization": f"Bearer {settings.deepseek_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.deepseek_timeout_seconds) as client:
            response = await client.post(endpoint, headers=headers, json=payload)
            response.raise_for_status()
    except httpx.HTTPStatusError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"DeepSeek API returned {error.response.status_code}",
        ) from error
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="DeepSeek API request failed",
        ) from error

    data = response.json()
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="DeepSeek API returned an unexpected response",
        ) from error
    return str(content).strip()


async def summarize_text(text: str, style: str = "concise") -> str:
    prompt = (
        f"请用 {style} 风格总结下面内容，输出 3-5 个要点和一句适合博客展示的摘要。\n\n"
        f"{text}"
    )
    return await call_deepseek([{"role": "user", "content": prompt}], temperature=0.3)


async def draft_post(title: str, keywords: list[str], tone: str) -> str:
    keyword_text = "、".join(keywords) if keywords else "Web 开发、信息安全、AI 工具、项目实践"
    prompt = (
        "请生成一篇个人技术博客草稿，使用 Markdown。"
        f"\n标题：{title}"
        f"\n关键词：{keyword_text}"
        f"\n语气：{tone}"
        "\n要求：包含摘要、分节标题、实践步骤、风险/坑点和下一步计划。"
    )
    return await call_deepseek([{"role": "user", "content": prompt}], temperature=0.5)


async def generate_security_question(topic: str, difficulty: str) -> str:
    prompt = (
        "请为 Security Lab Challenge 生成一道安全闯关选择题，返回 JSON，不要使用 Markdown 代码块。"
        f"\n主题：{topic}"
        f"\n难度：{difficulty}"
        '\n字段：question、options、answer、explanation。'
        "\noptions 必须是 4 个字符串，answer 是正确选项下标 0-3。"
    )
    return await call_deepseek([{"role": "user", "content": prompt}], temperature=0.4)


async def generate_digest(kind: str, source_text: str, focus: str) -> str:
    labels = {
        "daily-news": "每日技术新闻 / 安全大会",
        "github-trending": "GitHub Trending 自动解读",
        "papers": "AI 技术论文 Digest",
        "llm-security": "LLM Security 方向新闻整理",
    }
    label = labels.get(kind, kind)
    material = source_text.strip() or "未提供外部素材。请基于该方向给出一份可人工补充来源链接的结构化简报模板。"
    prompt = (
        f"请生成一份「{label}」中文 Digest，关注方向：{focus}。\n"
        "输出要求：\n"
        "1. 5 条以内重点摘要；\n"
        "2. 每条包含 why it matters；\n"
        "3. 给出适合发布到个人博客的标题；\n"
        "4. 最后列出下一步可验证的来源清单。\n\n"
        f"素材：\n{material}"
    )
    return await call_deepseek([{"role": "user", "content": prompt}], temperature=0.45)
