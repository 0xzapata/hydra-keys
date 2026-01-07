import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { configSchema, Config } from './schema';

const CONFIG_DIR = path.join(os.homedir(), '.hydra-keys');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export class ConfigManager {
  async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create config directory: ${error}`);
    }
  }

  configExists(): boolean {
    const exists = require('fs').existsSync(CONFIG_FILE);
    return exists;
  }

  async loadConfig(): Promise<Config> {
    if (!this.configExists()) {
      throw new Error('Configuration not found. Run "hydra-keys init" first.');
    }

    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(configData);

    return configSchema.parse(parsed);
  }

  async saveConfig(config: Config): Promise<void> {
    await this.ensureConfigDir();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  getConfigPath(): string {
    return CONFIG_FILE;
  }
}
