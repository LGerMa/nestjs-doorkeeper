export const DOORKEEPER_OPTIONS = Symbol("DOORKEEPER_OPTIONS");

export interface JwtOptions {
  secret: string;
  accessTokenTtl?: string; // default '15m'
  refreshTokenTtl?: string; // default '30d'
}

export interface DashboardOptions {
  enabled: boolean;
  path?: string; // default '/auth/dashboard'
  username?: string; // default 'admin'
  password: string;
}

export type CurrentUserMode = "entity" | "payload" | "subset";

export interface AuthModuleOptions {
  tablePrefix?: string;  // default 'auth'
  routePrefix?: string;  // default 'auth'
  global?: boolean;      // default true
  currentUser?: CurrentUserMode; // default 'subset'
  jwt: JwtOptions;       // required
  dashboard?: DashboardOptions;  // default disabled
}
