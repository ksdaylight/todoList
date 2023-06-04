import { ConfigureFactory, ConfigureRegister } from '../core/types';

import { TodoConfig } from './types';

export const createTodoConfig: (
    register: ConfigureRegister<Partial<TodoConfig>>,
) => ConfigureFactory<Partial<TodoConfig>, TodoConfig> = (register) => ({
    register,
    defaultRegister: () => ({}),
});
