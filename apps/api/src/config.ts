import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://invest4fun:invest4fun@localhost:5432/invest4fun"),
  COINGECKO_API_KEY: z.string().min(1).optional(),
});

export type ApiConfig = z.infer<typeof schema>;
export function loadConfig(source: NodeJS.ProcessEnv = process.env): ApiConfig {
  return schema.parse(source);
}
