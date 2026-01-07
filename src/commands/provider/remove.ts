import { Command, Args } from "@oclif/core";
import inquirer from "inquirer";
import chalk from "chalk";
import { ConfigManager } from "../../config";
import { KeychainStorage } from "../../storage/keychain-storage";

export default class ProviderRemove extends Command {
  static description = "Remove a provider configuration";

  static examples = [`$ hydra-keys provider remove openrouter`];

  static args = {
    provider: Args.string({
      description: "Provider name",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ProviderRemove);
    const { provider: providerName } = args;

    const configManager = new ConfigManager();
    const storage = new KeychainStorage();

    if (!configManager.configExists()) {
      this.error(
        chalk.red('Configuration not found. Run "hydra-keys init" first.'),
      );
      return;
    }

    const config = await configManager.loadConfig();
    const providerConfig = config.providers[providerName];

    if (!providerConfig || !providerConfig.configured) {
      this.warn(chalk.yellow(`Provider ${providerName} is not configured.`));
      return;
    }

    this.log(chalk.blue.bold(`\nRemoving ${providerName} provider...\n`));

    const answers = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to remove ${providerName}?`,
        default: false,
      },
    ]);

    if (!answers.confirm) {
      this.log(chalk.yellow("Cancelled."));
      return;
    }

    try {
      await storage.delete(providerConfig.serviceKeyId);
      delete config.providers[providerName];
      await configManager.saveConfig(config);

      this.log(chalk.green.bold("✓ Provider removed successfully!"));
    } catch (error: any) {
      this.error(chalk.red(`Failed to remove provider: ${error.message}`));
      throw error;
    }
  }
}
