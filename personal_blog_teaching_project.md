# 教学项目：从 0 到 1 做实用好玩的个人博客

## 一、项目定位

这个项目不是只做一个博客页面，而是通过“个人博客”这个场景，完整学习一次真实 Web 应用从开发到上线的全过程。

你最终要完成一个可以通过域名访问的个人博客网站，并在过程中学习：

- Git 与 GitHub 协作
- Web 基础、HTTP、DNS、浏览器渲染
- React 前端开发
- FastAPI 后端开发
- 数据库设计与 ORM
- 登录鉴权
- 评论、点赞、收藏等用户互动
- Docker 容器化部署
- 云服务器、Nginx、域名解析、HTTPS
- CI/CD 自动化构建和部署
- 搜索、统计、缓存、AI 自动化、MCP、安全主题小游戏等扩展模块

一句话总结：

> 用个人博客这个项目，把一个真实互联网应用从 0 到 1 做出来。

---

## 二、最终成果目标

### 1. 最终交付物

一个可访问、可发布文章、可评论互动、可部署迁移的个人博客网站。

### 2. 最低可接受标准

- 搭建起基本的全栈博客框架
- 能发布、存储、展示博客文章
- 能展示个人介绍、照片、兴趣、经历等信息
- 有评论区
- 有登录鉴权
- 用户可以评论、点赞、收藏
- 后端和数据库能够通过 Docker 一键部署
- 网站部署到云服务器
- 网站能够通过域名访问

### 3. 推荐完成效果

游客可以：

- 查看首页
- 查看个人介绍
- 浏览文章列表
- 查看文章详情
- 查看评论

登录用户可以：

- 注册
- 登录
- 评论
- 点赞
- 收藏

管理员可以：

- 登录后台
- 发布文章
- 编辑文章
- 删除文章
- 管理评论

系统层面需要：

- 数据持久化到数据库
- Docker Compose 一键启动
- 部署到云服务器
- 绑定域名
- 配置 CI/CD

---

## 三、推荐技术栈

推荐技术栈：

```text
React + FastAPI + PostgreSQL + Docker + Nginx
```

### 1. 前端

推荐使用：

- React
- Vite
- TypeScript
- React Router
- Axios / Fetch
- Tailwind CSS / Ant Design

前端负责：

- 博客首页
- 个人介绍页
- 文章列表页
- 文章详情页
- 登录注册页
- 评论、点赞、收藏交互
- 管理后台页面

### 2. 后端

推荐使用：

- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic
- JWT
- Alembic

后端负责：

- API 服务
- 用户注册和登录
- 文章增删改查
- 评论、点赞、收藏
- 文件上传
- 搜索接口
- 数据统计接口
- AI 自动化接口
- MCP 工具接口

### 3. 数据库

推荐使用：

- PostgreSQL：适合正式项目
- SQLite：适合前期快速学习

数据库存储：

- 用户
- 文章
- 评论
- 点赞
- 收藏
- 图片信息
- 访问统计

### 4. 部署

推荐使用：

- Docker
- Docker Compose
- Nginx
- 云服务器
- 域名解析
- GitHub Actions

部署链路：

```text
浏览器
  ↓
域名
  ↓
Nginx
  ↓
前端静态文件 / 后端 API
  ↓
FastAPI
  ↓
PostgreSQL
```

---

## 四、需要学习什么

### 1. Git

需要掌握：

- `git init`
- `git add`
- `git commit`
- `git status`
- `git log`
- `git branch`
- `git checkout`
- `git merge`
- `git pull`
- `git push`
- GitHub 创建仓库
- 分支开发
- Pull Request
- `.gitignore`

目标：

- 项目代码托管到 GitHub
- 每完成一个功能提交一次
- 能用分支开发功能
- 能配合 GitHub Actions 做自动构建和部署

常用命令：

```bash
git init
git add .
git commit -m "init blog project"
git remote add origin <你的仓库地址>
git push -u origin main
```

### 2. Web 基础

需要理解：

- HTTP 请求和响应
- DNS 域名解析
- IP 和端口
- GET / POST / PUT / DELETE
- 状态码 200 / 401 / 403 / 404 / 500
- REST API
- JSON
- Cookie、Token、JWT
- CORS 跨域
- Nginx 的作用
- 浏览器渲染过程

一次访问流程：

```text
用户访问 blog.example.com
  ↓
DNS 找到服务器 IP
  ↓
Nginx 接收请求
  ↓
页面请求返回前端文件
  ↓
/api 请求转发给 FastAPI
  ↓
FastAPI 查询数据库
  ↓
返回 JSON
  ↓
React 渲染页面
```

### 3. React 前端

需要掌握：

- 组件、Props、State
- `useState`、`useEffect`
- React Router
- 表单处理
- 调用后端 API
- 保存登录状态
- 响应式布局

建议页面：

```text
/                       首页
/about                  个人介绍
/posts                  文章列表
/posts/:id              文章详情
/login                  登录
/register               注册
/admin                  后台首页
/admin/posts            文章管理
/admin/posts/new        新建文章
/admin/posts/:id/edit   编辑文章
```

### 4. FastAPI 后端

需要掌握：

- FastAPI 路由
- 请求参数
- 响应模型
- Pydantic 数据校验
- SQLAlchemy
- JWT 鉴权
- 文件上传
- CORS
- API 分层设计

推荐目录：

```text
backend/
  app/
    main.py
    core/
      config.py
      security.py
    db/
      session.py
      models.py
    schemas/
      user.py
      post.py
      comment.py
    api/
      auth.py
      posts.py
      comments.py
      likes.py
      favorites.py
    services/
      post_service.py
      user_service.py
  requirements.txt
  Dockerfile
```

### 5. 数据库

需要掌握：

- 表、字段、主键、外键、索引
- 一对多、多对多
- 基础 SQL
- ORM

核心表：

```text
users
- id
- username
- email
- password_hash
- avatar_url
- role
- created_at

posts
- id
- title
- summary
- content
- cover_url
- author_id
- status
- created_at
- updated_at

comments
- id
- post_id
- user_id
- content
- created_at

likes
- id
- post_id
- user_id
- created_at

favorites
- id
- post_id
- user_id
- created_at
```

统计表：

```text
page_views
- id
- path
- ip
- user_agent
- created_at
```

---

## 五、主线功能如何实现

### 1. 上传和存储博客文章

这里可以理解为：管理员在后台发布文章，文章保存到数据库。

前端要做：

- 标题输入框
- 摘要输入框
- 正文编辑器
- 封面图上传
- 发布按钮

建议文章格式：

- 使用 Markdown 编写
- 后端保存 Markdown 原文
- 前端使用 Markdown 渲染库展示

可用库：

```bash
react-markdown
```

后端 API：

```text
GET    /api/posts          获取文章列表
GET    /api/posts/{id}     获取文章详情
POST   /api/posts          创建文章，需要管理员登录
PUT    /api/posts/{id}     更新文章，需要管理员登录
DELETE /api/posts/{id}     删除文章，需要管理员登录
```

数据库字段：

```text
title
summary
content
cover_url
author_id
status
created_at
updated_at
```

最低实现流程：

```text
管理员登录
  ↓
进入 /admin/posts/new
  ↓
填写文章
  ↓
调用 POST /api/posts
  ↓
后端保存到数据库
```

### 2. 展示个人介绍、照片、兴趣、经历

简单方式：

- 直接写在前端 `/about` 页面
- 适合第一版快速完成

内容包括：

- 头像
- 昵称
- 个人简介
- 技能栈
- 兴趣爱好
- 项目经历
- 联系方式

进阶方式：

- 存到数据库
- 后台可以编辑

数据库表：

```text
profile
- id
- name
- bio
- avatar_url
- interests
- experiences
- github_url
- email
```

接口：

```text
GET /api/profile
PUT /api/profile
```

建议先写死在前端，后期再改成后台可编辑。

### 3. 评论区

评论区依赖用户登录。

前端要做：

- 评论列表
- 评论输入框
- 发表评论按钮
- 未登录时提示登录

后端 API：

```text
GET    /api/posts/{post_id}/comments
POST   /api/posts/{post_id}/comments
DELETE /api/comments/{comment_id}
```

数据库表：

```text
comments
- id
- post_id
- user_id
- content
- created_at
```

权限规则：

- 所有人可以看评论
- 登录用户可以发评论
- 评论作者可以删除自己的评论
- 管理员可以删除任何评论

### 4. 通过域名访问

需要完成：

1. 购买域名
2. 购买云服务器
3. 部署项目
4. 配置 Nginx
5. 配置 DNS 解析
6. 配置 HTTPS

DNS 解析：

```text
主机记录: @
记录类型: A
记录值: 服务器公网 IP

主机记录: www
记录类型: A
记录值: 服务器公网 IP
```

Nginx 负责：

- 返回前端页面
- 将 `/api` 转发给 FastAPI
- 处理 HTTPS
- 缓存静态资源

示例：

```text
/        → 前端 React 静态页面
/api     → 后端 FastAPI
/uploads → 上传图片文件
```

---

## 六、基础功能如何实现

### 1. CI/CD

CI/CD 是代码提交后自动构建、测试或部署。

CI 最低要求：

- 安装前端依赖
- 构建前端
- 安装后端依赖
- 执行后端测试

文件位置：

```text
.github/workflows/ci.yml
```

流程：

```text
frontend:
- npm install
- npm run build

backend:
- pip install -r requirements.txt
- pytest
```

CD 进阶要求：

```text
push 到 main
  ↓
GitHub Actions 登录服务器
  ↓
拉取最新代码
  ↓
docker compose up -d --build
```

### 2. Docker 容器打包

最低要求：

```text
后端 + 数据库
```

推荐完整方案：

```text
前端 + 后端 + 数据库 + Nginx
```

项目结构：

```text
project/
  frontend/
    Dockerfile
  backend/
    Dockerfile
  nginx/
    nginx.conf
  docker-compose.yml
```

启动命令：

```bash
docker compose up -d --build
```

目标：

> 换一台服务器，只要安装 Docker，复制代码和环境变量，就能一键启动整个博客。

### 3. 登录鉴权

推荐使用 JWT。

流程：

```text
用户注册
  ↓
后端加密密码并保存
  ↓
用户登录
  ↓
后端校验密码
  ↓
生成 JWT token
  ↓
前端保存 token
  ↓
之后请求 API 时携带 token
```

后端 API：

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

前端保存：

```text
localStorage
```

请求头：

```text
Authorization: Bearer <token>
```

需要登录的操作：

- 发表评论
- 点赞
- 收藏
- 创建文章
- 编辑文章
- 删除文章

管理员专属操作：

- 创建文章
- 编辑文章
- 删除文章
- 管理评论

### 4. 评论、点赞、收藏

点赞表：

```text
likes
- id
- user_id
- post_id
- created_at
```

点赞接口：

```text
POST   /api/posts/{id}/like
DELETE /api/posts/{id}/like
GET    /api/posts/{id}/like-status
```

收藏表：

```text
favorites
- id
- user_id
- post_id
- created_at
```

收藏接口：

```text
POST   /api/posts/{id}/favorite
DELETE /api/posts/{id}/favorite
GET    /api/me/favorites
```

评论接口：

```text
GET  /api/posts/{id}/comments
POST /api/posts/{id}/comments
```

注意：

- 一个用户对一篇文章只能点赞一次
- 一个用户对一篇文章只能收藏一次
- 数据库应添加 `user_id + post_id` 唯一约束

---

## 七、支线功能如何实现

支线功能建议在主线完成后再做，挑 1 到 3 个深入即可。

### 1. 缓存机制

可使用 Redis。

适合缓存：

- 首页文章列表
- 热门文章
- 文章详情
- 访问统计

流程：

```text
FastAPI 先查 Redis
  ↓
Redis 没有再查 PostgreSQL
  ↓
查到后写入 Redis
```

缓存 key：

```text
posts:list:page:1
post:detail:123
```

文章更新后要清理相关缓存。

### 2. CDN

CDN 用于加速静态资源。

可加速：

- 前端 JS/CSS
- 图片
- 文章封面
- 用户头像

实现方式：

- 阿里云 OSS + CDN
- 腾讯云 COS + CDN
- 火山引擎对象存储 + CDN

建议前期先用服务器本地 `/uploads`，后期再迁移对象存储。

### 3. 数据埋点和统计

可统计：

- PV
- UV
- 热门文章
- 用户点击行为
- 来源页面
- 访问设备

前端进入页面时请求：

```text
POST /api/track
```

请求内容：

```json
{
  "path": "/posts/1",
  "event": "page_view"
}
```

数据库表：

```text
events
- id
- user_id
- event
- path
- extra
- ip
- user_agent
- created_at
```

后台展示：

- 总访问量
- 今日访问量
- 热门文章 Top 10
- 评论数量
- 点赞数量
- 收藏数量

### 4. 用户数据分析与推荐

用户数据分析可以看：

- 用户最常看哪类文章
- 用户点赞过哪些文章
- 用户收藏过哪些文章
- 用户评论活跃度

文章标签表：

```text
tags
- id
- name

post_tags
- post_id
- tag_id
```

简单推荐逻辑：

1. 找到用户点赞、收藏、浏览过的文章
2. 统计这些文章的标签
3. 找出用户最感兴趣的标签
4. 推荐相同标签下用户没看过的文章

接口：

```text
GET /api/recommendations
```

### 5. 文章搜索

关键词搜索：

```sql
WHERE title LIKE '%关键词%'
OR content LIKE '%关键词%'
```

更好的方案：

- PostgreSQL Full Text Search
- Meilisearch
- Elasticsearch

接口：

```text
GET /api/search?q=react
```

语义搜索流程：

```text
文章生成 embedding
  ↓
存入 pgvector / Qdrant / Milvus
  ↓
用户搜索词生成 embedding
  ↓
查找向量最接近的文章
```

### 6. MCP 暴露

MCP 可以理解为：

> 给 AI Agent 提供一套标准工具，让它能管理你的博客。

可以暴露：

```text
list_posts
get_post
create_post
update_post
delete_post
list_comments
delete_comment
get_analytics
```

建议主线完成后再做 MCP。

### 7. AI 自动化模块

每日新闻 Digest：

```text
定时任务 → 抓取新闻源 → LLM 总结 → 生成 Markdown → 保存草稿
```

GitHub Trending 自动解读：

```text
每天抓 GitHub Trending → 筛选项目 → LLM 总结亮点 → 生成文章
```

AI 技术论文 Digest：

```text
抓取 arXiv 论文 → 提取标题摘要链接 → LLM 总结 → 生成博客文章
```

需要学习：

- cron / APScheduler
- 外部 API
- LLM API
- 后端自动创建文章

### 8. 安全主题小游戏

作为信息安全专业学生，小游戏建议和安全知识结合，这样既好玩，也能体现专业特色。

推荐方向：

- XSS 防御挑战：判断输入是否存在脚本注入风险
- SQL 注入闯关：识别危险 SQL 拼接，并选择正确参数化写法
- 密码强度挑战：根据规则判断密码强度，并给出改进建议
- 钓鱼邮件识别：从邮件内容、链接、域名中识别钓鱼风险
- 日志分析挑战：从访问日志中找出异常 IP、爆破行为或扫描行为
- CTF 选择题闯关：Web 安全、密码学、网络安全、Linux 基础等题库

第一次做建议选择：

```text
钓鱼邮件识别小游戏 或 SQL 注入闯关
```

原因：

- 规则清晰，容易做成题库
- 适合前端交互
- 后端只需要记录分数和排行榜
- 能直观体现信息安全专业特色

需要实现：

- 前端小游戏页面
- 后端提交分数接口
- 数据库排行榜表
- 排行榜页面
- 题库数据
- 答题结果解析

数据库表：

```text
security_game_questions
- id
- game_name
- question
- options
- answer
- explanation
- difficulty
- category

security_game_scores
- id
- user_id
- game_name
- score
- correct_count
- total_count
- duration_seconds
- created_at
```

接口：

```text
GET  /api/security-games/{game_name}/questions
POST /api/security-games/{game_name}/submit
GET  /api/security-games/{game_name}/leaderboard
```

前端页面可以包含：

- 题目卡片
- 选项按钮
- 倒计时
- 即时反馈
- 答案解析
- 最终得分
- 排行榜

示例玩法：

```text
用户进入“钓鱼邮件识别”
  ↓
系统随机给出 10 道题
  ↓
用户判断邮件是否可疑
  ↓
每题显示解析
  ↓
提交分数
  ↓
进入排行榜
```

### 9. 数字化小人

可以做成博客虚拟助手：

- 首页右下角显示虚拟角色
- 点击后出现聊天框
- 可以介绍你是谁
- 可以回答博客内容问题
- 可以推荐文章

简单实现：

```text
前端放一个 Live2D / 2D 角色
  ↓
点击后出现聊天框
  ↓
聊天框调用后端 AI 接口
  ↓
后端基于博客内容回答
```

进阶方向：

- RAG
- 语音合成
- 表情动作
- 文章推荐

---

## 八、8 周推进路线

### 第 1 周：Git 从 0 到进阶

目标：

- 会用 Git 管理代码
- 建好 GitHub 仓库
- 建立项目目录结构

要做：

- 创建 GitHub 仓库
- 创建 `frontend` 和 `backend` 目录
- 写 README
- 完成第一次 commit
- 学会 branch 和 merge

交付物：

```text
GitHub 仓库
README
项目初始化结构
```

### 第 2 周：VibeCoding 安装及初步实践

目标：

- 学会用 AI 辅助写代码
- 能让 AI 帮你生成页面、接口、测试
- 能看懂和修改 AI 生成的代码

要做：

- 安装 VS Code / Cursor / Claude Code / Codex 等工具
- 学会描述需求
- 学会让 AI 分步骤实现
- 学会 review AI 代码

练习：

- 让 AI 帮你生成博客首页
- 让 AI 帮你设计数据库表
- 让 AI 帮你写 FastAPI 文章接口

### 第 3 周：网络基础、互联网认识、Web 渲染原理

目标：

- 理解网站如何被访问
- 理解前后端如何通信

要做：

- 用 FastAPI 写 hello API
- 用 React 调用 API
- 打开浏览器 DevTools 查看 Network
- 理解一次请求过程

交付物：

```text
React 页面能请求 FastAPI 接口并显示数据
```

### 第 4 周：前端 React 学习与实践

目标：

- 完成博客前端主体

要做：

- 首页
- 个人介绍页
- 文章列表页
- 文章详情页
- 登录页
- 注册页
- 后台文章编辑页

这一周可以先使用 mock 数据。

交付物：

```text
一个可浏览的博客前端
```

### 第 5 周：数据库及后端学习与实践

目标：

- 完成核心后端 API
- 前后端真正打通

要做：

- 用户注册
- 用户登录
- JWT 鉴权
- 文章增删改查
- 评论
- 点赞
- 收藏

核心接口：

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

GET    /api/posts
GET    /api/posts/{id}
POST   /api/posts
PUT    /api/posts/{id}
DELETE /api/posts/{id}

GET  /api/posts/{id}/comments
POST /api/posts/{id}/comments

POST   /api/posts/{id}/like
DELETE /api/posts/{id}/like

POST   /api/posts/{id}/favorite
DELETE /api/posts/{id}/favorite
GET    /api/me/favorites
```

交付物：

```text
完整可用的博客系统本地版
```

### 第 6 周：Docker、CI/CD、域名和部署

目标：

- 让博客真正上线

要做：

- 写 Dockerfile
- 写 `docker-compose.yml`
- 配置 PostgreSQL
- 配置 Nginx
- 购买云服务器
- 配置安全组
- 部署项目
- 绑定域名
- 配置 HTTPS
- 配置 GitHub Actions

最低启动命令：

```bash
docker compose up -d --build
```

交付物：

```text
一个真实可访问的博客网站
```

### 第 7 周：进阶内容

目标：

- 选择 1 到 3 个支线模块深入做

推荐组合：

```text
实用型：文章搜索 + 数据统计 + 缓存机制
AI 型：GitHub Trending 自动解读 + AI 技术论文 Digest + 语义搜索
安全特色型：安全主题小游戏排行榜 + 数据统计 + 文章推荐
```

第一次做建议：

```text
文章搜索 + 数据统计 + 安全主题小游戏
```

### 第 8 周：最终调试与完善

目标：

- 修 bug
- 优化体验
- 补文档
- 准备展示

要做：

- 测试所有页面
- 测试登录注册
- 测试文章发布
- 测试评论、点赞、收藏
- 测试移动端样式
- 检查 Docker 部署
- 检查域名访问
- 整理 README
- 准备演示材料

最终 README 应包含：

- 项目介绍
- 技术栈
- 功能列表
- 本地启动方式
- Docker 部署方式
- 环境变量说明
- 数据库说明
- 接口说明
- 线上访问地址
- 项目截图
- 未来计划

---

## 九、功能优先级

### 第一优先级：必须完成

```text
前端页面
后端 API
数据库
文章发布
文章展示
个人介绍
登录注册
评论
Docker 部署
域名访问
```

### 第二优先级：增强完整度

```text
点赞
收藏
后台管理
CI/CD
图片上传
Markdown 编辑
HTTPS
```

### 第三优先级：体现亮点

```text
搜索
数据统计
缓存
AI Digest
推荐系统
安全主题小游戏排行榜
MCP
数字化小人
```

---

## 十、最小可行版本 MVP

游客：

- 看首页
- 看个人介绍
- 看文章列表
- 看文章详情
- 看评论

登录用户：

- 注册
- 登录
- 评论
- 点赞
- 收藏

管理员：

- 登录后台
- 发布文章
- 编辑文章
- 删除文章

系统：

- 数据存在 PostgreSQL
- Docker Compose 一键启动
- 部署到云服务器
- 域名访问

完成这个 MVP，就已经是一个合格的从 0 到 1 博客项目。

---

## 十一、推荐项目结构

```text
personal-blog/
  frontend/
    src/
      pages/
      components/
      api/
      router/
      store/
    package.json
    Dockerfile

  backend/
    app/
      main.py
      api/
      core/
      db/
      models/
      schemas/
      services/
    tests/
    requirements.txt
    Dockerfile

  nginx/
    nginx.conf

  docs/
    api.md
    deploy.md
    database.md

  .github/
    workflows/
      ci.yml
      deploy.yml

  docker-compose.yml
  README.md
  .env.example
```

---

## 十二、每日推进建议

推荐每天按这个比例安排：

```text
30% 学习
50% 写代码
20% 复盘和记录
```

每完成一个功能，记录：

```text
今天做了什么
遇到了什么问题
怎么解决的
学到了什么
下一步做什么
```

这样最后不仅有项目，还有完整的学习过程。

---

## 十三、验收清单

### 1. 功能达标

- [ ] 可以访问首页
- [ ] 可以查看个人介绍
- [ ] 可以查看文章列表
- [ ] 可以查看文章详情
- [ ] 管理员可以发布文章
- [ ] 管理员可以编辑文章
- [ ] 管理员可以删除文章
- [ ] 用户可以注册
- [ ] 用户可以登录
- [ ] 用户可以评论
- [ ] 用户可以点赞
- [ ] 用户可以收藏

### 2. 工程达标

- [ ] 代码托管在 GitHub
- [ ] 前后端目录清晰
- [ ] 数据库表设计合理
- [ ] 接口命名清楚
- [ ] 有 README
- [ ] 有 Dockerfile
- [ ] 有 `docker-compose.yml`
- [ ] 能一键启动
- [ ] 有 CI/CD

### 3. 部署达标

- [ ] 项目部署到云服务器
- [ ] 域名能访问
- [ ] 后端接口能访问
- [ ] 数据库数据能持久化
- [ ] 服务器重启后服务能恢复
- [ ] 配置 HTTPS

### 4. 进阶达标

- [ ] 有文章搜索
- [ ] 有数据统计
- [ ] 有缓存机制
- [ ] 有 AI 自动化模块
- [ ] 有安全主题小游戏或 MCP
- [ ] 有推荐系统或语义搜索

---

## 十四、最终总结

这个项目的核心不是“写几页博客页面”，而是用博客这个场景，把一个真实全栈项目从开发、存储、登录、交互、部署、自动化和扩展完整走一遍。

建议先完成主线：

```text
文章
用户
评论
点赞
收藏
部署
域名访问
```

再从支线中挑亮点：

```text
搜索
统计
AI 自动化
MCP
安全主题小游戏
数字化小人
```

只要主线扎实、部署真实、支线有一个亮点做深，这个教学项目就既实用，也足够好玩。
