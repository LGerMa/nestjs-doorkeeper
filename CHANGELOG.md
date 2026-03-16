# Changelog

All notable changes to `@lgerma/nestjs-doorkeeper` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-rc.3] - 2026-03-16

### Fixed
- Added `@nestjs/typeorm` to `peerDependencies` (required by `AuthModule`)

---

## [1.0.0-rc.2] - 2026-03-16

### Fixed
- Migration generator now uses `gen_random_uuid()` instead of `uuid_generate_v4()` (no `uuid-ossp` extension required)
- TypeORM entity columns now have explicit `type` definitions to avoid `ColumnTypeUndefinedError` in consuming projects

---

## [1.0.0-rc.1] - 2026-03-16

First release candidate. Core authentication features are complete and working.

### Added
- `AuthModule.forRoot()` and `forRootAsync()` with configurable `tablePrefix`, `routePrefix`, `currentUser` mode, and JWT options
- JWT access token generation and verification via `@nestjs/jwt`
- Opaque refresh token generation with session rotation (delete old, create new)
- `SessionService` — create, rotate, revoke, list sessions
- `AuthService` — `register`, `login`, `logout`, `logoutAll`
- `TokenService` — sign/verify access tokens, generate refresh tokens
- `TypeOrmAdapter` with `UserRepository` and `SessionRepository`
- `applyTablePrefix()` — runtime TypeORM table name override via `getMetadataArgsStorage()`
- `JwtAuthGuard` with `@Public()` bypass and three `CurrentUserMode` options (`subset`, `payload`, `entity`)
- `RefreshGuard` — extracts and validates refresh token from request body
- `@CurrentUser()` param decorator
- `AuthController` with `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`
- Runtime route prefix override via `Reflect.defineMetadata`
- Device and browser detection utility (`parseDevice`) — supports iOS, Android, Windows, macOS, Linux
- `parseTtlMs` / `parseTtlDate` TTL utilities
- `npx @lgerma/nestjs-doorkeeper init` CLI command — detects ORM, prompts for config, generates TypeORM migration
- TypeORM migration generator using `gen_random_uuid()` (PostgreSQL 13+, no extension required)
- CLI auto-detects `migrations/` subfolder location relative to `data-source.ts`

### Notes
- Requires PostgreSQL 13+ for `gen_random_uuid()`
- Supports NestJS 10 and 11
- TypeORM is the only supported adapter in this release
