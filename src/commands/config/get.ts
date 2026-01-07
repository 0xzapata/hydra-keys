import { Command, Args } from "@oclif/core";
import chalk from "chalk";
import { ConfigManager } from "../../config";

export default class ConfigGet extends Command {
  static description = "Get a config value";

  static examples = [
    `$ hydra-keys config get storage.backend`,
    `$ hydra-keys config get defaults.provider`,
  ];

  static args = {
    key: Args.string({
      description: "Config key (dot notation)",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigGet);
    const { key: configKey } = args;

    const configManager = new ConfigManager();

    if (!configManager.configExists()) {
      this.error(
        chalk.red('Configuration not found. Run "hydra-keys init" first.'),
      );
      return;
    }

    const config = await configManager.loadConfig();

    const value = this.getNestedValue(config, configKey);

    if (value === undefined) {
      this.warn(chalk.yellow(`Config key "${configKey}" not found.`));
      return;
    }

    if (typeof value === "object") {
      this.log(JSON.stringify(value, null, 2));
    } else {
      this.log(String(value));
    }
  }

  private getNestedValue(obj: any, key: string): any {
    return key.split(".").reduce((current, prop) => {
      return current?.[prop];
    }, obj);
  }
}
