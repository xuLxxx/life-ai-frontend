/**
 * 规避 esbuild 常驻服务在 Windows + Node>=22 下的管道死锁。
 *
 * 现象：esbuild 的 JS 客户端启动服务时会追加 `--ping` 参数，服务据此每秒
 * 发送心跳请求。在 Windows 的 Node 22/23 上，心跳包与正常构建包存在竞争，
 * 会偶发管道死锁（表现为 dev 启动卡住、构建挂起）。
 * 处理：通过 NODE_OPTIONS 预加载本文件，hook child_process.spawn，
 * 仅对 esbuild 服务子进程移除 `--ping` 参数。
 * 父进程退出时其 stdin 管道关闭，服务仍会随 EOF 正常退出。
 */
const childProcess = require('node:child_process');

const originalSpawn = childProcess.spawn;

childProcess.spawn = function spawnWithoutEsbuildPing(command, args, options) {
  let patchedArgs = args;
  if (
    Array.isArray(args) &&
    args.some((arg) => String(arg).startsWith('--service='))
  ) {
    patchedArgs = args.filter((arg) => arg !== '--ping');
  }
  return originalSpawn.call(this, command, patchedArgs, options);
};
