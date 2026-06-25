import { apiFetch } from "./api";

export type ChatOption = {
  label: string;
  next?: string;
  action?: string;
};

export type CarouselItem = {
  title: string;
  description: string;
  linkUrl: string;
  thumbnailUrl?: string;
};

export type ChatNode = {
  nodeId: string;
  messages: string[];
  responseType: "buttons" | "carousel" | "end";
  options?: ChatOption[];
  carouselItems?: CarouselItem[];
  showHumanHandoff: boolean;
  isEndNode: boolean;
};

export type ChatHistoryEntry = {
  sender: "bot" | "user";
  text: string;
  nodeId?: string;
  timestamp: string;
};

export type ChatSession = {
  sessionId: string;
  userId?: string;
  currentNodeId: string;
  history: ChatHistoryEntry[];
  status: "active" | "handed_off" | "closed";
  createdAt: string;
  updatedAt: string;
};

export type ChatSessionResponse = {
  session: ChatSession;
  node: ChatNode;
  isNew?: boolean;
};

export function fetchChatNode(nodeId: string) {
  return apiFetch<ChatNode>(`/chat/node/${nodeId}`);
}

export function startChatSession(sessionId: string, userId?: string) {
  return apiFetch<ChatSessionResponse>("/chat/session/start", {
    method: "POST",
    body: JSON.stringify({ sessionId, userId }),
  });
}

export function advanceChatSession(
  sessionId: string,
  selectedOption: ChatOption,
) {
  return apiFetch<ChatSessionResponse>(`/chat/session/${sessionId}/advance`, {
    method: "POST",
    body: JSON.stringify({ selectedOption }),
  });
}

export function restartChatSession(sessionId: string) {
  return apiFetch<ChatSessionResponse>(`/chat/session/${sessionId}/restart`, {
    method: "POST",
  });
}

export function handoffChatSession(sessionId: string) {
  return apiFetch<ChatSessionResponse>(`/chat/session/${sessionId}/handoff`, {
    method: "POST",
  });
}

export function updateChatSessionStatus(
  sessionId: string,
  status: ChatSession["status"],
) {
  return apiFetch<ChatSession>(`/chat/session/${sessionId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
