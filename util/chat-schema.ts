import { UIDataTypes, UIMessage } from 'ai';
import { z } from 'zod';

export const myMessageMetadataSchema = z.object({
  createdAt: z.number(),
});

export type MyMessageMetadata = z.infer<typeof myMessageMetadataSchema>;

export type MyUIMessage = UIMessage<MyMessageMetadata, UIDataTypes>;

/** Agent 生成的工作区页面元数据 */
export type WorkspacePagesMeta = {
  /** 当前活跃快照 ID，null 表示尚未生成 */
  activeSnapshotId: string | null;
};

export type ChatData = {
  id: string;
  messages: MyUIMessage[];
  /** sdkSessionId 用于 Claude Agent SDK 会话断点续传 */
  sdkSessionId?: string;
  workspacePages: WorkspacePagesMeta;
  createdAt: number;
  activeStreamId: string | null;
  canceledAt: number | null;
};
