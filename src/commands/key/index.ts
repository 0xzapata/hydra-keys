import { Command, Args, Flags } from "@oclif/core";
import chalk from "chalk";
import Table from "cli-table3";
import { pluginSystem } from "../../core/plugin-system";
import { KeyResult } from "../../providers/base";

export default class KeyList extends Command {
  static description = "List keys for a provider";

  static examples = [
    `$ hydra-keys key list openrouter`,
    `$ hydra-keys key list convex`,
  ];

  static args = {
    provider: Args.string({
      description: "Provider name",
      required: true,
    }),
  };

  static flags = {
    json: Flags.boolean({
      description: "Output as JSON",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(KeyList);
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

      if (flags.json) {
        this.log(
          JSON.stringify(
            {
              provider: providerName,
              displayName: provider.displayName,
              keys: keys.map((k) => ({
                id: k.id,
                name: k.name,
                createdAt: k.createdAt.toISOString(),
                expiresAt: k.expiresAt?.toISOString(),
                limit: k.limit,
                limitReset: k.limitReset,
              })),
              total: keys.length,
            },
            null,
            2,
          ),
        );
        return;
      }

      this.showKeyTable(provider, keys);
    } catch (error: any) {
      this.error(chalk.red(`Failed to list keys: ${error.message}`));
      throw error;
    }
  }

  private showKeyTable(provider: any, keys: KeyResult[]): void {
    this.log(chalk.blue.bold(`${provider.displayName} Keys`));
    this.log(chalk.blue("═".repeat(40)));
    this.log("");

    if (keys.length === 0) {
      this.log(chalk.yellow("No keys found."));
      return;
    }

    const table = new Table({
      head: ["Name", "ID", "Created", "Expires", "Limit"],
      colWidths: [20, 20, 18, 18, 12],
      wordWrap: true,
    });

    keys.forEach((key) => {
      const truncatedId = this.truncateId(key.id);
      const expiresAt = key.expiresAt
        ? this.formatDate(key.expiresAt)
        : "Never";
      const limit = key.limit ? `$${key.limit}` : "-";
      const reset = key.limitReset ? `/${key.limitReset}` : "";

      table.push([
        key.name,
        truncatedId,
        this.formatDate(key.createdAt),
        expiresAt,
        limit + reset,
      ]);
    });

    this.log(table.toString());
    this.log("");
    this.log(
      chalk.gray(`Total: ${keys.length} key${keys.length !== 1 ? "s" : ""}`),
    );
  }

  private truncateId(id: string): string {
    if (id.length <= 12) {
      return id;
    }
    return `${id.slice(0, 4)}••••${id.slice(-4)}`;
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (diffDays < 0) {
      return chalk.red(formatted);
    } else if (diffDays <= 7) {
      return chalk.yellow(formatted);
    }

    return chalk.green(formatted);
  }
}
