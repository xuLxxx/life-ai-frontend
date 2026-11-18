# Life AI 前端协作说明

## 后端接口对接

涉及后端接口、请求参数、响应类型、认证、路由或业务字段时：

1. 优先使用 MCP Server `life-ai-backend-context`，不要仅凭前端推测接口。
2. 首先调用 `backend_priority_docs`，先读取 `README.md` 和存在的 `Agent.md` / `AGENT.md`。
3. 使用 `backend_api_context` 或 `backend_search` 查询控制器、路由、服务和 DTO。
4. 必要时通过 `backend_read_file` 阅读匹配源码的完整上下文。
5. MCP 只能读取 `.mcp/backend-api/.env` 中 `BACKEND_ROOT` 指定的后端仓库；不得读取或暴露 `.env`、密钥、token、`node_modules` 或构建产物。
6. 生成前端类型、服务方法和请求实现时，以后端实际源码为准，并注明来源文件。

MCP SDK 参考：<https://modelcontextprotocol.io/llms-full.txt> 及 `@modelcontextprotocol/sdk` 文档。
