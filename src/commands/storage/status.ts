import { Command } from "@oclif/core";
import chalk from "chalk";
import Table from "cli-table3";
import { ConfigManager } from "../../config";
import { KeychainStorage } from "../../storage/keychain-storage";

export default class StorageStatus extends Command {
  static description = "Show storage status";

  static examples = [`$ hydra-keys storage status`];

  async run(): Promise<void> {
    this.log(chalk.blue.bold("Storage Status"));
    this.log(chalk.blue("═".repeat(20)));
    this.log("");

    const configManager = new ConfigManager();

    if (!configManager.configExists()) {
      this.warn(
        chalk.yellow('Configuration not found. Run "hydra-keys init" first.'),
      );
      return;
    }

    const config = await configManager.loadConfig();

    const table = new Table({
      head: ["Setting", "Value"],
      colWidths: [25, 50],
      wordWrap: true,
    });

    const backend = config.storage.backend;
    table.push([
      "Backend",
      backend === "keychain"
        ? chalk.green("Keychain")
        : chalk.yellow("Encrypted File"),
    ]);

    try {
      const keychain = new KeychainStorage();
      const keys = await keychain.list();

      if (backend === "keychain") {
        table.push(["Keys in Keychain", chalk.cyan(String(keys.length))]);
      } else {
        table.push(["Keys in Keychain", chalk.gray("(not in use)")]);
      }
    } catch (error: any) {
      table.push([
        "Keychain Status",
        chalk.red("Unavailable: ") + error.message,
      ]);
    }

    table.push(["Config Path", chalk.gray(configManager.getConfigPath())]);
    table.push(["Version", chalk.gray(config.version)]);

    this.log(table.toString());
  }
}
