import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsUUID } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorators';

@DtoValidation({ type: 'query' })
export class QueryTaskHistoryDto {
    @ApiProperty({
        description: '需要查询的任务的ID',
        type: String,
    })
    @IsUUID(undefined, {
        each: true,
        message: 'ID格式错误',
        always: true,
    })
    @IsDefined({
        each: true,
        message: 'ID必须指定',
        always: true,
    })
    taskId!: string;
}
// TODO responseDto
