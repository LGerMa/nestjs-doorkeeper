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

@Entity("doorkeeper_sessions")
export class SessionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // ─── Relationship ─────────────────────────────
  @ManyToOne(() => UserEntity, (user) => user.sessions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @Column({ name: "user_id" })
  userId: string;

  // ─── Tokens ───────────────────────────────────
  @Column({ name: "access_token" })
  accessToken: string;

  @Index()
  @Column({ name: "refresh_token", unique: true })
  refreshToken: string;

  // ─── Device & Browser ─────────────────────────
  @Column({ name: "ip_address", nullable: true })
  ipAddress: string | null;

  @Column({ name: "user_agent", nullable: true })
  userAgent: string | null;

  @Column({ name: "device_type", nullable: true })
  deviceType: string | null; // 'desktop' | 'mobile' | 'tablet'

  @Column({ name: "device_name", nullable: true })
  deviceName: string | null; // 'MacBook Pro', 'iPhone 15'

  @Column({ name: "browser_name", nullable: true })
  browserName: string | null; // 'Chrome', 'Firefox', 'Safari'

  @Column({ name: "os_name", nullable: true })
  osName: string | null; // 'macOS', 'Windows', 'Android'

  @Column({ name: "os_version", nullable: true })
  osVersion: string | null; // '14.4', '17.0'

  // ─── Timestamps ───────────────────────────────
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "last_used_at", nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: "expires_at" })
  expiresAt: Date;
}
