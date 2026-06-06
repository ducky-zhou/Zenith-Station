import json

from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import SessionLocal, ensure_schema_compatibility, init_db
from app.models import Post, Profile, SecurityGameQuestion, User


SECURITY_QUESTIONS = [
    {
        "game_name": "phishing-detective",
        "question": "你收到一封邮件，发件人显示为 security@paypa1.com，要求 10 分钟内点击链接验证账号。最合理的判断是？",
        "options": ["正常安全通知", "疑似钓鱼邮件", "系统自动账单", "垃圾广告但无风险"],
        "answer": "1",
        "explanation": "paypa1.com 使用数字 1 模仿 paypal.com，并制造紧迫感，这是典型钓鱼特征。",
        "difficulty": "easy",
        "category": "phishing",
    },
    {
        "game_name": "phishing-detective",
        "question": "邮件正文中的按钮显示“登录 GitHub”，但鼠标悬停链接为 http://github-login.example.net。你应该怎么做？",
        "options": ["直接点击", "复制链接到浏览器", "不要点击，手动访问官网确认", "转发给同学点击"],
        "answer": "2",
        "explanation": "显示文本和真实链接不一致时，应避免点击，通过官方域名手动访问确认。",
        "difficulty": "easy",
        "category": "phishing",
    },
    {
        "game_name": "sql-injection-guard",
        "question": "下面哪种写法更能防止 SQL 注入？",
        "options": [
            "SELECT * FROM users WHERE name = '" + " + username + " + "'",
            "使用参数化查询 WHERE name = :username",
            "把单引号替换为空",
            "限制用户名长度为 100",
        ],
        "answer": "1",
        "explanation": "参数化查询能让数据库区分代码和数据，是防 SQL 注入的关键手段。",
        "difficulty": "easy",
        "category": "web-security",
    },
    {
        "game_name": "sql-injection-guard",
        "question": "登录框输入 ' OR '1'='1 最可能是在尝试什么攻击？",
        "options": ["XSS", "CSRF", "SQL 注入", "目录遍历"],
        "answer": "2",
        "explanation": "该输入试图改变 SQL 条件逻辑，使认证条件恒真，属于 SQL 注入尝试。",
        "difficulty": "easy",
        "category": "web-security",
    },
    {
        "game_name": "url-inspector",
        "question": "下面哪个 URL 最可疑？",
        "options": [
            "https://github.com/login",
            "https://docs.python.org/3/",
            "http://paypa1-security.example.net/verify",
            "https://zju.edu.cn/",
        ],
        "answer": "2",
        "explanation": "paypa1 使用数字 1 模仿 paypal，并且通过非官方 example.net 域名诱导验证，风险最高。",
        "difficulty": "easy",
        "category": "url-analysis",
    },
    {
        "game_name": "url-inspector",
        "question": "短链接跳转到陌生登录页时，最合理的操作是？",
        "options": ["直接输入账号", "关闭页面并从官网入口访问", "把链接发给别人测试", "关闭浏览器安全提示"],
        "answer": "1",
        "explanation": "陌生跳转登录页可能是凭证钓鱼，应从官方入口重新访问。",
        "difficulty": "easy",
        "category": "url-analysis",
    },
    {
        "game_name": "password-audit",
        "question": "以下哪个密码策略更合理？",
        "options": ["所有网站使用同一个复杂密码", "短密码但经常换", "使用密码管理器生成唯一强密码", "生日加姓名方便记忆"],
        "answer": "2",
        "explanation": "每个网站使用唯一强密码可以降低撞库和单点泄露影响。",
        "difficulty": "medium",
        "category": "account-security",
    },
    {
        "game_name": "password-audit",
        "question": "发现某服务密码可能泄露后，第一优先级操作是？",
        "options": ["只删除浏览器缓存", "立即修改该服务密码并检查复用账号", "等待平台通知", "继续使用直到被强制下线"],
        "answer": "1",
        "explanation": "应立即修改泄露服务密码，并检查其他复用同密码的账号。",
        "difficulty": "medium",
        "category": "account-security",
    },
    {
        "game_name": "xss-hunter",
        "question": "评论区直接把用户输入拼进 innerHTML，最主要的风险是什么？",
        "options": ["SQL 注入", "XSS 脚本执行", "端口扫描", "DNS 污染"],
        "answer": "1",
        "explanation": "未转义的用户输入进入 innerHTML 可能执行恶意脚本，造成 XSS。",
        "difficulty": "medium",
        "category": "xss",
    },
    {
        "game_name": "xss-hunter",
        "question": "防御存储型 XSS 时，下面哪项最关键？",
        "options": ["只限制用户名长度", "输出时按上下文转义并避免危险 HTML", "把数据库端口关闭", "只在前端弹窗提醒"],
        "answer": "1",
        "explanation": "XSS 防御核心是输出编码、HTML 清洗和安全渲染，不能只依赖提示或长度限制。",
        "difficulty": "medium",
        "category": "xss",
    },
    {
        "game_name": "vulnerability-scan",
        "question": "日志中出现 Authorization: Bearer eyJ... 被完整打印，最明显的问题是？",
        "options": ["敏感信息泄露", "SQL 注入", "图片缓存过期", "CSS 加载慢"],
        "answer": "0",
        "explanation": "认证 token 属于敏感凭据，不应完整进入日志，否则可能被用来冒充用户。",
        "difficulty": "medium",
        "category": "log-audit",
    },
    {
        "game_name": "vulnerability-scan",
        "question": "代码片段 const password = 'Admin123!' 暴露在前端仓库中，应该如何处理？",
        "options": ["换个变量名", "把密钥移到环境变量并轮换已泄露密码", "压缩 JS 文件即可", "只加一行注释"],
        "answer": "1",
        "explanation": "硬编码密码泄露后需要移出代码、改用环境变量或密钥管理，并立即轮换旧密码。",
        "difficulty": "medium",
        "category": "secret-leak",
    },
    {
        "game_name": "packet-detective",
        "question": "抓包中看到 HTTP 明文请求 /login 携带 password=123456，最主要的风险是？",
        "options": ["TLS 证书太新", "敏感信息可被中间人读取", "数据库索引失效", "浏览器缓存不足"],
        "answer": "1",
        "explanation": "HTTP 明文传输登录凭据会被同链路攻击者嗅探，应使用 HTTPS。",
        "difficulty": "medium",
        "category": "packet-analysis",
    },
    {
        "game_name": "packet-detective",
        "question": "一段访问日志中同一 IP 在 10 秒内尝试 200 次 /auth/login，最像什么行为？",
        "options": ["正常页面预加载", "暴力破解或撞库", "CDN 缓存命中", "CSS 热更新"],
        "answer": "1",
        "explanation": "短时间大量登录尝试通常意味着暴力破解或撞库，应考虑限流、验证码和告警。",
        "difficulty": "medium",
        "category": "packet-analysis",
    },
]


LLM_SECURITY_TITLE = "LLM Security 入门学习路线"
LLM_SECURITY_CONTENT = """# LLM Security

https://mundi-xu.github.io/2025/09/11/getting-started-with-llm-security/

## 理解LLM是如何“思考”的

Transformer 架构

- LLM 如何通过 Token 预测下一个词？
- 为什么 Prompt 会被“注入”并改变模型行为？
- 为什么模型会“幻觉”或输出有害内容？

神经网络可视化教程：[3Blue1Brown 的神经网络系列](https://www.3blue1brown.com/?topic=neural-networks)

> 建议先看前 4 集（神经网络基础），再配合《The Illustrated Transformer》快速建立 Transformer 心智模型。


## 熟悉主流LLM平台与API

交互方式
1. **界面交互** ：初步体验 与 Prompt Engineering
2. **API 调用**：构建可复现、可自动化的安全测试环境

两个平台

- [Hugging Face](https://huggingface.co/)
> 相当于 AI 领域的 GitHub，有开源模型库（Llama、Mistral、Qwen、DeepSeek 等）、数据集与评估脚本（用于安全 benchmark），Spaces 平台还可以快速部署 Demo 进行漏洞复现。


- [OpenRouter](https://openrouter.ai/)
> 聚合了 GPT-5、Claude 4、Gemini、DeepSeek 等数百种模型，提供免费模型和统一 API 接口，降低多模型测试成本。国内访问友好，支持支付宝/微信支付，适合预算有限的学习者。
> > 注册后，可以先用免费模型测试不同厂商对”越狱 Prompt”的安全水位，记录各家的脆弱性表现。


## 系统化认知LLM风险
> 理解哪些是高频高危漏洞，攻击者在使用什么战术


### OWASP Top 10 for LLM Applications

[OWASP官网](https://owasp.org/)


[OWASP官方发布](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
 LLM 安全风险分类框架

| 编号 | 风险名称 | 关键示例 |
|---|---|---|
| LLM01 | 提示注入（Prompt Injection） | 恶意指令覆盖系统提示，诱导模型执行非预期操作 |
| LLM02 | 敏感信息泄露（Sensitive Information Disclosure） | 模型输出用户隐私、密钥、内部配置或训练数据中的敏感内容 |
| LLM03 | 供应链风险（Supply Chain） | 第三方模型、插件、数据集或依赖包被污染或存在漏洞 |
| LLM04 | 数据与模型投毒（Data and Model Poisoning） | 在预训练、微调或嵌入数据中注入恶意样本影响模型行为 |
| LLM05 | 不安全输出处理（Improper Output Handling） | LLM 输出未经校验就执行代码、SQL、HTML 或跳转链接 |
| LLM06 | 过度代理能力（Excessive Agency） | 赋予模型过高权限，使其能越权调用工具、API 或修改数据 |
| LLM07 | 系统提示泄露（System Prompt Leakage） | 用户诱导模型泄露系统提示、隐藏规则或内部策略 |
| LLM08 | 向量与嵌入弱点（Vector and Embedding Weaknesses） | 通过相似度检索、RAG 或向量库注入恶意内容并影响回答 |
| LLM09 | 错误信息（Misinformation） | 模型生成幻觉内容，导致用户基于错误信息做出决策 |
| LLM10 | 无界消耗（Unbounded Consumption） | 攻击者诱导模型大量消耗 token、算力、API 调用或费用 |

> 了解每个的攻击路径、影响范围和解决方案，构建LLM安全防御体系的基础


### MITRE ATLAS

[MITRE ATLAS](https://atlas.mitre.org/)
AI系统攻击类别库

> 真实世界中针对 AI 系统的攻击形态 → 格式、技术与过程（TTPs）
>
> 例如：
> TA0001 – 利用模型接口 → T0003 – 提示注入 → T0008 – 感应数据泄漏

结合复现的攻击案例，对照ATLAS编号，构建完整的攻击树

框架适用于在红队演练、威胁建模和防御策略推演



## 用工具进行红队演练
安全的本质是对抗

### NVIDIA Garak

[Garak](https://github.com/NVIDIA/garak)（Garak, Eliminator of Models）

- 自动化探测提示注入、越狱、隐私泄露、拒绝服务等攻击
- 支持多模型模型并行测试（本地+API）
- 生成攻击报告与风险评分。

用法示例：
```zsh
garak --model openai/gpt-4 --probe jailbreak
```
系统会自动运行数十种越狱 Prompt，并汇总成功率。

> 建议用 Garak 复现 OWASP LLM01~LLM05，记录不同模型的防御强度，思考绕过方式。


## 融入社区，持续学习

- **智能体(Agent)安全**：自主调用工具、写代码、自我迭代
- **模型上下文协议(MCP)滥用**：通过上下文窗口注入指令，绕过系统提示
- **间接提示注入（Indirect Prompt Injection）**：通过 RAG、插件、文件上传等侧信道注入恶意指令
- **多模态安全**：从图像到文本的提示污染、语音指令劫持等

GitHub 上搜索 [Awesome LLM Security](https://github.com/search?q=Awesome+LLM+Security&type=repositories) 可以找到不少整理好的资源列表，比如 Trail of Bits 的 awesome-llm-security、Stanford 的 llm-security-papers，以及 PromptInject、LLM-Guard 等项目。


> 建议每周花 1 小时浏览 GitHub Trending 和 arXiv 最新论文（关键词 “LLM Security 2025”）


## 安全 ≠ 越狱
"""


def ensure_seed_data() -> None:
    init_db()
    ensure_schema_compatibility()
    settings = get_settings()
    db = SessionLocal()
    try:
        admin = db.scalar(select(User).where(User.email == settings.admin_email))
        if admin is None:
            admin = User(
                username=settings.admin_username,
                email=settings.admin_email,
                password_hash=hash_password(settings.admin_password),
                role="admin",
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        if db.get(Profile, 1) is None:
            db.add(
                Profile(
                    id=1,
                    name="Ducky Zhou",
                    bio="记录 Web 开发、信息安全、AI 自动化和个人项目实践。",
                    interests="Web 安全、漏洞分析、AI 自动化、全栈开发、CTF",
                    experiences="持续搭建和打磨一个带信息安全特色的个人博客。",
                    github_url="https://github.com/ducky-zhou",
                    email=settings.admin_email,
                )
            )

        if db.scalar(select(Post.id)) is None:
            db.add(
                Post(
                    title="从 0 到 1 搭建安全特色个人博客",
                    summary="记录本博客项目的技术选型、功能规划和安全设计。",
                    content=(
                        "# 从 0 到 1 搭建安全特色个人博客\n\n"
                        "这个博客使用 React、FastAPI 和数据库实现，包含文章、评论、点赞、收藏和安全主题小游戏。\n\n"
                        "安全设计重点包括密码哈希、JWT 鉴权、管理员权限控制和题库答案保护。"
                    ),
                    cover_url=None,
                    status="published",
                    author_id=admin.id,
                )
            )

        if db.scalar(select(Post.id).where(Post.title == LLM_SECURITY_TITLE)) is None:
            db.add(
                Post(
                    title=LLM_SECURITY_TITLE,
                    summary="整理 LLM Security 的学习入口：Transformer 心智模型、OWASP LLM Top 10、MITRE ATLAS、Garak 红队工具与持续学习资源。",
                    content=LLM_SECURITY_CONTENT,
                    cover_url=None,
                    status="published",
                    author_id=admin.id,
                )
            )

        for item in SECURITY_QUESTIONS:
            exists = db.scalar(
                select(SecurityGameQuestion.id).where(
                    SecurityGameQuestion.game_name == item["game_name"],
                    SecurityGameQuestion.question == item["question"],
                )
            )
            if exists is None:
                db.add(
                    SecurityGameQuestion(
                        game_name=item["game_name"],
                        question=item["question"],
                        options_json=json.dumps(item["options"], ensure_ascii=False),
                        answer=item["answer"],
                        explanation=item["explanation"],
                        difficulty=item["difficulty"],
                        category=item["category"],
                    )
                )
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    ensure_seed_data()
    print("Seed data ready.")
