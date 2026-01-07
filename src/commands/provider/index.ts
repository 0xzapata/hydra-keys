import { Command, Flags } from "@oclif/core";
import chalk from "chalk";
import Table from "cli-table3";
import { pluginSystem } from "../../core/plugin-system";

export default class ProviderList extends Command {
  static description = "List available providers";

  static examples = [`$ hydra-keys provider list`];

  static flags = {
    status: Flags.boolean({
      char: "s",
      description: "Show configuration status for each provider",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ProviderList);
    const providers = pluginSystem.list();

    if (flags.status) {
      this.showProviderStatus(providers);
    } else {
      this.showProviderList(providers);
    }
  }

  private showProviderList(providers: any[]): void {
    this.log(chalk.blue.bold("Available Providers"));
    this.log(chalk.blue("═".repeat(20)));
    this.log("");

    const table = new Table({
      head: ["Name", "Display Name", "Version"],
      colWidths: [15, 20, 10],
    });

    providers.forEach((provider) => {
      table.push([provider.name, provider.displayName, provider.version]);
    });

    this.log(table.toString());
    this.log("");
    this.log(`Total: ${providers.length} providers`);
  }

  private showProviderStatus(providers: any[]): void {
    this.log(chalk.blue.bold("Provider Status"));
    this.log(chalk.blue("═".repeat(20)));
    this.log("");

    const table = new Table({
      head: ["Name", "Status", "Configured"],
      colWidths: [15, 10, 15],
    });

    providers.forEach((provider) => {
      const { ConfigManager } = require("../../config");
      const configManager = new ConfigManager();
      const config = configManager.configExists()
        ? configManager.loadConfigSync?.()
        : null;
      const isConfigured =
        config?.providers?.[provider.name]?.configured || false;

      table.push([
        provider.name,
        isConfigured ? chalk.green("✓") : chalk.gray("✗"),
        isConfigured ? chalk.green("Yes") : chalk.gray("No"),
      ]);
    });

    this.log(table.toString());
  }
}
