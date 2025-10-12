declare namespace jest {
    interface Matchers<R> {
        toBeInTheDocument(): R;
    }

    interface It {
        (name: string, fn: () => void): void;
    }

    interface Describe {
        (name: string, fn: () => void): void;
    }

    function describe(name: string, fn: () => void): void;
    function it(name: string, fn: () => void): void;
    function expect<T>(actual: T): {
        toBe(expected: T): void;
        toEqual(expected: T): void;
        toBeInTheDocument(): void;
    };
}