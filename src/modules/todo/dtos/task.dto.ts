import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from '@nestjs/swagger';

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
    Length,
    IsDateString,
} from 'class-validator';

import { DtoValidation } from '@/modules/core/decorators';
import { toBoolean } from '@/modules/core/helpers';
import { IsDataExist } from '@/modules/database/constraints';

import {
    BaseResponseDto,
    ListWithTrashedQueryDto,
    PaginatedResponseDto,
} from '@/modules/restful/dtos';

import { TaskOrderType, TaskStatus } from '../constants';
import { TaskEntity, UserEntity } from '../entities';

import { QueryTaskHistoryResponseDto } from './task-history.dto';

@DtoValidation({ groups: ['create'] })
export class ManageCreateTaskDto {
    @ApiProperty({ description: '任务标题' })
    @Length(1, 30, {
        always: true,
        message: '长度必须为$constraint1到$constraint2',
    })
    @IsNotEmpty({ groups: ['create'], message: '任务标题不能为空' })
    @IsOptional({ groups: ['update'] })
    title: string;

    @ApiPropertyOptional({ description: '任务描述' })
    @Length(1, 100, {
        always: true,
        message: '长度必须为$constraint1到$constraint2',
    })
    @IsOptional({ always: true })
    description?: string;

    @ApiProperty({ description: '到期时间' })
    @IsDefined({ groups: ['create'], message: '到期时间必须指定' })
    @IsDateString({ strict: true }, { always: true })
    @IsOptional({ groups: ['update'] })
    dueDate: Date;

    @ApiProperty({
        description: '任务状态状态: 默认为 incomplete',
        enum: TaskStatus,
        default: TaskStatus.INCOMPLETE,
    })
    @IsEnum(TaskStatus, {
        always: true,
        message: `状态类型必须是${Object.values(TaskStatus).join(',')}其中一项`,
    })
    @IsOptional({ groups: ['update'] })
    status: TaskStatus;

    @ApiProperty({ description: '任务创建者ID' })
    @IsNotEmpty({ groups: ['create'], message: '任务创建者ID不能为空' })
    @IsDataExist(UserEntity, { always: true, message: '指定的任务创建者不存在' })
    @IsOptional({ groups: ['update'] })
    creator: string;

    @ApiPropertyOptional({ description: '任务分配者ID' })
    @IsOptional({ always: true })
    @IsDataExist(UserEntity, { always: true, message: '指定的任务分配者不存在' })
    distributor?: string;

    @ApiPropertyOptional({ description: '任务指派人ID列表' })
    @IsOptional({ always: true })
    @IsArray({ message: '任务指派人ID列表必须是数组' })
    @IsDataExist(UserEntity, { each: true, always: true, message: '指定的任务指派人不存在' })
    assignees?: string[];

    @ApiPropertyOptional({ description: '任务关注人ID列表' })
    @IsOptional({ always: true })
    @IsArray({ message: '任务关注人ID列表必须是数组' })
    @IsDataExist(UserEntity, { each: true, always: true, message: '指定的任务关注人不存在' })
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
    @IsUUID(undefined, { groups: ['query'], message: 'ID格式错误' })
    @IsOptional({ always: true })
    creatorId?: string;

    @ApiPropertyOptional({ description: '是否为主任务' })
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional({ always: true })
    onlyRoots?: boolean;

    @ApiPropertyOptional({ description: '分配人ID' })
    @IsUUID(undefined, { groups: ['query'], message: 'ID格式错误' })
    @IsOptional({ always: true })
    distributorId?: string;

    @ApiPropertyOptional({ description: '负责人ID' })
    @IsUUID(undefined, { groups: ['query'], message: 'ID格式错误', each: true, always: true })
    @IsArray({ groups: ['query'] })
    @ArrayNotEmpty({ groups: ['query'] })
    @ArrayMinSize(1, { groups: ['query'] })
    @IsOptional({ always: true })
    assigneesIds?: string[];

    @ApiPropertyOptional({ description: '关注人ID' })
    @IsUUID(undefined, { groups: ['query'], message: 'ID格式错误', each: true, always: true })
    @IsArray({ groups: ['query'] })
    @ArrayNotEmpty({ groups: ['query'] })
    @ArrayMinSize(1, { groups: ['query'] })
    @IsOptional({ always: true })
    watchers?: string[];

    @ApiPropertyOptional({ description: '是否完成任务' })
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional({ always: true })
    isCompleted?: boolean;

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
export class UserResponseInTaskDto extends BaseResponseDto {
    @ApiProperty({ description: '用户昵称' })
    nickname: string;

    @ApiProperty({ description: '用户名' })
    username: string;
}
export class UserInQueryTaskDto extends PickType(UserResponseInTaskDto, ['nickname']) {}

export class BaseTaskResponseDto extends BaseResponseDto {
    @ApiProperty({ description: '任务标题' })
    title: string;

    @ApiProperty({ description: '任务描述' })
    description: string;

    @ApiProperty({ description: '任务到期时间' })
    dueDate: Date;

    @ApiProperty({ description: '任务状态： completed 已完成,incomplete 未完成', enum: TaskStatus })
    status: TaskStatus;

    @ApiProperty({ description: '任务创建时间' })
    createdAt: Date;

    @ApiProperty({ description: '任务删除时间' })
    deletedAt: Date;
}

export class QueryTaskResponseDto extends PickType(BaseTaskResponseDto, ['id', 'title', 'status']) {
    @ApiProperty({ description: '负责人', isArray: true, type: () => UserInQueryTaskDto })
    assignees: UserInQueryTaskDto[];
}
export class QueryTaskPaginatedDto extends PaginatedResponseDto {
    @ApiProperty({ isArray: true, type: () => QueryTaskResponseDto })
    items: QueryTaskResponseDto[];
}
export class TaskDetailResponseDto {
    @ApiProperty({ description: '创建人', type: () => UserResponseInTaskDto })
    creator: UserResponseInTaskDto;

    @ApiProperty({ description: '任务分配者', type: () => UserResponseInTaskDto })
    distributor: UserResponseInTaskDto;

    @ApiProperty({
        description: '任务负责人(被分配者）',
        isArray: true,
        type: () => UserResponseInTaskDto,
    })
    assignees: UserResponseInTaskDto[];

    @ApiProperty({
        description: '任务关注人',
        isArray: true,
        type: () => UserResponseInTaskDto,
    })
    watchers: UserResponseInTaskDto[];

    @ApiProperty({
        description: '任务评论',
        isArray: true,
    })
    comments: string[];

    @ApiProperty({
        description: '任务历史记录',
        isArray: true,
        type: () => QueryTaskHistoryResponseDto,
    })
    histories: QueryTaskHistoryResponseDto[];

    @ApiProperty({
        description: '任务的上级任务',
        isArray: true,
        type: () => BaseTaskResponseDto,
    })
    parent: BaseTaskResponseDto;

    @ApiProperty({
        description: '任务的子任务',
        isArray: true,
        type: () => BaseTaskResponseDto,
    })
    children: BaseTaskResponseDto[];
}
