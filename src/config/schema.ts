import { z } from "zod";

export const configSchema = z.object({
  version: z.string().default("1"),
  storage: z.object({
    backend: z.enum(["keychain", "encrypted-file"]).default("keychain"),
  }),
  providers: z.record(
    z.object({
      configured: z.boolean(),
      serviceKeyId: z.string(),
      config: z.record(z.any()).optional(),
    }),
  ),
  plugins: z.array(z.string()).default([]),
  defaults: z
    .object({
      provider: z.string().optional(),
      keyLimit: z.number().optional(),
      limitReset: z.enum(["daily", "weekly", "monthly"]).optional(),
    })
    .optional(),
});

export type Config = z.infer<typeof configSchema>;

export interface ProviderConfigEntry {
  configured: boolean;
  serviceKeyId: string;
  config?: Record<string, any>;
}

export const defaultConfig: Config = {
  version: "1",
  storage: {
    backend: "keychain",
  },
  providers: {},
  plugins: [],
  defaults: {
    provider: "openrouter",
    keyLimit: 100,
    limitReset: "monthly",
  },
};
