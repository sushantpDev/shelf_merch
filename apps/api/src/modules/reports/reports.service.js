import { Order } from '../orders/order.model.js';
import { Recipient } from '../campaigns/recipient.model.js';
import { ReportSnapshot } from './reportSnapshot.model.js';
import { currentPeriod } from '../../services/usage.service.js';

/** UTC [start, end) for a YYYY-MM period. */
export function periodRange(period = currentPeriod()) {
  const [y, m] = period.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start, end };
}

/**
 * Aggregate the OLTP collections into a platform BI snapshot. Uses `.aggregate`
 * (not tenant-guarded, so it spans all tenants — intended for platform reports)
 * and never runs on a user request path — only the scheduled job / recompute
 * endpoint calls this.
 */
export async function computeSnapshot(period = currentPeriod()) {
  const { start, end } = periodRange(period);
  const match = { createdAt: { $gte: start, $lt: end } };

  const [orderTotals] = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        gmvInr: { $sum: { $ifNull: ['$amountBreakdown.total', 0] } },
        ordersCount: { $sum: 1 },
      },
    },
  ]);

  const statusRows = await Order.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const [marginRow] = await Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: null,
        marginInr: {
          $sum: {
            $multiply: [
              { $subtract: [{ $ifNull: ['$items.unitPriceInr', 0] }, { $ifNull: ['$items.costPriceInr', 0] }] },
              { $ifNull: ['$items.qty', 1] },
            ],
          },
        },
      },
    },
  ]);

  const funnelRows = await Recipient.aggregate([
    { $match: match },
    { $group: { _id: '$redemptionStatus', count: { $sum: 1 } } },
  ]);

  const metrics = {
    gmvInr: orderTotals?.gmvInr ?? 0,
    marginInr: marginRow?.marginInr ?? 0,
    ordersCount: orderTotals?.ordersCount ?? 0,
    ordersByStatus: Object.fromEntries(statusRows.map((r) => [r._id, r.count])),
    redemptionFunnel: Object.fromEntries(funnelRows.map((r) => [r._id, r.count])),
  };

  return ReportSnapshot.findOneAndUpdate(
    { scope: 'platform', period },
    { $set: { metrics, computedAt: new Date() }, $setOnInsert: { scope: 'platform', period } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
}

/** Read the precomputed snapshot (no live aggregation on the request path). */
export async function getSnapshot(period = currentPeriod()) {
  return ReportSnapshot.findOne({ scope: 'platform', period }).lean();
}
