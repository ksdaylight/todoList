import { SelectQueryBuilder } from 'typeorm';

import { BaseRepository } from '@/modules/database/base';
import { CustomRepository } from '@/modules/database/decorators';

import { QueryAlias } from '../constants';
import { UserEntity } from '../entities';

@CustomRepository(UserEntity)
export class UserRepository extends BaseRepository<UserEntity> {
    protected _qbName = QueryAlias.USER;

    /**
     * 构建基础Query
     */
    buildBaseQuery(): SelectQueryBuilder<UserEntity> {
        return this.createQueryBuilder(this.qbName).orderBy(`${this.qbName}.createdAt`, 'DESC');
    }
}
