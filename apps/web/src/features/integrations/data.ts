import darwinboxIcon from "../../../assets/integrations/darwinbox.jpg";
import kekaIcon from "../../../assets/integrations/keka.png";
import bamboohrIcon from "../../../assets/integrations/bamboohr.svg";
import razorpayIcon from "../../../assets/integrations/razorpay.svg";
import shiprocketIcon from "../../../assets/integrations/shiprocket.png";
import slackIcon from "../../../assets/integrations/slack.svg";
import googleWorkspaceIcon from "../../../assets/integrations/google-workspace.svg";
import oktaIcon from "../../../assets/integrations/okta.svg";
import microsoftEntraIcon from "../../../assets/integrations/microsoft-entra.svg";
import auth0Icon from "../../../assets/integrations/auth0.svg";
import oneloginIcon from "../../../assets/integrations/onelogin.svg";

export type Integration = {
  id: string;
  name: string;
  category: string;
  desc: string;
  connected: boolean;
  icon: string;
};

export const INTEGRATIONS: Integration[] = [
  {
    id: "darwinbox",
    name: "Darwinbox",
    category: "HRIS",
    desc: "Sync employees, birthdays & start dates",
    connected: true,
    icon: darwinboxIcon,
  },
  {
    id: "keka",
    name: "Keka",
    category: "HRIS",
    desc: "People data & org chart for automated gifting triggers",
    connected: false,
    icon: kekaIcon,
  },
  {
    id: "bamboohr",
    name: "BambooHR",
    category: "HRIS",
    desc: "Import employee records, departments & hire dates",
    connected: false,
    icon: bamboohrIcon,
  },
  {
    id: "okta",
    name: "Okta",
    category: "Identity",
    desc: "Single sign-on and user provisioning via Okta",
    connected: false,
    icon: oktaIcon,
  },
  {
    id: "microsoft-entra",
    name: "Microsoft Entra ID",
    category: "Identity",
    desc: "Sync users and groups from Azure AD / Entra",
    connected: false,
    icon: microsoftEntraIcon,
  },
  {
    id: "auth0",
    name: "Auth0",
    category: "Identity",
    desc: "Authenticate recipients and manage access policies",
    connected: false,
    icon: auth0Icon,
  },
  {
    id: "onelogin",
    name: "OneLogin",
    category: "Identity",
    desc: "SSO and directory sync for enterprise logins",
    connected: false,
    icon: oneloginIcon,
  },
  {
    id: "razorpay",
    name: "Razorpay",
    category: "Payments",
    desc: "Collect funds via UPI, cards, and netbanking",
    connected: true,
    icon: razorpayIcon,
  },
  {
    id: "shiprocket",
    name: "Shiprocket",
    category: "Logistics",
    desc: "Domestic & global fulfilment with live tracking",
    connected: true,
    icon: shiprocketIcon,
  },
  {
    id: "slack",
    name: "Slack",
    category: "Comms",
    desc: "Celebrate milestones and share redemption updates in channels",
    connected: false,
    icon: slackIcon,
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    category: "Directory",
    desc: "Provision recipients and sync org directory from Google",
    connected: false,
    icon: googleWorkspaceIcon,
  },
];

export type IntegrationCategory = { key: string; label: string; desc: string };

export const INTEG_CATEGORIES: IntegrationCategory[] = [
  { key: "HRIS", label: "HRIS", desc: "Employee records, hire dates & org structure" },
  {
    key: "Identity",
    label: "Identity Provider (SSO)",
    desc: "Single sign-on, provisioning & access control",
  },
  { key: "Payments", label: "Payments", desc: "Collect funds via UPI, cards & netbanking" },
  { key: "Logistics", label: "Logistics", desc: "Domestic & global fulfilment with tracking" },
  { key: "Comms", label: "Comms", desc: "Celebrate milestones in Slack & team channels" },
  { key: "Directory", label: "Directory", desc: "Provision recipients from company directory" },
];

export function categoryMeta(key: string): { total: number; connected: number } {
  const apps = INTEGRATIONS.filter((i) => i.category === key);
  return { total: apps.length, connected: apps.filter((i) => i.connected).length };
}
