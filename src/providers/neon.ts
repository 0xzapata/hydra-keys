import axios from "axios";
import {
  Provider,
  CreateKeyOptions,
  KeyResult,
  ProviderConfig,
  ValidationResult,
} from "./base";
import { loadProviderConfig } from "./helper";

const NEON_API_BASE = "https://console.neon.tech/api/v2";

interface NeonApiKey {
  id: number;
  name: string;
  created_at: string;
  last_used_at?: string;
  last_used_from_addr?: string;
  revoked?: boolean;
  project_id?: string;
  created_by?: string;
}

interface NeonCreateKeyResponse {
  id: number;
  key: string;
  name?: string;
  created_at?: string;
  created_by?: string;
  project_id?: string;
}

export const neonProvider: Provider = {
  name: "neon",
  displayName: "Neon",
  version: "1.0.0",
  keysUrl: "https://console.neon.tech/app/settings/api-keys",

  async createKey(options: CreateKeyOptions): Promise<KeyResult> {
    const config = await loadProviderConfig("neon");

    let url: string;
    const body: Record<string, string> = { key_name: options.name };

    if (config.orgId) {
      url = `${NEON_API_BASE}/organizations/${config.orgId}/api_keys`;
      if (config.projectId) {
        body.project_id = config.projectId;
      }
    } else {
      url = `${NEON_API_BASE}/api_keys`;
    }

    const response = await axios.post<NeonCreateKeyResponse>(url, body, {
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = response.data;
    return {
      id: String(data.id),
      name: data.name || options.name,
      key: data.key,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      metadata: {
        createdBy: data.created_by,
        projectId: data.project_id,
        orgId: config.orgId,
      },
    };
  },

  async listKeys(): Promise<KeyResult[]> {
    const config = await loadProviderConfig("neon");

    let url: string;
    if (config.orgId) {
      url = `${NEON_API_BASE}/organizations/${config.orgId}/api_keys`;
    } else {
      url = `${NEON_API_BASE}/api_keys`;
    }

    const response = await axios.get<NeonApiKey[]>(url, {
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
        Accept: "application/json",
      },
    });

    return response.data
      .filter((key) => !key.revoked)
      .map((key) => ({
        id: String(key.id),
        name: key.name,
        key: "••••",
        createdAt: new Date(key.created_at),
        metadata: {
          lastUsedAt: key.last_used_at,
          lastUsedFromAddr: key.last_used_from_addr,
          projectId: key.project_id,
          createdBy: key.created_by,
        },
      }));
  },

  async deleteKey(keyId: string): Promise<void> {
    const config = await loadProviderConfig("neon");

    let url: string;
    if (config.orgId) {
      url = `${NEON_API_BASE}/organizations/${config.orgId}/api_keys/${keyId}`;
    } else {
      url = `${NEON_API_BASE}/api_keys/${keyId}`;
    }

    await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
        Accept: "application/json",
      },
    });
  },

  async validateConfig(config: ProviderConfig): Promise<ValidationResult> {
    try {
      const response = await axios.get(`${NEON_API_BASE}/projects`, {
        headers: {
          Authorization: `Bearer ${config.serviceKey}`,
          Accept: "application/json",
        },
        timeout: 5000,
      });
      return { valid: true };
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      return {
        valid: false,
        error: axiosError.response?.data?.message || axiosError.message,
      };
    }
  },
};
