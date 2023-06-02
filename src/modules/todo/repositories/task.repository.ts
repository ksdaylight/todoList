import { BaseTreeRepository } from '@/modules/database/base';

import { TaskEntity } from '../entities';

export class TaskRepository extends BaseTreeRepository<TaskEntity> {
    protected _qbName = 'task';
}
