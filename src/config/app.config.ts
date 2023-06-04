import { createAppConfig } from '@/modules/core/helpers/options';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * 应用配置
 */
export const app = createAppConfig((configure) => ({}));
