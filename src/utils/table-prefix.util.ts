import { getMetadataArgsStorage } from "typeorm";

export function applyTablePrefix(prefix: string): void {
  const storage = getMetadataArgsStorage();

  const targets = [
    { target: "UserEntity", table: "users" },
    { target: "SessionEntity", table: "sessions" },
  ];

  storage.tables
    .filter((t) =>
      targets.some((e) => e.target === (t.target as Function).name),
    )
    .forEach((t) => {
      const match = targets.find(
        (e) => e.target === (t.target as Function).name,
      );
      if (match) {
        t.name = `${prefix}_${match.table}`;
      }
    });
}
