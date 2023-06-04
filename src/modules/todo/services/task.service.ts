import { Injectable } from '@nestjs/common';
import { isFunction, isNil, pick } from 'lodash';

import { EntityNotFoundError, In, SelectQueryBuilder } from 'typeorm';

import { toBoolean } from '@/modules/core/helpers';
import { BaseService } from '@/modules/database/base';

import { paginate } from '@/modules/database/helpers';
import { PaginateOptions, PaginateReturn, QueryHook } from '@/modules/database/types';

import { QueryAlias, TaskOrderType, TaskStatus } from '../constants';
import {
    CreateTaskWithSubTasksDto,
    ManageCreateTaskWithSubTasksDto,
    ManageUpdateTaskDto,
    QueryTaskDto,
    UpdateTasksDto,
} from '../dtos';
import { TaskEntity, TaskHistoryEntity, UserEntity } from '../entities';
import { TaskHistoryRepository, TaskRepository, UserRepository } from '../repositories';

type FindParams = {
    [key in keyof Omit<QueryTaskDto, 'limit' | 'page'>]: QueryTaskDto[key];
};
@Injectable()
export class TaskService extends BaseService<TaskEntity, TaskRepository, FindParams> {
    protected enableTrash = true;

    constructor(
        protected repository: TaskRepository,
        protected taskHistoryRepository: TaskHistoryRepository,
        protected userRepository: UserRepository,
    ) {
        super(repository);
    }

    async detail(id: string, callback?: QueryHook<TaskEntity>): Promise<TaskEntity> {
        const qbAlias = this.repository.qbName;
        let qb = this.repository
            .buildBaseQB()
            .leftJoinAndSelect(`${qbAlias}.children`, 'children')
            .leftJoinAndSelect(`${qbAlias}.histories`, 'histories')
            .leftJoinAndSelect(`${qbAlias}.creator`, 'creator')
            .leftJoinAndSelect(`${qbAlias}.distributor`, 'distributor')
            .leftJoinAndSelect(`${qbAlias}.assignees`, 'assignees')
            .leftJoinAndSelect(`${qbAlias}.watchers`, 'watchers')
            .leftJoinAndSelect(`${qbAlias}.comments`, 'comments')
            .where(`${qbAlias}.id = :id`, { id });
        qb = !isNil(callback) && isFunction(callback) ? await callback(qb) : qb;
        const item = await qb.getOne();
        if (!item) throw new EntityNotFoundError(TaskEntity, `The Task ${id} does not exist!`);

        return item;
    }

    /**
     * 模拟通过jwt获取到的id来获取当前user,正常情况下将放在userService里
     */

    async getCurrentUser(id: string) {
        return this.userRepository.findOneOrFail({ where: { id } });
    }

    async create({
        creator,
        ...data
    }: (CreateTaskWithSubTasksDto & { creator: string }) | ManageCreateTaskWithSubTasksDto) {
        const creatorUser = await this.getCurrentUser(creator); // assume
        // 创建主任务
        const createTaskDto = {
            ...data,
            creator: creatorUser,
            distributor: isNil(data.distributor)
                ? null
                : await this.userRepository.findOneBy({ id: data.distributor }),
            assignees: Array.isArray(data.assignees)
                ? await this.userRepository.findBy({ id: In(data.assignees) })
                : [],
            watchers: Array.isArray(data.watchers)
                ? await this.userRepository.findBy({ id: In(data.watchers) })
                : [],
            parent: await this.getParent(undefined, data.parent),
        };
        const mainTask = await this.repository.save(createTaskDto);

        // 创建任务历史记录
        const history = new TaskHistoryEntity();
        history.description = `创建了任务`;
        history.operationTime = new Date();
        history.task = mainTask;
        await this.taskHistoryRepository.save(history);
        // 详细历史记录内容暂不完善

        // 创建子任务
        if (Array.isArray(data.subTasks)) {
            for (const subTask of data.subTasks) {
                const subTaskCreator = await this.getCurrentUser(subTask.creator);

                const createSubTaskDto = {
                    ...subTask,
                    parent: mainTask,
                    creator: subTaskCreator,
                    distributor: isNil(subTask.distributor)
                        ? null
                        : await this.userRepository.findOneBy({ id: subTask.distributor }),
                    assignees: Array.isArray(subTask.assignees)
                        ? await this.userRepository.findBy({ id: In(subTask.assignees) })
                        : [],
                    watchers: Array.isArray(subTask.watchers)
                        ? await this.userRepository.findBy({ id: In(subTask.watchers) })
                        : [],
                };
                const childTask = await this.repository.save(createSubTaskDto);

                // 创建子任务的历史记录
                const childTaskHistory = new TaskHistoryEntity();
                childTaskHistory.description = `在任务${mainTask.id}中创建了子任务`;
                childTaskHistory.operationTime = new Date();
                childTaskHistory.task = childTask;
                await this.taskHistoryRepository.save(childTaskHistory);
            }
        }

        return this.detail(mainTask.id);
    }

    /**
     * 更新任务
     * @param data
     */
    async update({
        creator,
        ...data
    }: (UpdateTasksDto & { creator: string }) | ManageUpdateTaskDto) {
        const task = await this.detail(data.id);
        const creatorUser = await this.getCurrentUser(creator); // assume
        for (const prop in pick(data, ['title', 'description', 'dueDate', 'status'])) {
            if (prop in task && (data as any)[prop] !== (task as any)[prop]) {
                const history = new TaskHistoryEntity();
                history.description = `${creatorUser.username} Updated ${prop} from ${
                    (task as any)[prop]
                } to ${(data as any)[prop]}`;
                history.operationTime = new Date();
                history.task = task;
                task.histories.push(history);

                (task as any)[prop] = (data as any)[prop];
            }
        }

        await this.updateTaskEntity(task, 'assignees', data.assignees, this.userRepository);
        await this.updateTaskEntity(task, 'watchers', data.watchers, this.userRepository);
        await this.updateTaskEntity(task, 'creator', creator, this.userRepository);
        await this.updateTaskEntity(task, 'distributor', data.distributor, this.userRepository);

        const parent = await this.getParent(data.id, data.parent);

        await this.repository.save(task);
        const shouldUpdateParent =
            (!isNil(task.parent) && !isNil(parent) && task.parent.id !== parent.id) ||
            (isNil(task.parent) && !isNil(parent)) ||
            (!isNil(task.parent) && isNil(parent));

        // 父任务单独更新
        if (parent !== undefined && shouldUpdateParent) {
            task.parent = parent;
            await this.repository.save(task);
        }

        return this.detail(data.id);
    }

    async updateTaskEntity(
        task: TaskEntity,
        fieldName: keyof TaskEntity,
        newIds: string | string[],
        repository: UserRepository,
    ): Promise<void> {
        if (Array.isArray(newIds)) {
            // 处理ID列表
            // 需要保留的
            const users = task[fieldName] as UserEntity[];
            const idsToKeep = users
                .filter((entity) => newIds.includes(entity.id))
                .map((entity) => entity.id);
            // 新添加的
            const newEntityIds = newIds.filter(
                (id) => !users.map((entity) => entity.id).includes(id),
            );
            const newEntities = await repository.findBy({ id: In(newEntityIds) });
            (task[fieldName] as UserEntity[]) = [
                ...users.filter((entity) => idsToKeep.includes(entity.id)),
                ...newEntities,
            ];
        } else {
            // 处理单个ID
            const newEntity = await repository.findOneBy({ id: newIds });
            if (newEntity) (task[fieldName] as UserEntity) = newEntity;
        }

        const history = new TaskHistoryEntity();
        history.description = `Updated ${fieldName} to ${
            Array.isArray(task[fieldName])
                ? (task[fieldName] as UserEntity[])
                      .map((entity: UserEntity) => entity.username)
                      .join(', ')
                : (task[fieldName] as UserEntity).username
        }`; // 暂不细化
        history.operationTime = new Date();
        history.task = task;
        // const savedHistory = await this.taskHistoryRepository.save(history);
        task.histories.push(history);
    }

    /**
     * 获取请求传入的父分类
     * @param current 当前分类的ID
     * @param id
     */
    protected async getParent(current?: string, id?: string) {
        if (current === id) return undefined;
        let parent: TaskEntity | undefined;
        if (id !== undefined) {
            if (id === null) return null;
            parent = await this.repository.findOne({ where: { id } });
            if (!parent) throw new EntityNotFoundError(TaskEntity, `Parent task ${id} not exists!`);
        }
        return parent;
    }

    async paginate(
        options?: PaginateOptions & FindParams,
        callback?: QueryHook<TaskEntity>,
    ): Promise<PaginateReturn<TaskEntity>> {
        const queryOptions = options ?? {};
        const qb = await this.buildListQB(this.repository.buildBaseQB(), queryOptions, callback);
        return paginate(qb, options);
    }

    protected async buildListQB(
        queryBuilder: SelectQueryBuilder<TaskEntity>,
        options: FindParams = {},
        callback?: QueryHook<TaskEntity>,
    ): Promise<SelectQueryBuilder<TaskEntity>> {
        const {
            creatorId: creator,
            distributorId: distributor,
            assigneesIds: assignees,
            watchers,
            isCompleted: status,
            dueDate,
            createdTime,
            orderBy,
            onlyRoots,
        } = options;
        const qb = await super.buildListQB(queryBuilder, options, callback);
        qb.leftJoinAndSelect(`${QueryAlias.TASK}.assignees`, 'assignees');

        if (creator) {
            qb.andWhere(`${QueryAlias.TASK}.creator.id = :creator`, { creator });
        }
        if (distributor) {
            qb.andWhere(`${QueryAlias.TASK}.distributor.id = :distributor`, { distributor });
        }
        if (assignees) {
            // 长度暂不考虑
            let assigneesArray;
            if (typeof assignees === 'string') {
                assigneesArray = [assignees];
            } else {
                assigneesArray = assignees;
            }

            qb.andWhere('assignees.id IN (:...assigneesArray)', {
                assigneesArray,
            });
        }
        if (watchers) {
            let watchersArray;
            if (typeof watchers === 'string') {
                watchersArray = [watchers];
            } else {
                watchersArray = watchers;
            }
            qb.innerJoinAndSelect(`${QueryAlias.TASK}.watchers`, 'watchers').andWhere(
                'watchers.id IN (:...watchersArray )',
                { watchersArray },
            );
        }
        if (!isNil(status)) {
            qb.andWhere(`${QueryAlias.TASK}.status = :status`, {
                status: toBoolean(status) ? TaskStatus.COMPLETED : TaskStatus.INCOMPLETE,
            });
        }
        if (dueDate) {
            qb.andWhere(`${QueryAlias.TASK}.dueDate <= :dueDate`, { dueDate });
        }
        if (createdTime) {
            qb.andWhere(`${QueryAlias.TASK}.createdTime >= :createdTime`, { createdTime });
        }
        if (toBoolean(onlyRoots)) {
            qb.andWhere(`${QueryAlias.TASK}.parent IS NULL`);
        }
        this.addOrderByQuery(qb, orderBy);
        // 等等...
        return qb;
    }

    /**
     *  排序的Query构建
     * @param qb
     * @param orderBy 排序方式
     */
    protected addOrderByQuery(qb: SelectQueryBuilder<TaskEntity>, orderBy?: TaskOrderType) {
        switch (orderBy) {
            case TaskOrderType.CREATED:
                return qb.orderBy(`${QueryAlias.TASK}.createdAt`, 'DESC');
            case TaskOrderType.DUE_DATE:
                return qb.orderBy(`${QueryAlias.TASK}.dueDate`, 'DESC');
            default:
                return qb
                    .orderBy(`${QueryAlias.TASK}.createdAt`, 'DESC')
                    .addOrderBy('task.dueDate', 'DESC');
        }
    }
}
