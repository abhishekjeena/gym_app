import { app } from "./app.js";
import { applySchema } from "./config/applySchema.js";
import { env } from "./config/env.js";

async function startServer() {
  try {
    await applySchema();

    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
