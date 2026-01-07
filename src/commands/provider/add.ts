import { Command, Args } from "@oclif/core";
import inquirer from "inquirer";
import chalk from "chalk";
import { pluginSystem } from "../../core/plugin-system";
import { ConfigManager } from "../../config";
import { KeychainStorage } from "../../storage/keychain-storage";

export default class ProviderAdd extends Command {
  static description = "Configure a new provider";

  static examples = [
    `$ hydra-keys provider add openrouter`,
    `$ hydra-keys provider add convex`,
  ];

  static args = {
    provider: Args.string({
      description: "Provider name",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ProviderAdd);
    const provider = pluginSystem.get(args.provider);

    if (!provider) {
      this.error(
        chalk.red(`Unknown provider: ${args.provider}\n\n`) +
          chalk.gray("Available providers: ") +
          pluginSystem
            .list()
            .map((p) => p.name)
            .join(", "),
      );
      return;
    }

    const configManager = new ConfigManager();
    const storage = new KeychainStorage();

    if (!configManager.configExists()) {
      this.error(
        chalk.red('Configuration not found. Run "hydra-keys init" first.'),
      );
      return;
    }

    const appConfig = await configManager.loadConfig();
    const providerConfig = appConfig.providers[args.provider];

    if (!providerConfig || !providerConfig.configured) {
      this.warn(chalk.yellow(`Provider ${args.provider} is not configured.`));
    }

    this.log("");
    this.log(chalk.blue.bold(`Configuring ${provider.displayName}`));
    if (provider.keysUrl) {
      this.log(
        chalk.gray(`Get your API key here: ${chalk.cyan(provider.keysUrl)}`),
      );
    }
    this.log("");

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "serviceKey",
        message: "Service/Admin API Key:",
        validate: (input: string) => {
          if (!input.trim()) {
            return "Service key is required.";
          }
          return true;
        },
      },
    ]);

    if (answers.serviceKey.trim()) {
      const serviceKeyId = `${args.provider}_${Date.now()}`;

      try {
        await storage.store(serviceKeyId, answers.serviceKey);

        const providerConfig: {
          configured: boolean;
          serviceKeyId: string;
          config?: { projectId: string; teamId: string };
        } = {
          configured: true,
          serviceKeyId,
        };

        if (args.provider === "convex") {
          providerConfig.config = {
            projectId: answers.projectId,
            teamId: answers.teamId,
          };
        }

        const newConfig = await configManager.loadConfig();
        newConfig.providers[args.provider] = providerConfig;
        await configManager.saveConfig(newConfig);

        this.log(chalk.green.bold("✓ Provider configured successfully!"));
        this.log(chalk.gray("Service key stored securely in keychain."));
        this.log(chalk.gray(`Key ID: ${serviceKeyId}`));
      } catch (error: any) {
        this.error(chalk.red(`Failed to configure provider: ${error.message}`));
      }
    } else {
      this.warn(chalk.yellow("Service key is empty."));
    }
  }
}
