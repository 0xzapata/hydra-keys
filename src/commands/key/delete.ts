import { Command, Args } from "@oclif/core";
import inquirer from "inquirer";
import chalk from "chalk";
import { pluginSystem } from "../../core/plugin-system";

export default class KeyDelete extends Command {
  static description = "Delete an API key";

  static examples = [`$ hydra-keys key delete openrouter sk-or-123456`];

  static args = {
    provider: Args.string({
      description: "Provider name",
      required: true,
    }),
    keyId: Args.string({
      description: "Key ID to delete",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(KeyDelete);
    const { provider: providerName, keyId } = args;

    const provider = pluginSystem.get(providerName);

    if (!provider) {
      this.error(
        chalk.red(`Unknown provider: ${providerName}\n\n`) +
          chalk.gray("Available providers: ") +
          pluginSystem
            .list()
            .map((p) => p.name)
            .join(", "),
      );
      return;
    }

    if (!provider.deleteKey) {
      this.error(
        chalk.red(`${provider.displayName} does not support key deletion.`),
      );
      return;
    }

    this.log(
      chalk.blue.bold(`\nDeleting key from ${provider.displayName}...\n`),
    );

    const answers = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to delete key ${keyId}?`,
        default: false,
      },
    ]);

    if (!answers.confirm) {
      this.log(chalk.yellow("Cancelled."));
      return;
    }

    try {
      await provider.deleteKey(keyId);
      this.log(chalk.green.bold("✓ Key deleted successfully!"));
    } catch (error: any) {
      this.error(chalk.red(`Failed to delete key: ${error.message}`));
      throw error;
    }
  }
}
