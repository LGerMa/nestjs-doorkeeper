import { DynamicModule, Module, Provider } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AuthModuleOptions, DOORKEEPER_OPTIONS } from "./auth.module.options";
import { DOORKEEPER_ADAPTER } from "../adapters/adapter.interface";
import { TypeOrmAdapter } from "../adapters/typeorm/typeorm.adapter";
import { TokenService } from "../services/token.service";
import { SessionService } from "../services/session.service";
import { AuthService } from "../services/auth.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AuthController } from "../controllers/auth.controller";
import { applyTablePrefix } from "../utils/table-prefix.util";
import { UserEntity } from "../entities/user.entity";
import { SessionEntity } from "../entities/session.entity";

export interface AuthModuleAsyncOptions {
  imports?: any[];
  useFactory: (...args: any[]) => AuthModuleOptions | Promise<AuthModuleOptions>;
  inject?: any[];
  global?: boolean;
}

const SERVICE_PROVIDERS: Provider[] = [
  TokenService,
  SessionService,
  AuthService,
  JwtAuthGuard,
];

const EXPORTS = [
  AuthService,
  SessionService,
  TokenService,
  JwtAuthGuard,
  DOORKEEPER_ADAPTER,
];

@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    applyTablePrefix(options.tablePrefix ?? "auth");

    if (options.routePrefix) {
      Reflect.defineMetadata("path", options.routePrefix, AuthController);
    }

    return {
      module: AuthModule,
      global: options.global !== false,
      imports: [
        TypeOrmModule.forFeature([UserEntity, SessionEntity]),
        JwtModule.register({
          secret: options.jwt.secret,
          signOptions: { expiresIn: (options.jwt.accessTokenTtl ?? "15m") as any },
        }),
      ],
      controllers: [AuthController],
      providers: [
        { provide: DOORKEEPER_OPTIONS, useValue: options },
        {
          provide: DOORKEEPER_ADAPTER,
          inject: [DataSource],
          useFactory: (dataSource: DataSource) => new TypeOrmAdapter(dataSource),
        },
        ...SERVICE_PROVIDERS,
      ],
      exports: EXPORTS,
    };
  }

  static forRootAsync(asyncOptions: AuthModuleAsyncOptions): DynamicModule {
    return {
      module: AuthModule,
      global: asyncOptions.global !== false,
      imports: [
        TypeOrmModule.forFeature([UserEntity, SessionEntity]),
        ...(asyncOptions.imports ?? []),
        JwtModule.registerAsync({
          inject: [DOORKEEPER_OPTIONS],
          useFactory: (opts: AuthModuleOptions) => ({
            secret: opts.jwt.secret,
            signOptions: { expiresIn: (opts.jwt.accessTokenTtl ?? "15m") as any },
          }),
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: DOORKEEPER_OPTIONS,
          useFactory: asyncOptions.useFactory,
          inject: asyncOptions.inject ?? [],
        },
        {
          provide: DOORKEEPER_ADAPTER,
          inject: [DataSource, DOORKEEPER_OPTIONS],
          useFactory: (dataSource: DataSource, opts: AuthModuleOptions) => {
            applyTablePrefix(opts.tablePrefix ?? "auth");
            if (opts.routePrefix) {
              Reflect.defineMetadata("path", opts.routePrefix, AuthController);
            }
            return new TypeOrmAdapter(dataSource);
          },
        },
        ...SERVICE_PROVIDERS,
      ],
      exports: EXPORTS,
    };
  }
}
