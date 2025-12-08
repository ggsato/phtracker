import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setAuthTokenProvider } from "../lib/apiClient";

type TokenSet = {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch seconds
};

type AuthUser = {
  sub: string;
  email?: string;
  name?: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  tokens: TokenSet | null;
  login: (opts?: { redirectPath?: string }) => Promise<void>;
  logout: () => void;
  handleRedirectCallback: (code: string, state?: string | null) => Promise<void>;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = "phtracker.auth.tokens";
const VERIFIER_STORAGE_KEY = "phtracker.auth.pkce_verifier";
const REDIRECT_STORAGE_KEY = "phtracker.auth.post_login_path";

const cognitoDomain = (import.meta.env.VITE_COGNITO_DOMAIN as string | undefined)?.replace(/\/$/, "");
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined;
const redirectUri =
  (import.meta.env.VITE_COGNITO_REDIRECT_URI as string | undefined) ||
  `${window.location.origin}/callback`;
const logoutRedirectUri =
  (import.meta.env.VITE_COGNITO_LOGOUT_URI as string | undefined) || window.location.origin;

if (!cognitoDomain || !clientId) {
  console.warn("Cognito env vars are not fully configured; auth will not work until they are set.");
}

const parseJwt = (token: string): Record<string, unknown> | null => {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;
    const padded = payloadB64.padEnd(payloadB64.length + ((4 - (payloadB64.length % 4)) % 4), "=");
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const decodeUser = (idToken: string): AuthUser | null => {
  const payload = parseJwt(idToken);
  if (!payload || typeof payload.sub !== "string") return null;
  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
  };
};

const readStoredTokens = (): TokenSet | null => {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TokenSet;
    return parsed;
  } catch {
    return null;
  }
};

const storeTokens = (tokens: TokenSet | null) => {
  if (!tokens) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthTokenProvider(() => null);
    return;
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  setAuthTokenProvider(() => tokens.accessToken || tokens.idToken || null);
};

const isExpired = (expiresAt: number | undefined) => {
  if (!expiresAt) return true;
  const now = Math.floor(Date.now() / 1000);
  return expiresAt < now + 60; // consider expiring within the next minute as expired
};

const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const sha256 = async (message: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
};

const toBase64Url = (buffer: Uint8Array) =>
  btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const buildAuthorizeUrl = async (codeVerifier: string, state: string) => {
  const challenge = toBase64Url(await sha256(codeVerifier));
  const params = new URLSearchParams({
    client_id: clientId ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
  });
  return `${cognitoDomain}/oauth2/authorize?${params.toString()}`;
};

const exchangeCodeForTokens = async (code: string, codeVerifier: string): Promise<TokenSet> => {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId ?? "",
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const res = await fetch(`${cognitoDomain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [tokens, setTokens] = useState<TokenSet | null>(() => readStoredTokens());
  const [user, setUser] = useState<AuthUser | null>(() =>
    tokens?.idToken ? decodeUser(tokens.idToken) : null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!tokens || isExpired(tokens.expiresAt)) {
      setTokens(null);
      setUser(null);
      storeTokens(null);
      return;
    }
    storeTokens(tokens);
    if (!user && tokens.idToken) {
      setUser(decodeUser(tokens.idToken));
    }
  }, [tokens, user]);

  const clearAuth = useCallback(() => {
    setTokens(null);
    setUser(null);
    storeTokens(null);
  }, []);

  const login = useCallback(
    async (opts?: { redirectPath?: string }) => {
      if (!cognitoDomain || !clientId) {
        throw new Error("Cognito auth is not configured");
      }
      const verifier = generateCodeVerifier();
      sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
      const redirectPath = opts?.redirectPath || window.location.pathname || "/";
      sessionStorage.setItem(REDIRECT_STORAGE_KEY, redirectPath);
      const state = crypto.randomUUID();
      const authUrl = await buildAuthorizeUrl(verifier, state);
      window.location.assign(authUrl);
    },
    [clientId],
  );

  const logout = useCallback(() => {
    clearAuth();
    if (cognitoDomain && clientId) {
      const params = new URLSearchParams({
        client_id: clientId,
        logout_uri: logoutRedirectUri,
      });
      window.location.assign(`${cognitoDomain}/logout?${params.toString()}`);
    }
  }, [clearAuth]);

  const handleRedirectCallback = useCallback(
    async (code: string) => {
      const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY);
      if (!verifier) {
        throw new Error("Missing PKCE verifier; please retry login");
      }
      sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
      setIsLoading(true);
      try {
        const tokenSet = await exchangeCodeForTokens(code, verifier);
        setTokens(tokenSet);
        const decoded = tokenSet.idToken ? decodeUser(tokenSet.idToken) : null;
        setUser(decoded);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(tokens && !isExpired(tokens.expiresAt)),
      isLoading,
      user,
      tokens,
      login,
      logout,
      handleRedirectCallback,
      clearAuth,
    }),
    [tokens, isLoading, user, login, logout, handleRedirectCallback, clearAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
