import { Command, Args } from "@oclif/core";
import chalk from "chalk";
import Table from "cli-table3";
import { ConfigManager } from "../../config";

export default class ConfigShow extends Command {
  static description = "Show all configuration";

  static examples = [`$ hydra-keys config show`];

  async run(): Promise<void> {
    const configManager = new ConfigManager();

    if (!configManager.configExists()) {
      this.error(
        chalk.red('Configuration not found. Run "hydra-keys init" first.'),
      );
      return;
    }

    const config = await configManager.loadConfig();

    this.log(chalk.blue.bold("Hydra-Keys Configuration"));
    this.log(chalk.blue("═".repeat(30)));
    this.log("");

    this.log(
      `${chalk.bold("Version:")}           ${chalk.cyan(config.version)}`,
    );
    this.log(
      `${chalk.bold("Storage:")}          ${chalk.cyan(config.storage.backend)}`,
    );

    if (Object.keys(config.providers).length > 0) {
      this.log(
        `${chalk.bold("Providers:")}         ${chalk.yellow("None configured")}`,
      );
    } else {
      this.log(
        `${chalk.bold("Providers:")}         ${Object.keys(config.providers)
          .map((p, i, arr) => {
            const isConfigured = config.providers[p].configured;
            return (
              (i > 0 ? ", " : "") +
              (isConfigured ? chalk.green(p) : chalk.gray(p))
            );
          })
          .join("")}`,
      );
    }

    if (config.plugins && config.plugins.length > 0) {
      this.log(
        `${chalk.bold("Plugins:")}          ${config.plugins.join(", ")}`,
      );
    }

    if (config.defaults) {
      this.log("");
      this.log(chalk.bold("Defaults:"));
      const table = new Table({
        head: ["Setting", "Value"],
        colWidths: [20, 30],
      });

      if (config.defaults.provider) {
        table.push(["Provider", config.defaults.provider]);
      }
      if (config.defaults.keyLimit) {
        table.push(["Key Limit", String(config.defaults.keyLimit)]);
      }
      if (config.defaults.limitReset) {
        table.push(["Limit Reset", config.defaults.limitReset]);
      }

      if (table.length > 0) {
        this.log(table.toString());
      }
    }

    this.log("");
    this.log(chalk.gray(`Config Path: ${configManager.getConfigPath()}`));
  }
}
