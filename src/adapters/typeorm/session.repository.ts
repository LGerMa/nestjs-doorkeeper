import { DataSource, Repository } from "typeorm";
import { SessionEntity } from "../../entities/session.entity";
import { CreateSessionInput, ISessionRepository } from "../adapter.interface";

export class TypeOrmSessionRepository implements ISessionRepository {
  private readonly repo: Repository<SessionEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(SessionEntity);
  }

  async create(data: CreateSessionInput): Promise<SessionEntity> {
    const session = this.repo.create({
      userId: data.userId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      deviceType: data.deviceType ?? null,
      deviceName: data.deviceName ?? null,
      browserName: data.browserName ?? null,
      osName: data.osName ?? null,
      osVersion: data.osVersion ?? null,
      lastUsedAt: data.lastUsedAt ?? null,
    });
    return this.repo.save(session);
  }

  findByRefreshToken(token: string): Promise<SessionEntity | null> {
    return this.repo.findOneBy({ refreshToken: token });
  }

  findByAccessToken(token: string): Promise<SessionEntity | null> {
    return this.repo.findOneBy({ accessToken: token });
  }

  findById(id: string): Promise<SessionEntity | null> {
    return this.repo.findOneBy({ id });
  }

  findAll(): Promise<SessionEntity[]> {
    return this.repo.find({ relations: ["user"] });
  }

  findByUserId(userId: string): Promise<SessionEntity[]> {
    return this.repo.findBy({ userId });
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }
}
