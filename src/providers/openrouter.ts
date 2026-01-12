import axios from "axios";
import {
  Provider,
  CreateKeyOptions,
  KeyResult,
  ProviderConfig,
  ValidationResult,
} from "./base";
import { loadProviderConfig } from "./helper";

const API_BASE_URL = "https://openrouter.ai/api/v1";

export const openrouterProvider: Provider = {
  name: "openrouter",
  displayName: "OpenRouter",
  version: "1.0.0",
  keysUrl: "https://openrouter.ai/settings/keys",

  async createKey(options: CreateKeyOptions): Promise<KeyResult> {
    const config = await loadProviderConfig("openrouter");
    const response = await axios.post(
      `${API_BASE_URL}/keys`,
      {
        name: options.name,
        limit: options.limit,
        limit_reset: options.limitReset,
        expires_at: options.expiresAt?.toISOString(),
      },
      {
        headers: {
          Authorization: `Bearer ${config.serviceKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const { data, key } = response.data;
    return {
      id: data.hash,
      name: data.name,
      key: key,
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      limit: data.limit,
      limitReset: data.limit_reset,
    };
  },

  async listKeys(): Promise<KeyResult[]> {
    const config = await loadProviderConfig("openrouter");
    const response = await axios.get(`${API_BASE_URL}/keys`, {
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
      },
    });

    return response.data.data.map((key: any) => ({
      id: key.id,
      name: key.name,
      key: "••••",
      createdAt: new Date(key.created_at),
      expiresAt: key.expires_at ? new Date(key.expires_at) : undefined,
      limit: key.limit,
      limitReset: key.limit_reset,
    }));
  },

  async deleteKey(keyId: string): Promise<void> {
    const config = await loadProviderConfig("openrouter");
    await axios.delete(`${API_BASE_URL}/keys/${keyId}`, {
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
      },
    });
  },

  async validateConfig(config: ProviderConfig): Promise<ValidationResult> {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/key`, {
        headers: {
          Authorization: `Bearer ${config.serviceKey}`,
        },
        timeout: 5000,
      });
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
};
