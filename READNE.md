<div align=center>

<img src="src/assets/images/test.jpg" style="width:280px;">

</div>

# gulp-wxapp-boilerplate

> 基于Gulp构建的微信小程序开发工作流

<div align=center>

**探索微信小程序开发的最佳实践。**

项目开源，持续维护，欢迎[反馈](https://github.com/Observer-L/gulp-wxapp-boilerplate/issues)、 [PR](https://github.com/Observer-L/gulp-wxapp-boilerplate/pulls) 和 Star⭐️！

</div>

## ⚡️ 功能

✅ 命令行快建模板文件
✅ 图片压缩
✅ less样式预编译支持
✅ Typescript开发
✅ tslint代码检查
🔲 云函数处理
🔲 npm 依赖包自动打包
🔲 分包处理

## 🔩 项目结构
```
├─dist                             // 编译之后的项目文件
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
│  ├─pages                        // 小程序相关页面
│  ├─utils                        // 工具库
│
├─template                        // 页面模板
├─typing                          // 小程序官方typing库
│
├─gulpfile.js                     // 工具配置
├─package.json                    // 项目配置
├─project.config.json             // 小程序配置文件
├─README.md                       // 项目说明
├─tsconfig.json                   // typescript配置
├─tslint.json                     // tslint代码风格配置
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


