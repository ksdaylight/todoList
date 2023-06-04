import { Controller } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { BaseControllerWithTrash } from '@/modules/restful/base';
import { Crud, Depends } from '@/modules/restful/decorators';

import { createHookOption } from '@/modules/restful/helpers';

import { ManageCreateTaskWithSubTasksDto, ManageUpdateTaskDto, QueryTaskDto } from '../dtos';
import { TaskService } from '../services';
import { TodoModule } from '../todo.module';

/**
 * 任务控制器
 */
@ApiTags('任务管理')
@Depends(TodoModule)
@Crud(async () => ({
    id: 'task',
    enabled: [
        {
            name: 'list',
            option: createHookOption({
                summary: '任务查询,以分页模式展示',
                // apiOkResponse: EntryOrderPaginatedDto,
            }),
        },
        {
            name: 'detail',
            option: createHookOption({
                summary: '任务详情',
                // apiOkResponse: EntryOrderDetailResponseDto,
            }),
        },
        {
            name: 'store',
            option: createHookOption({
                summary: '新增任务',
                // apiOkResponse: EntryOrderDetailResponseDto,
            }),
        },
        {
            name: 'update',
            option: createHookOption('修改任务'),
        },
        {
            name: 'delete',
            option: createHookOption({
                summary: '删除任务',
                // apiOkResponse: [EntryOrderQueryResponseDto],
            }),
        },
        {
            name: 'restore',
            option: createHookOption({
                summary: '恢复任务',
                // apiOkResponse: [EntryOrderQueryResponseDto],
            }),
        },
    ],
    dtos: {
        store: ManageCreateTaskWithSubTasksDto,
        update: ManageUpdateTaskDto, // 暂不区分前后台接口,前台用户接口就是通过jwt等方式析出userId即可
        list: QueryTaskDto,
    },
}))
@Controller('task')
export class TaskController extends BaseControllerWithTrash<TaskService> {
    constructor(protected service: TaskService) {
        super(service);
    }
}
