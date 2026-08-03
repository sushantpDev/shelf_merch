// Auth flows re-exported from the shared services layer; controllers import from here.
export {
  login,
  register,
  startSignup,
  resendSignupOtp,
  verifySignupOtp,
  isPlatformUser,
  ApiError,
  startGoogleAuth,
} from "@/services/api-bridge";
export type { SignupStartResult } from "@/services/api-bridge";
