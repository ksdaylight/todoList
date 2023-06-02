import { BaseService } from '@/modules/database/base';

import { TaskEntity } from '../entities';
import { TaskRepository } from '../repositories';

export class TaskService extends BaseService<TaskEntity, TaskRepository> {
    protected enableTrash = true;

    constructor(protected repository: TaskRepository) {
        super(repository);
    }
}
