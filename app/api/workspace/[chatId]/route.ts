import { readFile } from 'fs/promises';
import { getWorkspaceFilePath, workspaceFileExists } from '@/util/workspace';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { chatId } = await params;
  const filePath = getWorkspaceFilePath(chatId, 'index.html');

  if (!workspaceFileExists(chatId, 'index.html')) {
    return new Response(
      `<!DOCTYPE html><html><body><p style="font-family:sans-serif;padding:2rem;color:#666">
        尚未生成页面，请在对话中输入需求。
      </p></body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  const content = await readFile(filePath, 'utf-8');
  return new Response(content, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
