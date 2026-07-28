import { logger } from '../../config/logger.js';

/** Fire-and-forget hook after Order.create — never blocks order placement. */
export function scheduleOrderInvoiceGeneration(order) {
  setImmediate(() => {
    import('./orderInvoice.service.js')
      .then(({ generateAndStoreOrderInvoice }) => generateAndStoreOrderInvoice(order))
      .catch((err) => {
        logger.error({ err, orderId: order._id }, 'Order invoice generation failed');
      });
  });
}
