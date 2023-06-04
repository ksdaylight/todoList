import { BaseRepository } from '@/modules/database/base';
import { CustomRepository } from '@/modules/database/decorators';

import { QueryAlias } from '../constants';
import { MessageReceiverEntity } from '../entities';

@CustomRepository(MessageReceiverEntity)
export class ReceiverRepository extends BaseRepository<MessageReceiverEntity> {
    protected _qbName = QueryAlias.RECEIVER;
}
