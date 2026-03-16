import * as fs from "node:fs";
import * as path from "node:path";

export interface MigrationOptions {
  tablePrefix: string;
  outputDir: string;
}

export function generateMigration({ tablePrefix, outputDir }: MigrationOptions): string {
  const timestamp = Date.now();
  const className = `DoorkeeperInit${timestamp}`;
  const fileName  = `${timestamp}-DoorkeeperInit.ts`;
  const filePath  = path.join(outputDir, fileName);

  const content = buildMigrationContent(className, tablePrefix);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");

  return filePath;
}

function buildMigrationContent(className: string, p: string): string {
  return `import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class ${className} implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "${p}_users",
        columns: [
          { name: "id",            type: "uuid",      isPrimary: true, generationStrategy: "uuid", default: "gen_random_uuid()" },
          { name: "email",         type: "varchar",   isUnique: true,  isNullable: false },
          { name: "password_hash", type: "varchar",   isNullable: false },
          { name: "is_active",     type: "boolean",   default: true },
          { name: "created_at",    type: "timestamp", default: "now()" },
          { name: "updated_at",    type: "timestamp", default: "now()" },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "${p}_sessions",
        columns: [
          { name: "id",            type: "uuid",      isPrimary: true, generationStrategy: "uuid", default: "gen_random_uuid()" },
          { name: "user_id",       type: "uuid",      isNullable: false },
          { name: "access_token",  type: "varchar",   isNullable: false },
          { name: "refresh_token", type: "varchar",   isNullable: false, isUnique: true },
          { name: "ip_address",    type: "varchar",   isNullable: true },
          { name: "user_agent",    type: "varchar",   isNullable: true },
          { name: "device_type",   type: "varchar",   isNullable: true },
          { name: "device_name",   type: "varchar",   isNullable: true },
          { name: "browser_name",  type: "varchar",   isNullable: true },
          { name: "os_name",       type: "varchar",   isNullable: true },
          { name: "os_version",    type: "varchar",   isNullable: true },
          { name: "created_at",    type: "timestamp", default: "now()" },
          { name: "last_used_at",  type: "timestamp", isNullable: true },
          { name: "expires_at",    type: "timestamp", isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "${p}_sessions",
      new TableIndex({ name: "IDX_${p}_sessions_refresh_token", columnNames: ["refresh_token"] }),
    );

    await queryRunner.createForeignKey(
      "${p}_sessions",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedTableName: "${p}_users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("${p}_sessions", true);
    await queryRunner.dropTable("${p}_users", true);
  }
}
`;
}
