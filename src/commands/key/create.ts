import { Command, Args, Flags } from "@oclif/core";
import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs/promises";
import { pluginSystem } from "../../core/plugin-system";
import { CreateKeyOptions } from "../../providers/base";

export default class KeyCreate extends Command {
  static description = "Create a new API key";

  static examples = [
    `$ hydra-keys key create openrouter --name "Production"`,
    `$ hydra-keys key create openrouter --name "Dev" --limit 100 --reset monthly`,
  ];

  static args = {
    provider: Args.string({
      description: "Provider name",
      required: true,
    }),
  };

  static flags = {
    name: Flags.string({
      char: "n",
      description: "Key name",
    }),
    limit: Flags.string({
      char: "l",
      description: "Spending/usage limit",
    }),
    reset: Flags.string({
      char: "r",
      description: "Limit reset period (daily|weekly|monthly)",
    }),
    expires: Flags.string({
      char: "e",
      description: "Expiration date (ISO 8601)",
    }),
    output: Flags.string({
      char: "o",
      description: "Save key to file",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(KeyCreate);
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

    const createOptions = await this.getCreateOptions(flags);

    try {
      const keyResult = await provider.createKey(createOptions);

      this.log(chalk.green.bold("✓ Key created successfully!"));
      this.log("");

      this.showKeyDetails(provider.displayName, keyResult, createOptions);

      if (flags.output) {
        await this.saveKeyToFile(keyResult, flags.output);
      } else {
        this.log("");
        this.warn(
          chalk.yellow("⚠  Save this key now - it won't be shown again!"),
        );
      }
    } catch (error: any) {
      this.error(chalk.red(`Failed to create key: ${error.message}`));
      throw error;
    }
  }

  private async getCreateOptions(flags: any): Promise<CreateKeyOptions> {
    if (flags.name) {
      return {
        name: flags.name,
        limit: flags.limit ? parseFloat(flags.limit) : undefined,
        limitReset: flags.reset as "daily" | "weekly" | "monthly" | undefined,
        expiresAt: flags.expires ? new Date(flags.expires) : undefined,
      };
    }

    type PromptAnswers = {
      name: string;
      limit?: string;
      limitReset?: string;
      expiresAt?: string;
    };

    const answers = await inquirer.prompt<PromptAnswers>([
      {
        type: "input",
        name: "name",
        message: "Key name:",
        validate: (input: string) => {
          if (!input.trim()) {
            return "Key name is required.";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "limit",
        message: "Spending/usage limit (optional):",
      },
      {
        type: "list",
        name: "limitReset",
        message: "Limit reset period:",
        choices: ["daily", "weekly", "monthly", "None"],
        default: "monthly",
      },
      {
        type: "input",
        name: "expiresAt",
        message: "Expiration date (ISO 8601, optional):",
        validate: (input: string) => {
          if (input.trim()) {
            const date = new Date(input);
            if (isNaN(date.getTime())) {
              return "Invalid date format. Use ISO 8601 format (e.g., 2025-12-31).";
            }
          }
          return true;
        },
      },
    ]);

    return {
      name: answers.name,
      limit: answers.limit ? parseFloat(answers.limit) : undefined,
      limitReset:
        answers.limitReset === "None"
          ? undefined
          : (answers.limitReset as "daily" | "weekly" | "monthly" | undefined),
      expiresAt: answers.expiresAt ? new Date(answers.expiresAt) : undefined,
    };
  }

  private showKeyDetails(
    providerName: string,
    keyResult: any,
    options: CreateKeyOptions,
  ): void {
    this.log(`${chalk.bold("Name:")}           ${keyResult.name}`);
    this.log(`${chalk.bold("Key:")}            ${chalk.cyan(keyResult.key)}`);
    const limitText = options.limit
      ? `$${options.limit}${options.limitReset ? `/${options.limitReset}` : ""}`
      : "None";
    this.log(`${chalk.bold("Limit:")}          ${limitText}`);
    const expiresText = options.expiresAt
      ? options.expiresAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Never";
    this.log(`${chalk.bold("Expires:")}        ${expiresText}`);
  }

  private async saveKeyToFile(keyResult: any, filePath: string): Promise<void> {
    const output = {
      name: keyResult.name,
      key: keyResult.key,
      createdAt: keyResult.createdAt.toISOString(),
      expiresAt: keyResult.expiresAt?.toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(output, null, 2));
    this.log(chalk.green(`Key saved to ${filePath}`));
  }
}
