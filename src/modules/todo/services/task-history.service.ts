import { BaseService } from '@/modules/database/base';

import { QueryTaskHistoryDto } from '../dtos';
import { TaskHistoryEntity } from '../entities';
import { TaskHistoryRepository, TaskRepository } from '../repositories';

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
            .createQueryBuilder('taskHistory')
            .where('taskHistory.task = :taskId', { taskId })
            .orderBy('taskHistory.operationTime', 'DESC')
            .getMany();

        return histories;
    }
}
