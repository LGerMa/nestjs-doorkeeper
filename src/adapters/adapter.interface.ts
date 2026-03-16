import { UserEntity } from "../entities/user.entity";
import { SessionEntity } from "../entities/session.entity";

export interface CreateSessionInput {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceType?: string | null;
  deviceName?: string | null;
  browserName?: string | null;
  osName?: string | null;
  osVersion?: string | null;
  lastUsedAt?: Date | null;
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(email: string, passwordHash: string): Promise<UserEntity>;
  findAll(): Promise<UserEntity[]>;
}

export interface ISessionRepository {
  create(data: CreateSessionInput): Promise<SessionEntity>;
  findByRefreshToken(token: string): Promise<SessionEntity | null>;
  findByAccessToken(token: string): Promise<SessionEntity | null>;
  findById(id: string): Promise<SessionEntity | null>;
  findAll(): Promise<SessionEntity[]>;
  findByUserId(userId: string): Promise<SessionEntity[]>;
  deleteById(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}

export interface IDoorkeeperAdapter {
  users: IUserRepository;
  sessions: ISessionRepository;
}

export const DOORKEEPER_ADAPTER = Symbol("DOORKEEPER_ADAPTER");
