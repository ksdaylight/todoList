import { Exclude, Expose, Type } from 'class-transformer';

import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToMany,
    OneToMany,
    UpdateDateColumn,
} from 'typeorm';

import { BaseEntity } from '@/modules/database/base';

import { TransformerId } from '../constants';

import { CommentEntity } from './comment.entity';
import { MessageEntity } from './message.entity';
import { MessageReceiverEntity } from './receiver.entity';
import { TaskEntity } from './task.entity';

/**
 * 用户模型
 */

@Exclude()
@Entity('users')
export class UserEntity extends BaseEntity {
    @Expose({
        groups: [
            'user-detail',
            'user-list',
            `${TransformerId.TASK}-list`,
            `${TransformerId.TASK}-detail`,
        ],
    })
    @Column({
        comment: '姓名',
        nullable: true,
    })
    nickname?: string;

    @Expose({ groups: ['user-detail', 'user-list', `${TransformerId.TASK}-detail`] })
    @Column({ comment: '用户名', unique: true })
    username!: string;

    @Column({ comment: '密码', length: 500, select: false })
    password!: string;

    @Expose({ groups: ['user-detail', 'user-list'] })
    @Column({ comment: '手机号', nullable: true, unique: true })
    phone?: string;

    @Expose({ groups: ['user-detail', 'user-list'] })
    @Column({ comment: '邮箱', nullable: true, unique: true })
    email?: string;

    @Expose({ groups: ['user-detail', 'user-list'] })
    @Expose()
    @Type(() => Date)
    @CreateDateColumn({
        comment: '用户创建时间',
    })
    createdAt!: Date;

    @Expose({ groups: ['user-detail', 'user-list'] })
    @Expose()
    @Type(() => Date)
    @UpdateDateColumn({
        comment: '用户更新时间',
    })
    updatedAt!: Date;

    @Expose({ groups: ['user-detail', 'user-list'] })
    @Expose()
    @Type(() => Date)
    @DeleteDateColumn({
        comment: '删除时间',
    })
    deletedAt!: Date;

    @OneToMany((type) => MessageEntity, (message) => message.sender, {
        cascade: true,
    })
    sends!: MessageEntity[];

    @OneToMany((type) => MessageReceiverEntity, (message) => message.receiver, { cascade: true })
    messages!: MessageReceiverEntity[];

    @OneToMany(() => TaskEntity, (task) => task.creator)
    tasks: TaskEntity[];

    @OneToMany(() => CommentEntity, (comment) => comment.creator, { cascade: true })
    comments: CommentEntity[];

    @OneToMany(() => TaskEntity, (task) => task.distributor)
    distributedTasks: TaskEntity[];

    @ManyToMany(() => TaskEntity, (task) => task.assignees)
    assignedTasks: TaskEntity[];

    @ManyToMany(() => TaskEntity, (task) => task.watchers)
    watchedTasks: TaskEntity[];

    @Expose({ groups: ['user-detail', 'user-list'] })
    @ManyToMany((type) => CommentEntity, (comment) => comment.mentionedUsers)
    mentionedInComments: CommentEntity[];
}
