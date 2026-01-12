import axios from "axios";
import {
  Provider,
  CreateKeyOptions,
  KeyResult,
  ProviderConfig,
  ValidationResult,
} from "./base";
import { loadProviderConfig } from "./helper";

const API_BASE_URL = "https://api.convex.dev/v1";

export const convexProvider: Provider = {
  name: "convex",
  displayName: "Convex",
  version: "1.0.0",
  keysUrl: "https://dashboard.convex.dev/settings",

  async createKey(options: CreateKeyOptions): Promise<KeyResult> {
    const config = await loadProviderConfig("convex");
    const response = await axios.post(
      `${API_BASE_URL}/deployments/${config.projectId}/create_deploy_key`,
      {},
      {
        headers: {
          Authorization: `Convex ${config.serviceKey}`,
        },
      },
    );

    const deployKey = response.data.deployKey;
    return {
      id: deployKey,
      name: options.name,
      key: deployKey,
      createdAt: new Date(),
    };
  },

  async listKeys(): Promise<KeyResult[]> {
    const config = await loadProviderConfig("convex");
    const response = await axios.get(`${API_BASE_URL}/deployments`, {
      headers: {
        Authorization: `Convex ${config.serviceKey}`,
      },
    });

    return response.data.deployments.map((deployment: any) => ({
      id: deployment.deployKey || deployment.id,
      name: deployment.name,
      key: "••••",
      createdAt: new Date(deployment.createTime || Date.now()),
    }));
  },

  async deleteKey(keyId: string): Promise<void> {
    throw new Error(
      "Convex deploy keys cannot be deleted programmatically. Please use the Convex dashboard.",
    );
  },

  async validateConfig(config: ProviderConfig): Promise<ValidationResult> {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: {
          Authorization: `Convex ${config.serviceKey}`,
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
