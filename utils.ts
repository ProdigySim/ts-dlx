export function *filter<T>(iter: Iterable<T>, predicate: (item: T) => boolean) {
    for(const item of iter) {
        if(predicate(item)) {
            yield item;
        }
    }
}

export function find<T, S extends T>(iter: Iterable<T>, predicate: (item: T) => item is S): S | undefined {
    for(const item of iter) {
        if(predicate(item)) {
            return item;
        }
    }
    return undefined;
}
[].filter

export function *map<T, U>(iter: Iterable<T>, mapper: (item: T) => U): Iterable<U> {
    for(const item of iter) {
        yield mapper(item);
    }
}