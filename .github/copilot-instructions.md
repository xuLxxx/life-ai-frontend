# Life AI 前端协作说明

## 后端接口对接

涉及后端接口、请求参数、响应类型、认证、路由或业务字段时：

1. 优先使用 MCP Server `life-ai-openapi-context` 查询运行中后端的 OpenAPI 契约；Swagger 地址为 `http://127.0.0.1:3000/api`。
2. 先调用 `openapi_sources` 或 `openapi_refresh` 确认文档可用，再使用 `openapi_search` / `openapi_list_operations` 查找接口，最后通过 `openapi_operation_context` 获取完整请求参数、响应和安全要求。
3. 需要后端源码实现、服务逻辑或 DTO 校验细节时，使用 MCP Server `life-ai-backend-context`。
4. 使用后端源码 MCP 时，先调用 `backend_priority_docs`，读取 `README.md` 和存在的 `Agent.md` / `AGENT.md`。
5. 使用 `backend_api_context` 或 `backend_search` 查询控制器、路由、服务和 DTO；必要时通过 `backend_read_file` 阅读匹配源码完整上下文。
6. MCP 只能读取 `.mcp/backend-api/.env` 中 `BACKEND_ROOT` 指定的后端仓库；不得读取或暴露 `.env`、密钥、token、`node_modules` 或构建产物。
7. OpenAPI MCP 只读取预配置的数据源，不接受任意 URL，也不转发认证凭据或调用业务接口。
8. 生成前端类型、服务方法和请求实现时，以 OpenAPI 契约和后端实际源码为准，并注明来源接口或文件。

MCP SDK 参考：<https://modelcontextprotocol.io/llms-full.txt> 及 `@modelcontextprotocol/sdk` 文档。
