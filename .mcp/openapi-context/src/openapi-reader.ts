const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace',
]);
const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;

type JsonObject = Record<string, unknown>;

export type OpenApiSource = {
  swaggerUi: string;
  json: string;
  yaml: string;
};

export type OperationSummary = {
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags: string[];
  security: unknown;
};

type Cache = { expiresAt: number; document: JsonObject };

function asObject(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function operationEntries(document: JsonObject): Array<{
  path: string;
  pathItem: JsonObject;
  method: string;
  operation: JsonObject;
}> {
  const entries: Array<{
    path: string;
    pathItem: JsonObject;
    method: string;
    operation: JsonObject;
  }> = [];
  for (const [apiPath, rawPathItem] of Object.entries(
    asObject(document.paths),
  )) {
    const pathItem = asObject(rawPathItem);
    for (const [method, rawOperation] of Object.entries(pathItem)) {
      if (HTTP_METHODS.has(method.toLowerCase())) {
        entries.push({
          path: apiPath,
          pathItem,
          method: method.toUpperCase(),
          operation: asObject(rawOperation),
        });
      }
    }
  }
  return entries;
}

function normalizeSecurity(value: unknown): unknown {
  return value === undefined ? null : value;
}

export class OpenApiReader {
  readonly source: OpenApiSource;
  private readonly cacheTtlMs: number;
  private readonly timeoutMs: number;
  private cache?: Cache;

  constructor(
    source?: Partial<OpenApiSource>,
    cacheTtlMs = 30_000,
    timeoutMs = 5_000,
  ) {
    this.source = {
      swaggerUi: source?.swaggerUi ?? 'http://127.0.0.1:3000/api',
      json: source?.json ?? 'http://127.0.0.1:3000/api/openapi.json',
      yaml: source?.yaml ?? 'http://127.0.0.1:3000/api/openapi.yaml',
    };
    for (const url of Object.values(this.source)) {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`OpenAPI 数据源不支持 ${parsed.protocol} 协议`);
      }
    }
    this.cacheTtlMs = Math.max(cacheTtlMs, 0);
    this.timeoutMs = Math.max(timeoutMs, 1);
  }

  async document(force = false): Promise<JsonObject> {
    const now = Date.now();
    if (!force && this.cache && this.cache.expiresAt > now) {
      return this.cache.document;
    }

    const response = await fetch(this.source.json, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`读取 OpenAPI JSON 失败：HTTP ${response.status}`);
    }
    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') > MAX_DOCUMENT_BYTES) {
      throw new Error('OpenAPI 文档超过 2 MiB 限制');
    }
    const parsed: unknown = JSON.parse(text);
    const document = asObject(parsed);
    if (!asString(document.openapi) || !document.paths) {
      throw new Error('返回内容不是有效的 OpenAPI 3 文档');
    }
    this.cache = {
      document,
      expiresAt: now + this.cacheTtlMs,
    };
    return document;
  }

  async listOperations(
    filters: {
      query?: string;
      tag?: string;
      method?: string;
    } = {},
  ): Promise<OperationSummary[]> {
    const document = await this.document();
    const query = filters.query?.toLocaleLowerCase();
    const tag = filters.tag?.toLocaleLowerCase();
    const method = filters.method?.toUpperCase();
    return operationEntries(document)
      .filter(({ path, operation, method: httpMethod }) => {
        const tags = stringArray(operation.tags);
        const haystack = [
          path,
          asString(operation.operationId),
          asString(operation.summary),
          asString(operation.description),
          ...tags,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase();
        return (
          (!query || haystack.includes(query)) &&
          (!tag || tags.some((item) => item.toLocaleLowerCase() === tag)) &&
          (!method || method === 'ALL' || httpMethod === method)
        );
      })
      .map(({ path, operation, method: httpMethod }) => ({
        method: httpMethod,
        path,
        operationId: asString(operation.operationId),
        summary: asString(operation.summary),
        description: asString(operation.description),
        tags: stringArray(operation.tags),
        security: normalizeSecurity(operation.security ?? document.security),
      }));
  }

  async search(query: string, maxResults = 50) {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) throw new Error('搜索词不能为空');
    return (await this.listOperations({ query: normalized })).slice(
      0,
      Math.min(Math.max(maxResults, 1), 200),
    );
  }

  async operationContext(apiPath: string, requestedMethod: string) {
    const document = await this.document();
    const method = requestedMethod.toLowerCase();
    if (!HTTP_METHODS.has(method)) throw new Error('HTTP 方法无效');
    const pathItem = asObject(asObject(document.paths)[apiPath]);
    const operation = asObject(pathItem[method]);
    if (!Object.keys(operation).length) {
      throw new Error(
        `未找到接口：${requestedMethod.toUpperCase()} ${apiPath}`,
      );
    }

    const refs = this.collectReferences(operation, document);
    return {
      source: this.source,
      api: {
        method: method.toUpperCase(),
        path: apiPath,
        operationId: operation.operationId,
        summary: operation.summary,
        description: operation.description,
        tags: operation.tags,
        parameters: [
          ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
          ...(Array.isArray(operation.parameters) ? operation.parameters : []),
        ],
        requestBody: operation.requestBody,
        responses: operation.responses,
        security: operation.security ?? document.security ?? [],
      },
      securitySchemes: asObject(asObject(document.components).securitySchemes),
      referencedSchemas: refs,
    };
  }

  async info() {
    const document = await this.document();
    return {
      source: this.source,
      info: document.info,
      openapi: document.openapi,
      tags: document.tags,
      operationCount: operationEntries(document).length,
    };
  }

  private collectReferences(operation: JsonObject, document: JsonObject) {
    const schemas: Record<string, unknown> = {};
    const pending = this.findRefs(operation);
    const visited = new Set<string>();
    while (pending.length) {
      const reference = pending.shift();
      if (!reference) continue;
      if (visited.has(reference) || !reference.startsWith('#/components/')) {
        continue;
      }
      visited.add(reference);
      const value = this.resolveLocalRef(document, reference);
      if (value === undefined) continue;
      schemas[reference] = value;
      pending.push(...this.findRefs(value));
    }
    return schemas;
  }

  private findRefs(value: unknown): string[] {
    const refs: string[] = [];
    const visit = (node: unknown) => {
      if (Array.isArray(node)) {
        node.forEach(visit);
      } else if (node !== null && typeof node === 'object') {
        for (const [key, child] of Object.entries(node)) {
          if (key === '$ref' && typeof child === 'string') refs.push(child);
          else visit(child);
        }
      }
    };
    visit(value);
    return refs;
  }

  private resolveLocalRef(document: JsonObject, reference: string): unknown {
    return reference
      .slice(2)
      .split('/')
      .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
      .reduce<unknown>((value, part) => asObject(value)[part], document);
  }
}
