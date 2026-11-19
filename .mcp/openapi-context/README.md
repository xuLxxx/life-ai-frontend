# Life AI OpenAPI Context MCP

通过本地 Swagger/OpenAPI 文档读取后端接口契约，供前端接口对接使用。服务通过 stdio 运行，不转发前端请求或凭据。

## 数据源

- Swagger UI：`http://127.0.0.1:3000/api`
- OpenAPI JSON：`http://127.0.0.1:3000/api/openapi.json`
- OpenAPI YAML：`http://127.0.0.1:3000/api/openapi.yaml`

复制 `.env.example` 为 `.env` 后可调整地址。默认只访问 JSON 文档；YAML 和 Swagger 地址作为元数据返回。缓存默认 30 秒。

## 工具

- `openapi_sources`：返回已配置文档地址。
- `openapi_list_operations`：列出接口，支持按标签、方法和关键词筛选。
- `openapi_search`：搜索路径、operationId、摘要和描述。
- `openapi_operation_context`：返回单个接口的完整契约，包括参数、请求体、响应、安全要求和引用 schema。
- `openapi_refresh`：强制刷新 OpenAPI 缓存。

## 安装与运行

Node.js 22+：

```powershell
cd .mcp/openapi-context
npm install
npm test
npm run build
```

VS Code 通过 `.vscode/mcp.json` 启动此服务。

## 安全边界

- MCP 工具参数不接受任意 URL，只读取环境变量中配置的数据源。
- 仅允许 `http`、`https` 协议。
- OpenAPI 文档最大 2 MiB，默认请求超时 5 秒。
- 不读取 `.env` 内容，不转发认证头或调用业务接口。
