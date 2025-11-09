# 开发指南

## 调试日志控制

插件支持调试日志的开关控制，方便开发和发布：

### 开启调试日志（开发模式）

在 `src/index.ts` 的第 5 行，将 `DEBUG` 改为 `true`：

```typescript
private readonly DEBUG = true; // 开发时改为 true
```

这样会输出详细的调试信息，包括：
- 插件加载状态
- 文档列表加载数量
- 文档切换事件
- 按钮插入确认
- 文档查找过程

### 关闭调试日志（发布模式）

发布到插件市场前，将 `DEBUG` 改为 `false`：

```typescript
private readonly DEBUG = false; // 发布时改为 false
```

这样只会保留必要的错误日志，不会在用户的控制台输出过多信息。

## 日志类型

插件使用两种日志方法：

1. **`this.log(...)`** - 调试日志，受 `DEBUG` 开关控制
   - 仅在开发模式下输出
   - 用于跟踪插件运行状态

2. **`this.logError(...)`** - 错误日志，始终输出
   - 不受 `DEBUG` 开关影响
   - 用于记录运行时错误，帮助用户诊断问题

## 开发流程

1. 开发阶段：`DEBUG = true`，查看所有日志
2. 测试阶段：`DEBUG = false`，验证生产环境表现
3. 发布阶段：确保 `DEBUG = false`，提交代码

## 构建命令

```bash
# 开发模式（热重载）
pnpm dev

# 生产构建
pnpm build
```
