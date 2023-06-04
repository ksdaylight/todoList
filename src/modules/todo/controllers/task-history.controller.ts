import { Controller, Get, Query, SerializeOptions } from '@nestjs/common';

import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseControllerWithTrash } from '@/modules/restful/base';

import { Depends } from '@/modules/restful/decorators';

import { QueryTaskHistoryDto } from '../dtos';
import { TaskHistoryService } from '../services';
import { TodoModule } from '../todo.module';

@ApiTags('任务历史记录管理')
@Depends(TodoModule)
@Controller('task-history')
export class TaskHistoryController extends BaseControllerWithTrash<TaskHistoryService> {
    constructor(protected service: TaskHistoryService) {
        super(service);
    }

    @Get('task')
    @ApiOperation({ summary: '查询任务的历史记录' })
    // @ApiOkResponse({ type: [BoxResponseDto] })
    @SerializeOptions({ groups: [] }) // `${TransformerId.STORAGE_BOX}-create`
    async queryTaskHistory(
        @Query()
        data: QueryTaskHistoryDto,
    ) {
        return this.service.queryTaskHistory(data);
    }
}
