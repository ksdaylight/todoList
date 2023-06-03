import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { isNil } from 'lodash';

import { CrudMethodOption } from './types';

/**
 * 常用的一些crud的hook配置生成
 * @param option
 */
export function createHookOption(
    option: { summary?: string; apiOkResponse?: any } | string = {},
): CrudMethodOption {
    const params = typeof option === 'string' ? { summary: option } : option;
    const { summary, apiOkResponse } = params;
    return {
        hook: (target, method) => {
            if (!isNil(summary))
                ApiOperation({ summary })(
                    target,
                    method,
                    Object.getOwnPropertyDescriptor(target.prototype, method),
                );

            if (!isNil(apiOkResponse)) {
                ApiOkResponse({
                    type: apiOkResponse,
                })(target, method, Object.getOwnPropertyDescriptor(target.prototype, method));
            }
        },
    };
}
