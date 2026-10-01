import { z } from "zod";
import { AppError } from "../errors/AppError.js";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DB_HOST: z.string().min(1).default("127.0.0.1"),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_NAME: z.string().min(1).default("dry_docks"),
  DB_USER: z.string().min(1).default("dry_docks_app"),
  DB_PASSWORD: z.string().default(""),
  CORS_ORIGIN: z.string().default("http://localhost:8080,http://localhost:5173")
});

export function readConfig(environment = process.env) {
  const result = envSchema.safeParse(environment);
  if (!result.success) {
    throw new AppError(500, "INVALID_CONFIGURATION", "Server configuration is invalid");
  }
  return {
    ...result.data,
    corsOrigins: result.data.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  };
}
