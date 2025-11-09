# 发布到思源插件市场检查清单

## ✅ 必需文件

- [x] **plugin.json** - 插件配置文件
  - [x] name, version, author
  - [x] displayName (中英文)
  - [x] description (中英文)
  - [x] url (GitHub 仓库地址)
  - [x] keywords
  - [x] minAppVersion
  - [x] readme 引用
  
- [x] **README.md** - 英文说明文档
  - [x] 功能介绍
  - [x] 安装方法
  - [x] 使用说明
  - [x] 截图/预览
  
- [x] **README_zh_CN.md** - 中文说明文档
  - [x] 功能介绍
  - [x] 安装方法
  - [x] 使用说明
  - [x] 截图/预览
  
- [x] **CHANGELOG.md** - 更新日志
  - [x] v0.1.0 版本说明
  
- [x] **icon.png** - 插件图标
  - 尺寸：160x160 px
  - 格式：PNG
  - 位置：根目录
  
- [x] **preview.png** - 预览图
  - 尺寸：1200x675 px (16:9)
  - 格式：PNG
  - 位置：根目录
  
- [x] **LICENSE** - 开源协议
  - MIT License

## 📝 代码准备

- [x] **src/index.ts**
  - [x] DEBUG = false（生产模式）
  - [x] 无编译错误
  - [x] 类型定义完整
  - [x] 代码注释清晰
  
- [ ] **构建生产版本**
  ```bash
  pnpm run build
  ```
  
- [ ] **测试插件功能**
  - [ ] 文档导航正常
  - [ ] 页码显示正确
  - [ ] 禁用状态正确
  - [ ] 主题适配良好
  - [ ] 无控制台错误

## 🚀 GitHub 准备

- [ ] **创建 GitHub 仓库**
  - 仓库名：next-page-button
  - 描述：SiYuan plugin for document navigation
  - 公开仓库
  
- [ ] **推送代码**
  ```bash
  git add .
  git commit -m "feat: initial release v0.1.0"
  git push origin main
  ```
  
- [ ] **创建 Release**
  1. 进入 GitHub 仓库
  2. 点击 "Releases" → "Create a new release"
  3. Tag version: `v0.1.0`
  4. Release title: `v0.1.0 - Initial Release`
  5. 描述：复制 CHANGELOG.md 中的内容
  6. 上传 `package.zip`（从 dist/ 目录）
  7. 发布

## 📤 提交到插件市场

### 方法 1：通过 GitHub（推荐）

1. Fork 官方插件市场仓库
   - https://github.com/siyuan-note/bazaar

2. 在 `plugins.json` 中添加你的插件信息：
   ```json
   {
     "name": "next-page-button",
     "author": "rio",
     "url": "https://github.com/rio/next-page-button",
     "version": "0.1.0",
     "minAppVersion": "3.0.0",
     "displayName": {
       "zh_CN": "文档导航按钮",
       "en_US": "Next Page Button"
     },
     "description": {
       "zh_CN": "在每个文档底部添加上一页和下一页按钮，按照文档树顺序浏览所有文档",
       "en_US": "Add previous and next page buttons at the bottom of each document to browse all documents in tree order"
     },
     "readme": {
       "zh_CN": "README_zh_CN.md",
       "en_US": "README.md"
     },
     "funding": {
       "custom": [
         "https://github.com/sponsors/rio"
       ]
     }
   }
   ```

3. 提交 Pull Request
   - 标题：`Add plugin: next-page-button v0.1.0`
   - 描述：简要说明插件功能

4. 等待审核通过

### 方法 2：社区发帖

1. 在思源社区发帖介绍插件
2. 提供 GitHub 链接和下载链接
3. 等待管理员添加到市场

## 🎯 发布后

- [ ] **在社区发布公告**
  - 思源笔记社区
  - GitHub Discussions
  
- [ ] **收集用户反馈**
  - 关注 GitHub Issues
  - 在社区回复问题
  
- [ ] **持续维护**
  - 修复 bug
  - 添加新功能
  - 更新文档

## 📋 版本更新流程

当需要发布新版本时：

1. 更新 `plugin.json` 中的 version
2. 更新 `CHANGELOG.md` 添加新版本说明
3. 更新代码并测试
4. 构建：`pnpm run build`
5. 提交代码并打 tag
6. 创建新的 GitHub Release
7. 更新插件市场的 `plugins.json`

## 🔍 常见问题

### Q: 插件审核需要多长时间？
A: 通常 1-3 个工作日，具体取决于审核人员的时间

### Q: 如何更新插件？
A: 发布新的 GitHub Release，然后更新 bazaar 仓库的 plugins.json

### Q: 可以修改已发布的插件吗？
A: 可以，但建议通过版本更新的方式，而不是直接修改旧版本

### Q: 图标和预览图必须提供吗？
A: 是的，这是插件市场的要求，有助于用户了解插件功能

## 📞 获取帮助

- 思源社区：https://ld246.com
- GitHub Discussions：https://github.com/siyuan-note/siyuan/discussions
- 官方文档：https://docs.siyuan-note.com/
