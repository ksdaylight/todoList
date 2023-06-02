import { BaseService } from '@/modules/database/base';

import { TaskHistoryEntity } from '../entities';
import { TaskHistoryRepository } from '../repositories';

export class TaskHistoryService extends BaseService<TaskHistoryEntity, TaskHistoryRepository> {
    protected enableTrash = true;

    constructor(protected repository: TaskHistoryRepository) {
        super(repository);
    }
}
