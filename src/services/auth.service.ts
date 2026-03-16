import { Injectable, Inject, ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { IDoorkeeperAdapter, DOORKEEPER_ADAPTER } from "../adapters/adapter.interface";
import { SessionService, DeviceInfo, TokenPair } from "./session.service";

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DOORKEEPER_ADAPTER) private readonly adapter: IDoorkeeperAdapter,
    private readonly sessionService: SessionService,
  ) {}

  async register(
    email: string,
    password: string,
    device: DeviceInfo = {},
  ): Promise<TokenPair> {
    const existing = await this.adapter.users.findByEmail(email);
    if (existing) {
      throw new ConflictException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.adapter.users.create(email, passwordHash);

    return this.sessionService.createSession(user.id, user.email, device);
  }

  async login(
    email: string,
    password: string,
    device: DeviceInfo = {},
  ): Promise<TokenPair> {
    const user = await this.adapter.users.findByEmail(email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.sessionService.createSession(user.id, user.email, device);
  }

  async logout(accessToken: string): Promise<void> {
    await this.sessionService.revokeByAccessToken(accessToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionService.revokeAllUserSessions(userId);
  }
}
