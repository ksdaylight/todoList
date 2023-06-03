import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';

import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
    // 允许跨域
    app.enableCors();
    useContainer(app.select(AppModule), {
        fallbackOnErrors: true,
    });
    const options = new DocumentBuilder()
        .setTitle('ToDoList REST API')
        .setDescription('The Swagger REST API DOC')
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('swagger', app, document);
    await app.listen(3000);
}
bootstrap();
