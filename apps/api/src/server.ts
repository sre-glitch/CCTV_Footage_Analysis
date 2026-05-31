import { env } from "./config/env.js";
import { buildApp } from "./app.js";

const app = await buildApp();
await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
