import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  STALE_FEED_MINUTES: z.coerce.number().int().positive().default(5),
  API_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);
