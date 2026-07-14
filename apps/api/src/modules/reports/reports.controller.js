import { computeSnapshot, getSnapshot } from './reports.service.js';
import { currentPeriod } from '../../services/usage.service.js';
import { writeAudit } from '../../services/audit.service.js';

/**
 * §Gap G — read the precomputed snapshot. If none exists yet for the period
 * (e.g. before the first scheduled run), returns computedAt: null with empty
 * metrics rather than running a heavy live aggregation on the request path.
 */
export async function summary(req, res) {
  const period = req.query.period || currentPeriod();
  const snapshot = await getSnapshot(period);
  res.json(
    snapshot ?? { scope: 'platform', period, metrics: {}, computedAt: null, stale: true },
  );
}

/** On-demand recompute (also runs on a schedule via the analytics worker). */
export async function recompute(req, res) {
  const period = req.body?.period || currentPeriod();
  const snapshot = await computeSnapshot(period);
  writeAudit({ req, action: 'reports.recompute', entityType: 'ReportSnapshot', entityId: snapshot?._id });
  res.status(201).json(snapshot);
}
