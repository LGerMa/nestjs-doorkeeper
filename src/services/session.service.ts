import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { SessionEntity } from "../entities/session.entity";
import { IDoorkeeperAdapter, DOORKEEPER_ADAPTER } from "../adapters/adapter.interface";
import { TokenService } from "./token.service";

export interface DeviceInfo {
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceType?: string | null;
  deviceName?: string | null;
  browserName?: string | null;
  osName?: string | null;
  osVersion?: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class SessionService {
  constructor(
    @Inject(DOORKEEPER_ADAPTER) private readonly adapter: IDoorkeeperAdapter,
    private readonly tokenService: TokenService,
  ) {}

  async createSession(
    userId: string,
    email: string,
    device: DeviceInfo = {},
  ): Promise<TokenPair> {
    const accessToken = this.tokenService.signAccessToken(userId, email);
    const refreshToken = this.tokenService.generateRefreshToken();
    const expiresAt = this.tokenService.getRefreshTokenExpiresAt();

    await this.adapter.sessions.create({
      userId,
      accessToken,
      refreshToken,
      expiresAt,
      ...device,
    });

    return { accessToken, refreshToken };
  }

  async rotateSession(
    currentRefreshToken: string,
    device: DeviceInfo = {},
  ): Promise<TokenPair> {
    const session = await this.adapter.sessions.findByRefreshToken(currentRefreshToken);

    if (!session) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (session.expiresAt < new Date()) {
      await this.adapter.sessions.deleteById(session.id);
      throw new UnauthorizedException("Refresh token expired");
    }

    const user = session.user ?? { id: session.userId, email: "" };

    // We need the email for the new access token — load the user if not eagerly loaded
    let email = user.email;
    if (!email) {
      const found = await this.adapter.users.findById(session.userId);
      if (!found) throw new UnauthorizedException("User not found");
      email = found.email;
    }

    await this.adapter.sessions.deleteById(session.id);

    const accessToken = this.tokenService.signAccessToken(session.userId, email);
    const refreshToken = this.tokenService.generateRefreshToken();
    const expiresAt = this.tokenService.getRefreshTokenExpiresAt();

    await this.adapter.sessions.create({
      userId: session.userId,
      accessToken,
      refreshToken,
      expiresAt,
      lastUsedAt: new Date(),
      ...device,
    });

    return { accessToken, refreshToken };
  }

  async revokeByAccessToken(accessToken: string): Promise<void> {
    const session = await this.adapter.sessions.findByAccessToken(accessToken);
    if (session) {
      await this.adapter.sessions.deleteById(session.id);
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.adapter.sessions.deleteByUserId(userId);
  }

  findById(id: string): Promise<SessionEntity | null> {
    return this.adapter.sessions.findById(id);
  }

  findAll(): Promise<SessionEntity[]> {
    return this.adapter.sessions.findAll();
  }

  findByUserId(userId: string): Promise<SessionEntity[]> {
    return this.adapter.sessions.findByUserId(userId);
  }
}
