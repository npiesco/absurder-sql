// Type declarations for Jest test runner
declare function test(name: string, fn: () => void | Promise<void>, timeout?: number): void;
declare function it(name: string, fn: () => void | Promise<void>, timeout?: number): void;
declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void | Promise<void>, timeout?: number): void;
declare function afterEach(fn: () => void | Promise<void>, timeout?: number): void;
declare function beforeAll(fn: () => void | Promise<void>, timeout?: number): void;
declare function afterAll(fn: () => void | Promise<void>, timeout?: number): void;
declare function expect<T>(actual: T): jest.Matchers<T>;

declare namespace jest {
  interface Matchers<R> {
    toBe(expected: any): R;
    toEqual(expected: any): R;
    toBeTruthy(): R;
    toBeFalsy(): R;
    toBeNull(): R;
    toBeUndefined(): R;
    toBeDefined(): R;
    toBeGreaterThan(expected: number): R;
    toBeLessThan(expected: number): R;
    toContain(expected: any): R;
    toHaveLength(expected: number): R;
    toThrow(expected?: any): R;
    toMatchSnapshot(): R;
    not: Matchers<R>;
  }
}
