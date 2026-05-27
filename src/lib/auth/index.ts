import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { authDb, authSchema } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(authDb, {
    provider: "pg",
    schema: {
      user: authSchema.authUser,
      session: authSchema.authSession,
      account: authSchema.authAccount,
      verification: authSchema.authVerification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret:
    process.env.BETTER_AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "dev_only_change_me_long_random_string"
      : undefined),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    "http://localhost:3000",
  ],
});
