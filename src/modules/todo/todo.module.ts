import { ModuleMetadata } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ModuleBuilder } from '../core/decorators';
import { DatabaseModule } from '../database/database.module';

import * as entities from './entities';
import * as repositories from './repositories';
import * as services from './services';

@ModuleBuilder(async (configure) => {
    const providers: ModuleMetadata['providers'] = [...Object.values(services)];
    return {
        imports: [
            TypeOrmModule.forFeature(Object.values(entities)),
            DatabaseModule.forRepository(Object.values(repositories)),
        ],
        providers,
        exports: [
            ...Object.values(services),
            DatabaseModule.forRepository(Object.values(repositories)),
        ],
    };
})
export class TodoModule {}
