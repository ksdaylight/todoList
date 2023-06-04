import { SelectQueryBuilder } from 'typeorm';

import { BaseRepository } from '@/modules/database/base';
import { CustomRepository } from '@/modules/database/decorators';

import { QueryAlias } from '../constants';
import { TaskHistoryEntity } from '../entities';

@CustomRepository(TaskHistoryEntity)
export class TaskHistoryRepository extends BaseRepository<TaskHistoryEntity> {
    protected _qbName = QueryAlias.TASK_HISTORY;

    buildBaseQuery(): SelectQueryBuilder<TaskHistoryEntity> {
        return this.createQueryBuilder(this.qbName).orderBy(`${this.qbName}.operationTime`, 'DESC');
    }
}
