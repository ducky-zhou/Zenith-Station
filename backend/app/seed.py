import json

from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import SessionLocal, init_db
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


def ensure_seed_data() -> None:
    init_db()
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
