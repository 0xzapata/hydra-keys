import { Command, Args } from "@oclif/core";
import chalk from "chalk";
import { ConfigManager } from "../../config";

export default class ConfigSet extends Command {
  static description = "Set a config value";

  static examples = [
    `$ hydra-keys config set storage.backend encrypted-file`,
    `$ hydra-keys config set defaults.provider openrouter`,
  ];

  static args = {
    key: Args.string({
      description: "Config key (dot notation)",
      required: true,
    }),
    value: Args.string({
      description: "Value to set",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigSet);
    const { key: configKey, value } = args;

    const configManager = new ConfigManager();

    if (!configManager.configExists()) {
      this.error(
        chalk.red('Configuration not found. Run "hydra-keys init" first.'),
      );
      return;
    }

    const config = await configManager.loadConfig();

    const parsedValue = this.parseValue(value);
    this.setNestedValue(config, configKey, parsedValue);

    try {
      await configManager.saveConfig(config);
      this.log(chalk.green.bold("✓ Config updated successfully!"));
      this.log("");
      this.log(`${chalk.bold("Key:")}   ${configKey}`);
      this.log(
        `${chalk.bold("Value:")} ${chalk.cyan(typeof parsedValue === "object" ? JSON.stringify(parsedValue) : String(parsedValue))}`,
      );
    } catch (error: any) {
      this.error(chalk.red(`Failed to save config: ${error.message}`));
      throw error;
    }
  }

  private parseValue(value: string): any {
    if (value === "true") return true;
    if (value === "false") return false;
    if (!isNaN(Number(value))) return Number(value);

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private setNestedValue(obj: any, key: string, value: any): void {
    const keys = key.split(".");
    const lastKey = keys.pop()!;

    const target = keys.reduce((current, prop) => {
      if (!(prop in current)) {
        current[prop] = {};
      }
      return current[prop];
    }, obj);

    target[lastKey] = value;
  }
}
