/**
 * Singleton Decorator
 * 
 * This decorator implements the Singleton pattern for classes,
 * ensuring that only one instance of the decorated class is created
 * and providing a global point of access to that instance.
 * 
 * Usage:
 * @Singleton
 * export class MyService {
 *   constructor(private readonly dependency: SomeDependency) {}
 * }
 * 
 * The decorator will:
 * 1. Store the single instance in a Map
 * 2. Return the same instance on subsequent instantiations
 * 3. Preserve the original constructor behavior for the first instantiation
 */

const singletonInstances = new Map<any, any>();

/**
 * Singleton decorator function
 * @param constructor - The class constructor to be decorated
 * @returns A new constructor that implements singleton behavior
 */
export function Singleton<T extends new (...args: any[]) => any>(constructor: T): T {
  // Create a proxy constructor that handles singleton behavior
  const singletonWrapper = function (this: any, ...args: any[]) {
    // Check if an instance already exists
    if (singletonInstances.has(singletonWrapper)) {
      return singletonInstances.get(singletonWrapper);
    }

    // Create new instance using the original constructor
    const instance = new constructor(...args);
    
    // Store the instance using the wrapper as key
    singletonInstances.set(singletonWrapper, instance);
    
    return instance;
  };

  // Copy static properties and methods from original constructor
  Object.getOwnPropertyNames(constructor).forEach(name => {
    if (name !== 'prototype' && name !== 'length' && name !== 'name') {
      const descriptor = Object.getOwnPropertyDescriptor(constructor, name);
      if (descriptor) {
        Object.defineProperty(singletonWrapper, name, descriptor);
      }
    }
  });

  // Set the prototype properly
  singletonWrapper.prototype = constructor.prototype;

  // Preserve the original class name
  Object.defineProperty(singletonWrapper, 'name', {
    value: constructor.name,
    configurable: true
  });

  // Store reference to original constructor for utility functions
  (singletonWrapper as any)._originalConstructor = constructor;

  return singletonWrapper as any;
}

/**
 * Utility function to clear all singleton instances
 * Useful for testing scenarios where you need fresh instances
 */
export function clearSingletonInstances(): void {
  singletonInstances.clear();
}

/**
 * Utility function to check if a class has a singleton instance
 * @param constructor - The class constructor to check
 * @returns true if an instance exists, false otherwise
 */
export function hasSingletonInstance<T extends new (...args: any[]) => any>(
  constructor: T
): boolean {
  return singletonInstances.has(constructor);
}

/**
 * Utility function to get the singleton instance without creating one
 * @param constructor - The class constructor
 * @returns The instance if it exists, undefined otherwise
 */
export function getSingletonInstance<T extends new (...args: any[]) => any>(
  constructor: T
): InstanceType<T> | undefined {
  return singletonInstances.get(constructor);
}
