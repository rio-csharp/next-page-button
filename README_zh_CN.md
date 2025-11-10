
# 文档导航按钮

[English](./README.md) | 中文

> 在文档底部添加「上一页」和「下一页」按钮，按文档树顺序浏览所有文档。

[![版本](https://img.shields.io/github/v/release/rio-csharp/next-page-button)](https://github.com/rio-csharp/next-page-button/releases)
[![许可证](https://img.shields.io/github/license/rio-csharp/next-page-button)](LICENSE)
[![下载量](https://img.shields.io/github/downloads/rio-csharp/next-page-button/total)](https://github.com/rio-csharp/next-page-button/releases)

##  功能特性

- **顺序导航**：通过上一页/下一页按钮按文档树顺序浏览
- **笔记本隔离**：每个笔记本独立计算页码
- **位置指示**：实时显示当前位置（如：5 / 20）
- **自适应宽度**：按钮容器宽度自动跟随文档内容宽度
- **实时更新**：即时响应文档结构变化
- **智能检测**：自动检测拖拽调整文档顺序
- **主题适配**：完美融入思源笔记界面
- **生产级质量**：全面的错误处理，无内存泄漏
- **零配置**：开箱即用

##  安装

### 从插件市场安装（推荐）

1. 打开思源笔记
2. 进入 `设置`  `集市`  `插件`
3. 搜索 "Next Page Button" 或 "文档导航按钮"
4. 点击下载并启用

### 手动安装

1. 从 [Releases](https://github.com/rio-csharp/next-page-button/releases) 下载 `package.zip`
2. 解压到 `{workspace}/data/plugins/`
3. 重启思源笔记
4. 在 `设置`  `集市`  `已下载` 中启用

##  使用方法

安装后插件自动工作：

1. 打开任意文档
2. 滚动到文档底部
3. 使用导航按钮在文档间移动
4. 页码指示器显示当前在笔记本中的位置

**按钮状态：**
-  **可用**：蓝色按钮可点击
-  **禁用**：灰色按钮表示已是笔记本中的第一篇/最后一篇

**核心特性：**
- 每个笔记本有独立的页码计数
- 拖拽调整文档顺序后，导航自动更新
- 按钮宽度自动适配文档内容宽度（遵循思源的自适应宽度设置）

##  智能更新

导航会在以下情况自动更新：
- 创建或删除文档
- 在文件夹间移动文档
- 重命名文档
- 拖拽调整文档顺序
- 更改自适应宽度设置

##  贡献

欢迎提交 Issue 和 Pull Request！开发环境搭建请参考 [DEVELOPMENT.md](DEVELOPMENT.md)

##  开源协议

[MIT License](LICENSE)
