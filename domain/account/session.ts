"use client";

export const BIKES_ACCOUNT_ISSUER =
  "https://hycegznamzjhwinegaai.supabase.co";
export const BIKES_ACCOUNT_PUBLISHABLE_KEY =
  "sb_publishable_1rZzRPzfLMaAH5pIgCwIjA_19UPMIsR";
export const BIKES_ACCOUNT_STORAGE_KEY =
  "thiepn:bikes-auth:v1";
export const BIKES_PRODUCTION_URL =
  "https://thiepn.dev/bikes/";
export const BIKES_CALLBACK_URL =
  "https://thiepn.dev/bikes/auth/callback/";
export const BIKES_CORE_URL =
  "https://thiepn-core-gateway.thiepn.workers.dev";
export const BIKES_ACCOUNT_URL =
  "https://account.thiepn.dev/";

export type BikeAccountIdentity =
  | { status: "checking" }
  | { status: "signed-out" }
  | { status: "unconfigured" }
  | { status: "unavailable"; code: string }
  | {
      status: "signed-in";
      id: string;
      email: string | null;
    };

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
};

type PendingAuthorization = {
  state: string;
  verifier: string;
  startedAt: number;
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

const CLIENT_ID =
  process.env.NEXT_PUBLIC_BIKES_ACCOUNT_CLIENT_ID?.trim() ?? "";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_SKEW_MS = 30_000;
const PENDING_TTL_MS = 10 * 60_000;
const tokenKey = BIKES_ACCOUNT_STORAGE_KEY + ":tokens";
const pendingKey = BIKES_ACCOUNT_STORAGE_KEY + ":pending";

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomToken(size = 32) {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(size)));
}

async function challengeFor(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return encodeBase64Url(new Uint8Array(digest));
}

function validCallback(url: URL) {
  if (url.hash) return null;
  const state = url.searchParams.get("state");
  if (
    !state ||
    url.searchParams.getAll("state").length !== 1 ||
    !/^[A-Za-z0-9_-]{43,128}$/.test(state)
  ) {
    return null;
  }

  const code = url.searchParams.get("code");
  if (code && url.searchParams.getAll("code").length === 1) {
    if (
      [...url.searchParams.keys()].some(
        (key) => !["code", "state"].includes(key),
      ) ||
      code.length > 4096 ||
      /[\s\x00-\x1f\x7f]/.test(code)
    ) {
      return null;
    }
    return { code, state } as const;
  }

  const error = url.searchParams.get("error");
  if (
    !error ||
    url.searchParams.getAll("error").length !== 1 ||
    [...url.searchParams.keys()].some(
      (key) =>
        !["error", "error_description", "state"].includes(key),
    )
  ) {
    return null;
  }
  return { error, state } as const;
}

class BikeAccountSession {
  private current: BikeAccountIdentity = CLIENT_ID
    ? { status: "checking" }
    : { status: "unconfigured" };
  private listeners = new Set<(value: BikeAccountIdentity) => void>();

  get configured() {
    return UUID_RE.test(CLIENT_ID);
  }

  identity() {
    return this.current;
  }

  subscribe(listener: (value: BikeAccountIdentity) => void) {
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }

  private publish(value: BikeAccountIdentity) {
    this.current = value;
    for (const listener of this.listeners) listener(value);
    return value;
  }

  private clearTokens() {
    localStorage.removeItem(tokenKey);
  }

  private readTokens(): StoredTokens | null {
    const value = parseJson<Partial<StoredTokens>>(
      localStorage.getItem(tokenKey),
    );
    if (
      !value ||
      typeof value.accessToken !== "string" ||
      typeof value.refreshToken !== "string" ||
      typeof value.expiresAt !== "number" ||
      typeof value.scope !== "string"
    ) {
      return null;
    }
    return value as StoredTokens;
  }

  private writeTokens(value: TokenResponse) {
    const stored: StoredTokens = {
      accessToken: value.access_token,
      refreshToken: value.refresh_token,
      expiresAt: Date.now() + value.expires_in * 1000,
      scope: value.scope ?? "",
    };
    localStorage.setItem(tokenKey, JSON.stringify(stored));
    return stored;
  }

  private async tokenRequest(body: URLSearchParams) {
    const response = await fetch(
      new URL("/auth/v1/oauth/token", BIKES_ACCOUNT_ISSUER),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        credentials: "omit",
        redirect: "error",
        signal: AbortSignal.timeout(8000),
      },
    );

    const payload = (await response.json()) as Partial<TokenResponse>;
    if (
      !response.ok ||
      typeof payload.access_token !== "string" ||
      typeof payload.refresh_token !== "string" ||
      typeof payload.expires_in !== "number" ||
      payload.token_type !== "bearer"
    ) {
      throw new Error("ACCOUNT_TOKEN_EXCHANGE_FAILED");
    }
    return payload as TokenResponse;
  }

  private async usableTokens() {
    const stored = this.readTokens();
    if (!stored) return null;
    if (stored.expiresAt - TOKEN_SKEW_MS > Date.now()) return stored;

    try {
      const next = await this.tokenRequest(
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: stored.refreshToken,
          client_id: CLIENT_ID,
        }),
      );
      return this.writeTokens(next);
    } catch {
      this.clearTokens();
      return null;
    }
  }

  async verify(): Promise<BikeAccountIdentity> {
    if (!this.configured) return this.publish({ status: "unconfigured" });
    this.publish({ status: "checking" });

    const tokens = await this.usableTokens();
    if (!tokens) return this.publish({ status: "signed-out" });

    try {
      const response = await fetch(
        new URL("/auth/v1/user", BIKES_ACCOUNT_ISSUER),
        {
          headers: {
            Accept: "application/json",
            apikey: BIKES_ACCOUNT_PUBLISHABLE_KEY,
            Authorization: "Bearer " + tokens.accessToken,
          },
          credentials: "omit",
          redirect: "error",
          signal: AbortSignal.timeout(8000),
        },
      );

      if (response.status === 401 || response.status === 403) {
        this.clearTokens();
        return this.publish({ status: "signed-out" });
      }
      if (!response.ok) {
        return this.publish({
          status: "unavailable",
          code: "ACCOUNT_VERIFY_UNAVAILABLE",
        });
      }

      const user = (await response.json()) as {
        id?: unknown;
        email?: unknown;
      };
      if (typeof user.id !== "string" || !UUID_RE.test(user.id)) {
        this.clearTokens();
        return this.publish({
          status: "unavailable",
          code: "ACCOUNT_IDENTITY_INVALID",
        });
      }

      return this.publish({
        status: "signed-in",
        id: user.id,
        email: typeof user.email === "string" ? user.email : null,
      });
    } catch {
      return this.publish({
        status: "unavailable",
        code: "ACCOUNT_VERIFY_UNAVAILABLE",
      });
    }
  }

  async authorizationUrl() {
    if (!this.configured) throw new Error("BIKES_ACCOUNT_CLIENT_UNCONFIGURED");

    const verifier = randomToken();
    const state = randomToken();
    const challenge = await challengeFor(verifier);

    const pending: PendingAuthorization = {
      state,
      verifier,
      startedAt: Date.now(),
    };
    sessionStorage.setItem(pendingKey, JSON.stringify(pending));

    const url = new URL(
      "/auth/v1/oauth/authorize",
      BIKES_ACCOUNT_ISSUER,
    );
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", BIKES_CALLBACK_URL);
    url.searchParams.set(
      "scope",
      "email offline_access openid profile",
    );
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    return url.toString();
  }

  async signIn() {
    location.assign(await this.authorizationUrl());
  }

  async completeCallback(locationLike: Pick<Location, "href">) {
    if (!this.configured) return this.publish({ status: "unconfigured" });

    const callback = validCallback(new URL(locationLike.href));
    const pending = parseJson<Partial<PendingAuthorization>>(
      sessionStorage.getItem(pendingKey),
    );
    sessionStorage.removeItem(pendingKey);

    if (
      !callback ||
      !pending ||
      typeof pending.state !== "string" ||
      pending.state !== callback.state ||
      typeof pending.verifier !== "string" ||
      typeof pending.startedAt !== "number" ||
      Date.now() < pending.startedAt ||
      Date.now() - pending.startedAt > PENDING_TTL_MS
    ) {
      return this.publish({
        status: "unavailable",
        code: "ACCOUNT_CALLBACK_INVALID",
      });
    }

    if ("error" in callback) {
      return this.publish({ status: "signed-out" });
    }

    try {
      const result = await this.tokenRequest(
        new URLSearchParams({
          grant_type: "authorization_code",
          code: callback.code,
          client_id: CLIENT_ID,
          redirect_uri: BIKES_CALLBACK_URL,
          code_verifier: pending.verifier,
        }),
      );
      this.writeTokens(result);
      return this.verify();
    } catch {
      this.clearTokens();
      return this.publish({
        status: "unavailable",
        code: "ACCOUNT_CODE_EXCHANGE_FAILED",
      });
    }
  }

  async getAccessToken() {
    if (!this.configured) return null;
    return (await this.usableTokens())?.accessToken ?? null;
  }

  signOutLocal() {
    this.clearTokens();
    sessionStorage.removeItem(pendingKey);
    return this.publish({ status: "signed-out" });
  }
}

export const bikeAccountSession = new BikeAccountSession();
