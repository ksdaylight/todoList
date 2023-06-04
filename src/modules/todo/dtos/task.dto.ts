import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';

import { Transform, Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsOptional,
    IsArray,
    IsUUID,
    ValidateIf,
    ValidateNested,
    IsDefined,
    IsEnum,
    IsBoolean,
    ArrayMinSize,
    ArrayNotEmpty,
} from 'class-validator';

import { DtoValidation } from '@/modules/core/decorators';
import { toBoolean } from '@/modules/core/helpers';
import { IsDataExist } from '@/modules/database/constraints';

import { ListWithTrashedQueryDto } from '@/modules/restful/dtos';

import { TaskOrderType, TaskStatus } from '../constants';
import { TaskEntity, UserEntity } from '../entities';

@DtoValidation({ groups: ['create'] })
export class ManageCreateTaskDto {
    @ApiProperty({ description: '任务标题' })
    @IsNotEmpty({ groups: ['create'], message: '任务标题不能为空' })
    title: string;

    @ApiProperty({ description: '任务描述' })
    description: string;

    @ApiProperty({ description: '到期时间' })
    @IsNotEmpty({ groups: ['create'], message: '到期时间不能为空' })
    dueDate: Date;

    @ApiProperty({ description: '任务状态' })
    @IsNotEmpty({ groups: ['create'], message: '任务状态不能为空' })
    status: TaskStatus;

    @ApiProperty({ description: '任务创建者ID' })
    @IsNotEmpty({ groups: ['create'], message: '任务创建者ID不能为空' })
    @IsDataExist(UserEntity, { groups: ['create'], message: '指定的任务创建者不存在' })
    creator: string;

    @ApiPropertyOptional({ description: '任务分配者ID' })
    @IsOptional()
    @IsDataExist(UserEntity, { message: '指定的任务分配者不存在' })
    distributor?: string;

    @ApiPropertyOptional({ description: '任务指派人ID列表' })
    @IsOptional()
    @IsArray({ message: '任务指派人ID列表必须是数组' })
    @IsDataExist(UserEntity, { each: true, message: '指定的任务指派人不存在' })
    assignees?: string[];

    @ApiPropertyOptional({ description: '任务关注人ID列表' })
    @IsOptional()
    @IsArray({ message: '任务关注人ID列表必须是数组' })
    @IsDataExist(UserEntity, { each: true, message: '指定的任务关注人不存在' })
    watchers?: string[];

    @IsDataExist(TaskEntity, { always: true, message: '父分类不存在' })
    @IsUUID(undefined, { always: true, message: '父分类ID格式不正确' })
    @ValidateIf((value) => value.parent !== null && value.parent)
    @IsOptional({ always: true })
    @Transform(({ value }) => (value === 'null' ? null : value))
    parent?: string;
}

@DtoValidation({ groups: ['create'] })
export class ManageCreateTaskWithSubTasksDto extends ManageCreateTaskDto {
    @ApiPropertyOptional({
        description: '子任务列表',
        type: [ManageCreateTaskDto],
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => ManageCreateTaskDto)
    subTasks?: ManageCreateTaskDto[];
}

@DtoValidation({ groups: ['create'] })
export class CreateTaskWithSubTasksDto extends OmitType(ManageCreateTaskWithSubTasksDto, [
    'creator',
]) {}
/**
 * 任务更新验证
 */
@DtoValidation({ groups: ['update'] })
export class ManageUpdateTaskDto extends PartialType(ManageCreateTaskDto) {
    @ApiProperty({ description: '任务ID' })
    @IsUUID(undefined, { groups: ['update'], message: '任务ID格式错误' })
    @IsDefined({ groups: ['update'], message: '任务ID必须指定' })
    id: string;
}
@DtoValidation({ groups: ['update'] })
export class UpdateTasksDto extends OmitType(ManageUpdateTaskDto, ['creator']) {}
@DtoValidation({ groups: ['query'] })
export class QueryTaskDto extends ListWithTrashedQueryDto {
    @ApiPropertyOptional({ description: '创建者ID' })
    @IsOptional({ always: true })
    creator?: string;

    @ApiPropertyOptional({ description: '是否为主任务' })
    @IsOptional({ always: true })
    onlyRoots?: boolean;

    @ApiPropertyOptional({ description: '分配人ID' })
    @IsOptional({ always: true })
    distributor?: string;

    @ApiPropertyOptional({ description: '负责人ID' })
    @IsArray({ groups: ['create'] })
    @ArrayNotEmpty({ groups: ['create'] })
    @ArrayMinSize(1, { groups: ['create'] })
    @IsOptional({ always: true })
    assignees?: string[];

    @ApiPropertyOptional({ description: '关注人ID' })
    @IsOptional({ always: true })
    watchers?: string[];

    @ApiPropertyOptional({ description: '任务完成状态' })
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional({ always: true })
    status?: boolean;

    @ApiPropertyOptional({ description: '计划完成时间' })
    @IsOptional({ always: true })
    dueDate?: Date;

    @ApiPropertyOptional({ description: '创建时间' })
    @IsOptional({ always: true })
    createdTime?: Date;

    @ApiPropertyOptional({
        description: '排序规则: 默认为 ',
        enum: TaskOrderType,
        default: TaskOrderType.CREATED,
    })
    @IsEnum(TaskOrderType, {
        message: `排序规则必须是${Object.values(TaskOrderType).join(',')}其中一项`,
    })
    @IsOptional()
    orderBy?: TaskOrderType;
    // 其它...
}
