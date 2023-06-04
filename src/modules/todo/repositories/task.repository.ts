import { BaseTreeRepository } from '@/modules/database/base';

import { TreeChildrenResolve } from '@/modules/database/constants';

import { CustomRepository } from '@/modules/database/decorators';

import { TaskEntity } from '../entities';

@CustomRepository(TaskEntity)
export class TaskRepository extends BaseTreeRepository<TaskEntity> {
    protected _qbName = 'task';

    protected _childrenResolve = TreeChildrenResolve.UP;
}
