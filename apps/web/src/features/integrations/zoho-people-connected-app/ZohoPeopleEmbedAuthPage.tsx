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
  shelfmerchPostMessageOrigin,
  SHELFMERCH_ZOHO_EMBED_OAUTH,
} from "./zoho-embed-messaging";

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

/** Popup relay after Zoho OAuth — notifies opener iframe and closes. */
export function ZohoPeopleOAuthDonePage() {
  const [params] = useSearchParams();
  const zoho = params.get("zoho");
  const reason = params.get("reason") || undefined;

  useEffect(() => {
    const status = zoho === "connected" ? "connected" : "error";
    const targetOrigin = shelfmerchPostMessageOrigin();
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: SHELFMERCH_ZOHO_EMBED_OAUTH, status, reason },
        targetOrigin,
      );
    }
    window.setTimeout(() => window.close(), 400);
  }, [zoho, reason]);

  return (
    <main className="zoho-connected-app zoho-embed-auth-popup">
      <section className="zoho-connected-app-signin">
        <p>Finishing Zoho connection…</p>
      </section>
    </main>
  );
}

/**
 * Popup bridge: establish OAuth bridge cookie then redirect to Zoho connect (popup mode).
 * Route: /zoho/people/oauth-bridge
 */
export function ZohoPeopleOAuthBridgePage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { startZohoConnectPopup } = await import("@/services/zoho-api");
        await startZohoConnectPopup();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not start Zoho connection");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
