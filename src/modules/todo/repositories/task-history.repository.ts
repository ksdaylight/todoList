import { SelectQueryBuilder } from 'typeorm';

import { BaseRepository } from '@/modules/database/base';
import { CustomRepository } from '@/modules/database/decorators';

import { TaskHistoryEntity } from '../entities';

@CustomRepository(TaskHistoryEntity)
export class TaskHistoryRepository extends BaseRepository<TaskHistoryEntity> {
    protected _qbName = 'taskHistory';

    buildBaseQuery(): SelectQueryBuilder<TaskHistoryEntity> {
        return this.createQueryBuilder(this.qbName).orderBy(`${this.qbName}.operationTime`, 'DESC');
    }
}
