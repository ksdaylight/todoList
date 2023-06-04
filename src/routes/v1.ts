import { Configure } from '@/modules/core/configure';
import { ApiVersionOption } from '@/modules/restful/types';
import * as todoControllers from '@/modules/todo/controllers';

export const v1 = async (configure: Configure): Promise<ApiVersionOption> => ({
    routes: [
        {
            name: 'app',
            path: '/',
            controllers: [],
            doc: {
                title: '应用接口',
                description: 'CMS系统的应用接口',
                tags: [
                    { name: '任务管理', description: '任务增删查改操作' },
                    { name: '任务历史记录管理', description: '任务的历史记录管理' },
                ],
            },
            children: [
                {
                    name: 'todo',
                    path: 'todo',
                    controllers: Object.values(todoControllers),
                },
            ],
        },
    ],
});
