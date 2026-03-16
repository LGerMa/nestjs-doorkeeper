import { DataSource, Repository } from "typeorm";
import { UserEntity } from "../../entities/user.entity";
import { IUserRepository } from "../adapter.interface";

export class TypeOrmUserRepository implements IUserRepository {
  private readonly repo: Repository<UserEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserEntity);
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOneBy({ email });
  }

  async create(email: string, passwordHash: string): Promise<UserEntity> {
    const user = this.repo.create({ email, passwordHash });
    return this.repo.save(user);
  }

  findAll(): Promise<UserEntity[]> {
    return this.repo.find();
  }
}
