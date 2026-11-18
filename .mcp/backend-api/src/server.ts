import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { BackendReader } from './backend-reader.js';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
loadEnvFile(path.join(projectRoot, '.env'));

const reader = new BackendReader();
const server = new McpServer({
  name: 'life-ai-backend-context',
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
  'backend_priority_docs',
  {
    description:
      '对接后端前必须优先调用：按 README.md、Agent.md/AGENT.md 优先读取后端仓库说明。',
    inputSchema: z.object({}).strict(),
  },
  async () => text(await reader.priorityDocs()),
);

server.registerTool(
  'backend_api_context',
  {
    description:
      '整合优先级文档和后端源码中与接口、路由、控制器、DTO 或业务关键词相关的上下文。',
    inputSchema: z
      .object({
        query: z
          .string()
          .min(1)
          .describe('接口路径、业务名、控制器、方法或 DTO 关键词'),
      })
      .strict(),
  },
  async ({ query }) => text(await reader.relevantApiContext(query)),
);

server.registerTool(
  'backend_search',
  {
    description: '在后端仓库的源码和文档中搜索，自动排除密钥、依赖和构建产物。',
    inputSchema: z
      .object({
        query: z.string().min(1).describe('正则表达式；非法时按普通文本搜索'),
        pathHint: z
          .string()
          .optional()
          .describe('文件路径或名称片段，如 controller、auth、dto'),
        maxResults: z.number().int().min(1).max(100).default(30),
      })
      .strict(),
  },
  async ({ query, pathHint, maxResults }) =>
    text(await reader.search(query, pathHint, maxResults)),
);

server.registerTool(
  'backend_read_file',
  {
    description: '读取后端仓库内指定源码或文档；路径必须相对于仓库根目录。',
    inputSchema: z
      .object({
        path: z.string().min(1).describe('例如 src/auth/auth.controller.ts'),
      })
      .strict(),
  },
  async ({ path }) => text(await reader.read(path)),
);

await server.connect(new StdioServerTransport());
