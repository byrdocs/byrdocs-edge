import { Hono } from 'hono'
import { Bindings } from '../types'
import { OAuth } from '../objects/oauth';
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { login } from '../login';

export default new Hono<{
    Bindings: Bindings,
    Variables: {
        auth: DurableObjectStub<OAuth>
    }
}>()
    .use(async (c, next) => {
        const id: DurableObjectId = c.env.OAUTH.idFromName("oauth");
        const stub: DurableObjectStub<OAuth> = c.env.OAUTH.get(id);
        c.set("auth", stub)
        await next()
    })
    .post("/login", async c => {
        const uuid = await c.get('auth').begin()
        const origin = new URL(c.req.url).origin
        return c.json({
            tokenURL: origin + "/api/auth/token/" + uuid,
            loginURL: origin + "/auth/" + uuid,
            success: true
        })
    })
    .get("/token/:uuid", async c => {
        const uuid = c.req.param("uuid")
        try {
            const token = await c.get('auth').listen(uuid)
            if (token) {
                return c.json({ token, success: true })
            } else {
                return c.json({ error: "会话过期，请重新登录", success: false })
            }
        } catch (e) {
            return c.json({ error: (e as Error).message || e?.toString() || "未知错误", success: false })
        }
    })
    .post("/callback", zValidator('json', z.object({
        code: z.string(),
        state: z.string(),
    })), async c => {
        const { code, state } = c.req.valid("json")
        try {
            const token = await c.get('auth').login(code, state)
            return c.json({ token, success: true })
        } catch (e) {
            return c.json({ error: (e as Error).message || e?.toString() || "未知错误", success: false })
        }
    })
    .post("/bupt_login", zValidator('json', z.object({
        username: z.string(),
        password: z.string(),
        uuid: z.string(),
    })), async c => {
        const { username, password, uuid } = c.req.valid("json")
        try {
            await login(username, password)
            const token = await c.get('auth').loginBUPT(username, uuid)
            return c.json({ token, success: true })
        } catch (e) {
            return c.json({ error: (e as Error).message || e?.toString() || "未知错误", success: false })
        }
    })


