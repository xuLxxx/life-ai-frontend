import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { OpenApiReader } from './openapi-reader.js';

const document = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/auth/sign-in': {
      post: {
        operationId: 'signIn',
        summary: '登录',
        tags: ['auth'],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SignInDto' },
            },
          },
        },
        responses: { '200': { description: 'ok' } },
      },
    },
  },
  components: {
    securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } },
    schemas: {
      SignInDto: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string' } },
      },
    },
  },
};

async function withServer(
  run: (sourceUrl: string) => Promise<void>,
): Promise<void> {
  let requestCount = 0;
  const server = createServer((_request, response) => {
    requestCount += 1;
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(document));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No port');
  try {
    await run(`http://127.0.0.1:${address.port}/openapi.json`);
    assert.ok(requestCount > 0);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test('lists, searches and resolves operation schemas', async () => {
  await withServer(async (sourceUrl) => {
    const reader = new OpenApiReader({ json: sourceUrl });
    const operations = await reader.listOperations({
      method: 'POST',
      tag: 'auth',
    });
    assert.equal(operations.length, 1);
    assert.equal(operations[0]?.operationId, 'signIn');
    assert.equal((await reader.search('登录')).length, 1);

    const context = await reader.operationContext('/auth/sign-in', 'post');
    assert.ok(context.referencedSchemas['#/components/schemas/SignInDto']);
    assert.equal((context.api as Record<string, unknown>).method, 'POST');
  });
});

test('rejects unknown operations and unsupported source protocols', async () => {
  await withServer(async (sourceUrl) => {
    const reader = new OpenApiReader({ json: sourceUrl });
    await assert.rejects(reader.operationContext('/missing', 'get'));
  });
  assert.throws(() => new OpenApiReader({ json: 'file:///tmp/openapi.json' }));
});
