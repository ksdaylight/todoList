import { Type } from 'class-transformer';
import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '@/modules/database/base';

import { TaskEntity } from './task.entity';

@Entity('task_histories')
export class TaskHistoryEntity extends BaseEntity {
    @Column({ comment: '操作描述' })
    description: string;

    @Type(() => Date)
    @Column({ comment: '操作时间', type: 'timestamp' })
    operationTime: Date;

    @ManyToOne(() => TaskEntity, (task) => task.histories, {
        onDelete: 'CASCADE',
    })
    task: TaskEntity;
}
