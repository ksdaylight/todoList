import { BaseTreeRepository } from '@/modules/database/base';

import { TreeChildrenResolve } from '@/modules/database/constants';

import { TaskEntity } from '../entities';

export class TaskRepository extends BaseTreeRepository<TaskEntity> {
    protected _qbName = 'task';

    protected _childrenResolve = TreeChildrenResolve.UP;
}
