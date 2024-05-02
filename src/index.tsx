import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers'
import { getSignedCookie, setSignedCookie } from 'hono/cookie'

import { Counter } from './counter';
export { Counter } from './counter';

import { createChecker } from 'is-in-subnet';
import { buptSubnets } from '../bupt';

import { Login } from './loginPage';
import { login } from './login';

import manifest from '__STATIC_CONTENT_MANIFEST'

type Bindings = {
    COUNTER: DurableObjectNamespace<Counter<Bindings>>;
    JWT_SECRET: string;
    FILE_SERVER: string;
    TOKEN: string;
}


const ipChecker = createChecker(buptSubnets);

export default new Hono<{ Bindings: Bindings }>()
    .get("/logo_512.png", serveStatic({
        root: './',
        manifest
    }))
    .get("/login", async c => {
        const ip = c.req.header("CF-Connecting-IP") || "未知"
        if (ip !== "未知" && ipChecker(ip)) return c.redirect("/")
        return c.render(<Login ip={ip}/>)
    })
    .post("/login", async c => {
        const ip = c.req.header("CF-Connecting-IP") || "未知"
        if (ip !== "未知" && ipChecker(ip)) return c.redirect("/")
        const { studentId, password } = await c.req.parseBody()
        if (typeof studentId !== "string" || typeof password !== "string") {
            return c.render(<Login errorMsg="输入不合法" ip={ip}/>)
        }
        try {
            if (await login(studentId, password)) {
                await setSignedCookie(c, "login", "1", c.env.JWT_SECRET, {
                    maxAge: 2592000,
                    secure: true,
                    httpOnly: true,
                    sameSite: "Strict",
                    path: "/"
                })
                const to = c.req.query("to") || "/"
                return c.redirect(to)
            }
            return c.render(<Login errorMsg="可能是用户名或密码错误" ip={ip}/>)
        } catch (e) {
            return c.render(<Login errorMsg={(e as Error).message || e?.toString() || "未知错误"} ip={ip}/>)
        }
    })
    .use(async (c, next) => {
        const ip = c.req.header("CF-Connecting-IP")
        if (ip && ipChecker(ip)) {
            await next()
        } else {
            const login = await getSignedCookie(c, c.env.JWT_SECRET, "login")
            if (login === "1") {
                await next()
            } else {
                const toq = new URL(c.req.url).searchParams
                if ((c.req.path === "" || c.req.path === '/') && toq.size === 0) return c.redirect("/login")
                const to = c.req.path + (toq.size > 0 ? "?" + toq.toString() : "")
                return c.redirect("/login?" + new URLSearchParams({ to }).toString())
            }
        }
    })
    .get("/rank", async c => {
        const token = c.req.query("token")
        if (token !== c.env.TOKEN) {
            return c.json({ error: "Forbidden" }, { status: 403 })
        }
        const id: DurableObjectId = c.env.COUNTER.idFromName("counter");
        const stub: DurableObjectStub<Counter<Bindings>> = c.env.COUNTER.get(id);
        const data = await stub.list()
        return c.json(data)
    })
    .get("/files/*", async c => {
        const path = c.req.path.slice(7)
        if (!path.startsWith("covers/")) {
            const id: DurableObjectId = c.env.COUNTER.idFromName("counter");
            const stub: DurableObjectStub<Counter<Bindings>> = c.env.COUNTER.get(id);
            c.executionCtx.waitUntil(stub.add(path))
        }
        const url = c.env.FILE_SERVER + (c.env.FILE_SERVER.endsWith("/") ? "" : "/") + path
        return fetch(url)
    })
    .use(serveStatic({
        root: './',
        manifest
    }))
    .use(serveStatic({
        root: './',
        manifest,
        rewriteRequestPath: path => '/index.html'
    }))
