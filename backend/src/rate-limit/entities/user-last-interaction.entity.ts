import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Tracks last interaction timestamp per user for rate limiting.
 * Used to enforce cooldown on spin & staking (bet) endpoints.
 */
@Entity('user_last_interaction')
export class UserLastInteraction {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    name: 'last_interaction_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastInteractionAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
