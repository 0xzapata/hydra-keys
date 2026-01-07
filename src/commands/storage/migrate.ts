import { Command } from "@oclif/core";
import inquirer from "inquirer";
import chalk from "chalk";
import { ConfigManager } from "../../config";
import { KeychainStorage } from "../../storage/keychain-storage";

export default class StorageMigrate extends Command {
  static description = "Migrate between storage backends";

  static examples = [`$ hydra-keys storage migrate`];

  async run(): Promise<void> {
    const configManager = new ConfigManager();

    if (!configManager.configExists()) {
      this.error(
        chalk.red('Configuration not found. Run "hydra-keys init" first.'),
      );
      return;
    }

    const config = await configManager.loadConfig();
    const currentBackend = config.storage.backend;

    this.log(chalk.blue.bold("Storage Migration"));
    this.log(chalk.blue("═".repeat(20)));
    this.log("");
    this.log(
      `Current backend: ${currentBackend === "keychain" ? chalk.green("Keychain") : chalk.yellow("Encrypted File")}`,
    );
    this.log("");

    const { targetBackend } = await inquirer.prompt<{ targetBackend: string }>([
      {
        type: "list",
        name: "targetBackend",
        message: "Select target backend:",
        choices: [
          { name: "Keychain (Recommended)", value: "keychain" },
          { name: "Encrypted File", value: "encrypted-file" },
        ],
        default: currentBackend === "keychain" ? "encrypted-file" : "keychain",
      },
    ]);

    if (targetBackend === currentBackend) {
      this.warn(chalk.yellow("Already using selected backend."));
      return;
    }

    const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
      {
        type: "confirm",
        name: "confirm",
        message: `Migrate from ${currentBackend} to ${targetBackend}?`,
        default: false,
      },
    ]);

    if (!confirm) {
      this.log(chalk.yellow("Cancelled."));
      return;
    }

    await this.performMigration(
      configManager,
      config,
      currentBackend,
      targetBackend,
    );
  }

  private async performMigration(
    configManager: ConfigManager,
    config: any,
    fromBackend: string,
    toBackend: string,
  ): Promise<void> {
    this.log("");
    this.log(chalk.bold(`Migrating from ${fromBackend} to ${toBackend}...`));
    this.log("");

    try {
      if (fromBackend === "keychain" && toBackend === "encrypted-file") {
        await this.migrateKeychainToEncrypted(configManager, config);
      } else if (fromBackend === "encrypted-file" && toBackend === "keychain") {
        await this.migrateEncryptedToKeychain(configManager, config);
      }

      config.storage.backend = toBackend as "keychain" | "encrypted-file";
      await configManager.saveConfig(config);

      this.log("");
      this.log(chalk.green.bold("✓ Migration completed successfully!"));
      this.log(chalk.gray(`New backend: ${toBackend}`));
    } catch (error: any) {
      this.error(chalk.red(`Migration failed: ${error.message}`));
      throw error;
    }
  }

  private async migrateKeychainToEncrypted(
    configManager: ConfigManager,
    config: any,
  ): Promise<void> {
    const keychain = new KeychainStorage();
    throw new Error(
      "Encrypted storage not yet implemented. Please use keychain storage.",
    );
  }

  private async migrateEncryptedToKeychain(
    configManager: ConfigManager,
    config: any,
  ): Promise<void> {
    const keychain = new KeychainStorage();
    throw new Error(
      "Encrypted storage not yet implemented. Please use keychain storage.",
    );
  }
}
