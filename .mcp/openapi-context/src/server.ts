import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { OpenApiReader } from './openapi-reader.js';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
try {
  loadEnvFile(path.join(projectRoot, '.env'));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

const reader = new OpenApiReader(
  {
    swaggerUi: process.env.SWAGGER_UI_URL,
    json: process.env.OPENAPI_JSON_URL,
    yaml: process.env.OPENAPI_YAML_URL,
  },
  Number(process.env.OPENAPI_CACHE_TTL_MS ?? 30_000),
  Number(process.env.OPENAPI_REQUEST_TIMEOUT_MS ?? 5_000),
);
const server = new McpServer({
  name: 'life-ai-openapi-context',
  version: '0.1.0',
});
const text = (value: unknown) => ({
  content: [
    {
      type: 'text' as const,
      text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
    },
  ],
});

server.registerTool(
  'openapi_sources',
  {
    description: '返回 Swagger UI、OpenAPI JSON/YAML 地址和接口文档元数据。',
    inputSchema: z.object({}).strict(),
  },
  async () => text(await reader.info()),
);

server.registerTool(
  'openapi_list_operations',
  {
    description:
      '列出后端接口操作，支持路径/摘要关键词、标签和 HTTP 方法筛选。',
    inputSchema: z
      .object({
        query: z
          .string()
          .optional()
          .describe('路径、operationId、摘要、描述或标签关键词'),
        tag: z.string().optional(),
        method: z
          .string()
          .optional()
          .describe('GET、POST、PATCH 等；省略时返回全部'),
      })
      .strict(),
  },
  async (filters) => text(await reader.listOperations(filters)),
);

server.registerTool(
  'openapi_search',
  {
    description: '搜索 OpenAPI 中的接口路径、operationId、摘要、描述和标签。',
    inputSchema: z
      .object({
        query: z.string().min(1),
        maxResults: z.number().int().min(1).max(200).default(50),
      })
      .strict(),
  },
  async ({ query, maxResults }) => text(await reader.search(query, maxResults)),
);

server.registerTool(
  'openapi_operation_context',
  {
    description:
      '获取单个接口的完整前端对接契约，包括参数、请求体、响应、安全要求和引用 schema。',
    inputSchema: z
      .object({
        path: z.string().min(1).describe('OpenAPI 路径，例如 /auth/sign-in'),
        method: z.string().min(1).describe('HTTP 方法，例如 POST'),
      })
      .strict(),
  },
  async ({ path: apiPath, method }) =>
    text(await reader.operationContext(apiPath, method)),
);

server.registerTool(
  'openapi_refresh',
  {
    description: '忽略缓存并强制从 OpenAPI JSON 地址重新读取接口文档。',
    inputSchema: z.object({}).strict(),
  },
  async () => text(await reader.document(true)),
);

await server.connect(new StdioServerTransport());
