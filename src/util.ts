import { useContext } from 'react';
import config from './config';
import { AuthContext } from './contexts/authContext';
import { JSONObject } from './types';

export async function request(
    method: string,
    route: string,
    token: string | null,
    data?: JSONObject | FormData
): Promise<JSONObject> {
    const url = `${config.BASE_URL}/${route}`;

    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let body: FormData | string | null = null;
    if (data instanceof FormData) {
        headers['Content-Type'] = 'multipart/form-data';
        body = data;
    } else if (typeof data === 'object') {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(data);
    }

    const response = await fetch(url, {
        method: method,
        body: body,
        headers: headers,
    });
    if (response.status !== 200) {
        // TODO: throw error with status/message/body/etc attributes
        throw new Error(`invalid response status: ${response.status}`);
    }

    return (await response.json()) as JSONObject;
}

// Used for passing async functions to react event handlers like `onPress`.
// Automatically displays toast on screen in case of error.
export function asyncHandler<Args extends unknown[]>(
    handler: (...args: Args) => Promise<void>,
    opts: { prefix?: string } = {}
): (...args: Args) => void {
    return (...args) => {
        handler(...args).catch((e) => {
            let errStr = config.NODE_ENV === 'production' ? 'An error occurred' : `${e}`;
            if (opts.prefix) {
                errStr = `${opts.prefix}:\n${errStr}`;
            }
            toast.show(errStr, { type: 'danger' });
            console.error(e, e instanceof Error ? e.stack : undefined);
        });
    };
}

export function getUserToken() {
    const token = useContext(AuthContext).state.token;
    if (!token) {
        toast.show('User not signed in', { type: 'danger' });
        console.error('User not signed in');
        return undefined;
    }
    return token;
}
