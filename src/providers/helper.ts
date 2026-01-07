import { ConfigManager } from "../config";
import { KeychainStorage } from "../storage/keychain-storage";
import { ProviderConfig } from "./base";

export async function loadProviderConfig(
  providerName: string,
): Promise<ProviderConfig> {
  const configManager = new ConfigManager();
  const storage = new KeychainStorage();

  if (!configManager.configExists()) {
    throw new Error('Configuration not found. Run "hydra-keys init" first.');
  }

  const appConfig = await configManager.loadConfig();
  const providerConfig = appConfig.providers[providerName];

  if (!providerConfig || !providerConfig.configured) {
    throw new Error(
      `${providerName} provider not configured. Run "hydra-keys provider add ${providerName}" first.`,
    );
  }

  const serviceKey = await storage.retrieve(providerConfig.serviceKeyId);
  if (!serviceKey) {
    throw new Error(
      `${providerName} service key not found in keychain. Run "hydra-keys provider add ${providerName}" to reconfigure.`,
    );
  }

  return {
    serviceKey,
    ...(providerConfig.config || {}),
  };
}
