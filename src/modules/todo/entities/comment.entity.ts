import { Exclude, Expose, Type } from 'class-transformer';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    Tree,
    TreeChildren,
    TreeParent,
} from 'typeorm';

import { BaseEntity } from '@/modules/database/base';

import { TaskEntity } from './task.entity';
import { UserEntity } from './user.entity';

/**
 * 树形嵌套评论
 */
@Exclude()
@Tree('materialized-path')
@Entity('task_comments')
export class CommentEntity extends BaseEntity {
    @Expose()
    @Column({ comment: '评论内容', type: 'longtext' })
    body: string;

    @Expose()
    @Type(() => Date)
    @CreateDateColumn({
        comment: '创建时间',
    })
    createdAt: Date;

    @Expose()
    depth = 0;

    @Expose()
    @ManyToOne((type) => TaskEntity, (post) => post.comments, {
        // 文章不能为空
        nullable: false,
        // 跟随父表删除与更新
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    task: TaskEntity;

    @TreeParent({ onDelete: 'CASCADE' })
    parent: CommentEntity | null;

    @Expose()
    @TreeChildren({ cascade: true })
    children: CommentEntity[];

    @Expose()
    @ManyToOne((type) => UserEntity, (user) => user.comments, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    creator!: UserEntity;

    @Expose()
    @ManyToMany((type) => UserEntity, (user) => user.mentionedInComments)
    @JoinTable()
    mentionedUsers: UserEntity[];
}
