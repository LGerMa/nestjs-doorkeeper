import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Inject,
} from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { SessionService } from "../services/session.service";
import { Public } from "../decorators/public.decorator";
import { RefreshGuard } from "../guards/refresh.guard";
import { deviceFrom } from "../utils/device-parser.util";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(SessionService) private readonly sessionService: SessionService,
  ) {}

  @Public()
  @Post("register")
  register(@Body() body: { email: string; password: string }, @Req() req: any) {
    return this.authService.register(body.email, body.password, deviceFrom(req));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  login(@Body() body: { email: string; password: string }, @Req() req: any) {
    return this.authService.login(body.email, body.password, deviceFrom(req));
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
    return this.sessionService.rotateSession(req.refreshToken as string, deviceFrom(req));
  }

}
