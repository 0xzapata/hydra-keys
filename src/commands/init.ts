import { Command, Flags } from "@oclif/core";
import inquirer from "inquirer";
import chalk from "chalk";
import { ConfigManager } from "../config";
import { StorageManager } from "../storage";
import { pluginSystem } from "../core/plugin-system";
import { Config } from "../config/schema";

export default class Init extends Command {
  static description = "Initialize hydra-keys configuration";

  static examples = [
    `$ hydra-keys init
Start interactive setup
`,
  ];

  static flags = {
    force: Flags.boolean({
      char: "f",
      description: "Force reinitialize (overwrites existing config)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Init);

    const configManager = new ConfigManager();
    const storageManager = new StorageManager();

    if (configManager.configExists() && !flags.force) {
      this.warn(
        chalk.yellow(
          "Configuration already exists. Use --force to reinitialize.",
        ),
      );
      const answers = await inquirer.prompt([
        {
          type: "confirm",
          name: "continue",
          message: "Do you want to continue anyway?",
          default: false,
        },
      ]);

      if (!answers.continue) {
        this.log("Setup cancelled.");
        return;
      }
    }

    this.log(chalk.blue.bold("🐉 Welcome to hydra-keys setup!"));
    this.log("");

    this.log("Initializing plugin system...");
    await pluginSystem.initializeBuiltInProviders();
    this.log(chalk.green("✓ Built-in providers registered"));

    this.log("");
    this.log("Checking secure storage...");
    const storageStatus = await storageManager.checkStorage();
    const backend = storageStatus.available
      ? ("keychain" as const)
      : ("encrypted-file" as const);

    if (storageStatus.available) {
      this.log(chalk.green("✓ Keychain storage available"));
    } else {
      this.log(
        chalk.yellow(
          "⚠ Keychain not available, will use encrypted file storage",
        ),
      );
    }
    this.log("");

    const config: Config = {
      version: "1",
      storage: {
        backend,
      },
      providers: {},
      plugins: [],
      defaults: {
        provider: "openrouter",
        keyLimit: 100,
        limitReset: "monthly",
      },
    };

    await configManager.saveConfig(config);

    this.log(chalk.green.bold("✓ Setup complete!"));
    this.log("");
    this.log("Next steps:");
    this.log("  1. Add a provider: hydra-keys provider add <provider-name>");
    this.log(
      "  2. Create a key: hydra-keys key create <provider-name> --name <name>",
    );
    this.log("");
    this.log('Run "hydra-keys help" for more information.');
  }
}
