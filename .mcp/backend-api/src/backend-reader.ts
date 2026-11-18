import { lstat, readdir, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

const MAX_FILE_BYTES = 256 * 1024;
const MAX_SCAN_RESULTS = 100;
const BLOCKED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
  'supabase/.temp',
]);
const BLOCKED_NAMES =
  /(^|[\\/])(?:\.env(?:\.|$)|.*\.(?:pem|key|p12|pfx|keystore|jks)$)/i;
const ALLOWED_EXTENSIONS = new Set([
  '.ts',
  '.js',
  '.json',
  '.md',
  '.yaml',
  '.yml',
  '.graphql',
  '.gql',
  '.txt',
]);

export type SearchHit = { path: string; line: number; text: string };

function isInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== '..' &&
      !path.isAbsolute(relative))
  );
}

function isBlocked(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  if (BLOCKED_NAMES.test(normalized)) return true;
  return normalized
    .split('/')
    .some(
      (part, index, parts) =>
        BLOCKED_DIRECTORIES.has(part) ||
        BLOCKED_DIRECTORIES.has(parts.slice(0, index + 1).join('/')),
    );
}

export class BackendReader {
  readonly root: string;
  private realRootPromise: Promise<string>;

  constructor(root = process.env.BACKEND_ROOT) {
    if (!root) throw new Error('环境变量 BACKEND_ROOT 未定义');
    this.root = path.resolve(root);
    this.realRootPromise = realpath(this.root);
  }

  async resolveSafe(
    relativePath: string,
  ): Promise<{
    absolute: string;
    relative: string;
    stat: Awaited<ReturnType<typeof lstat>>;
  }> {
    if (path.isAbsolute(relativePath))
      throw new Error('文件路径必须相对于后端仓库根目录');
    const realRoot = await this.realRootPromise;
    const absolute = path.resolve(this.root, relativePath);
    const relative = path.relative(this.root, absolute);
    if (!isInside(this.root, absolute) || isBlocked(relative))
      throw new Error('拒绝访问仓库外部、依赖、构建产物或敏感文件');
    const stat = await lstat(absolute);
    if (!stat.isFile()) throw new Error('目标不是普通文件');
    const resolved = await realpath(absolute);
    if (!isInside(realRoot, resolved))
      throw new Error('拒绝通过符号链接访问仓库外部');
    if (stat.size > MAX_FILE_BYTES)
      throw new Error(`文件超过 ${MAX_FILE_BYTES} 字节限制`);
    return { absolute: resolved, relative: relative.replace(/\\/g, '/'), stat };
  }

  async read(relativePath: string): Promise<{ path: string; content: string }> {
    const target = await this.resolveSafe(relativePath);
    const extension = path.extname(target.absolute).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension))
      throw new Error('不支持读取该文件类型');
    return {
      path: target.relative,
      content: await readFile(target.absolute, 'utf8'),
    };
  }

  async priorityDocs(
    maxBytes = 64 * 1024,
  ): Promise<Array<{ path: string; content: string }>> {
    const files = await this.walkFiles();
    const names = new Map<string, number>([
      ['readme.md', 0],
      ['agent.md', 0],
      ['agents.md', 1],
      ['contributing.md', 2],
    ]);
    files.sort((a, b) => {
      const nameRank = (file: string) =>
        names.get(path.basename(file).toLowerCase()) ?? 99;
      const depth = (file: string) => file.split('/').length;
      return (
        nameRank(a) - nameRank(b) || depth(a) - depth(b) || a.localeCompare(b)
      );
    });
    const selected = files.filter((file) =>
      names.has(path.basename(file).toLowerCase()),
    );
    const docs: Array<{ path: string; content: string }> = [];
    for (const file of selected) {
      const item = await this.read(file);
      docs.push({ path: item.path, content: item.content.slice(0, maxBytes) });
      if (
        docs.reduce((sum, doc) => sum + doc.content.length, 0) >=
        maxBytes * 2
      )
        break;
    }
    return docs;
  }

  async search(
    query: string,
    requestedGlob?: string,
    maxResults = 30,
  ): Promise<SearchHit[]> {
    if (!query.trim()) throw new Error('搜索词不能为空');
    const limit = Math.min(Math.max(maxResults, 1), MAX_SCAN_RESULTS);
    let matcher: RegExp;
    try {
      matcher = new RegExp(query, 'i');
    } catch {
      matcher = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    const files = await this.walkFiles();
    const glob = requestedGlob?.toLowerCase();
    const results: SearchHit[] = [];
    for (const file of files) {
      if (
        glob &&
        !(
          file.toLowerCase().includes(glob) ||
          path.basename(file).toLowerCase().includes(glob)
        )
      )
        continue;
      if (
        !['.ts', '.js', '.md', '.json', '.yaml', '.yml'].includes(
          path.extname(file).toLowerCase(),
        )
      )
        continue;
      const { content } = await this.read(file);
      for (const [index, line] of content.split(/\r?\n/).entries()) {
        if (matcher.test(line))
          results.push({
            path: file,
            line: index + 1,
            text: line.slice(0, 500),
          });
        matcher.lastIndex = 0;
        if (results.length >= limit) return results;
      }
    }
    return results;
  }

  async relevantApiContext(query: string): Promise<string> {
    const docs = await this.priorityDocs();
    const hits = await this.search(query, undefined, 60);
    const grouped = hits.reduce<Record<string, SearchHit[]>>((all, hit) => {
      if (!all[hit.path]) all[hit.path] = [];
      all[hit.path].push(hit);
      return all;
    }, {});
    const sections = Object.entries(grouped).map(
      ([file, fileHits]) =>
        `### ${file}\n${fileHits
          .map((hit) => `${hit.line}: ${hit.text}`)
          .join('\n')}`,
    );
    return [
      '# API integration context',
      ...docs.map((doc) => `## Priority document: ${doc.path}\n${doc.content}`),
      `## Backend search: ${query}`,
      sections.length
        ? sections.join('\n\n')
        : 'No matching backend code found.',
    ].join('\n\n');
  }

  private async walkFiles(): Promise<string[]> {
    const found: string[] = [];
    const visit = async (directory: string): Promise<void> => {
      const entries = await readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        const absolute = path.join(directory, entry.name);
        const relative = path.relative(this.root, absolute).replace(/\\/g, '/');
        if (isBlocked(relative)) continue;
        if (entry.isSymbolicLink()) continue;
        if (entry.isDirectory()) await visit(absolute);
        else if (
          entry.isFile() &&
          ALLOWED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
        )
          found.push(relative);
      }
    };
    await visit(this.root);
    return found;
  }
}
