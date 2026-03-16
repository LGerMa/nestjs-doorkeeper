import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { UserEntity } from "./user.entity";

@Entity("auth_sessions")
export class SessionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // ─── Relationship ─────────────────────────────
  @ManyToOne(() => UserEntity, (user) => user.sessions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  // ─── Tokens ───────────────────────────────────
  @Column({ name: "access_token", type: "varchar" })
  accessToken: string;

  @Index()
  @Column({ name: "refresh_token", type: "varchar", unique: true })
  refreshToken: string;

  // ─── Device & Browser ─────────────────────────
  @Column({ name: "ip_address", type: "varchar", nullable: true })
  ipAddress: string | null;

  @Column({ name: "user_agent", type: "varchar", nullable: true })
  userAgent: string | null;

  @Column({ name: "device_type", type: "varchar", nullable: true })
  deviceType: string | null; // 'desktop' | 'mobile' | 'tablet'

  @Column({ name: "device_name", type: "varchar", nullable: true })
  deviceName: string | null; // 'MacBook Pro', 'iPhone 15'

  @Column({ name: "browser_name", type: "varchar", nullable: true })
  browserName: string | null; // 'Chrome', 'Firefox', 'Safari'

  @Column({ name: "os_name", type: "varchar", nullable: true })
  osName: string | null; // 'macOS', 'Windows', 'Android'

  @Column({ name: "os_version", type: "varchar", nullable: true })
  osVersion: string | null; // '14.4', '17.0'

  // ─── Timestamps ───────────────────────────────
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "last_used_at", type: "timestamp", nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt: Date;
}
