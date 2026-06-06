# 部署说明

## 本地开发

后端：

```bash
cd backend
pip install -r requirements.txt
python -m app.seed
python -m uvicorn app.main:app --reload
```

前端：

```bash
cd frontend
npm install
npm run dev
```

## Docker Compose

首次部署前复制 `.env.example` 为 `.env`，并修改生产配置：

- `SECRET_KEY`
- `ADMIN_PASSWORD`
- `POSTGRES_PASSWORD`
- `CORS_ORIGINS`
- `FRONTEND_BASE_URL`

如需启用 GitHub 登录，还需要在 GitHub OAuth App 中配置回调地址：

```text
http://服务器公网IP/api/auth/github/callback
```

如果已经绑定域名并开启 HTTPS，建议使用正式域名：

```text
https://你的域名/api/auth/github/callback
```

并在 `.env` 中配置：

```text
FRONTEND_BASE_URL=http://服务器公网IP
GITHUB_CLIENT_ID=你的 GitHub OAuth Client ID
GITHUB_CLIENT_SECRET=你的 GitHub OAuth Client Secret
GITHUB_REDIRECT_URI=http://服务器公网IP/api/auth/github/callback
```

配置完成后，登录页会自动显示“使用 GitHub 登录”。可以先访问：

```text
http://服务器公网IP/api/auth/github/enabled
```

返回 `{"enabled":true}` 即说明后端已读取到配置。

## MCP Server

后端提供 HTTP JSON-RPC MCP 入口：

```text
http://服务器公网IP/api/mcp
```

MCP 请求必须携带登录后的 JWT：

```text
Authorization: Bearer <token>
```

读工具可由普通登录用户使用，创建/更新/删除文章和读取统计需要管理员账号。当前工具包括：

```text
blog.profile.get
blog.posts.list
blog.posts.get
blog.posts.create
blog.posts.update
blog.posts.delete
blog.stats.get
blog.ai.summarize_text
blog.ai.summarize_post
blog.ai.draft_post
blog.ai.generate_security_question
```

## DeepSeek AI 配置

项目支持通过 DeepSeek API 提供 AI 总结、文章草稿和安全题目生成能力。API Key 只应配置在服务器 `.env` 中，不要提交到 GitHub。

服务器 `/opt/zenith-station/.env` 增加：

```env
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_SECONDS=30
```

重启服务：

```bash
cd /opt/zenith-station
docker compose up -d --build
```

检查是否启用：

```text
http://服务器公网IP/api/ai/enabled
```

未配置 Key 时，AI 写作相关接口会返回 `503 DeepSeek API is not configured`，不会影响博客、评论、点赞、安全闯关和 MCP 基础工具。

启动：

```bash
docker compose up -d --build
```

查看日志：

```bash
docker compose logs -f backend
docker compose logs -f nginx
```

## 域名访问

在域名服务商添加 A 记录：

```text
@    A    你的服务器公网 IP
www  A    你的服务器公网 IP
```

服务器安全组至少开放：

```text
80/tcp
443/tcp
22/tcp
```

生产环境建议使用 HTTPS，可通过云厂商证书、Certbot 或反向代理网关配置。

备案期间可先通过服务器公网 IP 临时访问；安全组建议只保留临时访问需要的 Web 端口，SSH 端口限制为本人 IP，Linux 实例不需要开放 RDP 3389。

## 缓存与 CDN

当前前端容器对 Vite 生成的 `/assets/` 静态资源设置了 30 天 immutable 缓存，上传头像通过 `/uploads/` 暴露并缓存 7 天。备案和 HTTPS 完成后，可以将阿里云 CDN 或 Cloudflare 的源站指向服务器公网 IP，并缓存以下路径：

```text
/assets/*
/uploads/*
```

API 路径 `/api/*` 不应做 CDN 缓存。

## CI/CD

当前已提供 `.github/workflows/ci.yml`：

- 后端安装依赖、语法检查、运行测试
- 前端安装依赖、执行构建

后续可以继续增加 CD：
当前也提供 `.github/workflows/deploy.yml`，需要在 GitHub Secrets 中配置：

```text
DEPLOY_HOST
DEPLOY_USER
DEPLOY_KEY
DEPLOY_PATH
```

服务器上的 `DEPLOY_PATH` 需要是已经克隆好的项目目录，并且目录中已经配置好 `.env`。
