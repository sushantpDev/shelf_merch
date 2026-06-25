import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "@tanstack/react-router";
import { isAuthenticated, getStoredUser } from "@/services/auth-store";
import { runChatAction } from "@/services/api-bridge";
import {
  advanceChatSession,
  fetchChatNode,
  handoffChatSession,
  restartChatSession,
  startChatSession,
  type ChatHistoryEntry,
  type ChatNode,
  type ChatOption,
  type ChatSession,
} from "@/services/chat-api";

const SESSION_STORAGE_KEY = "sm_chat_session_id";
const CHAT_FLOW_VERSION = "7";
const CHAT_FLOW_VERSION_KEY = "sm_chat_flow_version";
const BRAND = "#1B4332";
const CREAM = "#EDECEA";
const BODY_BG = "#F4F4F2";
const SURFACE = "#FFFFFF";
const INK = "#1B1B1B";
const LABEL_MUTED = "#8A8A86";
const TIME_MUTED = "#ABABA7";
const HEADER_SUBTITLE = "#B7CCBF";
const LINK_COLOR = "#2D6A4F";
const AVATAR_HEADER_BG = "#2D6A4F";
const ICON_MUTED = "#8A8A86";

const BOT_BUBBLE_STYLE: CSSProperties = {
  backgroundColor: SURFACE,
  border: "0.5px solid rgba(27,67,50,0.12)",
  borderRadius: "14px",
  borderTopLeftRadius: "4px",
  padding: "10px 14px",
  maxWidth: "85%",
  marginLeft: "26px",
  fontSize: "14px",
  lineHeight: 1.5,
  color: INK,
};

function ensureChatFlowFresh() {
  if (localStorage.getItem(CHAT_FLOW_VERSION_KEY) !== CHAT_FLOW_VERSION) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.setItem(CHAT_FLOW_VERSION_KEY, CHAT_FLOW_VERSION);
  }
}

function getOrCreateSessionId(): string {
  ensureChatFlowFresh();
  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(SESSION_STORAGE_KEY, id);
  return id;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 60_000) return "Just now";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function linkifyText(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline"
        style={{ color: LINK_COLOR }}
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

type HistoryTurn =
  | { kind: "bot"; messages: ChatHistoryEntry[] }
  | { kind: "user"; message: ChatHistoryEntry };

function groupHistory(history: ChatHistoryEntry[]): HistoryTurn[] {
  const turns: HistoryTurn[] = [];
  let botBatch: ChatHistoryEntry[] = [];
  let batchNodeId: string | null | undefined = null;

  const flushBot = () => {
    if (botBatch.length) {
      turns.push({ kind: "bot", messages: [...botBatch] });
      botBatch = [];
      batchNodeId = null;
    }
  };

  for (const entry of history) {
    if (entry.sender === "bot") {
      if (batchNodeId !== null && entry.nodeId !== batchNodeId) {
        flushBot();
      }
      batchNodeId = entry.nodeId ?? null;
      botBatch.push(entry);
    } else {
      flushBot();
      turns.push({ kind: "user", message: entry });
    }
  }
  flushBot();
  return turns;
}

function BotTurnAvatar() {
  return (
    <div
      className="shrink-0 rounded-full"
      style={{ width: 20, height: 20, backgroundColor: BRAND }}
      aria-hidden
    />
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function typingPauseMs(text: string) {
  return Math.min(1500, Math.max(450, text.length * 14));
}

async function runTypewriter(
  text: string,
  onUpdate: (value: string) => void,
  token: number,
  activeToken: () => number,
) {
  const chunk = text.length > 140 ? 4 : text.length > 70 ? 2 : 1;
  const stepMs = text.length > 140 ? 10 : 16;
  for (let i = 0; i <= text.length; i += chunk) {
    if (token !== activeToken()) return;
    onUpdate(text.slice(0, Math.min(i, text.length)));
    await delay(stepMs);
  }
  onUpdate(text);
}

function turnsToDisplay(targetTurns: HistoryTurn[]): DisplayTurn[] {
  return targetTurns.map((turn) =>
    turn.kind === "bot"
      ? { kind: "bot", messages: turn.messages }
      : { kind: "user", message: turn.message },
  );
}

function sameBotTurn(a: DisplayTurn | undefined, nodeId: string | null | undefined) {
  return a?.kind === "bot" && a.messages[0]?.nodeId === nodeId;
}

function upsertActiveBotTurn(
  prev: DisplayTurn[],
  nodeId: string | null | undefined,
  botTurn: DisplayBotTurn,
): DisplayTurn[] {
  const next = [...prev];
  if (sameBotTurn(next[next.length - 1], nodeId)) {
    next[next.length - 1] = botTurn;
    return next;
  }
  next.push(botTurn);
  return next;
}

type DisplayBotTurn = {
  kind: "bot";
  messages: ChatHistoryEntry[];
  typingIndex?: number;
  typingText?: string;
};

type DisplayTurn = DisplayBotTurn | { kind: "user"; message: ChatHistoryEntry };

function BotTurn({
  messages,
  typingIndex,
  typingText,
  animate,
}: {
  messages: ChatHistoryEntry[];
  typingIndex?: number;
  typingText?: string;
  animate?: boolean;
}) {
  const completedMessages =
    typingIndex !== undefined ? messages.slice(0, typingIndex) : messages;
  const activeTyping = typingIndex !== undefined && typingText !== undefined;
  const last = messages[messages.length - 1];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center" style={{ gap: 6 }}>
        <BotTurnAvatar />
        <span style={{ fontSize: 12, fontWeight: 500, color: LABEL_MUTED }}>
          ShelfMerch Bot
        </span>
      </div>
      <div className="flex flex-col" style={{ gap: 6 }}>
        {completedMessages.map((msg, i) => (
          <div
            key={`${msg.timestamp}-${i}`}
            className={animate ? "sm-chat-bubble-in" : undefined}
            style={BOT_BUBBLE_STYLE}
          >
            {linkifyText(msg.text)}
          </div>
        ))}
        {activeTyping && (
          <div className="sm-chat-bubble-in" style={BOT_BUBBLE_STYLE}>
            {linkifyText(typingText)}
            {typingText.length < (messages[typingIndex!]?.text.length ?? 0) && (
              <span className="sm-chat-caret" style={{ marginLeft: 1, color: LABEL_MUTED }}>
                |
              </span>
            )}
          </div>
        )}
      </div>
      {!activeTyping && last && (
        <p style={{ fontSize: 11, color: TIME_MUTED, marginLeft: 26, marginTop: 2 }}>
          {formatTime(last.timestamp)}
        </p>
      )}
    </div>
  );
}

function UserTurn({ message, animate }: { message: ChatHistoryEntry; animate?: boolean }) {
  return (
    <div className={`flex justify-end${animate ? " sm-chat-bubble-in" : ""}`}>
      <div
        style={{
          backgroundColor: BRAND,
          color: CREAM,
          borderRadius: "14px",
          borderTopRightRadius: "4px",
          padding: "8px 14px",
          maxWidth: "75%",
          fontSize: "14px",
          lineHeight: 1.4,
        }}
      >
        {message.text}
      </div>
    </div>
  );
}

function TypingTurn() {
  return (
    <div className="flex flex-col gap-1 sm-chat-bubble-in">
      <div className="flex items-center" style={{ gap: 6 }}>
        <BotTurnAvatar />
        <span style={{ fontSize: 12, fontWeight: 500, color: LABEL_MUTED }}>
          ShelfMerch Bot
        </span>
      </div>
      <div
        className="inline-flex items-center"
        style={{
          ...BOT_BUBBLE_STYLE,
          gap: 5,
          width: "fit-content",
          padding: "12px 16px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="sm-chat-typing-dot inline-block rounded-full"
            style={{
              width: 7,
              height: 7,
              backgroundColor: LABEL_MUTED,
              animationDelay: `${i * 160}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ActionPill({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
      style={{
        backgroundColor: BRAND,
        color: CREAM,
        border: `1.5px solid ${BRAND}`,
        borderRadius: 999,
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

function OptionPill({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="transition-colors duration-150 disabled:opacity-50"
      style={{
        backgroundColor: SURFACE,
        border: `1.5px solid ${BRAND}`,
        color: BRAND,
        borderRadius: 999,
        padding: "7px 14px",
        fontSize: 13,
        fontWeight: 500,
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.backgroundColor = BRAND;
        e.currentTarget.style.color = CREAM;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = SURFACE;
        e.currentTarget.style.color = BRAND;
      }}
    >
      {label}
    </button>
  );
}

function TurnOptions({
  node,
  loading,
  onAction,
  onOption,
}: {
  node: ChatNode;
  loading: boolean;
  onAction: (action: string, label: string, next?: string) => void;
  onOption: (option: ChatOption) => void;
}) {
  const showCarousel = node.responseType === "carousel" && node.carouselItems?.length;

  return (
    <div className="flex flex-col items-start" style={{ gap: 8, marginLeft: 26, maxWidth: "85%" }}>
      {showCarousel && node.carouselItems && (
        <div className="mb-1 w-full">
          <CarouselCards items={node.carouselItems} />
        </div>
      )}
      <div className="flex flex-col items-end self-end" style={{ gap: 8, width: "100%" }}>
        {node.options?.map((option) =>
          option.action ? (
            <ActionPill
              key={`action-${option.action}-${option.label}`}
              label={option.label}
              disabled={loading}
              onClick={() => onAction(option.action!, option.label, option.next)}
            />
          ) : option.next ? (
            <OptionPill
              key={`${option.label}-${option.next}`}
              label={option.label}
              disabled={loading}
              onClick={() => onOption(option)}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}

function CarouselCards({
  items,
}: {
  items: NonNullable<ChatNode["carouselItems"]>;
}) {
  return (
    <div
      className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ marginLeft: 26, maxWidth: "85%" }}
    >
      {items.map((item) => (
        <div
          key={item.title}
          className="min-w-[200px] max-w-[200px] shrink-0 rounded-xl p-3"
          style={{
            backgroundColor: SURFACE,
            border: "0.5px solid rgba(27,67,50,0.12)",
          }}
        >
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt=""
              className="mb-2 h-20 w-full rounded-lg object-cover"
            />
          ) : (
            <div
              className="mb-2 flex h-20 items-center justify-center rounded-lg text-[10px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: BRAND, color: CREAM }}
            >
              Guide
            </div>
          )}
          <p className="text-[13px] font-semibold leading-snug" style={{ color: INK }}>
            {item.title}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed" style={{ color: LABEL_MUTED }}>
            {item.description}
          </p>
          <a
            href={item.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block w-full rounded-lg py-2 text-center text-[12px] font-semibold no-underline"
            style={{ backgroundColor: BRAND, color: CREAM }}
          >
            View article
          </a>
        </div>
      ))}
    </div>
  );
}

export function ChatWidget() {
  const location = useLocation();
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [currentNode, setCurrentNode] = useState<ChatNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayTurns, setDisplayTurns] = useState<DisplayTurn[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [revealComplete, setRevealComplete] = useState(false);
  const [optionsEnabled, setOptionsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const revealTokenRef = useRef(0);
  const revealFromRef = useRef(0);
  const animateNewTurnsRef = useRef(true);

  const isPublicRoute =
    location.pathname.startsWith("/redeem/") ||
    location.pathname.startsWith("/shop/") ||
    location.pathname.startsWith("/accept-invite");
  const [fullscreenFlow, setFullscreenFlow] = useState(false);

  useEffect(() => {
    const onViewChange = (e: Event) => {
      const detail = (e as CustomEvent<{ fullscreenFlow?: boolean }>).detail;
      setFullscreenFlow(!!detail?.fullscreenFlow);
    };
    window.addEventListener("sm:view-change", onViewChange);
    return () => window.removeEventListener("sm:view-change", onViewChange);
  }, []);

  useEffect(() => {
    const sync = () => setAuthed(isAuthenticated());
    window.addEventListener("sm:auth-change", sync);
    const timers = [250, 750, 2000].map((ms) => window.setTimeout(sync, ms));
    return () => {
      window.removeEventListener("sm:auth-change", sync);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, [location.pathname]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, displayTurns, isBotTyping, loading, scrollToBottom]);

  const turns = useMemo(
    () => groupHistory(session?.history ?? []),
    [session?.history],
  );

  const revealTurns = useCallback(
    async (targetTurns: HistoryTurn[], fromIndex: number, token: number) => {
      for (let i = fromIndex; i < targetTurns.length; i += 1) {
        if (token !== revealTokenRef.current) return;
        const turn = targetTurns[i];

        if (turn.kind === "user") {
          setDisplayTurns((prev) => {
            const last = prev[prev.length - 1];
            if (
              last?.kind === "user" &&
              last.message.text === turn.message.text &&
              last.message.nodeId === turn.message.nodeId
            ) {
              return prev;
            }
            return [...prev, { kind: "user", message: turn.message }];
          });
          await delay(160);
          continue;
        }

        setIsBotTyping(true);
        const combined = turn.messages.map((m) => m.text).join(" ");
        await delay(typingPauseMs(combined));
        if (token !== revealTokenRef.current) return;
        setIsBotTyping(false);

        for (let m = 0; m < turn.messages.length; m += 1) {
          if (token !== revealTokenRef.current) return;
          const nodeId = turn.messages[0]?.nodeId;
          setDisplayTurns((prev) =>
            upsertActiveBotTurn(prev, nodeId, {
              kind: "bot",
              messages: turn.messages,
              typingIndex: m,
              typingText: "",
            }),
          );

          await runTypewriter(
            turn.messages[m].text,
            (typingText) => {
              if (token !== revealTokenRef.current) return;
              setDisplayTurns((prev) => {
                const last = prev[prev.length - 1];
                if (!sameBotTurn(last, nodeId)) return prev;
                return upsertActiveBotTurn(prev, nodeId, {
                  kind: "bot",
                  messages: turn.messages,
                  typingIndex: m,
                  typingText,
                });
              });
            },
            token,
            () => revealTokenRef.current,
          );

          if (token !== revealTokenRef.current) return;
          setDisplayTurns((prev) => {
            const last = prev[prev.length - 1];
            if (!sameBotTurn(last, nodeId)) return prev;
            return upsertActiveBotTurn(prev, nodeId, {
              kind: "bot",
              messages: turn.messages.slice(0, m + 1),
            });
          });
          if (m < turn.messages.length - 1) await delay(280);
        }
      }

      if (token === revealTokenRef.current) {
        revealFromRef.current = targetTurns.length;
        setRevealComplete(true);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open || initializing || !session) return;

    const from = revealFromRef.current;
    if (turns.length <= from) {
      if (from > 0 || turns.length > 0) setRevealComplete(true);
      setIsBotTyping(false);
      return;
    }

    if (!animateNewTurnsRef.current) {
      setDisplayTurns(turnsToDisplay(turns));
      revealFromRef.current = turns.length;
      setRevealComplete(true);
      setIsBotTyping(false);
      return;
    }

    setRevealComplete(false);
    const token = revealTokenRef.current;
    void revealTurns(turns, from, token);
  }, [open, initializing, session, turns, revealTurns]);

  useEffect(() => {
    if (!open) return;
    if (initializing || !session) {
      setIsBotTyping(true);
      setRevealComplete(false);
    }
  }, [open, initializing, session]);

  useEffect(() => {
    if (!open || !session?.currentNodeId) return;
    fetchChatNode(session.currentNodeId)
      .then(setCurrentNode)
      .catch(() => {});
  }, [open, session?.currentNodeId]);

  const initSession = useCallback(async () => {
    setInitializing(true);
    setError(null);
    try {
      const sessionId = getOrCreateSessionId();
      const userId = getStoredUser()?.id;
      const result = await startChatSession(sessionId, userId);
      setSession(result.session);
      setCurrentNode(result.node);
      const grouped = groupHistory(result.session.history);
      if (result.isNew) {
        animateNewTurnsRef.current = true;
        revealFromRef.current = 0;
        setDisplayTurns([]);
        setRevealComplete(false);
      } else {
        animateNewTurnsRef.current = false;
        revealFromRef.current = grouped.length;
        setDisplayTurns(turnsToDisplay(grouped));
        setRevealComplete(true);
        setIsBotTyping(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start chat");
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (open && !session && !initializing) {
      void initSession();
    }
  }, [open, session, initializing, initSession]);

  const showUserChoiceImmediately = useCallback((entry: ChatHistoryEntry) => {
    revealTokenRef.current += 1;
    setDisplayTurns((prev) => {
      const last = prev[prev.length - 1];
      if (last?.kind === "user" && last.message.text === entry.text) return prev;
      return [...prev, { kind: "user", message: entry }];
    });
    revealFromRef.current += 1;
  }, []);

  const rollbackUserChoice = useCallback(() => {
    setDisplayTurns((prev) => {
      const last = prev[prev.length - 1];
      if (last?.kind !== "user") return prev;
      return prev.slice(0, -1);
    });
    revealFromRef.current = Math.max(0, revealFromRef.current - 1);
  }, []);

  const handleActionClick = async (action: string, label: string, next?: string) => {
    if (loading || !session || !optionsEnabled) return;

    const userEntry: ChatHistoryEntry = {
      sender: "user",
      text: label,
      nodeId: session.currentNodeId,
      timestamp: new Date().toISOString(),
    };

    if (next) {
      animateNewTurnsRef.current = true;
      setOptionsEnabled(false);
      setRevealComplete(false);
      showUserChoiceImmediately(userEntry);
      setLoading(true);
      setError(null);
      try {
        const result = await advanceChatSession(session.sessionId, { label, next });
        setSession(result.session);
        setCurrentNode(result.node);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        rollbackUserChoice();
        setLoading(false);
        return;
      }
      setLoading(false);
    } else {
      showUserChoiceImmediately(userEntry);
    }

    const ran = runChatAction(action);
    if (!ran) {
      window.setTimeout(() => runChatAction(action), 100);
    }
    setOpen(false);
  };

  const handleOptionClick = async (option: ChatOption) => {
    if (!session || loading || !option.next || !optionsEnabled) return;

    animateNewTurnsRef.current = true;
    setOptionsEnabled(false);
    setRevealComplete(false);
    showUserChoiceImmediately({
      sender: "user",
      text: option.label,
      nodeId: session.currentNodeId,
      timestamp: new Date().toISOString(),
    });
    setLoading(true);
    setError(null);

    try {
      const result = await advanceChatSession(session.sessionId, option);
      setSession(result.session);
      setCurrentNode(result.node);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      rollbackUserChoice();
    } finally {
      setLoading(false);
    }
  };

  const handleHandoff = async () => {
    if (!session || loading) return;
    setRevealComplete(false);
    animateNewTurnsRef.current = true;
    setOptionsEnabled(false);
    setLoading(true);
    setError(null);

    showUserChoiceImmediately({
      sender: "user",
      text: "Talk to our team",
      nodeId: session.currentNodeId,
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await handoffChatSession(session.sessionId);
      setSession(result.session);
      setCurrentNode(result.node);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      rollbackUserChoice();
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!session || loading) return;
    revealTokenRef.current += 1;
    animateNewTurnsRef.current = true;
    setRevealComplete(false);
    setOptionsEnabled(false);
    revealFromRef.current = 0;
    setDisplayTurns([]);
    setLoading(true);
    setError(null);
    try {
      const result = await restartChatSession(session.sessionId);
      setSession(result.session);
      setCurrentNode(result.node);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restart");
    } finally {
      setLoading(false);
    }
  };

  const lastEntry = session?.history.at(-1);
  const activeBotTurn =
    Boolean(currentNode) &&
    revealComplete &&
    !isBotTyping &&
    !loading &&
    (currentNode?.options?.length ?? 0) > 0 &&
    lastEntry?.sender === "bot" &&
    lastEntry?.nodeId === currentNode?.nodeId;

  const showEndActions =
    currentNode &&
    revealComplete &&
    !isBotTyping &&
    (currentNode.responseType === "end" || currentNode.isEndNode);

  const hasActiveTypewriter = displayTurns.some(
    (t) => t.kind === "bot" && t.typingIndex !== undefined,
  );
  const showTypingIndicator =
    (initializing || isBotTyping || loading) && !hasActiveTypewriter;

  useEffect(() => {
    if (!open || !activeBotTurn) {
      setOptionsEnabled(false);
      return;
    }
    setOptionsEnabled(false);
    const timer = window.setTimeout(() => setOptionsEnabled(true), 450);
    return () => window.clearTimeout(timer);
  }, [open, activeBotTurn, currentNode?.nodeId]);

  const openChat = useCallback(() => {
    setOptionsEnabled(false);
    setOpen(true);
  }, []);

  const widget = (
    <div
      className="sm-chat-widget"
      style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
    >
      <style>{`
        @keyframes sm-chat-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sm-chat-typing {
          0%, 70%, 100% { transform: translateY(0); opacity: 0.35; }
          35% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes sm-chat-caret {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        @keyframes sm-chat-panel-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sm-chat-bubble-in {
          animation: sm-chat-fade-in 0.32s ease-out both;
        }
        .sm-chat-typing-dot {
          animation: sm-chat-typing 1.1s ease-in-out infinite;
        }
        .sm-chat-caret {
          animation: sm-chat-caret 0.85s step-end infinite;
        }
        .sm-chat-panel-in {
          animation: sm-chat-panel-in 0.28s ease-out both;
        }
      `}</style>
      {!open && (
        <button
          type="button"
          onClick={openChat}
          aria-label="Open support chat"
          className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.18)] transition-transform hover:scale-105"
          style={{ backgroundColor: SURFACE, color: BRAND }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
            <path
              fillRule="evenodd"
              d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.135 3.348 4.022v6.852c0 1.887-1.37 3.73-3.348 4.022a48.52 48.52 0 01-3.228.719 18.01 18.01 0 01-4.772 2.74 1.5 1.5 0 01-1.572-.001 18.01 18.01 0 01-4.772-2.74 48.52 48.52 0 01-3.228-.719c-1.978-.292-3.348-2.135-3.348-4.022V6.771c0-1.887 1.37-3.73 3.348-4.022z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {open && (
        <div
          className="sm-chat-panel-in fixed bottom-0 right-0 z-[9999] flex w-[calc(100%-24px)] max-h-[600px] flex-col overflow-hidden sm:bottom-6 sm:right-6 sm:w-[360px]"
          style={{
            backgroundColor: SURFACE,
            borderRadius: 16,
            boxShadow: "0 24px 60px -18px rgba(14,30,22,0.32)",
          }}
        >
          {/* Header */}
          <header
            className="flex shrink-0 items-start"
            style={{
              backgroundColor: BRAND,
              padding: "14px 16px",
              gap: 10,
            }}
          >
            <div
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{
                width: 36,
                height: 36,
                backgroundColor: AVATAR_HEADER_BG,
                color: CREAM,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              SM
            </div>
            <div className="min-w-0 flex-1">
              <p style={{ color: CREAM, fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>
                ShelfMerch
              </p>
              <p style={{ color: HEADER_SUBTITLE, fontSize: 12, marginTop: 2, lineHeight: 1.3 }}>
                Corporate gifting &amp; swag, simplified.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                color: HEADER_SUBTITLE,
                fontSize: 18,
                lineHeight: 1,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                marginTop: 2,
              }}
            >
              ×
            </button>
          </header>

          {/* Message body */}
          <div
            className="min-h-0 flex-1 overflow-y-auto"
            style={{
              backgroundColor: BODY_BG,
              padding: 16,
              minHeight: 320,
            }}
          >
            <div className="flex flex-col" style={{ gap: 12 }}>
              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700 sm-chat-bubble-in">
                  {error}
                </p>
              )}

              {displayTurns.map((turn, i) => {
                const isActive =
                  activeBotTurn && i === displayTurns.length - 1 && turn.kind === "bot";
                return (
                  <div key={turn.kind === "bot" ? `bot-${i}` : `user-${i}`}>
                    {turn.kind === "bot" ? (
                      <BotTurn
                        messages={turn.messages}
                        typingIndex={turn.typingIndex}
                        typingText={turn.typingText}
                        animate={turn.typingIndex === undefined}
                      />
                    ) : (
                      <UserTurn message={turn.message} animate />
                    )}
                    {isActive && currentNode && (
                      <TurnOptions
                        node={currentNode}
                        loading={loading || !optionsEnabled}
                        onAction={handleActionClick}
                        onOption={handleOptionClick}
                      />
                    )}
                  </div>
                );
              })}

              {showTypingIndicator && <TypingTurn />}

              {showEndActions && (
                <div
                  className="flex flex-col items-end"
                  style={{
                    gap: 8,
                    marginTop: 4,
                    maxWidth: "85%",
                    marginLeft: "auto",
                  }}
                >
                  <OptionPill
                    label="Restart conversation"
                    disabled={loading}
                    onClick={handleRestart}
                  />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Footer input bar */}
          <div
            className="flex shrink-0 items-center"
            style={{
              backgroundColor: SURFACE,
              borderTop: "0.5px solid rgba(27,67,50,0.1)",
              padding: "10px 14px",
              gap: 8,
            }}
          >
            <button
              type="button"
              aria-label="Attach file"
              style={{
                color: ICON_MUTED,
                fontSize: 18,
                background: "none",
                border: "none",
                cursor: "default",
                padding: 0,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="h-[18px] w-[18px]"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                />
              </svg>
            </button>
            <input
              type="text"
              readOnly
              placeholder="Type a message"
              className="min-w-0 flex-1 outline-none"
              style={{
                border: "1px solid rgba(27,67,50,0.2)",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 13,
                color: INK,
                backgroundColor: SURFACE,
              }}
            />
          </div>

          {/* Bottom link bar */}
          <div
            className="shrink-0 text-center"
            style={{
              backgroundColor: SURFACE,
              borderTop: "0.5px solid rgba(27,67,50,0.06)",
              padding: "8px 14px",
            }}
          >
            {currentNode?.showHumanHandoff ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleHandoff}
                className="disabled:opacity-50"
                style={{
                  fontSize: 12,
                  color: LINK_COLOR,
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  padding: 0,
                }}
              >
                Talk to our team
              </button>
            ) : (
              <span style={{ fontSize: 12, color: LINK_COLOR, textDecoration: "underline" }}>
                Talk to our team
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (!authed || isPublicRoute || fullscreenFlow) return null;

  return createPortal(widget, document.body);
}
