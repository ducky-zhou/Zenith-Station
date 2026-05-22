# Security Personal Blog

一个面向信息安全专业特色的个人博客项目，包含文章发布、个人介绍、登录鉴权、评论、点赞、收藏、安全主题小游戏、Docker 部署和 CI/CD 配置。

## 技术栈

- 前端：React + Vite + TypeScript
- 后端：FastAPI + SQLAlchemy + JWT
- 数据库：SQLite 开发环境，PostgreSQL 生产环境可切换
- 部署：Docker Compose + Nginx
- 自动化：GitHub Actions

## 核心功能

- 文章列表、文章详情、Markdown 内容展示
- 管理员文章创建、编辑、删除
- 用户注册、登录、鉴权
- 评论、点赞、收藏
- 个人介绍页面
- 安全主题小游戏：钓鱼邮件识别、SQL 注入识别等题库和排行榜
- Docker 一键启动
- Nginx 反向代理配置

## 本地后端启动

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload
```

## 本地前端启动

```bash
cd frontend
npm install
npm run dev
```

## Docker 启动

```bash
docker compose up -d --build
```

## 默认账号

开发环境可使用 `.env.example` 中的管理员信息。首次启动后请立刻修改默认密码和 `SECRET_KEY`。

## 文档

- 教学项目说明：`personal_blog_teaching_project.md`
- API 说明：`docs/api.md`
- 部署说明：`docs/deploy.md`
- 安全检查：`docs/security_check.md`
