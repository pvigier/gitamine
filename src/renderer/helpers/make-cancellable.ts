export interface CancellablePromise<T> {
  promise: Promise<T>;
  cancel(): void;
}

export function makeCancellable<T>(promise: Promise<T>) {
  let hasCancelled = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      value => hasCancelled ? reject({isCanceled: true}) : resolve(value),
      error => hasCancelled ? reject({isCanceled: true}) : reject(error)
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCancelled = true;
    }
  } as CancellablePromise<T>;
};