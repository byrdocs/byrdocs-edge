import { DurableObject } from "cloudflare:workers";
import { v4 as uuidv4 } from 'uuid';
import { sign } from 'hono/jwt'

import { Bindings } from "./types";

type State = {
    login: boolean,
    createdAt: number,
    token?: string,
}

export class OAuth extends DurableObject {
    listeners: Map<string, Array<(_: string) => void>> = new Map();
    env: Bindings;
    constructor(ctx: DurableObjectState, env: Bindings) {
        super(ctx, env);
        this.env = env;
        // 1h
        this.ctx.storage.setAlarm(Date.now() + 3600 * 1000);
    }

    async alarm() {
        const now = Date.now();
        for (const [key, value] of await this.ctx.storage.list<State>()) {
            if (now - value.createdAt > 3600 * 1000) {
                await this.ctx.storage.delete(key);
            }
        }
        this.ctx.storage.setAlarm(Date.now() + 3600 * 1000);
    }

    async begin() {
        const uuid = uuidv4();
        this.ctx.storage.put<State>(uuid, {
            login: false,
            createdAt: Date.now(),
        });
        return uuid;
    }

    async login(code: string, uuid: string) {
        const state = await this.ctx.storage.get<State>(uuid);
        if (!state) {
            throw new Error('您的会话已过期，请重新登录');
        }
        const tokenRes = await fetch("https://github.com/login/oauth/access_token?" + new URLSearchParams({
            client_id: this.env.GITHUB_CLIENT_ID,
            client_secret: this.env.GITHUB_CLIENT_SECRET,
            code,
        }), {
            method: "POST",
            headers: {
                Accept: "application/json"
            }
        });
        if (!tokenRes.ok) {
            throw new Error(await tokenRes.text());
        }
        const ghToken = await tokenRes.json() as {
            access_token?: string,
            error_description?: string
        };
        if (!ghToken.access_token) {
            if (ghToken.error_description) {
                throw new Error(ghToken.error_description);
            } else {
                throw new Error('未知错误');
            }
        }
        const res = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${ghToken.access_token}`,
                Accept: "application/json",
                "User-Agent": "ByrDocs"
            }
        });
        if (!res.ok) {
            throw new Error(await res.text());
        }
        const { id } = await res.json() as { login: string, id: number };
        const token = await sign({ id }, this.env.JWT_SECRET);
        state.login = true;
        state.token = token;
        await this.ctx.storage.put(uuid, state);
        const listeners = this.listeners.get(uuid) || [];
        this.listeners.delete(uuid);
        listeners.forEach(listener => listener(token));
        return token;
    }

    async listen(uuid: string) {
        const state = await this.ctx.storage.get<State>(uuid);
        if (!state) {
            throw new Error('您的会话已过期，请重新登录');
        }
        if (state.login) {
            return state.token;
        }
        return await Promise.any([
            new Promise<string>(resolve => {
                const listener = this.listeners.get(uuid) || [];
                this.listeners.set(uuid, listener.concat(resolve));
            }),
            new Promise<void>(resolve => {
                setTimeout(() => {
                    this.listeners.delete(uuid);
                    resolve();
                }, 10 * 60 * 1000);
            })
        ]);
    }
}
