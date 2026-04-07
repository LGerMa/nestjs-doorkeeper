# @lgerma/nestjs-doorkeeper

A drop-in authentication module for NestJS inspired by Rails' Doorkeeper.
Handles sessions, access tokens, refresh tokens, and device tracking out of the box.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start (CLI)](#quick-start-cli)
- [Module Registration](#module-registration)
- [Auth Routes](#auth-routes)
- [Guards](#guards)
- [Custom Auth Controller](#custom-auth-controller)
- [Decorators](#decorators)
- [Current User Modes](#current-user-modes)
- [Configuration Reference](#configuration-reference)
- [Sub-path Exports](#sub-path-exports)
- [Entities](#entities)
- [Token Strategy](#token-strategy)
- [Device & Browser Tracking](#device--browser-tracking)

---

## Features

- `POST /auth/register` — create user + session
- `POST /auth/login` — validate credentials, create session
- `POST /auth/logout` — revoke current session
- `POST /auth/refresh` — rotate both tokens
- Global `JwtAuthGuard` — all routes protected by default
- `@Public()` — opt-out individual routes from auth
- `@CurrentUser()` — inject authenticated user anywhere
- Session-based refresh tokens — opaque, stored in DB, rotated on use
- Device & browser metadata captured on every login/refresh
- Configurable table prefix, route prefix, and token TTLs
- No Passport.js dependency

---

## Installation

```bash
npm install @lgerma/nestjs-doorkeeper
```

**Peer dependencies** (must already be installed in your app):

```bash
npm install @nestjs/common @nestjs/core @nestjs/jwt typeorm reflect-metadata
```

---

## Quick Start (CLI)

Run the init command inside your NestJS project:

```bash
npx @lgerma/nestjs-doorkeeper init
```

The CLI will prompt you for:

| Prompt | Default |
|--------|---------|
| Access token TTL | `15m` |
| Refresh token TTL | `30d` |
| JWT secret env var | `JWT_SECRET` |
| Table prefix | `auth` |
| Route prefix | `auth` |
| Migrations output folder | auto-detected from `data-source.ts` location (e.g. `src/database/migrations`), falls back to `src/migrations` |

The migrations folder is detected automatically by searching for a `data-source.ts` file under `src/`. If found, the migration is placed as a sibling in a `migrations/` subfolder next to it. You can override the path at the prompt.

This will:
1. Detect your ORM (TypeORM supported)
2. Ask a few config questions (with defaults)
3. Generate a TypeORM migration file in the detected (or chosen) migrations folder
4. Print exact next steps

Then run the migration:

```bash
npx typeorm migration:run -d src/data-source.ts
```

---

## Module Registration

### Minimal (synchronous)

```ts
import { AuthModule } from '@lgerma/nestjs-doorkeeper';

@Module({
  imports: [
    AuthModule.forRoot({
      jwt: { secret: process.env.JWT_SECRET },
    }),
  ],
})
export class AppModule {}
```

### With full config

```ts
AuthModule.forRoot({
  tablePrefix: 'auth',      // default: 'auth' → tables: auth_users, auth_sessions
  routePrefix: 'auth',      // default: 'auth' → routes: /auth/register, /auth/login, ...
  global: true,             // default: true  → JwtAuthGuard applied globally
  currentUser: 'subset',    // default: 'subset' → see Current User Modes
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenTtl: '15m',  // default: '15m'
    refreshTokenTtl: '30d', // default: '30d'
  },
})
```

### Async (with ConfigService)

```ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@lgerma/nestjs-doorkeeper';

AuthModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    jwt: {
      secret: config.get<string>('JWT_SECRET'),
      accessTokenTtl: '15m',
      refreshTokenTtl: '30d',
    },
    tablePrefix: 'auth',
    routePrefix: 'auth',
  }),
})
```

---

## Auth Routes

All routes are registered automatically. The prefix is configurable via `routePrefix` (default: `auth`).

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/auth/register` | Public | `{ email, password }` | `{ accessToken, refreshToken }` |
| `POST` | `/auth/login` | Public | `{ email, password }` | `{ accessToken, refreshToken }` |
| `POST` | `/auth/logout` | JWT required | — | `204 No Content` |
| `POST` | `/auth/refresh` | Public | `{ refreshToken }` | `{ accessToken, refreshToken }` |

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{ "email": "user@example.com", "password": "secret123" }'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "user@example.com", "password": "secret123" }'
```

### Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H 'Authorization: Bearer <access_token>'
```

### Refresh

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{ "refreshToken": "<refresh_token>" }'
```

---

## Guards

### JwtAuthGuard (global)

Applied globally when `global: true` (the default). Every route requires a valid `Authorization: Bearer <token>` header unless decorated with `@Public()`.

To apply it manually instead of globally:

```ts
AuthModule.forRoot({ global: false, jwt: { secret: '...' } })

// Then on specific routes or controllers:
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile() {}
```

### RefreshGuard

Used internally on `POST /auth/refresh`. Can also be used manually if you need to protect a custom refresh endpoint:

```ts
import { RefreshGuard } from '@lgerma/nestjs-doorkeeper/guards';

@UseGuards(RefreshGuard)
@Post('custom-refresh')
customRefresh(@Req() req: any) {
  // req.refreshToken is set by RefreshGuard
}
```

---

## Custom Auth Controller

Set `mountController: false` to disable the built-in routes and implement your own using `AuthService` directly:

```ts
AuthModule.forRoot({
  mountController: false,
  jwt: { secret: process.env.JWT_SECRET },
})
```

```ts
import { AuthService, deviceFrom } from '@lgerma/nestjs-doorkeeper';

@Controller('auth')
export class MyAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }, @Req() req: Request) {
    return this.authService.login(body.email, body.password, deviceFrom(req));
  }
}
```

`deviceFrom(req)` extracts IP, User-Agent, and parsed device/browser info from any HTTP request object.

---

## Decorators

### `@Public()`

Skips `JwtAuthGuard` on a route even when the guard is applied globally.

```ts
import { Public } from '@lgerma/nestjs-doorkeeper/decorators';

@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

Can also be applied at the controller level to make all its routes public:

```ts
@Public()
@Controller('webhooks')
export class WebhookController {}
```

### `@CurrentUser()`

Injects the authenticated user into a route handler. The shape depends on `currentUser` mode.

```ts
import { CurrentUser } from '@lgerma/nestjs-doorkeeper/decorators';

@Get('profile')
getProfile(@CurrentUser() user: { id: string; email: string }) {
  return user;
}
```

---

## Current User Modes

Configured via `currentUser` in `forRoot`. Controls what `@CurrentUser()` returns and whether a DB query is made on each request.

| Mode | DB hit | Injects | Use when |
|---|---|---|---|
| `subset` | No | `{ id, email }` | Default — most routes only need user identity |
| `payload` | No | Full JWT payload including `iat`, `exp` | You need token timestamps in handlers |
| `entity` | Yes | Full `UserEntity` from DB | You frequently need DB fields beyond what the JWT carries |

```ts
// subset (default)
@CurrentUser() user: { id: string; email: string }

// payload
@CurrentUser() user: { sub: string; email: string; iat: number; exp: number }

// entity
@CurrentUser() user: UserEntity
```

---

## Configuration Reference

### `AuthModuleOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `jwt.secret` | `string` | **required** | JWT signing secret |
| `jwt.accessTokenTtl` | `string` | `'15m'` | Access token lifetime (e.g. `'15m'`, `'1h'`) |
| `jwt.refreshTokenTtl` | `string` | `'30d'` | Refresh token lifetime (e.g. `'7d'`, `'30d'`) |
| `tablePrefix` | `string` | `'auth'` | Prefix for DB tables (`auth_users`, `auth_sessions`) |
| `routePrefix` | `string` | `'auth'` | Prefix for HTTP routes (`/auth/login`, etc.) |
| `global` | `boolean` | `true` | Register `JwtAuthGuard` globally |
| `mountController` | `boolean` | `true` | Mount the built-in `AuthController`. Set to `false` to handle auth routes yourself |
| `currentUser` | `'subset' \| 'payload' \| 'entity'` | `'subset'` | Shape of `@CurrentUser()` injection |

TTL format: a number followed by a unit — `s` (seconds), `m` (minutes), `h` (hours), `d` (days).
Examples: `'30s'`, `'15m'`, `'2h'`, `'7d'`.

---

## Sub-path Exports

| Import path | Exports |
|---|---|
| `@lgerma/nestjs-doorkeeper` | `AuthModule`, `AuthService`, `SessionService`, `deviceFrom`, `DeviceInfo`, `Public`, `CurrentUser`, `JwtAuthGuard`, `RefreshGuard`, `UserEntity`, `SessionEntity` |
| `@lgerma/nestjs-doorkeeper/guards` | `JwtAuthGuard`, `RefreshGuard` |
| `@lgerma/nestjs-doorkeeper/decorators` | `@CurrentUser`, `@Public` |
| `@lgerma/nestjs-doorkeeper/services` | `AuthService`, `SessionService`, `TokenService` |
| `@lgerma/nestjs-doorkeeper/entities` | `UserEntity`, `SessionEntity` |
| `@lgerma/nestjs-doorkeeper/adapters` | `TypeOrmAdapter`, `IDoorkeeperAdapter` |

---

## Entities

Both entities are automatically registered — no need to add them to your TypeORM `entities` array.

### `UserEntity` → `auth_users`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, auto-generated |
| `email` | varchar | Unique, not null |
| `passwordHash` | varchar | bcrypt hash |
| `isActive` | boolean | Default `true`. Set to `false` to disable login |
| `createdAt` | timestamp | Auto |
| `updatedAt` | timestamp | Auto |

### `SessionEntity` → `auth_sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `userId` | uuid | FK → `auth_users.id`, CASCADE DELETE |
| `accessToken` | varchar | Stored JWT |
| `refreshToken` | varchar | Opaque random token, unique, indexed |
| `ipAddress` | varchar | Captured on login/refresh |
| `userAgent` | varchar | Raw User-Agent string |
| `deviceType` | varchar | `desktop`, `mobile`, or `tablet` |
| `deviceName` | varchar | e.g. `iPhone`, `Mac`, `Pixel 7` |
| `browserName` | varchar | e.g. `Chrome`, `Firefox`, `Safari` |
| `osName` | varchar | e.g. `macOS`, `Windows`, `Android`, `iOS` |
| `osVersion` | varchar | e.g. `14.4`, `11` |
| `createdAt` | timestamp | Auto |
| `lastUsedAt` | timestamp | Updated on token rotation |
| `expiresAt` | timestamp | Derived from `refreshTokenTtl` |

---

## Token Strategy

| Token | Type | Default TTL | Notes |
|---|---|---|---|
| Access token | JWT (signed) | `15m` | Sent in `Authorization: Bearer` header |
| Refresh token | Opaque hex string | `30d` | Sent in request body, stored in DB |

**Rotation** — on every `/auth/refresh` call:
1. Old session row is deleted
2. New session row is created with fresh tokens and updated `lastUsedAt`
3. New `{ accessToken, refreshToken }` pair is returned

**Revocation** — logout deletes the session row. No `revoked_at` column — absence of the row means the token is invalid.

One user can have multiple active sessions (multiple devices/browsers simultaneously).

---

## Device & Browser Tracking

Device metadata is captured automatically on `register`, `login`, and `refresh` from request headers — no configuration needed.

Detection order:
1. **Client Hints** (`sec-ch-ua-platform`, `sec-ch-ua-mobile`) — modern Chromium browsers
2. **User-Agent string** — regex fallback for all other browsers

Fields captured per session:

| Field | Example values |
|---|---|
| `deviceType` | `desktop`, `mobile`, `tablet` |
| `deviceName` | `iPhone`, `iPad`, `Mac`, `Pixel 7`, `Samsung Galaxy S21` |
| `browserName` | `Chrome`, `Firefox`, `Safari`, `Edge`, `Opera` |
| `osName` | `macOS`, `Windows`, `iOS`, `Android`, `Linux` |
| `osVersion` | `14.4`, `11/10`, `17.0` |

---

## License

MIT
