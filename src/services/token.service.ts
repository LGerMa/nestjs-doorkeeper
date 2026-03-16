import { Injectable, Inject } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "node:crypto";
import { AuthModuleOptions, DOORKEEPER_OPTIONS } from "../module/auth.module.options";
import { parseTtlDate } from "../utils/parse-ttl.util";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(DOORKEEPER_OPTIONS) private readonly options: AuthModuleOptions,
  ) {}

  signAccessToken(userId: string, email: string): string {
    // expiresIn is configured on JwtModule at AuthModule setup time
    return this.jwtService.sign({ sub: userId, email });
  }

  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      return this.jwtService.verify<AccessTokenPayload>(token);
    } catch {
      return null;
    }
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(40).toString("hex");
  }

  getRefreshTokenExpiresAt(): Date {
    return parseTtlDate(this.options.jwt.refreshTokenTtl ?? "30d");
  }
}
