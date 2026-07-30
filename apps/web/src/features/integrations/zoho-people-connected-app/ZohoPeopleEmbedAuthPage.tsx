import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { login } from "@/features/auth/model";
import { isAuthenticated } from "@/services/auth-store";
import { issueZohoEmbedCode, reportZohoEmbedEvent } from "@/services/zoho-api";
import { ApiError } from "@/services/api";
import {
  createEmbedRequestId,
  EMBED_OPENER_MISSING,
  sendEmbedAuthAndAwaitAck,
  sendOAuthDoneAndAwaitAck,
  shelfmerchPostMessageOrigin,
  SHELFMERCH_ZOHO_OAUTH_BRIDGE_READY,
} from "./zoho-embed-messaging";
import { exchangeZohoOAuthLaunch, ZOHO_CONNECT_URL } from "@/services/zoho-api";

/**
 * Popup page: first-party login, then issue one-time embed code and postMessage parent.
 * Route: /zoho/people/embed-auth?requestId=...
 */
export function ZohoPeopleEmbedAuthPage() {
  const [params] = useSearchParams();
  const requestId = params.get("requestId") || createEmbedRequestId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"login" | "issuing" | "done" | "opener_missing">(() =>
    isAuthenticated() ? "issuing" : "login",
  );
  const issuedRef = useRef(false);
  const closedRef = useRef(false);

  const issueAndNotify = useCallback(async () => {
    if (issuedRef.current) return;

    if (!window.opener) {
      setPhase("opener_missing");
      setError("Unable to communicate with Zoho People. Please close this window and try again.");
      void reportZohoEmbedEvent(EMBED_OPENER_MISSING, requestId).catch(() => {});
      return;
    }

    issuedRef.current = true;
    setPhase("issuing");
    setError("");
    try {
      const { code } = await issueZohoEmbedCode(requestId);
      await sendEmbedAuthAndAwaitAck({
        opener: window.opener,
        code,
        requestId,
        targetOrigin: shelfmerchPostMessageOrigin(),
      });
      setPhase("done");
      if (!closedRef.current) {
        closedRef.current = true;
        window.close();
      }
    } catch (err) {
      issuedRef.current = false;
      setPhase("login");
      setError(err instanceof ApiError ? err.message : "Could not complete sign-in");
    }
  }, [requestId]);

  useEffect(() => {
    if (isAuthenticated() && phase === "issuing") {
      void issueAndNotify();
    }
  }, [issueAndNotify, phase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), password);
      setPhase("issuing");
      await issueAndNotify();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="zoho-connected-app zoho-embed-auth-popup">
      <section className="zoho-connected-app-signin">
        <h1>Sign in to ShelfMerch</h1>
        {phase === "opener_missing" ? (
          <p className="zoho-embed-auth-error" role="alert">
            {error}
          </p>
        ) : phase === "issuing" || phase === "done" ? (
          <p className="zoho-embed-auth-wait">
            <Loader2 className="zoho-integ-spin" size={18} aria-hidden="true" />
            Completing sign-in…
          </p>
        ) : (
          <>
            <p>Use your ShelfMerch company account to connect Zoho People.</p>
            <form className="zoho-embed-auth-form" onSubmit={onSubmit}>
              <label>
                Work email
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              {error ? (
                <p className="zoho-embed-auth-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                className="zoho-integ-btn zoho-integ-btn--primary"
                disabled={busy}
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

/** Popup relay after Zoho OAuth — notifies opener iframe and closes after ACK. */
export function ZohoPeopleOAuthDonePage() {
  const [params] = useSearchParams();
  const zoho = params.get("zoho");
  const requestId = params.get("requestId") || "";
  const reason = params.get("reason") || undefined;
  const closedRef = useRef(false);
  const [message, setMessage] = useState("Finishing Zoho connection…");

  useEffect(() => {
    const status = zoho === "connected" ? "connected" : "error";
    const targetOrigin = shelfmerchPostMessageOrigin();

    if (!requestId) {
      setMessage("Invalid OAuth completion request.");
      return;
    }

    if (status === "connected") {
      setMessage("Zoho People connected successfully. You may close this window.");
    }

    if (!window.opener) {
      if (status !== "connected") {
        setMessage("Could not connect Zoho People. You may close this window.");
      }
      return;
    }

    if (status === "connected" && !closedRef.current) {
      closedRef.current = true;
      try {
        window.close();
      } catch {
        // Popup may remain open when the browser blocks programmatic close.
      }
    }

    let cancelled = false;
    void sendOAuthDoneAndAwaitAck({
      opener: window.opener as Window,
      status,
      requestId,
      reason,
      targetOrigin,
    })
      .then(() => {
        if (!cancelled && !closedRef.current) {
          closedRef.current = true;
          window.close();
        }
      })
      .catch(() => {
        if (!cancelled && status !== "connected") {
          setMessage("Could not connect Zoho People. You may close this window.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [zoho, reason, requestId]);

  return (
    <main className="zoho-connected-app zoho-embed-auth-popup">
      <section className="zoho-connected-app-signin">
        <p>{message}</p>
      </section>
    </main>
  );
}

/**
 * Popup bridge: handshake with iframe for one-time OAuth launch code, then connect.
 * Route: /zoho/people/oauth-bridge?requestId=...
 */
export function ZohoPeopleOAuthBridgePage() {
  const [params] = useSearchParams();
  const requestId = params.get("requestId") || "";
  const [error, setError] = useState("");

  useEffect(() => {
    if (!requestId) {
      setError("Invalid OAuth launch request.");
      return;
    }

    if (!window.opener) {
      setError("Unable to communicate with Zoho People. Please close this window and try again.");
      return;
    }

    const targetOrigin = shelfmerchPostMessageOrigin();
    let cancelled = false;

    const onLaunch = async (event: MessageEvent) => {
      if (event.origin !== targetOrigin) return;
      if (event.source !== window.opener) return;
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type !== "SHELFMERCH_ZOHO_OAUTH_LAUNCH") return;
      if (event.data.requestId !== requestId) return;
      if (typeof event.data.code !== "string") return;

      window.removeEventListener("message", onLaunch);

      try {
        await exchangeZohoOAuthLaunch(event.data.code, requestId);
        if (cancelled) return;
        const connectUrl = `${ZOHO_CONNECT_URL}?popup=1&requestId=${encodeURIComponent(requestId)}`;
        window.location.assign(connectUrl);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not start Zoho connection");
        }
      }
    };

    window.addEventListener("message", onLaunch);
    window.opener.postMessage(
      { type: SHELFMERCH_ZOHO_OAUTH_BRIDGE_READY, requestId },
      targetOrigin,
    );

    return () => {
      cancelled = true;
      window.removeEventListener("message", onLaunch);
    };
  }, [requestId]);

  return (
    <main className="zoho-connected-app zoho-embed-auth-popup">
      <section className="zoho-connected-app-signin">
        {error ? (
          <p className="zoho-embed-auth-error" role="alert">
            {error}
          </p>
        ) : (
          <p className="zoho-embed-auth-wait">
            <Loader2 className="zoho-integ-spin" size={18} aria-hidden="true" />
            Opening Zoho authorization…
          </p>
        )}
      </section>
    </main>
  );
}
