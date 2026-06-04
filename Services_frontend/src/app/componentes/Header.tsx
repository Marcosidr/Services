import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  Bell,
  BellRing,
  CheckCheck,
  ClipboardList,
  User,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Menu,
  MessageCircle,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAuthorizationHeader } from "../utils/auth";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/profissionais", label: "Profissionais" },
  { to: "/contato", label: "Contato" },
];

type NotificationItem = {
  id: string;
  type?: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

function parsePositiveInteger(value: unknown) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function getChatTargetFromNotification(notification: NotificationItem) {
  if (notification.type !== "message") return null;
  if (!notification.metadata || typeof notification.metadata !== "object") return null;

  const senderId = (notification.metadata as Record<string, unknown>).senderId;
  return parsePositiveInteger(senderId);
}

function getOrderTargetFromNotification(notification: NotificationItem) {
  if (!notification.metadata || typeof notification.metadata !== "object") return null;

  const metadata = notification.metadata as Record<string, unknown>;
  if (metadata.target !== "orders") return null;
  if (typeof metadata.orderId !== "string") return null;
  const orderId = metadata.orderId.trim();
  return orderId || null;
}

function extractSenderName(notificationMessage: string) {
  const suffix = " enviou uma mensagem";
  if (!notificationMessage.endsWith(suffix)) return "";

  return notificationMessage.slice(0, -suffix.length).trim();
}

function getNotificationIcon(type?: string) {
  if (type === "message") return MessageCircle;
  if (type === "order") return ClipboardList;
  return BellRing;
}

function getNotificationTone(type?: string) {
  if (type === "message") {
    return "bg-primary/10 text-primary ring-primary/10";
  }

  if (type === "order") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-secondary/10 text-secondary ring-secondary/10";
}

function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, userPhoto, logout, refreshUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [clearingNotifications, setClearingNotifications] = useState(false);
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setNotificationMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }

      if (notificationMenuRef.current && !notificationMenuRef.current.contains(target)) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function loadNotifications(limit = 20) {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadNotifications(0);
      return;
    }

    try {
      setLoadingNotifications(true);

      const response = await fetch(`/api/notifications?limit=${limit}`, {
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) return;

      const data = (await response.json()) as {
        items?: NotificationItem[];
        unreadCount?: number;
      };

      setNotifications(Array.isArray(data.items) ? data.items : []);
      setUnreadNotifications(
        typeof data.unreadCount === "number" && data.unreadCount > 0 ? data.unreadCount : 0
      );
    } catch {
      // Mantem estado anterior em caso de erro de rede.
    } finally {
      setLoadingNotifications(false);
    }
  }

  async function markNotificationAsRead(notificationId: string) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) return;

      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
      );
      setUnreadNotifications((prev) => Math.max(prev - 1, 0));
    } catch {
      // Ignora falha pontual.
    }
  }

  async function markAllNotificationsAsRead() {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) return;

      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadNotifications(0);
    } catch {
      // Ignora falha pontual.
    }
  }

  async function deleteNotification(notification: NotificationItem) {
    if (deletingNotificationId) return;

    try {
      setDeletingNotificationId(notification.id);

      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "DELETE",
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) return;

      setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
      if (!notification.isRead) {
        setUnreadNotifications((prev) => Math.max(prev - 1, 0));
      }
    } catch {
      // Ignora falha pontual.
    } finally {
      setDeletingNotificationId(null);
    }
  }

  async function clearAllNotifications() {
    if (clearingNotifications) return;

    try {
      setClearingNotifications(true);
      const response = await fetch("/api/notifications/clear", {
        method: "DELETE",
        headers: {
          ...getAuthorizationHeader()
        }
      });

      if (!response.ok) {
        // Fallback para backends antigos sem endpoint /clear.
        const listResponse = await fetch("/api/notifications?limit=100", {
          headers: {
            ...getAuthorizationHeader()
          }
        });

        if (!listResponse.ok) return;

        const data = (await listResponse.json()) as { items?: NotificationItem[] };
        const items = Array.isArray(data.items) ? data.items : [];
        if (items.length === 0) {
          setNotifications([]);
          setUnreadNotifications(0);
          return;
        }

        await Promise.all(
          items.map((item) =>
            fetch(`/api/notifications/${item.id}`, {
              method: "DELETE",
              headers: {
                ...getAuthorizationHeader()
              }
            })
          )
        );
      }

      await loadNotifications(100);
    } catch {
      // Ignora falha pontual.
    } finally {
      setClearingNotifications(false);
    }
  }

  useEffect(() => {
    const syncFromApi = async () => {
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadNotifications(0);
        return;
      }

      try {
        await refreshUser();
      } catch {
        // Mantem o estado local quando houver falha de rede.
      }
      await loadNotifications();
    };

    void syncFromApi();
  }, [isAuthenticated, pathname, refreshUser]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    setNotifications([]);
    setUnreadNotifications(0);
    setUserMenuOpen(false);
    setNotificationMenuOpen(false);
    setDeletingNotificationId(null);
  };

  return (
    <header className="sticky top-0 z-50" translate="no">
      <div className="border-b border-white/65 bg-white/70 shadow-[0_12px_30px_-26px_rgba(15,23,42,0.95)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/55">
        <div className="section-container">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link to="/" className="inline-flex items-center gap-2.5 shrink-0">
              <span className="animate-pulse-glow flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/95 to-secondary text-white shadow-[0_10px_24px_-16px_rgba(29,78,216,0.9)]">
                <MapPin className="w-4 h-4" />
              </span>

              <span
                className="text-gradient-brand tracking-tight"
                style={{ fontWeight: 800, fontSize: "1.15rem" }}
              >
                Zentry
              </span>
            </Link>

            <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/70 px-1.5 py-1 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-xl px-3.5 py-2 text-sm whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-white shadow-[0_12px_24px_-16px_rgba(29,78,216,0.95)]"
                        : "text-slate-600 hover:bg-primary/10 hover:text-primary"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticated ? (
                <>
                  <div className="relative" ref={notificationMenuRef}>
                    <button
                      onClick={() => {
                        setNotificationMenuOpen((open) => !open);
                        setUserMenuOpen(false);
                      }}
                      className="relative rounded-xl border border-transparent p-2 text-slate-500 hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
                      aria-label="Notificações"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadNotifications > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-[10px] text-gray-900 flex items-center justify-center">
                          {unreadNotifications > 9 ? "9+" : unreadNotifications}
                        </span>
                      )}
                    </button>

                    {notificationMenuOpen && (
                      <div className="fixed left-3 right-3 top-[4.75rem] z-50 max-h-[calc(100vh-6rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl md:absolute md:left-auto md:right-0 md:top-full md:mt-3 md:w-[26rem] md:max-h-[34rem]">
                        <div className="border-b border-slate-100 bg-white px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-base text-slate-900" style={{ fontWeight: 700 }}>
                                  Avisos
                                </p>
                                {unreadNotifications > 0 && (
                                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-slate-900">
                                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {notifications.length === 1
                                  ? "1 atualização recente"
                                  : `${notifications.length} atualizações recentes`}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setNotificationMenuOpen(false)}
                              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:hidden"
                              title="Fechar notificações"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {(unreadNotifications > 0 || notifications.length > 0) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {unreadNotifications > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    void markAllNotificationsAsRead();
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/15"
                                >
                                  <CheckCheck className="h-3.5 w-3.5" />
                                  Marcar lidas
                                </button>
                              )}
                              {notifications.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    void clearAllNotifications();
                                  }}
                                  disabled={clearingNotifications}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs text-red-600 hover:bg-red-100 disabled:opacity-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  {clearingNotifications ? "Limpando..." : "Limpar"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="max-h-[calc(100vh-15rem)] overflow-y-auto bg-white md:max-h-[25rem]">
                          {loadingNotifications ? (
                            <div className="space-y-2 p-3">
                              {[1, 2, 3].map((item) => (
                                <div key={item} className="flex animate-pulse gap-3 rounded-2xl bg-slate-50 p-3">
                                  <div className="h-10 w-10 rounded-full bg-slate-200" />
                                  <div className="flex-1 space-y-2">
                                    <div className="h-3 w-2/3 rounded-full bg-slate-200" />
                                    <div className="h-3 w-full rounded-full bg-slate-100" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 shadow-sm">
                                <Bell className="h-5 w-5" />
                              </div>
                              <p className="mt-3 text-sm text-slate-500">
                                Nenhuma notificação no momento.
                              </p>
                            </div>
                          ) : (
                            <div className="divide-y divide-slate-100">
                              {notifications.map((notification) => {
                                const NotificationIcon = getNotificationIcon(notification.type);

                                return (
                                  <div
                                    key={notification.id}
                                    className={`relative flex w-full items-start gap-3 px-4 py-3 transition hover:bg-slate-50 ${
                                      notification.isRead
                                        ? "bg-white"
                                        : "bg-primary/[0.04]"
                                    }`}
                                  >
                                    {!notification.isRead && (
                                      <span className="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-accent" />
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!notification.isRead) {
                                          void markNotificationAsRead(notification.id);
                                        }

                                        const orderTargetId = getOrderTargetFromNotification(notification);
                                        if (orderTargetId) {
                                          const query = new URLSearchParams({
                                            tab: "pedidos",
                                            orderId: orderTargetId
                                          });
                                          navigate(`/painel?${query.toString()}`);
                                          setNotificationMenuOpen(false);
                                          return;
                                        }

                                        const chatTargetId = getChatTargetFromNotification(notification);
                                        if (chatTargetId) {
                                          const query = new URLSearchParams({
                                            chatWith: String(chatTargetId)
                                          });

                                          const senderName = extractSenderName(notification.message);
                                          if (senderName) {
                                            query.set("chatName", senderName);
                                          }

                                          navigate(`/painel?${query.toString()}`);
                                          setNotificationMenuOpen(false);
                                        }
                                      }}
                                      className="flex min-w-0 flex-1 gap-3 text-left"
                                    >
                                      <span
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${getNotificationTone(
                                          notification.type
                                        )}`}
                                      >
                                        <NotificationIcon className="h-5 w-5" />
                                      </span>

                                      <span className="min-w-0 flex-1">
                                        <span className="flex items-start justify-between gap-3">
                                          <span className="min-w-0 flex-1 truncate text-sm text-slate-900" style={{ fontWeight: 700 }}>
                                            {notification.title}
                                          </span>
                                          <span className="shrink-0 text-[11px] text-slate-500">
                                            {new Date(notification.createdAt).toLocaleString("pt-BR", {
                                              day: "2-digit",
                                              month: "2-digit"
                                            })}
                                          </span>
                                        </span>
                                        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-slate-600">
                                          {notification.message}
                                        </span>
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        void deleteNotification(notification);
                                      }}
                                      disabled={deletingNotificationId === notification.id}
                                      className="mt-1 rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                      title="Excluir aviso"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => {
                        setUserMenuOpen((open) => !open);
                        setNotificationMenuOpen(false);
                      }}
                      className="flex items-center gap-2 rounded-xl border border-transparent px-2.5 py-1.5 hover:border-primary/15 hover:bg-primary/10"
                    >
                      {userPhoto ? (
                        <img
                          src={userPhoto}
                          alt="Foto do usuario"
                          className="w-8 h-8 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </span>
                      )}

                      <span className="hidden text-sm text-slate-700 md:block">
                        {userRole === "admin" ? "Admin" : "Usuário"}
                      </span>
                    </button>

                    {userMenuOpen && (
                      <div className="surface-card absolute right-0 z-50 mt-2 w-52 py-1">
                        <Link
                          to="/painel"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Meu Painel
                        </Link>

                        {userRole === "admin" && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Admin
                          </Link>
                        )}

                        <hr className="my-1 border-slate-100" />

                        <Link
                          to="/login"
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="btn-ghost text-sm"
                  >
                    Entrar
                  </Link>

                  <Link
                    to="/cadastro"
                    className="btn-primary text-sm"
                  >
                    Cadastrar
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="rounded-xl p-2 text-slate-500 hover:bg-primary/10 hover:text-primary md:hidden"
                aria-label="Abrir menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="border-b border-white/60 bg-white/90 backdrop-blur-sm md:hidden">
          <div className="section-container flex flex-col gap-1 py-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2.5 text-sm ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-slate-700 hover:bg-primary/10 hover:text-primary"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <Link
              to="/profissionais"
              className="btn-accent mt-1 text-sm"
              style={{ fontWeight: 600 }}
            >
              <Sparkles className="w-4 h-4" />
              Contratar agora
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;


