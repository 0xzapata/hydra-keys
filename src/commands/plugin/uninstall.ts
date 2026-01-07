import { Command, Args } from "@oclif/core";
import chalk from "chalk";
import { exec } from "child_process";
import { promisify } from "util";
import { ConfigManager } from "../../config";

const execAsync = promisify(exec);

export default class PluginUninstall extends Command {
  static description = "Uninstall a plugin package";

  static examples = [
    `$ hydra-keys plugin uninstall hydra-keys-provider-anthropic`,
  ];

  static args = {
    package: Args.string({
      description: "NPM package name",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(PluginUninstall);
    const { package: packageName } = args;

    this.log(chalk.blue.bold(`Uninstalling ${packageName}...`));
    this.log("");

    try {
      await execAsync(`npm uninstall ${packageName}`);

      this.log(chalk.green.bold("✓ Plugin uninstalled successfully!"));
    } catch (error: any) {
      this.error(chalk.red(`Failed to uninstall plugin: ${error.message}`));
      throw error;
    }
  }
}
