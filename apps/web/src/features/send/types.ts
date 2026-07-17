export type SendMode = "redeem" | "surprise" | "single";

export type PaymentMethod = "wallet" | "upi" | "card";

export type WhenMode = "now" | "sched" | "self";

export type SingleLocation = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type ScheduleDraft = { date: string; time: string; tz: string };

export const EMPTY_SINGLE_LOCATION: SingleLocation = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "IN",
};

/** Convert the wizard's draft schedule into the api-bridge schedule payload. */
export function toSchedulePayload(
  when: WhenMode,
  sched: ScheduleDraft,
): { mode: "now" | "scheduled" | "self"; sendAt?: string | null; timezone?: string } {
  if (when === "self") return { mode: "self" };
  if (when === "sched") {
    const date = sched.date || new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const time = sched.time || "10:00";
    const tz = (sched.tz || "Asia/Kolkata (IST)").split(" ")[0];
    // Asia/Kolkata is IST (+05:30). Attach offset so sendAt is absolute, not ambiguous local.
    const offset = tz === "Asia/Kolkata" || tz.includes("Kolkata") ? "+05:30" : "";
    return {
      mode: "scheduled",
      sendAt: `${date}T${time}:00${offset}`,
      timezone: tz,
    };
  }
  return { mode: "now" };
}
