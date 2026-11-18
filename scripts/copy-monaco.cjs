/* eslint-disable */
/**
 * 将 monaco-editor 的 min/vs 静态资源复制到 public/monaco/vs，
 * 使 Monaco 编辑器从本地加载而非 CDN。
 *
 * 项目使用 JSON 与 Markdown 编辑器，只复制必要的静态资源（约 5MB），
 * 跳过 80+ 种未使用语言的定义文件和 ts/css/html worker（约 10MB）。
 */
const fs = require('node:fs');
const path = require('node:path');

const sourceDir = path.resolve(
  __dirname,
  '../node_modules/monaco-editor/min/vs',
);
const targetDir = path.resolve(__dirname, '../public/monaco/vs');

if (!fs.existsSync(sourceDir)) {
  console.warn(
    '[copy-monaco] node_modules/monaco-editor/min/vs 不存在，跳过复制',
  );
  process.exit(0);
}

// --- 白名单配置（适配 monaco-editor 0.56 min/vs 布局）---

// 完整复制的目录（内部所有文件均需要）
const REQUIRED_DIRS = [
  'editor/', // editor.main.js + editor.main.css
  'basic-languages/', // monaco.contribution.js（语言注册入口，语言定义 chunk 懒加载）
];

// assets 目录中仅保留必要 worker 的文件名正则
// editorWebWorkerMain：0.56 新增的 worker 引导入口（editor-*.js 引用）
const REQUIRED_ASSETS = [
  /^(editor|json)\.worker-.*\.js$/,
  /^editorWebWorkerMain-.*\.js$/,
];

// 根级文件白名单（带 hash 后缀的文件用通配匹配）
// 依赖链依据（从 vs/editor/editor.main 出发的 AMD 静态依赖 + 运行时动态加载）：
// - loader.js：AMD loader 入口
// - nls.messages-loader.js：NLS 插件（未配置 availableLanguages 时零开销，
//   语言包已按需化为 nls/lang/<locale>.js，项目用默认英文无需复制）
// - index-*.js / editor-*.js：0.56 新的主 chunk（取代旧 editor.api/_commonjsHelpers）
// - monaco.contribution-*.js：css/html/json/ts 四语言 contribution，
//   editor.main.js 无条件依赖，本身轻量
// - json.worker-/css.worker-/html.worker-/ts.worker-*.js：worker 入口注册模块，
//   editor.main.js 静态依赖（实际 worker 实体在 assets/，非 JSON 语言不加载）
// - jsonMode-*.js：JSON contribution 动态加载的语言核心
// - lspLanguageFeatures-*.js / workers-*.js：jsonMode 的动态依赖
// - main-*.js：jsonMode / lspLanguageFeatures 依赖的共享 chunk
// - editorWorkerHost-*.js / toggleHighContrast-*.js：闭包内的功能 chunk
// 0.56 起不再需要 language/ 目录（JSON contribution 已打包进根目录 chunk）
const REQUIRED_ROOT_FILES = [
  /^loader\.js$/,
  /^nls\.messages-loader\.js$/,
  /^index-.*\.js$/,
  /^editor-.*\.js$/,
  /^editorWorkerHost-.*\.js$/,
  /^toggleHighContrast-.*\.js$/,
  /^monaco\.contribution-.*\.js$/,
  /^(json|css|html|ts)\.worker-.*\.js$/,
  /^jsonMode-.*\.js$/,
  /^lspLanguageFeatures-.*\.js$/,
  /^main-.*\.js$/,
  /^workers-.*\.js$/,
];

// markdown 分词器 chunk 位于 vs 根目录且带 hash 后缀，
// 从 basic-languages/monaco.contribution.js 动态解析其文件名，
// 避免 monaco-editor 升级后 hash 变化导致白名单失配
const EXTRA_ROOT_FILES = [];
const contributionFile = path.join(
  sourceDir,
  'basic-languages/monaco.contribution.js',
);
if (fs.existsSync(contributionFile)) {
  const contribution = fs.readFileSync(contributionFile, 'utf8');
  const match = contribution.match(
    /id:"markdown"[^}]*?a\(\["\.\.\/([A-Za-z0-9_-]+)"/,
  );
  if (match) {
    EXTRA_ROOT_FILES.push(new RegExp(`^${match[1]}\\.js$`));
  } else {
    console.warn(
      '[copy-monaco] 未能在 monaco.contribution.js 中解析到 markdown 语言 chunk，Markdown 编辑器将无语法高亮',
    );
  }
}

// --- 复制逻辑 ---

function isRequired(relativePath) {
  // 1. 完整目录白名单
  if (REQUIRED_DIRS.some((dir) => relativePath.startsWith(dir))) {
    return true;
  }

  // 2. assets 目录：仅保留必要 worker
  if (relativePath.startsWith('assets/')) {
    const fileName = relativePath.slice('assets/'.length);
    return REQUIRED_ASSETS.some((re) => re.test(fileName));
  }

  // 3. 其他子目录（language/、nls/ 等）不匹配下方仅限根级的正则，自然跳过

  // 4. 根级文件白名单
  return (
    REQUIRED_ROOT_FILES.some((re) => re.test(relativePath)) ||
    EXTRA_ROOT_FILES.some((re) => re.test(relativePath))
  );
}

function copyFile(srcPath, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
}

// 清空目标目录后再复制，避免残留旧版本文件
function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function walkDir(src, dest, base = '') {
  let copied = 0;
  let skipped = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const relativePath = base ? `${base}/${entry.name}` : entry.name;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // 先进入目录统计，再决定是否创建
      const result = walkDir(srcPath, destPath, relativePath);
      copied += result.copied;
      skipped += result.skipped;
      // 如果目录为空（没有复制任何文件），删除空目录
      if (fs.existsSync(destPath) && fs.readdirSync(destPath).length === 0) {
        fs.rmdirSync(destPath);
      }
    } else if (isRequired(relativePath)) {
      copyFile(srcPath, destPath);
      copied++;
    } else {
      skipped++;
    }
  }
  return { copied, skipped };
}

rmrf(targetDir);
const { copied, skipped } = walkDir(sourceDir, targetDir);

console.log(
  `[copy-monaco] 已复制 ${copied} 个文件，跳过 ${skipped} 个不需要的文件 → public/monaco/vs`,
);
