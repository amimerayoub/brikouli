import type { Express } from "express";
import { loginAction, requestPhoneOtpAction, verifyPhoneOtpAction } from "../actions/login";
import { registerAction } from "../actions/register";

export function registerAuthActionRoutes(app: Express) {
  app.post("/api/auth/login", async (request, response) => { const result = await loginAction(request.body); return response.status(result.success ? 200 : 400).json(result); });
  app.post("/api/auth/register", async (request, response) => { const result = await registerAction(request.body); return response.status(result.success ? 200 : 400).json(result); });
  app.post("/api/auth/phone-otp", async (request, response) => { const result = await requestPhoneOtpAction(request.body); return response.status(result.success ? 200 : 400).json(result); });
  app.post("/api/auth/verify-otp", async (request, response) => { const result = await verifyPhoneOtpAction(request.body); return response.status(result.success ? 200 : 400).json(result); });
}
