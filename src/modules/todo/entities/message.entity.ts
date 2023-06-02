import { Expose, Type } from 'class-transformer';

import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '@/modules/database/base';

import { MessageReceiverEntity } from './receiver.entity';

import { UserEntity } from './user.entity';

/**
 * 即时消息模型
 */
@Entity('user_messages')
export class MessageEntity extends BaseEntity {
    @Column({ comment: '消息标题', nullable: true })
    title?: string;

    @Column({ comment: '消息内容', type: 'longtext' })
    body!: string;

    @Column({
        comment: '消息类型(用于客户端根据类型显示图标,点开链接地址等)',
        nullable: true,
    })
    type?: string;

    @Expose()
    @Type(() => Date)
    @CreateDateColumn({
        comment: '创建时间',
    })
    createdAt!: Date;

    @ManyToOne((type) => UserEntity, (user) => user.sends, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    sender!: UserEntity;

    @OneToMany((type) => MessageReceiverEntity, (receiver) => receiver.message, {
        cascade: true,
    })
    recipients!: MessageReceiverEntity[];
}
