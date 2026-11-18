# Life AI Backend Context MCP

为前端接口开发提供受限的后端代码上下文。服务通过 stdio 运行，通过 `.env` 中的 `BACKEND_ROOT` 指定后端仓库；自动排除 `.env`、密钥、`.git`、`node_modules`、`dist` 等内容。

## 配置

复制 `.env.example` 为 `.env`，并将 `BACKEND_ROOT` 设置为本机后端仓库绝对路径。`.env` 不应提交到版本库。

## 工具

- `backend_priority_docs`：优先读取 README.md、Agent.md/AGENT.md。
- `backend_api_context`：合并优先文档与相关接口源码搜索结果。
- `backend_search`：搜索控制器、路由、服务和 DTO。
- `backend_read_file`：读取仓库内指定文件。

## 安装与运行

Node.js 22+：

```powershell
cd .mcp/backend-api
npm install
npm test
npm run build
```

VS Code 已通过 `.vscode/mcp.json` 使用 `node dist/server.js` 启动。可用 `BACKEND_ROOT` 覆盖默认后端路径。

## 安全边界

- 相对路径强制限制在后端仓库内。
- realpath 检查阻止符号链接逃逸。
- 禁止读取 `.env*`、私钥类文件、依赖目录和构建产物。
- 单文件大小限制为 256 KiB。
- 不执行后端代码，也不转发网络请求或凭据。
