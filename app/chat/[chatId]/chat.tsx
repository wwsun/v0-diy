'use client';

import { invalidateRouterCache } from '@/app/actions';
import {
  builderBriefSchema,
  type AppType,
  type BuilderBrief,
} from '@/util/builder-schema';
import type {
  AgentSdk,
  ArtifactVersion,
  ChatMode,
  MyUIMessage,
} from '@/util/chat-schema';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Bot, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ArtifactCard from './artifact-card';
import ChatInput from './chat-input';
import Message from './message';
import PreviewPanel from './preview-panel';

export default function ChatComponent({
  chatData,
  isNewChat = false,
  resume = false,
}: {
  chatData: {
    id: string;
    messages: MyUIMessage[];
    mode: ChatMode;
    agentSdk: AgentSdk;
    builderContext: {
      appType: AppType;
      brief: BuilderBrief;
    };
    artifacts: {
      activeArtifactId: string | null;
      versions: ArtifactVersion[];
    };
  };
  isNewChat?: boolean;
  resume?: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ChatMode>(chatData.mode);
  const [agentSdk, setAgentSdk] = useState<AgentSdk>(chatData.agentSdk);
  const [appType, setAppType] = useState<AppType>(
    chatData.builderContext.appType,
  );
  const [brief, setBrief] = useState<BuilderBrief>(chatData.builderContext.brief);
  const [artifacts, setArtifacts] = useState(chatData.artifacts);
  const [isActivatingArtifact, setIsActivatingArtifact] = useState(false);
  const [isUpdatingBuilderContext, setIsUpdatingBuilderContext] = useState(false);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);

  const refreshArtifacts = async () => {
    try {
      const response = await fetch(`/api/chat/${chatData.id}`);
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        ok: boolean;
        chat: {
          artifacts: typeof artifacts;
          builderContext: {
            appType: AppType;
            brief: BuilderBrief;
          };
          mode: ChatMode;
          agentSdk: AgentSdk;
        };
      };

      if (!data.ok) {
        return;
      }

      setArtifacts(data.chat.artifacts);
      setAppType(data.chat.builderContext.appType);
      setBrief(data.chat.builderContext.brief);
      setMode(data.chat.mode);
      setAgentSdk(data.chat.agentSdk);
      setIsUpdatingBuilderContext(false);
    } catch (error) {
      console.error(error);
    }
  };

  const { status, sendMessage, messages, regenerate } = useChat({
    id: chatData.id,
    messages: chatData.messages,
    resume,
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ id, messages, trigger, messageId }) => {
        switch (trigger) {
          case 'regenerate-message':
            // omit messages data transfer, only send the messageId:
            return {
              body: {
                trigger: 'regenerate-message',
                id,
                messageId,
                mode,
                agentSdk,
                builderContext: {
                  appType,
                  brief,
                },
              },
            };

          case 'submit-message':
            // only send the last message to the server to limit the request size:
            return {
              body: {
                trigger: 'submit-message',
                id,
                message: messages[messages.length - 1],
                messageId,
                mode,
                agentSdk,
                builderContext: {
                  appType,
                  brief,
                },
              },
            };
        }
      },
    }),
    onFinish(options) {
      console.log('onFinish', options);

      void refreshArtifacts();

      // for new chats, the router cache needs to be invalidated so
      // navigation to the previous page triggers SSR correctly
      if (isNewChat) {
        invalidateRouterCache();
      }

      // focus the input field again after the response is finished
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    },
  });

  // activate the input field
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, status]);

  useEffect(() => {
    setMode(chatData.mode);
    setAgentSdk(chatData.agentSdk);
    setAppType(chatData.builderContext.appType);
    setBrief(chatData.builderContext.brief);
    setArtifacts(chatData.artifacts);
    setIsUpdatingBuilderContext(false);
    setIsUpdatingMode(false);
  }, [chatData]);

  const activeArtifact =
    artifacts.versions.find(
      artifact => artifact.id === artifacts.activeArtifactId,
    ) ?? null;

  const persistAgentConfig = async ({
    nextMode,
    nextAgentSdk,
  }: {
    nextMode?: ChatMode;
    nextAgentSdk?: AgentSdk;
  }) => {
    const targetMode = nextMode ?? mode;
    const targetAgentSdk = nextAgentSdk ?? agentSdk;

    if (
      (targetMode === mode && targetAgentSdk === agentSdk) ||
      status !== 'ready' ||
      isUpdatingMode
    ) {
      return;
    }

    const previousMode = mode;
    const previousAgentSdk = agentSdk;

    setIsUpdatingMode(true);

    try {
      const response = await fetch(`/api/chat/${chatData.id}/agent-config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: targetMode,
          agentSdk: targetAgentSdk,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update agent config');
      }

      setMode(targetMode);
      setAgentSdk(targetAgentSdk);
    } catch (error) {
      console.error(error);
      setMode(previousMode);
      setAgentSdk(previousAgentSdk);
      window.alert('Failed to switch agent settings. Please try again.');
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const persistMode = async (nextMode: ChatMode) => {
    await persistAgentConfig({ nextMode });
  };

  const persistSdk = async (nextAgentSdk: AgentSdk) => {
    await persistAgentConfig({ nextAgentSdk });
  };

  const persistBuilderContext = async ({
    nextAppType,
    nextBrief,
  }: {
    nextAppType?: AppType;
    nextBrief?: Partial<BuilderBrief>;
  }) => {
    if (status !== 'ready' || isUpdatingBuilderContext || isUpdatingMode) {
      return;
    }

    const targetAppType = nextAppType ?? appType;
    const targetBrief = builderBriefSchema.parse({
      ...brief,
      ...(nextBrief ?? {}),
    });

    const previousAppType = appType;
    const previousBrief = brief;

    setAppType(targetAppType);
    setBrief(targetBrief);
    setIsUpdatingBuilderContext(true);

    try {
      const response = await fetch(`/api/chat/${chatData.id}/agent-config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          builderContext: {
            appType: targetAppType,
            brief: targetBrief,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to persist builder context');
      }
    } catch (error) {
      console.error(error);
      setAppType(previousAppType);
      setBrief(previousBrief);
      window.alert('Failed to update builder config. Please try again.');
    } finally {
      setIsUpdatingBuilderContext(false);
    }
  };

  const activateArtifact = async (artifactId: string) => {
    if (isActivatingArtifact) {
      return;
    }

    setIsActivatingArtifact(true);

    try {
      const response = await fetch(
        `/api/chat/${chatData.id}/artifact/${artifactId}`,
        {
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to activate artifact');
      }

      setArtifacts(previous => ({
        ...previous,
        activeArtifactId: artifactId,
      }));
    } catch (error) {
      console.error(error);
      window.alert('Failed to activate artifact. Please try again.');
    } finally {
      setIsActivatingArtifact(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 bg-white">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Bot className="size-4 text-slate-500" />
              Conversation
            </h2>
            <p className="text-[11px] text-slate-500">Chat ID: {chatData.id}</p>
            <p className="text-[11px] text-slate-500">
              Mode: {mode === 'agent' ? `Agent · ${agentSdk}` : 'Chat'}
            </p>
            <p className="text-[11px] text-slate-500">
              Context:{' '}
              {appType === 'marketing-campaign'
                ? 'Marketing Campaign'
                : 'Report App'}
            </p>
          </div>
          {(status === 'streaming' || status === 'submitted') && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              <Loader2 className="size-3.5 animate-spin" />
              Generating...
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 py-2">
          {messages.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              Start by typing a message below.
            </div>
          ) : (
            messages.map(message => (
              <Message
                key={message.id}
                message={message}
                regenerate={regenerate}
                sendMessage={sendMessage}
                status={status}
              />
            ))
          )}

          {artifacts.versions.length > 0 && (
            <div className="space-y-2 border-t border-dashed border-slate-200 pt-2">
              <p className="text-xs font-medium text-slate-500">Artifacts</p>
              {artifacts.versions
                .slice()
                .reverse()
                .map(artifact => (
                  <ArtifactCard
                    key={artifact.id}
                    artifact={artifact}
                    isActive={artifact.id === artifacts.activeArtifactId}
                    onActivate={activateArtifact}
                    disabled={isActivatingArtifact}
                  />
                ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-2 py-2">
          <ChatInput
            status={status}
            stop={() => {
              fetch(`/api/chat/${chatData.id}/stream`, {
                method: 'DELETE',
              });
            }}
            onSubmit={text => {
              sendMessage({ text, metadata: { createdAt: Date.now() } });

              if (isNewChat) {
                window.history.pushState(null, '', `/chat/${chatData.id}`);
              }
            }}
            inputRef={inputRef}
            mode={mode}
            onModeChange={persistMode}
            agentSdk={agentSdk}
            onAgentSdkChange={persistSdk}
            appType={appType}
            onAppTypeChange={nextAppType => {
              void persistBuilderContext({ nextAppType });
            }}
            brief={brief}
            onBriefChange={nextBrief => {
              void persistBuilderContext({ nextBrief });
            }}
            modeDisabled={isUpdatingMode || isUpdatingBuilderContext}
          />
        </div>
      </div>

      <PreviewPanel artifact={activeArtifact} />
    </div>
  );
}
