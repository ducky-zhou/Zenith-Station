# API 说明

后端基础地址：

```text
http://localhost:8000/api
```

## 鉴权

登录成功后返回 JWT，前端请求需要登录的接口时携带：

```text
Authorization: Bearer <token>
```

## 用户

```text
POST /auth/register
POST /auth/login
GET  /auth/me
GET  /auth/github/enabled
GET  /auth/github/start
GET  /auth/github/callback
```

GitHub 登录启用条件：后端环境变量中配置 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`，并将 GitHub OAuth App 的 callback URL 指向 `/api/auth/github/callback`。

## 文章

```text
GET    /posts
GET    /posts?q=关键词
GET    /posts/{id}
POST   /posts
PUT    /posts/{id}
DELETE /posts/{id}
```

说明：

- `POST /posts`、`PUT /posts/{id}`、`DELETE /posts/{id}` 需要管理员权限
- `include_drafts=true` 只允许管理员使用

## 评论

```text
GET    /posts/{post_id}/comments
POST   /posts/{post_id}/comments
DELETE /comments/{comment_id}
```

## 点赞与收藏

```text
POST   /posts/{id}/like
DELETE /posts/{id}/like
GET    /posts/{id}/like-status
POST   /posts/{id}/favorite
DELETE /posts/{id}/favorite
GET    /me/favorites
```

## 个人介绍

```text
GET /profile
PUT /profile
```

`PUT /profile` 需要管理员权限。

## 安全主题小游戏

```text
GET  /security-games
GET  /security-games/{game_name}/questions
POST /security-games/{game_name}/submit
GET  /security-games/{game_name}/leaderboard
```

题目接口不会返回正确答案。提交后才返回每题解析。

## 埋点

```text
POST /track
```

请求示例：

```json
{
  "event": "page_view",
  "path": "/posts/1",
  "extra": {}
}
```

## DeepSeek AI

```text
GET  /ai/enabled
POST /ai/summarize
POST /ai/summarize-post
POST /ai/draft-post
POST /ai/security-question
```

说明：

- `GET /ai/enabled` 可公开访问，用于判断后端是否配置 DeepSeek API Key
- 其他 AI 接口需要管理员权限，避免 API Key 被滥用产生费用
- DeepSeek Key 只配置在后端环境变量中，不应出现在前端代码或 Git 仓库里

环境变量：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_SECONDS=30
```

请求示例：

```json
{
  "text": "这里放需要总结的文章内容",
  "style": "concise"
}
```

## MCP Server

```text
GET  /mcp
POST /mcp
```

`POST /mcp` 使用 HTTP JSON-RPC，并要求登录态：

```text
Authorization: Bearer <token>
```

支持基础 MCP 方法：

```text
initialize
tools/list
tools/call
notifications/initialized
```

当前工具：

```text
blog.profile.get
blog.posts.list
blog.posts.get
blog.posts.create    # admin
blog.posts.update    # admin
blog.posts.delete    # admin
blog.stats.get       # admin
blog.ai.summarize_text              # admin, DeepSeek
blog.ai.summarize_post              # admin, DeepSeek
blog.ai.draft_post                  # admin, DeepSeek
blog.ai.generate_security_question  # admin, DeepSeek
```

示例：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "blog.posts.list",
    "arguments": {
      "limit": 5
    }
  }
}
```
