import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { SessionService } from "../services/session.service";
import { Public } from "../decorators/public.decorator";
import { RefreshGuard } from "../guards/refresh.guard";
import { parseDevice, extractIp } from "../utils/device-parser.util";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Public()
  @Post("register")
  register(@Body() body: { email: string; password: string }, @Req() req: any) {
    return this.authService.register(body.email, body.password, this.deviceFrom(req));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  login(@Body() body: { email: string; password: string }, @Req() req: any) {
    return this.authService.login(body.email, body.password, this.deviceFrom(req));
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  logout(@Req() req: any) {
    return this.authService.logout(req.accessToken as string);
  }

  @Public()
  @UseGuards(RefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  refresh(@Req() req: any) {
    return this.sessionService.rotateSession(req.refreshToken as string, this.deviceFrom(req));
  }

  private deviceFrom(req: any) {
    const headers: Record<string, string | undefined> = req.headers ?? {};
    const parsed = parseDevice(headers);
    return {
      ipAddress: extractIp(headers, req.socket?.remoteAddress),
      userAgent: headers["user-agent"] ?? null,
      ...parsed,
    };
  }
}
