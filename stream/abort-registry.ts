/**
 * 进程内 AbortController 注册表。
 * 用于在 DELETE 取消请求时主动中断正在运行的 Claude Agent SDK query()。
 */
const controllers = new Map<string, AbortController>();

/** 注册并返回一个新的 AbortController，旧的（如有）会先被 abort */
export function registerAbort(chatId: string): AbortController {
  abortIfRunning(chatId);
  const controller = new AbortController();
  controllers.set(chatId, controller);
  return controller;
}

/** 如果存在运行中的 controller 则 abort 并移除 */
export function abortIfRunning(chatId: string): void {
  const existing = controllers.get(chatId);
  if (existing) {
    existing.abort();
    controllers.delete(chatId);
  }
}

/** 流正常结束后清理注册 */
export function unregisterAbort(chatId: string): void {
  controllers.delete(chatId);
}
