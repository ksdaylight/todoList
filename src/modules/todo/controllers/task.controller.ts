import { Controller } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { BaseControllerWithTrash } from '@/modules/restful/base';
import { Crud, Depends } from '@/modules/restful/decorators';

import { createHookOption } from '@/modules/restful/helpers';

import { TransformerId } from '../constants';
import {
    ManageCreateTaskWithSubTasksDto,
    ManageUpdateTaskDto,
    QueryTaskPaginatedDto,
    QueryTaskDto,
    TaskDetailResponseDto,
} from '../dtos';
import { TaskService } from '../services';
import { TodoModule } from '../todo.module';

/**
 * 任务控制器
 */
@ApiTags('任务管理')
@Depends(TodoModule)
@Crud(async () => ({
    id: TransformerId.TASK,
    enabled: [
        {
            name: 'list',
            option: createHookOption({
                summary: '任务查询,以分页模式展示',
                apiOkResponse: QueryTaskPaginatedDto,
            }),
        },
        {
            name: 'detail',
            option: createHookOption({
                summary: '任务详情',
                apiOkResponse: TaskDetailResponseDto,
            }),
        },
        {
            name: 'store',
            option: createHookOption({
                summary: '新增任务',
                apiOkResponse: TaskDetailResponseDto,
            }),
        },
        {
            name: 'update',
            option: createHookOption({
                summary: '修改任务',
                apiOkResponse: TaskDetailResponseDto,
            }),
        },
        {
            name: 'delete',
            option: createHookOption({
                summary: '删除任务',
                apiOkResponse: [TaskDetailResponseDto],
            }),
        },
        {
            name: 'restore',
            option: createHookOption({
                summary: '恢复任务',
                apiOkResponse: [TaskDetailResponseDto],
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
