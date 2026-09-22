/** Ignore results from a previous render or an unmounted component. */
export function observePromise<T>(
	promise: Promise<T>,
	onSuccess: (value: T) => void,
	onError: (error: unknown) => void
) {
	let current = true;
	void promise.then(
		(value) => {
			if (current) onSuccess(value);
		},
		(error: unknown) => {
			if (current) onError(error);
		}
	);
	return () => {
		current = false;
	};
}
