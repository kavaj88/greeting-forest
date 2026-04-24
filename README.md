# 如是愿 (WISHING YOU)

一个基于 React + Vite + Supabase 的祈福祝愿 Web 应用，支持用户登录注册、发布心愿、点赞互动。

## 功能特性

- 🔐 **用户认证**: 邮箱 + 密码登录注册，验证码验证邮箱所有权
- 🏮 **三种心愿类型**: 祈福、祝愿、吐槽
- 🔒 **隐私保护**: 可选择公开或保密心愿
- 💫 **发光边框**: 不同颜色边框区分心愿类型
- 📱 **响应式设计**: 支持桌面端和移动端
- ✨ **动画效果**: 流畅的过渡和交互动画

### 前端
- **React** 18.3.1 - UI 框架
- **Vite** 6.3.5 - 构建工具
- **TypeScript** - 开发语言
- **Tailwind CSS** 4.1.12 - CSS 框架
- **Motion** (framer-motion) - 动画库
- **Lucide React** - 图标库
- **Supabase JS** - 数据库客户端

### 后端
- **Supabase** - 后端即服务平台
  - PostgreSQL 数据库
  - 行级安全 (RLS)
  - 实时订阅

## 功能特性

- 🏮 **三种心愿类型**: 祈福、祝愿、吐槽
- 🔒 **隐私保护**: 可选择公开或保密心愿
- 💫 **发光边框**: 不同颜色边框区分心愿类型
- 📱 **响应式设计**: 支持桌面端和移动端
- ✨ **动画效果**: 流畅的过渡和交互动画

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件，填入你的 Supabase 配置：
```
VITE_SUPABASE_URL=你的项目 URL
VITE_SUPABASE_ANON_KEY=你的 Anon Key
```

**注意**：不要将 `.env` 文件提交到 Git！

### 3. 初始化数据库

在 Supabase SQL Editor 中运行 `supabase/migrations/001_initial_schema.sql` 文件内容。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

## 项目结构

```
src/
├── app/
│   ├── App.tsx              # 主应用组件
│   ├── types.ts             # 类型定义
│   └── components/
│       ├── WishCard.tsx     # 心愿卡片组件
│       ├── CreateWishModal.tsx  # 创建心愿弹窗
│       └── ui/              # UI 组件库
├── lib/
│   ├── supabase.ts          # Supabase 客户端配置
│   └── api.ts               # API 调用函数
└── styles/
    ├── index.css            # 全局样式
    ├── tailwind.css         # Tailwind 入口
    ├── fonts.css            # 字体设置
    └── theme.css            # 主题变量
```

## 数据库结构

### wishes 表

| 字段 | 类型 | 说明 |
|-----|------|-----|
| id | UUID | 主键 |
| category | TEXT | 类型 (blessing/wish/vent) |
| content | TEXT | 内容 |
| author | TEXT | 作者 |
| is_public | BOOLEAN | 是否公开 |
| likes | INTEGER | 点赞数 |
| bg_variant | INTEGER | 背景样式 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

## 常用命令

```bash
npm install    # 安装依赖
npm run dev    # 启动开发服务器
npm run build  # 构建生产版本
```

## API 说明

### fetchWishes()
获取所有公开的心愿列表

### createWish(wish)
创建新心愿
- category: 类型
- content: 内容
- author: 作者
- isPublic: 是否公开
- bgVariant: 背景样式

### likeWish(id)
点赞心愿

## 部署

### Supabase 部署

1. 在 Supabase 创建项目
2. 运行数据库迁移脚本
3. 获取项目 URL 和 Anon Key
4. 更新 `.env` 文件

### 前端部署

支持部署到任意静态托管服务：
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

## 觉得不错，可以加我和关注公众号

<img src="./public/wx.png" width="258" height="258" alt="微信二维码">     ![公众号](./public/qRcode.jpg)  

## 安全

- 启用行级安全 (RLS)
- 公开心愿才可被查询
- 任何人可创建心愿和点赞

## License

MIT
