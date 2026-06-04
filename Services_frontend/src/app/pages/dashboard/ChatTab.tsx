import {
  CheckCheck,
  MessageCircle,
  Search,
  Send,
  Trash2,
  User,
  X
} from "lucide-react";
import type { KeyboardEvent, RefObject } from "react";
import type { ConversationSummary, DashboardMessage, DashboardProfessional } from "./types";

type ChatTabProps = {
  conversationSearch: string;
  onConversationSearchChange: (value: string) => void;
  loadingConversations: boolean;
  filteredConversations: ConversationSummary[];
  activeChatProfessional: DashboardProfessional | null;
  onCloseConversation: () => void;
  deletingConversationId: string | null;
  onOpenConversation: (
    withUserId: number,
    withUserName?: string,
    withUserPhoto?: string,
    conversationId?: string
  ) => Promise<void>;
  onDeleteConversation: (conversation: ConversationSummary) => Promise<void>;
  conversations: ConversationSummary[];
  loadingMessages: boolean;
  messages: DashboardMessage[];
  onDeleteMessage: (message: DashboardMessage) => Promise<void>;
  deletingMessageId: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  chatMessage: string;
  onChatMessageChange: (value: string) => void;
  onSendMessage: () => Promise<void>;
  sendingMessage: boolean;
};

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function getConversationTime(conversation: ConversationSummary) {
  if (conversation.lastMessage.time) return conversation.lastMessage.time;
  return new Date(conversation.lastMessage.createdAt ?? Date.now()).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function isOwnMessage(message: DashboardMessage) {
  return message.sender === "user";
}

function canDeleteMessage(message: DashboardMessage) {
  return isOwnMessage(message) && /^\d+$/.test(message.id);
}

function Avatar({
  name,
  photo,
  active,
  size = "md"
}: {
  name: string;
  photo?: string;
  active?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-14 w-14 text-base"
  }[size];

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-1 ring-slate-200`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full ${
        active ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
      }`}
      aria-hidden="true"
    >
      {name ? getInitials(name) : <User className="h-4 w-4" />}
    </div>
  );
}

function ConversationLoading() {
  return (
    <div className="space-y-2 p-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex animate-pulse items-center gap-3 rounded-2xl bg-white p-4">
          <div className="h-12 w-12 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded-full bg-slate-200" />
            <div className="h-3 w-4/5 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyInbox({ searching }: { searching: boolean }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <MessageCircle className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {searching ? "Nenhuma conversa encontrada." : "Voce ainda nao possui conversas."}
      </p>
    </div>
  );
}

function ChatMessageRow({
  message,
  activeChat,
  deletingMessageId,
  onDeleteMessage
}: {
  message: DashboardMessage;
  activeChat: DashboardProfessional;
  deletingMessageId: string | null;
  onDeleteMessage: (message: DashboardMessage) => Promise<void>;
}) {
  const ownMessage = isOwnMessage(message);

  return (
    <div className={`group flex items-end gap-2 ${ownMessage ? "justify-end" : "justify-start"}`}>
      {!ownMessage && <Avatar name={activeChat.name} photo={activeChat.photo} size="sm" />}

      {ownMessage && canDeleteMessage(message) && (
        <button
          type="button"
          onClick={() => void onDeleteMessage(message)}
          disabled={deletingMessageId === message.id}
          className="mb-1 rounded-full bg-white p-1.5 text-slate-400 shadow-sm hover:bg-red-50 hover:text-red-600 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
          title="Apagar mensagem"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[68%] ${
          ownMessage
            ? "rounded-br-md bg-primary text-white"
            : "rounded-bl-md border border-slate-100 bg-white text-slate-700"
        }`}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
        <div
          className={`mt-1.5 flex items-center gap-1 text-[11px] ${
            ownMessage ? "justify-end text-blue-100" : "text-slate-400"
          }`}
        >
          <span>{message.time}</span>
          {ownMessage && <CheckCheck className="h-3.5 w-3.5" />}
        </div>
      </div>
    </div>
  );
}

function ChatModal({
  activeChat,
  activeConversation,
  conversations,
  loadingMessages,
  messages,
  deletingMessageId,
  messagesEndRef,
  chatMessage,
  sendingMessage,
  onCloseConversation,
  onDeleteConversation,
  onDeleteMessage,
  onChatMessageChange,
  onSendMessage
}: {
  activeChat: DashboardProfessional;
  activeConversation?: ConversationSummary;
  conversations: ConversationSummary[];
  loadingMessages: boolean;
  messages: DashboardMessage[];
  deletingMessageId: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  chatMessage: string;
  sendingMessage: boolean;
  onCloseConversation: () => void;
  onDeleteConversation: (conversation: ConversationSummary) => Promise<void>;
  onDeleteMessage: (message: DashboardMessage) => Promise<void>;
  onChatMessageChange: (value: string) => void;
  onSendMessage: () => Promise<void>;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void onSendMessage();
  };

  const handleDeleteConversation = () => {
    const currentConversation = conversations.find(
      (conversation) => String(conversation.otherUserId) === activeChat.id
    );
    if (currentConversation) void onDeleteConversation(currentConversation);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onCloseConversation}
    >
      <section
        className="flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[min(84vh,44rem)] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <Avatar name={activeChat.name} photo={activeChat.photo} active size="md" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-slate-900" style={{ fontWeight: 700 }}>
              {activeChat.name}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {activeChat.categoryLabel || "Mensagem direta"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDeleteConversation}
            className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Apagar conversa"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onCloseConversation}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(155deg,#f8fafc_0%,#eef6ff_54%,#effdf8_100%)] px-4 py-5 sm:px-6">
          {loadingMessages ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className={`flex animate-pulse ${item % 2 === 0 ? "justify-end" : "justify-start"}`}
                >
                  <div className="h-14 w-2/3 max-w-sm rounded-2xl bg-white/80" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <Avatar name={activeChat.name} photo={activeChat.photo} active size="lg" />
                <p className="mt-3 text-sm text-slate-600" style={{ fontWeight: 600 }}>
                  {activeChat.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">Nenhuma mensagem ainda.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="sticky top-0 z-10 flex justify-center">
                <span className="rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[11px] text-slate-500 shadow-sm backdrop-blur">
                  Hoje
                </span>
              </div>

              {messages.map((message) => (
                <ChatMessageRow
                  key={message.id}
                  message={message}
                  activeChat={activeChat}
                  deletingMessageId={deletingMessageId}
                  onDeleteMessage={onDeleteMessage}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <footer className="border-t border-slate-200 bg-white p-3 sm:p-4">
          {activeConversation?.unreadCount ? (
            <div className="mb-2 text-center text-[11px] text-slate-400">
              {activeConversation.unreadCount} nova
              {activeConversation.unreadCount === 1 ? "" : "s"} mensagem
              {activeConversation.unreadCount === 1 ? "" : "s"}
            </div>
          ) : null}

          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <textarea
              value={chatMessage}
              onChange={(event) => onChatMessageChange(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={`Mensagem para ${activeChat.name}`}
              disabled={sendingMessage || loadingMessages}
              className="min-h-11 max-h-28 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:opacity-60"
            />

            <button
              type="button"
              onClick={() => void onSendMessage()}
              disabled={sendingMessage || loadingMessages || !chatMessage.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
              title="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export function ChatTab({
  conversationSearch,
  onConversationSearchChange,
  loadingConversations,
  filteredConversations,
  activeChatProfessional,
  onCloseConversation,
  deletingConversationId,
  onOpenConversation,
  onDeleteConversation,
  conversations,
  loadingMessages,
  messages,
  onDeleteMessage,
  deletingMessageId,
  messagesEndRef,
  chatMessage,
  onChatMessageChange,
  onSendMessage,
  sendingMessage
}: ChatTabProps) {
  const activeConversation = conversations.find(
    (conversation) =>
      activeChatProfessional?.conversationId === conversation.conversationId ||
      activeChatProfessional?.id === String(conversation.otherUserId)
  );

  return (
    <>
      <div className="surface-card overflow-hidden border border-slate-200/80 bg-white shadow-[0_24px_64px_-44px_rgba(15,23,42,0.6)]">
        <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg text-slate-900" style={{ fontWeight: 700 }}>
                Mensagens
              </p>
              <p className="text-xs text-slate-500">
                {conversations.length} {conversations.length === 1 ? "conversa" : "conversas"}
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={conversationSearch}
                onChange={(event) => onConversationSearchChange(event.target.value)}
                placeholder="Buscar conversa..."
                className="input-surface w-full rounded-full bg-slate-50 py-2.5 pl-9 pr-3"
              />
            </div>
          </div>
        </div>

        {loadingConversations ? (
          <ConversationLoading />
        ) : filteredConversations.length === 0 ? (
          <EmptyInbox searching={Boolean(conversationSearch.trim())} />
        ) : (
          <div className="grid max-h-[36rem] gap-2 overflow-y-auto bg-slate-50/70 p-3">
            {filteredConversations.map((conversation) => {
              const isActive =
                activeChatProfessional?.conversationId === conversation.conversationId ||
                activeChatProfessional?.id === String(conversation.otherUserId);
              const deletingCurrent = deletingConversationId === conversation.conversationId;

              return (
                <article
                  key={conversation.conversationId}
                  className={`group rounded-2xl border bg-white transition hover:border-primary/25 hover:shadow-sm ${
                    isActive ? "border-primary/30" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 p-3 sm:p-4">
                    <button
                      type="button"
                      onClick={() =>
                        void onOpenConversation(
                          conversation.otherUserId,
                          conversation.otherUserName,
                          conversation.otherUserPhoto ?? "",
                          conversation.conversationId
                        )
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left"
                    >
                      <Avatar
                        name={conversation.otherUserName}
                        photo={conversation.otherUserPhoto}
                        active={isActive}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm text-slate-900" style={{ fontWeight: 700 }}>
                            {conversation.otherUserName}
                          </p>
                          <span className="shrink-0 text-[11px] text-slate-400">
                            {getConversationTime(conversation)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <p
                            className={`min-w-0 flex-1 truncate text-sm ${
                              conversation.unreadCount > 0 ? "text-slate-800" : "text-slate-500"
                            }`}
                            style={{ fontWeight: conversation.unreadCount > 0 ? 600 : 400 }}
                          >
                            {conversation.lastMessage.text}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] text-white">
                              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => void onDeleteConversation(conversation)}
                      disabled={deletingCurrent}
                      className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Apagar conversa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {activeChatProfessional && (
        <ChatModal
          activeChat={activeChatProfessional}
          activeConversation={activeConversation}
          conversations={conversations}
          loadingMessages={loadingMessages}
          messages={messages}
          deletingMessageId={deletingMessageId}
          messagesEndRef={messagesEndRef}
          chatMessage={chatMessage}
          sendingMessage={sendingMessage}
          onCloseConversation={onCloseConversation}
          onDeleteConversation={onDeleteConversation}
          onDeleteMessage={onDeleteMessage}
          onChatMessageChange={onChatMessageChange}
          onSendMessage={onSendMessage}
        />
      )}
    </>
  );
}
