/* eslint-disable new-cap */
import { Get, Type, Post, Patch, Delete, SerializeOptions } from '@nestjs/common';
import { ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ClassTransformOptions } from 'class-transformer';
import { isNil } from 'lodash';

import { BaseController, BaseControllerWithTrash } from '../base';

import { CRUD_OPTIONS } from '../constants';

import {
    ControllerDtos,
    ControllerWithTrashDtos,
    CrudActions,
    CrudItem,
    CurdOptions,
} from '../types';

/**
 * 控制器上的CRUD装饰器
 * @param options
 */
export const Crud =
    (options: CurdOptions) =>
    <T extends BaseController<any> | BaseControllerWithTrash<any>>(Target: Type<T>) => {
        Reflect.defineMetadata(CRUD_OPTIONS, options, Target);

        const { id, enabled, dtos } = Reflect.getMetadata(CRUD_OPTIONS, Target) as CurdOptions;
        const methods: CrudItem[] = [];
        // 添加启用的CRUD方法
        for (const value of enabled) {
            const item = (typeof value === 'string' ? { name: value } : value) as CrudItem;
            if (
                methods.map(({ name }) => name).includes(item.name) ||
                !isNil(Object.getOwnPropertyDescriptor(Target.prototype, item.name))
            )
                continue;
            methods.push(item);
        }

        for (const { name, option = {} } of methods) {
            // Target是一个类，而不是一个实例。instanceof运算符用于检查一个实例是否属于某个类或其子类。
            // 要正确检查Target类是否是BaseControllerWithTrash的子类，您需要使用prototype属性和isPrototypeOf方法。
            const isInheritedFromWithTrash = Object.prototype.isPrototypeOf.call(
                BaseControllerWithTrash.prototype,
                Target.prototype,
            );
            if (isNil(Object.getOwnPropertyDescriptor(Target.prototype, name))) {
                let descriptor: PropertyDescriptor | undefined;
                if (isInheritedFromWithTrash) {
                    descriptor = Object.getOwnPropertyDescriptor(
                        BaseControllerWithTrash.prototype,
                        name,
                    );
                } else {
                    descriptor = Object.getOwnPropertyDescriptor(BaseController.prototype, name);
                }

                if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
                    throw new Error(
                        `Descriptor for '${name}' on '${
                            isInheritedFromWithTrash ? 'BaseControllerWithTrash' : 'BaseController'
                        }' of '${Target.name}' is undefined or does not have a value.`,
                    );
                }
                // 这段代码使用 Object.defineProperty 方法在 Target.prototype 上重新定义了一个属性 name。这个新属性的值是一个异步函数，其内部调用了 descriptor.value.apply(this, args)。这里的 descriptor.value 指的是原始方法（即父类中的 name 方法），而 apply 方法用于调用这个原始方法，并传递当前的上下文（this）和参数（args）。
                // 在这个新定义的异步函数中，this 上下文保持不变，因此在调用 descriptor.value.apply(this, args) 时，this 依然指向当前实例。这也就是为什么该异步函数最终会访问父类的 name 方法的原因。
                // 需要注意的是，这种重新定义方法的方式可能会导致原始方法的某些元数据丢失，例如装饰器可能会失效。但在这个特定的情况下，这种方法应该是可行的，因为下面的代码中已经动态地处理了装饰器。
                Object.defineProperty(Target.prototype, name, {
                    ...descriptor,
                    async value(...args: any[]) {
                        return descriptor.value.apply(this, args);
                    },
                });
                Target.prototype[name].originalName = name;
            }

            const descriptor = Object.getOwnPropertyDescriptor(Target.prototype, name);

            const [, ...params] = Reflect.getMetadata('design:paramtypes', Target.prototype, name);

            for (const action of CrudActions) {
                if (name === action) {
                    let dto = dtos[name];
                    if (!isNil(dto)) {
                        Reflect.defineMetadata(
                            'design:paramtypes',
                            [dto, ...params],
                            Target.prototype,
                            name,
                        );
                    } else {
                        dto = isInheritedFromWithTrash
                            ? ControllerWithTrashDtos[name]
                            : ControllerDtos[name];
                    }
                    switch (name) {
                        case 'list':
                            ApiQuery({ type: dto })(Target, name, descriptor);
                            break;
                        case 'detail':
                            ApiParam({ name: 'id', type: 'string', description: 'UUID of Item' })(
                                Target,
                                name,
                                descriptor,
                            );
                            break;
                        case 'store':
                        case 'update':
                        case 'delete':
                        case 'restore':
                            ApiBody({ type: dto })(Target, name, descriptor);
                            break;
                        default:
                            console.warn(
                                `Unknown action '${name}' encountered. Please handle it accordingly.`,
                            );
                            break;
                    }
                }
            }

            let serialize: ClassTransformOptions = {};
            if (isNil(option.serialize)) {
                if (['detail', 'store', 'update', 'delete', 'restore'].includes(name)) {
                    serialize = { groups: [`${id}-detail`] };
                } else if (['list'].includes(name)) {
                    serialize = { groups: [`${id}-list`] };
                }
            } else if (option.serialize === 'noGroup') {
                serialize = {};
            } else {
                serialize = option.serialize;
            }
            SerializeOptions(serialize)(Target, name, descriptor);

            switch (name) {
                case 'list':
                    Get()(Target, name, descriptor);
                    break;
                case 'detail':
                    Get(':id')(Target, name, descriptor);
                    break;
                case 'store':
                    Post()(Target, name, descriptor);
                    break;
                case 'update':
                    Patch()(Target, name, descriptor);
                    break;
                case 'delete':
                    Delete()(Target, name, descriptor);
                    break;
                case 'restore':
                    Patch('restore')(Target, name, descriptor);
                    break;
                default:
                    break;
            }

            if (!isNil(option.hook)) option.hook(Target, name);
        }

        return Target;
    };
