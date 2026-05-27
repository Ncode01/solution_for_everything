import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.server") });

const DEMO_EMAIL = "owner@flowcanvas.dev";
const DEMO_PASSWORD = "demo12345";

async function main() {
  const { auth } = await import("../src/lib/auth");

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        name: "Demo Owner",
      },
    });

    if (result?.user) {
      console.log(`Auth user created: ${result.user.email}`);
      process.exit(0);
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    if (/already|exist|unique/i.test(message)) {
      console.log(`Auth user already exists: ${DEMO_EMAIL}`);
      process.exit(0);
    }
    console.error("Auth seed failed:", message);
    process.exit(1);
  }
}

main();
