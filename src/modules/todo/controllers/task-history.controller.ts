import { Controller, Get, Param, SerializeOptions } from '@nestjs/common';

import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseControllerWithTrash } from '@/modules/restful/base';

import { QueryTaskHistoryDto } from '../dtos';
import { TaskHistoryService } from '../services';

@ApiTags('箱号管理')
@Controller('task-history')
export class TaskHistoryController extends BaseControllerWithTrash<TaskHistoryService> {
    constructor(protected service: TaskHistoryService) {
        super(service);
    }

    @Get()
    @ApiOperation({ summary: '请求创建多少个新箱子' })
    // @ApiOkResponse({ type: [BoxResponseDto] })
    @SerializeOptions({ groups: [] }) // `${TransformerId.STORAGE_BOX}-create`
    async queryTaskHistory(
        @Param()
        data: QueryTaskHistoryDto,
    ) {
        return this.service.queryTaskHistory(data);
    }
}
