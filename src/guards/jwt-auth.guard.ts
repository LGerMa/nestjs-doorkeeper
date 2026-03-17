import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/keys";
import { TokenService } from "../services/token.service";
import { IDoorkeeperAdapter, DOORKEEPER_ADAPTER } from "../adapters/adapter.interface";
import { AuthModuleOptions, DOORKEEPER_OPTIONS } from "../module/auth.module.options";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(TokenService) private readonly tokenService: TokenService,
    @Inject(DOORKEEPER_ADAPTER) private readonly adapter: IDoorkeeperAdapter,
    @Inject(DOORKEEPER_OPTIONS) private readonly options: AuthModuleOptions,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (isPublic) return true;

    const request = ctx.switchToHttp().getRequest();
    const token = this.extractBearerToken(request);

    if (!token) throw new UnauthorizedException("Missing access token");

    const payload = this.tokenService.verifyAccessToken(token);
    if (!payload) throw new UnauthorizedException("Invalid or expired access token");

    request.accessToken = token;

    const mode = this.options.currentUser ?? "subset";

    if (mode === "payload") {
      request.user = payload;
    } else if (mode === "entity") {
      const user = await this.adapter.users.findById(payload.sub);
      if (!user?.isActive) throw new UnauthorizedException("User not found");
      request.user = user;
    } else {
      // subset — default, no DB hit
      request.user = { id: payload.sub, email: payload.email };
    }

    return true;
  }

  private extractBearerToken(request: { headers: Record<string, string | undefined> }): string | null {
    const auth = request.headers["authorization"];
    if (!auth?.startsWith("Bearer ")) return null;
    return auth.slice(7);
  }
}
