import { DataSource } from "typeorm";
import { IDoorkeeperAdapter, IUserRepository, ISessionRepository } from "../adapter.interface";
import { TypeOrmUserRepository } from "./user.repository";
import { TypeOrmSessionRepository } from "./session.repository";

export class TypeOrmAdapter implements IDoorkeeperAdapter {
  readonly users: IUserRepository;
  readonly sessions: ISessionRepository;

  constructor(dataSource: DataSource) {
    this.users = new TypeOrmUserRepository(dataSource);
    this.sessions = new TypeOrmSessionRepository(dataSource);
  }
}
