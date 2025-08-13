import type { IDisposable } from "core/index";

export type PropertyHooks = {
    /**
     * This function will be called after the hooked property is set.
     */
    valToSet: (set: any) => any;

    /**
     * This function will be called after the hooked property is get.
     */
    valToGet: () => any;
};

const InterceptorHooksMaps = new WeakMap<object, Map<PropertyKey, PropertyHooks[]>>();

/**
 * Intercepts a property on an object and allows you to add hooks that will be called when the property is get or set.
 * @param target The object containing the property to intercept.
 * @param propertyKey The key of the property to intercept.
 * @param hooks The hooks to call when the property is get or set.
 * @returns A disposable that removes the hooks when disposed and returns the object to its original state.
 */
export function InterceptProperty<T extends object>(target: T, propertyKey: keyof T, hooks: PropertyHooks): IDisposable {
    // Find the property descriptor and note the owning object (might be inherited through the prototype chain).
    let propertyOwner: object | null = target;
    let propertyDescriptor: PropertyDescriptor | undefined;
    while (propertyOwner) {
        if ((propertyDescriptor = Reflect.getOwnPropertyDescriptor(propertyOwner, propertyKey))) {
            break;
        }
        propertyOwner = Reflect.getPrototypeOf(propertyOwner);
    }

    if (!propertyDescriptor) {
        throw new Error(`Property "${propertyKey.toString()}" not found on "${target}" or in its prototype chain.`);
    }

    // Make sure the property is configurable and writable, otherwise it is immutable and cannot be intercepted.
    if (!propertyDescriptor.configurable) {
        throw new Error(`Property "${propertyKey.toString()}" of object "${target}" is not configurable.`);
    }
    if (propertyDescriptor.writable === false || (propertyDescriptor.writable === undefined && !propertyDescriptor.set)) {
        throw new Error(`Property "${propertyKey.toString()}" of object "${target}" is readonly.`);
    }

    // Get or create the hooks map for the target object.
    let hooksMap = InterceptorHooksMaps.get(target);
    if (!hooksMap) {
        InterceptorHooksMaps.set(target, (hooksMap = new Map()));
    }

    // Get or create the hooks array for the property key.
    let hooksForKey = hooksMap.get(propertyKey);
    if (!hooksForKey) {
        hooksMap.set(propertyKey, (hooksForKey = []));

        let { get: _getValue, set: setValue } = propertyDescriptor;

        // We already checked that the property is writable, so if there is no setter, then it must be a value property.
        // In this case, getValue can return the direct value, and setValue can set the direct value.
        if (!setValue) {
            _getValue = () => propertyDescriptor.value;
            setValue = (value: any) => (propertyDescriptor.value = value);
        }

        if (
            // Replace the property with a new one that calls the hooks in addition to the original getter and setter.
            !Reflect.defineProperty(target, propertyKey, {
                configurable: true,
                get: () => {
                    return hooksForKey![0]?.valToGet();
                    // getValue ? () => getValue.call(target) : undefined,
                    // for (const { valToGet } of hooksForKey!) {
                    //     valToGet?.();
                    // }
                },
                set: (newValue: any) => {
                    return setValue.call(target, hooksForKey![0]?.valToSet(newValue));
                    // for (const { afterSet } of hooksForKey!) {
                    //     afterSet?.(newValue);
                    // }
                },
            })
        ) {
            throw new Error(`Failed to define new property "${propertyKey.toString()}" on object "${target}".`);
        }
    }
    hooksForKey.push(hooks);

    // Take note of whether the property is owned by the target object or inherited from its prototype chain.
    const isOwnProperty = propertyOwner === target;

    let isDisposed = false;
    return {
        dispose: () => {
            if (!isDisposed) {
                // Remove the hooks from the hooks array for the property key.
                hooksForKey.splice(hooksForKey.indexOf(hooks), 1);

                // If there are no more hooks for the property key, remove the property from the hooks map.
                if (hooksForKey.length === 0) {
                    hooksMap.delete(propertyKey);

                    // If there are no more hooks for the target object, remove the hooks map from the WeakMap.
                    if (hooksMap.size === 0) {
                        InterceptorHooksMaps.delete(target);
                    }

                    if (isOwnProperty) {
                        // If the property is owned by the target object, it means the property was defined directly on the target object,
                        // in which case we replaced it and the original property descriptor needs to be restored.
                        if (!Reflect.defineProperty(target, propertyKey, propertyDescriptor)) {
                            throw new Error(`Failed to restore original property descriptor "${propertyKey.toString()}" on object "${target}".`);
                        }
                    } else {
                        // Otherwise, the property was inherited through the prototype chain, and so we can simply delete it from
                        // the target object to allow it to fall back to the prototype chain as it did originally.
                        if (!Reflect.deleteProperty(target, propertyKey)) {
                            throw new Error(`Failed to delete transient property descriptor "${propertyKey.toString()}" on object "${target}".`);
                        }
                    }
                }

                isDisposed = true;
            }
        },
    };
}

export type FunctionHooks = {
    /**
     * This function will be called after the hooked function is called.
     */
    afterCall?: () => void;
};

const FnInterceptorHooksMaps = new WeakMap<object, Map<PropertyKey, FunctionHooks[]>>();

/**
 * Intercepts a function on an object and allows you to add hooks that will be called during function execution.
 * @param target The object containing the function to intercept.
 * @param propertyKey The key of the property that is a function (this is the function that will be intercepted).
 * @param hooks The hooks to call during the function execution.
 * @returns A disposable that removes the hooks when disposed and returns the object to its original state.
 */
export function InterceptFunction<T extends object>(target: T, propertyKey: keyof T, hooks: FunctionHooks): IDisposable {
    if (!hooks.afterCall) {
        throw new Error("At least one hook must be provided.");
    }

    const originalFunction = Reflect.get(target, propertyKey, target) as (...args: any) => any;
    if (typeof originalFunction !== "function") {
        throw new Error(`Property "${propertyKey.toString()}" of object "${target}" is not a function.`);
    }

    // Make sure the property is configurable and writable, otherwise it is immutable and cannot be intercepted.
    const propertyDescriptor = Reflect.getOwnPropertyDescriptor(target, propertyKey);
    if (propertyDescriptor) {
        if (!propertyDescriptor.configurable) {
            throw new Error(`Property "${propertyKey.toString()}" of object "${target}" is not configurable.`);
        }

        if (propertyDescriptor.writable === false || (propertyDescriptor.writable === undefined && !propertyDescriptor.set)) {
            throw new Error(`Property "${propertyKey.toString()}" of object "${target}" is readonly.`);
        }
    }

    // Get or create the hooks map for the target object.
    let hooksMap = FnInterceptorHooksMaps.get(target);
    if (!hooksMap) {
        FnInterceptorHooksMaps.set(target, (hooksMap = new Map()));
    }

    // Get or create the hooks array for the property key.
    let hooksForKey = hooksMap.get(propertyKey);
    if (!hooksForKey) {
        hooksMap.set(propertyKey, (hooksForKey = []));
        if (
            // Replace the function with a new one that calls the hooks in addition to the original function.
            !Reflect.set(target, propertyKey, (...args: any) => {
                const result = Reflect.apply(originalFunction, target, args);
                for (const { afterCall } of hooksForKey!) {
                    afterCall?.();
                }
                return result;
            })
        ) {
            throw new Error(`Failed to define new function "${propertyKey.toString()}" on object "${target}".`);
        }
    }
    hooksForKey.push(hooks);

    let isDisposed = false;
    return {
        dispose: () => {
            if (!isDisposed) {
                // Remove the hooks from the hooks array for the property key.
                hooksForKey.splice(hooksForKey.indexOf(hooks), 1);

                // If there are no more hooks for the property key, remove the property from the hooks map.
                if (hooksForKey.length === 0) {
                    hooksMap.delete(propertyKey);

                    // If there are no more hooks for the target object, remove the hooks map from the WeakMap.
                    if (hooksMap.size === 0) {
                        FnInterceptorHooksMaps.delete(target);
                    }

                    if (propertyDescriptor) {
                        // If we have a property descriptor, it means the property was defined directly on the target object,
                        // in which case we replaced it and the original property descriptor needs to be restored.
                        if (!Reflect.defineProperty(target, propertyKey, propertyDescriptor)) {
                            throw new Error(`Failed to restore original function "${propertyKey.toString()}" on object "${target}".`);
                        }
                    } else {
                        // Otherwise, the property was inherited through the prototype chain, and so we can simply delete it from
                        // the target object to allow it to fall back to the prototype chain as it did originally.
                        if (!Reflect.deleteProperty(target, propertyKey)) {
                            throw new Error(`Failed to delete transient function "${propertyKey.toString()}" on object "${target}".`);
                        }
                    }
                }

                isDisposed = true;
            }
        },
    };
}
