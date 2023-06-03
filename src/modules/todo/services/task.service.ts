import { isFunction, isNil, omit } from 'lodash';

import { EntityNotFoundError, In, SelectQueryBuilder } from 'typeorm';

import { BaseService } from '@/modules/database/base';

import { QueryHook } from '@/modules/database/types';

import { TaskOrderType } from '../constants';
import {
    CreateTaskWithSubTasksDto,
    ManageCreateTaskWithSubTasksDto,
    ManageUpdateTaskDto,
    QueryTaskDto,
} from '../dtos';
import { TaskEntity, TaskHistoryEntity } from '../entities';
import { TaskHistoryRepository, TaskRepository, UserRepository } from '../repositories';

type FindParams = {
    [key in keyof Omit<QueryTaskDto, 'limit' | 'page'>]: QueryTaskDto[key];
};
export class TaskService extends BaseService<TaskEntity, TaskRepository> {
    protected enableTrash = true;

    constructor(
        protected repository: TaskRepository,
        protected taskHistoryRepository: TaskHistoryRepository,
        protected userRepository: UserRepository,
    ) {
        super(repository);
    }

    async detail(id: string, callback?: QueryHook<TaskEntity>): Promise<TaskEntity> {
        let qb = this.repository
            .buildBaseQB()
            .leftJoinAndSelect(`${this.repository.qbName}.children`, 'children')
            .leftJoinAndSelect(`${this.repository.qbName}.histories`, 'histories')
            .leftJoinAndSelect(`${this.repository.qbName}.creator`, 'creator')
            .leftJoinAndSelect(`${this.repository.qbName}.distributor`, 'distributor')
            .leftJoinAndSelect(`${this.repository.qbName}.assignees`, 'assignees')
            .leftJoinAndSelect(`${this.repository.qbName}.watchers`, 'watchers')
            .leftJoinAndSelect(`${this.repository.qbName}.comments`, 'comments');

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
        const creatorUser = await this.getCurrentUser(creator);
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
    async update(data: ManageUpdateTaskDto) {
        const parent = await this.getParent(data.id, data.parent);

        const updateTaskDto = {
            ...omit(data, ['id', 'parent', 'creator']),
            distributor: data.distributor
                ? await this.userRepository.findOneBy({ id: data.distributor })
                : null,
            assignees: Array.isArray(data.assignees)
                ? await this.userRepository.findBy({ id: In(data.assignees) })
                : [],
            watchers: Array.isArray(data.watchers)
                ? await this.userRepository.findBy({ id: In(data.watchers) })
                : [],
        };
        await this.repository.update(data.id, updateTaskDto);

        const task = await this.detail(data.id);
        const shouldUpdateParent =
            (!isNil(task.parent) && !isNil(parent) && task.parent.id !== parent.id) ||
            (isNil(task.parent) && !isNil(parent)) ||
            (!isNil(task.parent) && isNil(parent));

        // 父任务单独更新
        if (parent !== undefined && shouldUpdateParent) {
            task.parent = parent;
            await this.repository.save(task);
        }

        return task;
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

    protected async buildListQB(
        queryBuilder: SelectQueryBuilder<TaskEntity>,
        options: FindParams = {},
        callback?: QueryHook<TaskEntity>,
    ): Promise<SelectQueryBuilder<TaskEntity>> {
        const {
            creator,
            distributor,
            assignee,
            watchers,
            status,
            dueDate,
            createdTime,
            orderBy,
            onlyRoots,
        } = options;
        const qb = await super.buildListQB(queryBuilder, options, callback);

        if (creator) {
            qb.andWhere('task.creator.id = :creator', { creator });
        }
        if (distributor) {
            qb.leftJoinAndSelect('task.distributor', 'distributor').andWhere(
                'distributor.id = :distributor',
                { distributor },
            );
        }
        if (assignee) {
            qb.leftJoinAndSelect('task.assignees', 'assignee').andWhere('assignee.id = :assignee', {
                assignee,
            });
        }
        if (watchers) {
            qb.innerJoinAndSelect('task.watchers', 'watcher').andWhere(
                'watcher.id IN (:...watchers)',
                { watchers },
            );
        }
        if (status) {
            qb.andWhere('task.status = :status', { status });
        }
        if (dueDate) {
            qb.andWhere('task.dueDate <= :dueDate', { dueDate });
        }
        if (createdTime) {
            qb.andWhere('task.createdTime >= :createdTime', { createdTime });
        }
        if (onlyRoots) {
            qb.andWhere('task.parent IS NULL');
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
                return qb.orderBy('task.createdAt', 'DESC');
            case TaskOrderType.DUE_DATE:
                return qb.orderBy('task.dueDate', 'DESC');
            default:
                return qb.orderBy('post.createdAt', 'DESC').addOrderBy('post.dueDate', 'DESC');
        }
    }
}
