// Auth flows re-exported from the shared services layer; controllers import from here.
export { login, register, isPlatformUser, ApiError, startGoogleAuth } from "@/services/api-bridge";
