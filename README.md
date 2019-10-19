<div align=center>

<img src="src/assets/images/test.jpg" style="width:200px;">

</div>

# gulp-wxapp-boilerplate

> 基于 Gulp 构建的微信小程序开发工作流

<div align=center>

**探索微信小程序开发的最佳实践。**

项目开源，持续维护，欢迎[反馈](https://github.com/Observer-L/gulp-wxapp-boilerplate/issues)、 [PR](https://github.com/Observer-L/gulp-wxapp-boilerplate/pulls) 和 Star⭐️！

</div>

## ⚡️ 功能

- [x] 命令行快建模板
- [x] 资源压缩
- [x] px 转换 rpx
- [x] sourcemaps 支持
- [x] less 样式预编译
- [x] Typescript 开发
- [x] eslint 代码检查
- [x] npm 支持
- [ ] 小程序云开发支持
- [ ] 分包处理

## 🔩 项目结构

```
├─cloud_function                   // 云函数目录
├─dist                             // 编译之后的项目文件
│  │  miniprogram_npm              // npm构建第三方包
├─src                              // 开发目录
│  │  app.ts                       // 小程序入口文件
│  │  app.json
│  │  app.less
│  │
│  ├─assets                     	// 静态资源
│     ├─styles                  	// 公共less
│     ├─images                  	// 图片资源
│  ├─components                   // 组件
│  ├─config                       // 配置文档
│  ├─pages                        // 页面
│  ├─utils                        // 工具库
│
├─template                        // 页面模板
├─typing                          // 小程序官方typing库
├─eslintrc.js                     // eslint配置文件
│
├─gulpfile.js                     // 工具配置
├─package.json                    // 项目配置
├─project.config.json             // 小程序配置文件
├─README.md                       // 项目说明
├─tsconfig.json                   // typescript配置
```

## 📋 使用指南

1. 下载模板并安装依赖

```cnpm
git clone https://github.com/Observer-L/gulp-wxapp-boilerplate.git
npm install
```

2. 快速创建页面或组件

```js
gulp create -p mypage           //创建名为mypage的page文件
gulp create -c mycomponent      //创建名为mycomponent的component文件
gulp create -s index -p mypage  //复制pages/index中的文件创建名称为mypage的页面
```

2. npm run dev
