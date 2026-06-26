export {};

declare global {
  interface Window {
    __shelfMerchNavigate?: (key: string) => void;
    __shelfMerchState?: {
      nav?: string;
      view?: string;
      authed?: boolean;
    };
  }
}
