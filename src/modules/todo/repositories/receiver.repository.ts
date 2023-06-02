import { BaseRepository } from '@/modules/database/base';
import { CustomRepository } from '@/modules/database/decorators';

import { MessageReceiverEntity } from '../entities';

@CustomRepository(MessageReceiverEntity)
export class ReceiverRepository extends BaseRepository<MessageReceiverEntity> {
    protected _qbName = 'receiver';
}
