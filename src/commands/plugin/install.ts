import { Command, Args } from "@oclif/core";
import chalk from "chalk";
import { exec } from "child_process";
import { promisify } from "util";
import { ConfigManager } from "../../config";

const execAsync = promisify(exec);

export default class PluginInstall extends Command {
  static description = "Install a plugin package";

  static examples = [
    `$ hydra-keys plugin install hydra-keys-provider-anthropic`,
    `$ hydra-keys plugin install hydra-keys-provider-anthropic@latest`,
  ];

  static args = {
    package: Args.string({
      description: "NPM package name",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(PluginInstall);
    const { package: packageName } = args;

    this.log(chalk.blue.bold(`Installing ${packageName}...`));
    this.log("");

    try {
      await execAsync(`npm install ${packageName}`);

      this.log(chalk.green.bold("✓ Plugin installed successfully!"));
      this.log("");
      this.log(chalk.gray("Note: Plugins must register themselves on import."));
      this.log(
        chalk.gray("Check the plugin documentation for usage instructions."),
      );
    } catch (error: any) {
      this.error(chalk.red(`Failed to install plugin: ${error.message}`));
      this.error(chalk.gray("Make sure you have npm configured correctly."));
      throw error;
    }
  }
}
