import { env } from './env.js';
import { logger } from './logger.js';

let sentry = null;

/**
 * §Gap F — optional error reporting / tracing. These integrations are wired but
 * NOT bundled as dependencies (this session avoids lockfile churn): they activate
 * only when the env is set AND the package is installed, via a dynamic import
 * that no-ops if absent. To enable: `npm i @sentry/node` and set SENTRY_DSN
 * (and, for tracing, the @opentelemetry/* packages + OTEL_EXPORTER_OTLP_ENDPOINT).
 */
export async function initObservability() {
  if (env.SENTRY_DSN) {
    try {
      const Sentry = await import('@sentry/node');
      Sentry.init({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV, tracesSampleRate: 0.1 });
      sentry = Sentry;
      logger.info('Sentry error reporting enabled');
    } catch {
      logger.warn('SENTRY_DSN is set but @sentry/node is not installed — `npm i @sentry/node` to enable');
    }
  }
  if (env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    logger.info(
      { endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT },
      'OTLP endpoint set — install @opentelemetry/* to enable distributed tracing',
    );
  }
}

export function captureException(err, context) {
  if (!sentry) return;
  try {
    sentry.captureException(err, context ? { extra: context } : undefined);
  } catch {
    /* never let error reporting break the error path */
  }
}
