export const INDIAN_GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export type WalletContactFields = {
  address: string;
  pinCode: string;
  mobileNumber: string;
  gstin: string;
};

export type WalletContactFieldErrors = Partial<Record<keyof WalletContactFields, string>>;

export function validateWalletContactFields(
  fields: WalletContactFields,
  options?: { required?: boolean },
): WalletContactFieldErrors {
  const required = options?.required !== false;
  const errors: WalletContactFieldErrors = {};

  const address = fields.address.trim();
  if (required && !address) errors.address = "Address is required";

  const pinCode = fields.pinCode.trim();
  if (required && !pinCode) errors.pinCode = "Pin code is required";
  else if (pinCode && !/^\d{6}$/.test(pinCode)) errors.pinCode = "Pin code must be exactly 6 digits";

  const mobileNumber = fields.mobileNumber.trim();
  if (required && !mobileNumber) errors.mobileNumber = "Mobile number is required";
  else if (mobileNumber && !/^\d{10}$/.test(mobileNumber)) {
    errors.mobileNumber = "Mobile number must be exactly 10 digits";
  }

  const gstin = fields.gstin.trim().toUpperCase();
  if (required && !gstin) errors.gstin = "GSTIN is required";
  else if (gstin && (gstin.length !== 15 || !INDIAN_GSTIN.test(gstin))) {
    errors.gstin = "Enter a valid 15-character GSTIN";
  }

  return errors;
}

export function walletContactFieldsValid(errors: WalletContactFieldErrors): boolean {
  return Object.keys(errors).length === 0;
}

export const EMPTY_WALLET_CONTACT: WalletContactFields = {
  address: "",
  pinCode: "",
  mobileNumber: "",
  gstin: "",
};
