/* eslint-disable jest/expect-expect */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import * as configs from '@/config';

import { App } from '@/modules/core/app';
import { createBootModule } from '@/modules/core/helpers/app';
import { TodoModule } from '@/modules/todo/todo.module';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const configure = await App.buildConfigure(configs);
        const { BootModule } = await createBootModule(
            { configure },
            {
                modules: [TodoModule],
            },
        );
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [BootModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('/ (GET)', () => {
        return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
    });
});
