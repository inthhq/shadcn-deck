'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHasHydrated() {
	return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
