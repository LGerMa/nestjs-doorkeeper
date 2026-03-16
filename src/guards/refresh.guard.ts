import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class RefreshGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest();
    const token: string | undefined = request.body?.refreshToken;

    if (!token) throw new UnauthorizedException("Missing refresh token");

    // Attach for the controller to consume
    request.refreshToken = token;
    return true;
  }
}
