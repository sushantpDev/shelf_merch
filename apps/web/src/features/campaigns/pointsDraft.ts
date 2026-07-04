import type { PaymentMethod, ScheduleDraft, WhenMode } from "@/features/send/types";

export type SendPointsDraft = {
  orderName: string;
  ppr: number; // budget per recipient, in INR
  recips: number; // headline recipient count (budget step)
  selRecips: string[];
  from: string;
  msg: string;
  when: WhenMode;
  schedule: ScheduleDraft;
  preview: "landing" | "email";
  pay: PaymentMethod;
};

export type SendPointsAction =
  | { type: "setOrderName"; orderName: string }
  | { type: "setPpr"; ppr: number }
  | { type: "setRecips"; recips: number }
  | { type: "toggleRecip"; id: string }
  | { type: "deselectRecips" }
  | { type: "setFrom"; from: string }
  | { type: "setMsg"; msg: string }
  | { type: "setWhen"; when: WhenMode }
  | { type: "setSchedule"; key: keyof ScheduleDraft; value: string }
  | { type: "setPreview"; preview: "landing" | "email" }
  | { type: "setPay"; pay: PaymentMethod };

export function sendPointsReducer(
  state: SendPointsDraft,
  action: SendPointsAction,
): SendPointsDraft {
  switch (action.type) {
    case "setOrderName":
      return { ...state, orderName: action.orderName };
    case "setPpr":
      return { ...state, ppr: action.ppr };
    case "setRecips":
      return { ...state, recips: action.recips };
    case "toggleRecip": {
      const has = state.selRecips.includes(action.id);
      return {
        ...state,
        selRecips: has
          ? state.selRecips.filter((id) => id !== action.id)
          : [...state.selRecips, action.id],
      };
    }
    case "deselectRecips":
      return { ...state, selRecips: [] };
    case "setFrom":
      return { ...state, from: action.from };
    case "setMsg":
      return { ...state, msg: action.msg };
    case "setWhen":
      return { ...state, when: action.when };
    case "setSchedule":
      return { ...state, schedule: { ...state.schedule, [action.key]: action.value } };
    case "setPreview":
      return { ...state, preview: action.preview };
    case "setPay":
      return { ...state, pay: action.pay };
    default:
      return state;
  }
}

export function initialSendPointsDraft(firstRecips: string[], account: string): SendPointsDraft {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  return {
    orderName: "Order R" + (200000000 + Math.floor(Math.random() * 99999999)),
    ppr: 1500,
    recips: 100,
    selRecips: firstRecips,
    from: `People Team, ${account}`,
    msg: "Appreciate your turnaround completing the key project, which is critical to company revenue.",
    when: "now",
    schedule: { date: tomorrow, time: "10:00", tz: "Asia/Kolkata (IST)" },
    preview: "landing",
    pay: "wallet",
  };
}
