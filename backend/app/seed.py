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
                    name="信息安全学习者",
                    bio="这里是我的个人博客，用来记录 Web 开发、信息安全、AI 工具和项目实践。",
                    interests="Web 安全、漏洞分析、AI 自动化、全栈开发、CTF",
                    experiences="正在从 0 到 1 搭建一个带安全特色的个人博客。",
                    github_url="https://github.com/your-name",
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

        if db.scalar(select(SecurityGameQuestion.id)) is None:
            for item in SECURITY_QUESTIONS:
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
