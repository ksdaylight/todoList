import { isNil } from 'lodash';
import { FindTreeOptions, SelectQueryBuilder } from 'typeorm';

import { BaseTreeRepository } from '@/modules/database/base';

import { CustomRepository } from '@/modules/database/decorators';
import { QueryParams } from '@/modules/database/types';

import { CommentEntity } from '../entities';

@CustomRepository(CommentEntity)
export class CommentRepository extends BaseTreeRepository<CommentEntity> {
    protected _qbName = 'comment';

    protected orderBy = 'createdAt';

    buildBaseQB(qb: SelectQueryBuilder<CommentEntity>): SelectQueryBuilder<CommentEntity> {
        return super
            .buildBaseQB(qb)
            .leftJoinAndSelect(`${this.qbName}.task`, 'task')
            .leftJoinAndSelect(`${this.qbName}.user`, 'user');
    }

    async findTree(
        options: FindTreeOptions &
            QueryParams<CommentEntity> & {
                task?: string;
            } = {},
    ): Promise<CommentEntity[]> {
        return super.findTrees({
            ...options,
            addQuery: async (qb) => {
                return isNil(options.task) ? qb : qb.where('task.id = :id', { id: options.task });
            },
        });
    }
}
