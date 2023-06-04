import { SelectQueryBuilder } from 'typeorm';

import { BaseRepository } from '@/modules/database/base';
import { CustomRepository } from '@/modules/database/decorators';

import { QueryAlias } from '../constants';
import { MessageEntity } from '../entities';

@CustomRepository(MessageEntity)
export class MessageRepository extends BaseRepository<MessageEntity> {
    protected _qbName = QueryAlias.MESSAGE;

    buildBaseQuery(): SelectQueryBuilder<MessageEntity> {
        return this.createQueryBuilder(this.qbName).orderBy(`${this.qbName}.createdAt`, 'DESC');
    }
}
