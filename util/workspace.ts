import { existsSync, mkdirSync } from 'fs';
import path from 'path';

/** 获取 workspace 根目录（.workspaces/ 在项目根） */
export function getWorkspacesRoot(): string {
  return path.join(process.cwd(), '.workspaces');
}

/** 获取单个 chat 的 workspace 目录 */
export function getChatWorkspaceDir(chatId: string): string {
  return path.join(getWorkspacesRoot(), chatId);
}

/** 获取 workspace 内的文件路径 */
export function getWorkspaceFilePath(chatId: string, filename: string): string {
  return path.join(getChatWorkspaceDir(chatId), filename);
}

/** 确保 workspace 目录存在 */
export function ensureWorkspaceDir(chatId: string): void {
  mkdirSync(getChatWorkspaceDir(chatId), { recursive: true });
}

/** 检查 workspace 内某文件是否存在 */
export function workspaceFileExists(chatId: string, filename: string): boolean {
  return existsSync(getWorkspaceFilePath(chatId, filename));
}
