# 部署到服务器（随时浏览器打开）

应用是纯前端，构建结果是 `dist/` 静态文件。数据在浏览器 **localStorage**，换浏览器或清缓存会丢进度，这是当前版本的设计。

## 方式零：GitHub Pages（免费，推荐先试）

仓库里已配置 [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)：推送 **`main`** 分支会自动构建并发布。

### 你要做的（一次性）

1. 在 GitHub 新建一个仓库，**仓库名用英文**（例如 `founder-english`），不要勾选 “Add a README”（若本地已有项目）。
2. 在本机项目目录执行（把 `YOUR_USER` / `YOUR_REPO` 换成你的）：

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Founder English app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
   git push -u origin main
   ```

3. 打开 GitHub 仓库 → **Settings** → **Pages** → **Build and deployment** → Source 选 **GitHub Actions**（不要选 Deploy from a branch，除非你知道自己在做什么）。
4. 等几分钟，到 **Actions** 里看到绿色勾后，访问：

   **`https://YOUR_USER.github.io/YOUR_REPO/`**

   路径里的 **`YOUR_REPO` 必须和仓库名完全一致**（工作流里用 `VITE_BASE_PATH=/<仓库名>/`）。

### 特殊：用户名.github.io 仓库

若仓库名正好是 `你的用户名.github.io`，网站在根路径 `https://你的用户名.github.io/`，需要把 `vite` 的 `base` 设为 `/`。此时应改工作流里环境变量为 `VITE_BASE_PATH=/`，或单独维护一个分支配置。一般项目用普通仓库名即可。

---

## 方式一：Docker（推荐）

服务器已安装 [Docker](https://docs.docker.com/engine/install/) 与 Docker Compose 时：

```bash
# 在项目目录
docker compose up -d --build
```

浏览器访问：`http://服务器IP:8080`

- 改端口：编辑 `docker-compose.yml` 里 `"8080:80"`，左侧改成你想要的宿主机端口。
- 停服：`docker compose down`

## 方式二：只上传 dist（无 Docker）

本机执行：

```bash
npm ci
npm run build
```

把 `dist/` 里全部文件上传到服务器的网站目录（如 `/var/www/founder-english/`），用 Nginx 指到该目录，配置可参考 `deploy/nginx.conf` 中的 `root` 与 `try_files`。

## 方式三：云平台托管静态站

将 `npm run build` 生成的 `dist` 部署到 **Cloudflare Pages / Vercel / Netlify / 阿里云 OSS 静态网站** 等，绑定自己的域名即可公网访问。

## HTTPS 与域名

- 生产环境建议在 Nginx/Caddy 前加 **HTTPS**（Let’s Encrypt）并绑定域名。
- Docker 场景可在宿主机再挂一层反向代理（443 → 容器 8080），由宿主机终止 TLS。
