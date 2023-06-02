import { Expose, Type } from 'class-transformer';
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
} from 'typeorm';

import { BaseEntity } from '@/modules/database/base';

import { CommentEntity } from './comment.entity';
import { HistoryEntity } from './history.entity';
import { UserEntity } from './user.entity';

@Entity('tasks')
export class TaskEntity extends BaseEntity {
    @Column({ comment: '任务标题' })
    title: string;

    @ManyToOne(() => UserEntity, (user) => user.tasks)
    creator: UserEntity;

    @Column({ comment: '任务描述', nullable: true })
    description: string;

    @Column({ comment: '到期时间', type: 'timestamp' })
    dueDate: Date;

    @ManyToMany(() => UserEntity)
    @JoinTable()
    assignees: UserEntity[];

    @ManyToMany(() => UserEntity)
    @JoinTable()
    watchers: UserEntity[];

    @OneToMany(() => CommentEntity, (comment) => comment.task, { cascade: true })
    comments: CommentEntity[];

    @OneToMany(() => HistoryEntity, (history) => history.task)
    histories: HistoryEntity[];

    @TreeParent()
    parent: TaskEntity;

    @TreeChildren()
    children: TaskEntity[];

    @Expose()
    @Type(() => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Expose()
    @Type(() => Date)
    @DeleteDateColumn({
        comment: '删除时间',
    })
    deletedAt: Date;
}