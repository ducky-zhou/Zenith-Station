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
