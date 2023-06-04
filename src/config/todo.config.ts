import { createTodoConfig } from '@/modules/todo/helpers';

export const content = createTodoConfig(() => ({
    searchType: 'against',
}));
