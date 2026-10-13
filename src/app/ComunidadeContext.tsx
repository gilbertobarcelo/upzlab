"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuthToken, authHeaders } from "../lib/auth";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  badge?: string;
  points?: number;
  time: string;
  read: boolean;
}

export interface DevPost {
  id: string;
  db_id?: number;
  user_id?: number;
  implementation_id?: string;
  authorName: string;
  authorRole: string;
  authorAvatarBg: string;
  category: "anomalia" | "code_fix" | "fraude" | "bug" | "publicacao" | "update";
  title: string;
  description: string;
  codeSnippet?: string;
  deviceOs?: string;
  stepsToReproduce?: string;
  uxRating?: number;
  hasImage: boolean;
  imageUrl?: string;
  status: "open" | "reviewed" | "approved";
  badgeAwarded?: string;
  pointsAwarded?: number;
  adminComment?: string;
  likes: number;
  hasLiked?: boolean;
  authorUsername?: string;
  commentsCount?: number;
  lastComment?: { authorName: string, body: string };
  date: string;
}

export interface DevProfile {
  id: string;
  name: string;
  username?: string;
  role: string;
  egolpeLevel: string;
  points: number;
  badges: string[];
  avatarBg: string;
  github?: string;
  location: string;
  contributionsCount: number;
  highlightAnomaly?: {
    title: string;
    date: string;
    description: string;
    badge: string;
    status: string;
  };
}

export interface BetaApp {
  id: string;
  slug: string;
  name: string;
  developer: string;
  description: string;
  category: string;
  reward: number;
  requiredLevel: string;
  slots: string;
  tags: string[];
  icon: string;
  is_founder_app?: boolean;
  boost_level?: number;
  boost_expires_at?: string | null;
}

interface ComunidadeContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  devUser: {
    id?: number;
    name: string;
    username?: string;
    email: string;
    role: string;
    github: string;
    bio: string;
    location: string;
    points: number;
    rankPosition: number;
    badges: string[];
    createdAt?: string;
    avatarUrl?: string;
    topLanguages?: string;
    coverUrl?: string;
    github_account_age_days?: number;
    github_total_repos?: number;
    github_score?: number;
    github_connected?: boolean;
    github_avatar_url?: string;
    is_staff?: boolean;
  };
  posts: DevPost[];
  addPost: (post: Omit<DevPost, "id" | "likes" | "date" | "status" | "authorName" | "authorRole" | "authorAvatarBg"> & { authorName?: string, productId?: string }, imageFile?: File | null) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  notifications: NotificationItem[];
  markAllNotificationsRead: () => void;
  topDevs: DevProfile[];
  recentApps: BetaApp[];
  refreshApps: () => Promise<void>;
  login: (token: string) => void;
  logout: () => void;
  refreshFeed: () => Promise<void>;
  refreshDevUser: () => Promise<void>;
  deletePost: (dbId: number) => Promise<void>;
  editPost: (dbId: number, title: string, description: string) => Promise<void>;
  appVersion: string;
  updates: any[];
  formatPoints: (points: number) => string;
}

export const formatPoints = (points: number): string => {
  if (points >= 1000000) {
    return (points / 1000000).toFixed(points % 1000000 === 0 ? 0 : 1).replace(/\.0$/, '') + 'M';
  }
  if (points >= 1000) {
    return (points / 1000).toFixed(points % 1000 === 0 ? 0 : 1).replace(/\.0$/, '') + 'K';
  }
  return points.toString();
};

const ComunidadeContext = createContext<ComunidadeContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

/**
 * Lê o token JWT dos cookies — implementação centralizada em `src/lib/auth`
 * (mantida aqui apenas como referência histórica; importada acima).
 */

/** Verifica se existe qualquer cookie de auth */
function hasCookieAuth(): boolean {
  if (typeof document === "undefined") return false;
  return ["upzlab_dev_jwt", "auth_token"].some(
    name => document.cookie.includes(`${name}=`)
  );
}

export function ComunidadeProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("v1.0.0");
  const [devUser, setDevUser] = useState<{
    id?: number;
    name: string;
    email: string;
    role: string;
    github: string;
    bio: string;
    location: string;
    points: number;
    rankPosition: number;
    badges: string[];
    avatarUrl?: string;
    topLanguages?: string;
    createdAt?: string;
    github_account_age_days?: number;
    github_total_repos?: number;
    github_score?: number;
    github_connected?: boolean;
    github_avatar_url?: string;
  }>({
    name: "",
    email: "",
    role: "",
    github: "",
    bio: "",
    location: "",
    points: 0,
    rankPosition: 0,
    badges: [],
    avatarUrl: "",
    topLanguages: "",
    createdAt: ""
  });

  const [posts, setPosts] = useState<DevPost[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [topDevs, setTopDevs] = useState<DevProfile[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [recentApps, setRecentApps] = useState<BetaApp[]>([]);

  // Detecta cookie de auth no mount (sincrono)
  useEffect(() => {
    if (hasCookieAuth()) {
      setIsLoggedIn(true);
    }
  }, []);

  const refreshApps = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/upzlab/campaigns/`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setRecentApps(json.data);
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar apps recentes:", e);
    }
  };

  const refreshFeed = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/upzlab/beta-feedback/comunidade/feed`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPosts(json.data);
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar feed:", e);
    }
  };

  const refreshRanking = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/upzlab/beta-feedback/comunidade/ranking`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setTopDevs(json.data);
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar ranking:", e);
    }
  };

  const refreshNotifs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/upzlab/beta-feedback/comunidade/notificacoes`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setNotifications(json.data);
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar notificações:", e);
    }
  };

  const refreshVersion = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/upzlab/beta-feedback/comunidade/version`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.version) {
          setAppVersion(json.version.startsWith('v') ? json.version : `v${json.version}`);
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar versão:", e);
    }
  };

  const refreshDevUser = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/dev/auth/me`, {
        credentials: "include",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setDevUser(json.data);
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar dados do usuário:", e);
    }
  };

  const refreshUpdates = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/upzlab/beta-updates`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setUpdates(json.data);
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar updates:", e);
    }
  };

  // Feed, ranking, notifs e versão são públicos — sempre no mount
  useEffect(() => {
    refreshFeed();
    refreshRanking();
    refreshNotifs();
    refreshVersion();
    refreshUpdates();
    refreshApps();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dados do usuário só quando logado
  useEffect(() => {
    if (isLoggedIn) {
      refreshDevUser();
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const addPost = async (
    newPostData: Omit<DevPost, "id" | "likes" | "date" | "status" | "authorName" | "authorRole" | "authorAvatarBg"> & { authorName?: string; productId?: string },
    imageFile?: File | null
  ) => {
    // Optimistic update imediato
    const tempPost: DevPost = {
      ...newPostData,
      id: `post-${Date.now()}`,
      authorName: newPostData.authorName || devUser.name,
      authorRole: devUser.role,
      authorAvatarBg: "from-emerald-500 to-emerald-700",
      status: "open",
      likes: 0,
      date: "Hoje",
      hasImage: !!imageFile,
      imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined,
    };
    setPosts(prev => [tempPost, ...prev]);

    try {
      const formData = new FormData();
      formData.append("title", newPostData.title || "Nova Publicação");
      formData.append("category", newPostData.category || "publicacao");
      formData.append("description", newPostData.description || "");
      if (newPostData.codeSnippet) formData.append("code_snippet", newPostData.codeSnippet);
      if (newPostData.deviceOs) formData.append("device_os", newPostData.deviceOs);
      if (newPostData.stepsToReproduce) formData.append("steps_to_reproduce", newPostData.stepsToReproduce);
      if (newPostData.uxRating) formData.append("ux_rating", newPostData.uxRating.toString());
      formData.append("author_name", newPostData.authorName || devUser.name || "Dev UpzLab");
      formData.append("author_role", devUser.role || "Developer");
      if (newPostData.productId) formData.append("product_id", newPostData.productId);
      if (imageFile) formData.append("images", imageFile);

      const token = getAuthToken();

      const res = await fetch(`${API_BASE}/api/upzlab/beta-feedback/comunidade/post`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: formData,
      });

      if (res.ok) {
        // Substitui o post temporário pelos dados reais do banco
        await refreshFeed();
      } else {
        const errText = await res.text();
        console.error("Erro ao criar post:", res.status, errText);
        alert(`Erro ao publicar (${res.status}): ${errText}`);
      }
    } catch (e) {
      console.warn("Erro ao salvar post:", e);
      alert(`Erro de conexão ao publicar: ${e}`);
    }
  };

  const deletePost = async (dbId: number) => {
    // Remove imediatamente da UI
    setPosts(prev => prev.filter(p => p.db_id !== dbId));
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/upzlab/beta-feedback/comunidade/post/${dbId}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        console.error("Erro ao deletar post:", res.status, await res.text());
        // Reverte removendo da UI se falhou
        await refreshFeed();
      }
    } catch (e) {
      console.warn("Erro ao deletar post:", e);
      await refreshFeed();
    }
  };

  const editPost = async (dbId: number, title: string, description: string) => {
    // Atualiza imediatamente na UI
    setPosts(prev => prev.map(p =>
      p.db_id === dbId ? { ...p, title, description } : p
    ));
    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      const res = await fetch(`${API_BASE}/api/upzlab/beta-feedback/comunidade/post/${dbId}`, {
        method: "PUT",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) {
        await refreshFeed();
      } else {
        console.error("Erro ao editar post:", res.status, await res.text());
        await refreshFeed();
      }
    } catch (e) {
      console.warn("Erro ao editar post:", e);
      await refreshFeed();
    }
  };

  const likePost = async (id: string) => {
    if (!devUser) {
      alert("Você precisa estar logado para curtir!");
      return;
    }

    const target = posts.find(p => p.id === id);
    if (target?.hasLiked) return; // Se já curtiu localmente nesta sessão, não faz nada

    if (target?.db_id) {
      // Optimistic Update
      setPosts(prev => prev.map(p => p.id === id ? { ...p, hasLiked: true, likes: p.likes + 1 } : p));
      try {
        const res = await fetch(`${API_BASE}/api/upzlab/beta-feedback/comunidade/like/${target.db_id}`, {
          method: "POST",
          headers: authHeaders(),
        });
        const data = await res.json();
        
        if (data.success) {
          // Atualiza com o número real do banco
          setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: data.likes } : p));
        } else {
          // Se já estava curtido no banco (antes desta sessão), não faz nada (silencioso)
          // Se for outro erro, reverte
          if (!data.message?.includes("já curtiu")) {
            setPosts(prev => prev.map(p => p.id === id ? { ...p, hasLiked: false, likes: p.likes - 1 } : p));
          }
        }
      } catch (e) {
        console.warn("Erro ao curtir:", e);
        // Reverte se deu erro de rede
        setPosts(prev => prev.map(p => p.id === id ? { ...p, hasLiked: false, likes: p.likes - 1 } : p));
      }
    }
  };

  const loadNotifications = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/upzlab/beta-feedback/comunidade/notificacoes?dev_id=${userId}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch (e) {
      console.warn("Erro ao buscar notificações:", e);
    }
  };

  // Carrega notificações após carregar o user
  useEffect(() => {
    if (devUser) {
      loadNotifications(devUser.id ?? 0);
    } else {
      setNotifications([]);
    }
  }, [devUser]);

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notifications.forEach(n => {
      if (!n.read) {
        fetch(`${API_BASE}/api/upzlab/beta-feedback/comunidade/notificacoes/${n.id}/read`, {
          method: "PUT",
          headers: authHeaders(),
        }).catch(console.warn);
      }
    });
  };

  const login = (token: string) => {
    // Salva com o mesmo nome que o backend usa: upzlab_dev_jwt
    document.cookie = `upzlab_dev_jwt=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    setIsLoggedIn(true);
  };

  const logout = () => {
    // Remove todos os nomes possíveis de cookie (host atual e domínio pai)
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    ["upzlab_dev_jwt", "auth_token"].forEach(name => {
      const expired = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
      document.cookie = expired;
      if (host) {
        document.cookie = `${expired}; domain=${host}`;
        document.cookie = `${expired}; domain=.${host}`;
      }
    });
    setIsLoggedIn(false);
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  };

  return (
    <ComunidadeContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        devUser,
        posts,
        addPost,
        likePost,
        notifications,
        markAllNotificationsRead,
        topDevs,
        recentApps,
        refreshApps,
        login,
        logout,
        refreshFeed,
        refreshDevUser,
        deletePost,
        editPost,
        appVersion,
        updates,
        formatPoints,
      }}
    >
      {children}
    </ComunidadeContext.Provider>
  );
}

export function useComunidade() {
  const context = useContext(ComunidadeContext);
  if (!context) {
    throw new Error("useComunidade must be used within a ComunidadeProvider");
  }
  return context;
}
