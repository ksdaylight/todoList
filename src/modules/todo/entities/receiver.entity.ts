import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { MessageEntity } from './message.entity';
import { UserEntity } from './user.entity';
/**
 * 消息与接收者的中间关联表
 */
@Entity('users_recipients')
export class MessageReceiverEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ comment: '是否已读', default: false })
    isRead?: boolean;

    @ManyToOne(() => MessageEntity, (message) => message.recipients, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    message!: MessageEntity;

    @ManyToOne(() => UserEntity, (receiver) => receiver.messages, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    receiver!: UserEntity;
}
