import { Injectable } from '@nestjs/common';

import { BaseService } from '@/modules/database/base';

import { QueryAlias } from '../constants';
import { QueryTaskHistoryDto } from '../dtos';
import { TaskHistoryEntity } from '../entities';
import { TaskHistoryRepository, TaskRepository } from '../repositories';

@Injectable()
export class TaskHistoryService extends BaseService<TaskHistoryEntity, TaskHistoryRepository> {
    protected enableTrash = true;

    constructor(
        protected repository: TaskHistoryRepository,
        protected taskRepository: TaskRepository,
    ) {
        super(repository);
    }

    async queryTaskHistory(data: QueryTaskHistoryDto) {
        const { taskId } = data;

        const histories = await this.repository
            .buildBaseQB()
            .where(`${QueryAlias.TASK_HISTORY}.task.id = :taskId`, { taskId })
            .orderBy(`${QueryAlias.TASK_HISTORY}.operationTime`, 'DESC')
            .getMany();

        return histories;
    }
}
