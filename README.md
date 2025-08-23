# 🎂 生日礼物网页

## 🌐 体验地址
**在线体验：** https://lw.xiaoweigezzz.xyz/

一个特别的生日礼物网页，包含主题切换和音乐播放功能。

## ✨ 功能特点

- 🎨 **3个主题切换**：每个主题包含独特的背景图、祝福文字和音乐
- 🎵 **圆形唱片播放器**：播放时旋转动画，支持播放/暂停控制
- 📱 **响应式设计**：完美适配电脑和手机端
- ⚡ **性能优化**：使用Vite构建，快速加载

## 🚀 快速开始

### 安装依赖
```bash
cd birthday-gift-website
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 📁 项目结构

```
birthday-gift-website/
├── public/
│   ├── images/          # 背景图片和唱片图片
│   └── audio/           # 主题音乐文件
├── src/
│   ├── styles/          # CSS样式文件
│   ├── js/              # JavaScript模块
│   └── index.html       # 主页面
├── vite.config.js       # Vite配置
└── package.json         # 项目配置
```

## 📋 资源准备

### 图片资源 (放在 `public/images/`)
- `bg1.jpg` - 主题1背景图
- `bg2.jpg` - 主题2背景图  
- `bg3.jpg` - 主题3背景图
- `vinyl-record.png` - 圆形唱片纹理图

### 音频资源 (放在 `public/audio/`)
- `theme1.mp3` - 主题1音乐
- `theme2.mp3` - 主题2音乐
- `theme3.mp3` - 主题3音乐

## 🛠️ 技术栈

- **构建工具**: Vite
- **前端**: 原生JavaScript + 现代CSS
- **动画**: CSS3 Transform + GPU加速
- **音频**: HTML5 Audio API

## 📱 兼容性

- ✅ Chrome (桌面端/移动端)
- ✅ Firefox (桌面端/移动端)
- ✅ Safari (桌面端/移动端)
- ✅ Edge (桌面端)

## 🚀 部署

推荐部署到以下平台：
- [Vercel](https://vercel.com) (推荐)
- [Netlify](https://netlify.com)
- [GitHub Pages](https://pages.github.com)

## 📝 开发状态

- [x] 项目初始化
- [ ] 基础布局
- [ ] 主题切换功能
- [ ] 音频播放器
- [ ] 移动端优化
- [ ] 部署上线
