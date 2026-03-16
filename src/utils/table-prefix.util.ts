import { getMetadataArgsStorage } from "typeorm";
import { UserEntity } from "../entities/user.entity";
import { SessionEntity } from "../entities/session.entity";

const ENTITY_TABLE_MAP = new Map<Function, string>([
  [UserEntity, "users"],
  [SessionEntity, "sessions"],
]);

/**
 * Patches TypeORM metadata at runtime so doorkeeper tables use the configured
 * prefix. Must be called before the TypeORM DataSource is initialized.
 *
 * @example applyTablePrefix("dk")   → dk_users, dk_sessions
 * @example applyTablePrefix("acme") → acme_users, acme_sessions
 */
export function applyTablePrefix(prefix: string): void {
  const storage = getMetadataArgsStorage();

  for (const tableMeta of storage.tables) {
    const baseName = ENTITY_TABLE_MAP.get(tableMeta.target as Function);
    if (baseName) {
      tableMeta.name = `${prefix}_${baseName}`;
    }
  }
}
