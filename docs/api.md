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
