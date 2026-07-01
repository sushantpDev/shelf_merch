type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

export function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export type RazorpayOrderPayload = {
  orderId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  keyId: string;
  paymentId: string;
  walletId: string;
};

export async function openRazorpayCheckout(opts: {
  order: RazorpayOrderPayload;
  walletName: string;
  onSuccess: (response: RazorpayHandlerResponse) => void;
  onDismiss?: () => void;
}): Promise<void> {
  await loadRazorpayScript();
  const RazorpayCtor = window.Razorpay;
  if (!RazorpayCtor) {
    throw new Error("Razorpay checkout is unavailable");
  }

  return new Promise((resolve, reject) => {
    const rzp = new RazorpayCtor({
      key: opts.order.keyId,
      amount: opts.order.amountPaise,
      currency: opts.order.currency,
      order_id: opts.order.orderId,
      name: "Shelf Merch",
      description: `Add funds to ${opts.walletName}`,
      theme: { color: "#1a5c45" },
      handler: (response) => {
        opts.onSuccess(response);
        resolve();
      },
      modal: {
        ondismiss: () => {
          opts.onDismiss?.();
          reject(new Error("Payment cancelled"));
        },
      },
    });

    rzp.open();
  });
}
