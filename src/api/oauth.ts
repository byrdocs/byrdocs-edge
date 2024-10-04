import { Hono } from 'hono'
import { Bindings } from '../types'
import { OAuth } from '../objects/oauth';
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

export default new Hono<{
    Bindings: Bindings,
    Variables: {
        oauth: DurableObjectStub<OAuth>
    }
}>()
    .use(async (c, next) => {
        const id: DurableObjectId = c.env.OAUTH.idFromName("oauth");
        const stub: DurableObjectStub<OAuth> = c.env.OAUTH.get(id);
        c.set("oauth", stub)
        await next()
    })
    .post("/login", async c => {
        const uuid = await c.get('oauth').begin()
        const origin = new URL(c.req.url).origin
        return c.json({
            tokenURL: origin + "/api/oauth/token/" + uuid,
            loginURL: origin + "/oauth/" + uuid,
            success: true
        })
    })
    .get("/token/:uuid", async c => {
        const uuid = c.req.param("uuid")
        try {
            const token = await c.get('oauth').listen(uuid)
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
            const token = await c.get('oauth').login(code, state)
            return c.json({ token, success: true })
        } catch (e) {
            return c.json({ error: (e as Error).message || e?.toString() || "未知错误", success: false })
        }
    })


