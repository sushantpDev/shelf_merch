import { z } from "zod";
import type { UiContact } from "@/services/mappers";

export const ROLES = ["Owner", "Admin", "Sender", "Member", "Non-Member"] as const;
/** Roles a user can pick when adding (Owner is assigned, not chosen). */
export const ADD_ROLES = ["Non-Member", "Member", "Sender", "Admin"] as const;

export const COUNTRIES = [
  { value: "IN", label: "India" },
  { value: "AE", label: "UAE" },
  { value: "US", label: "USA" },
] as const;

export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().default(""),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().default(""),
  role: z.enum(ROLES),
  department: z.string().trim().default(""),
  employeeCode: z.string().trim().default(""),
  line1: z.string().trim().default(""),
  city: z.string().trim().default(""),
  state: z.string().trim().default(""),
  pincode: z.string().trim().default(""),
  country: z.enum(["IN", "AE", "US"]),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

/** API payload shape shared by add + update flows. */
export function toContactPayload(v: ContactFormValues) {
  return {
    name: [v.firstName, v.lastName].filter(Boolean).join(" "),
    email: v.email,
    phone: v.phone,
    role: v.role,
    department: v.department,
    employeeCode: v.employeeCode,
    address: {
      line1: v.line1,
      city: v.city,
      state: v.state,
      pincode: v.pincode,
      country: v.country,
    },
  };
}

/** Seed the form from an existing contact (edit mode). */
export function contactToForm(c: UiContact): ContactFormValues {
  const parts = (c.name ?? "").split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    email: c.email ?? "",
    phone: c.phone ?? "",
    role: (ROLES as readonly string[]).includes(c.role)
      ? (c.role as ContactFormValues["role"])
      : "Member",
    department: c.department ?? "",
    employeeCode: c.employeeCode ?? "",
    line1: c.address ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    pincode: c.pincode ?? "",
    country: (["IN", "AE", "US"] as const).includes(c.country as "IN") ? (c.country as "IN") : "IN",
  };
}

export const EMPTY_CONTACT: ContactFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "Member",
  department: "",
  employeeCode: "",
  line1: "",
  city: "",
  state: "",
  pincode: "",
  country: "IN",
};
