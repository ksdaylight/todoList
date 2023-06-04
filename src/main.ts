import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { bootApp, createApp } from '@/modules/core/helpers/app';

import * as configs from './config';

import { echoApi } from './modules/restful/helpers';
import { Restful } from './modules/restful/restful';
import { TodoModule } from './modules/todo/todo.module';

const creator = createApp({
    configs,
    configure: { storage: true },
    modules: [TodoModule],
    builder: async ({ configure, BootModule }) => {
        return NestFactory.create<NestFastifyApplication>(BootModule, new FastifyAdapter(), {
            cors: true,
            logger: ['error', 'warn'],
        });
    },
});
bootApp(creator, ({ app, configure }) => async () => {
    const restful = app.get(Restful);
    echoApi(configure, restful);
});
