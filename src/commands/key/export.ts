import { Command, Args, Flags } from "@oclif/core";
import chalk from "chalk";
import fs from "fs/promises";
import { pluginSystem } from "../../core/plugin-system";

export default class KeyExport extends Command {
  static description = "Export keys to JSON";

  static examples = [
    `$ hydra-keys key export openrouter`,
    `$ hydra-keys key export openrouter --output ./keys.json`,
  ];

  static args = {
    provider: Args.string({
      description: "Provider name",
      required: true,
    }),
  };

  static flags = {
    output: Flags.string({
      char: "o",
      description: "Output file path",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(KeyExport);
    const { provider: providerName } = args;

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

    try {
      const keys = await provider.listKeys();

      const exportData = {
        provider: providerName,
        displayName: provider.displayName,
        exportedAt: new Date().toISOString(),
        keys: keys.map((k) => ({
          id: k.id,
          name: k.name,
          createdAt: k.createdAt.toISOString(),
          expiresAt: k.expiresAt?.toISOString(),
          limit: k.limit,
          limitReset: k.limitReset,
        })),
        total: keys.length,
      };

      const jsonOutput = JSON.stringify(exportData, null, 2);

      if (flags.output) {
        await fs.writeFile(flags.output, jsonOutput);
        this.log(chalk.green.bold("✓ Keys exported successfully!"));
        this.log(chalk.gray(`File: ${flags.output}`));
      } else {
        this.log(jsonOutput);
      }
    } catch (error: any) {
      this.error(chalk.red(`Failed to export keys: ${error.message}`));
      throw error;
    }
  }
}
