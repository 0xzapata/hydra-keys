import { Command } from "@oclif/core";
import chalk from "chalk";
import Table from "cli-table3";
import { ConfigManager } from "../../config";
import { pluginSystem } from "../../core/plugin-system";

export default class PluginList extends Command {
  static description = "List installed plugins";

  static examples = [`$ hydra-keys plugin list`];

  async run(): Promise<void> {
    this.log(chalk.blue.bold("Installed Plugins"));
    this.log(chalk.blue("═".repeat(20)));
    this.log("");

    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();

    const table = new Table({
      head: ["Plugin", "Status"],
      colWidths: [30, 10],
    });

    const builtInProviders = pluginSystem.list().map((p) => p.name);

    config.plugins.forEach((plugin) => {
      const isBuiltIn = builtInProviders.includes(plugin);
      const status = isBuiltIn
        ? chalk.gray("(built-in)")
        : chalk.green("installed");

      table.push([plugin, status]);
    });

    if (config.plugins.length === 0) {
      this.log(chalk.yellow("No plugins installed."));
      this.log("");
      this.log(
        chalk.gray("Built-in providers: ") + builtInProviders.join(", "),
      );
    } else {
      this.log(table.toString());
      this.log("");
      this.log(
        chalk.gray(
          `Total: ${config.plugins.length} plugin${config.plugins.length !== 1 ? "s" : ""}`,
        ),
      );
    }
  }
}
