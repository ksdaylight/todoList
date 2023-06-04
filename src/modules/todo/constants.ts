export enum TaskStatus {
    COMPLETED = 'completed',
    INCOMPLETE = 'incomplete',
}
export enum TaskOrderType {
    CREATED = 'createdAt',
    DUE_DATE = 'dueDate',
}
export const QueryAlias = {
    COMMENT: 'comment',
    MESSAGE: 'message',
    RECEIVER: 'receiver',
    TASK: 'task',
    TASK_HISTORY: 'taskHistory',
    USER: 'user',
};
export const TransformerId = {
    ...QueryAlias,
};
