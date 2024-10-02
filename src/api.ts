import { Hono } from 'hono'
import { Bindings } from './types'
import { OAuth } from './oauth';

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
            tokenURL: origin + "/api/token/" + uuid,
            loginURL: origin + "/oauth/" + uuid,
            code: 0
        })
    })
    .get("/token/:uuid", async c => {
        const uuid = c.req.param("uuid")
        try {
            const token = await c.get('oauth').listen(uuid)
            if (token) {
                return c.json({ token, code: 0 })
            } else {
                return c.json({ error: "会话过期，请重新登录", code: 1 })
            }
        } catch (e) {
            return c.json({ error: (e as Error).message || e?.toString() || "未知错误", code: 1 })
        }
    })
    .post("/callback", async c => {
        const { code, state } = await c.req.json()
        if (typeof code !== "string" || typeof state !== "string") {
            return c.json({ error: "输入不合法", code: 1 })
        }
        try {
            const token = await c.get('oauth').login(code, state)
            return c.json({ token, code: 0 })
        } catch (e) {
            return c.json({ error: (e as Error).message || e?.toString() || "未知错误", code: 1 })
        }
    })


