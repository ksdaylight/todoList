import { Exclude, Expose, Type } from 'class-transformer';
import {
    Entity,
    Column,
    ManyToMany,
    JoinTable,
    OneToMany,
    TreeParent,
    TreeChildren,
    CreateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    Tree,
} from 'typeorm';

import { BaseEntity } from '@/modules/database/base';

import { TaskStatus, TransformerId } from '../constants';

import { CommentEntity } from './comment.entity';
import { TaskHistoryEntity } from './task-history.entity';
import { UserEntity } from './user.entity';

@Exclude()
@Tree('materialized-path')
@Entity('tasks')
export class TaskEntity extends BaseEntity {
    @Expose()
    @Column({ comment: '任务标题' })
    title: string;

    @Expose()
    @ManyToOne(() => UserEntity, (user) => user.tasks)
    creator: UserEntity;

    // @Expose()
    // depth = 0;暂不需要

    @Expose({ groups: [`${TransformerId.TASK}-detail`] })
    @Column({ comment: '任务描述', nullable: true })
    description: string;

    @Expose({ groups: [`${TransformerId.TASK}-detail`] })
    @Type(() => Date)
    @Column({ comment: '到期时间', type: 'timestamp' })
    dueDate: Date;

    @Expose()
    @Column({ type: 'enum', enum: TaskStatus, comment: '任务状态' })
    status: TaskStatus;

    @Expose({ groups: [`${TransformerId.TASK}-detail`] })
    @ManyToOne(() => UserEntity, (user) => user.distributedTasks)
    distributor: UserEntity;

    @Expose()
    @ManyToMany(() => UserEntity, (user) => user.assignedTasks)
    @JoinTable()
    assignees: UserEntity[];

    @Expose({ groups: [`${TransformerId.TASK}-detail`] })
    @ManyToMany(() => UserEntity, (user) => user.watchedTasks)
    @JoinTable()
    watchers: UserEntity[];

    @Expose({ groups: [`${TransformerId.TASK}-detail`] })
    @OneToMany(() => CommentEntity, (comment) => comment.task, { cascade: true })
    comments: CommentEntity[];

    @Expose({ groups: [`${TransformerId.TASK}-detail`] })
    @OneToMany(() => TaskHistoryEntity, (history) => history.task, { cascade: true })
    histories: TaskHistoryEntity[];

    @Expose({ groups: [`${TransformerId.TASK}-detail`] })
    @TreeParent()
    parent: TaskEntity;

    @Expose({ groups: [`${TransformerId.TASK}-detail`] })
    @TreeChildren()
    children: TaskEntity[];

    @Expose({ groups: [`${TransformerId.TASK}-detail`] })
    @Type(() => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Expose({ groups: [`${TransformerId.TASK}-detail`] })
    @Type(() => Date)
    @DeleteDateColumn({
        comment: '删除时间',
    })
    deletedAt: Date;
}
