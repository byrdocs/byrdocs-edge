import { Hono, Context } from 'hono';
import { getSignedCookie, setSignedCookie } from 'hono/cookie'

import { Counter } from './counter';
export { Counter } from './counter';

import { createChecker } from 'is-in-subnet';
import { buptSubnets } from '../bupt';

import { Login } from './loginPage';
import { login } from './login';

import { AwsClient } from 'aws4fetch'

type Bindings = {
    COUNTER: DurableObjectNamespace<Counter<Bindings>>;
    JWT_SECRET: string;
    FILE_SERVER: string;
    TOKEN: string;
    S3_GET_ACCESS_KEY_ID: string;
    S3_GET_SECRET_ACCESS_KEY: string;
}

const ipChecker = createChecker(buptSubnets);

async function page(c: Context) {
    const url = new URL(c.req.url, "https://byrdocs-frontend.pages.dev/")
    return fetch("https://byrdocs-frontend.pages.dev" + c.req.url.slice(url.origin.length))
}

async function setCookie(c: Context) {
    await setSignedCookie(c, "login", "1", c.env.JWT_SECRET, {
        maxAge: 2592000,
        secure: true,
        httpOnly: true,
        sameSite: "Strict",
        path: "/"
    })
}

export default new Hono<{ Bindings: Bindings }>()
    .get("/logo_512.png", page)
    .get("/placeholder.svg", page)
    .get("/filesize.json", async c =>
        fetch(c.env.FILE_SERVER + (c.env.FILE_SERVER.endsWith("/") ? "" : "/") + "filesize.json")
    )
    .get("/login", async c => {
        const ip = c.req.header("CF-Connecting-IP") || "未知"
        if (ip !== "未知" && ipChecker(ip)) return c.redirect(c.req.query("to") || "/")
        return c.render(<Login ip={ip} />)
    })
    .post("/login", async c => {
        const ip = c.req.header("CF-Connecting-IP") || "未知"
        if (ip !== "未知" && ipChecker(ip)) return c.redirect(c.req.query("to") || "/")
        const { studentId, password } = await c.req.parseBody()
        if (typeof studentId !== "string" || typeof password !== "string") {
            return c.render(<Login errorMsg="输入不合法" ip={ip} />)
        }
        try {
            if (await login(studentId, password)) {
                await setCookie(c)
                return c.redirect(c.req.query("to") || "/")
            }
            return c.render(<Login errorMsg="可能是用户名或密码错误" ip={ip} />)
        } catch (e) {
            return c.render(<Login errorMsg={(e as Error).message || e?.toString() || "未知错误"} ip={ip} />)
        }
    })
    .use(async (c, next) => {
        const token = c.req.header("X-Byrdocs-Token")
        const ip = c.req.header("CF-Connecting-IP")
        if (ip && ipChecker(ip)) {
            await next()
        } else if (token === c.env.TOKEN) {
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
        if (path.startsWith("books/") || path.startsWith("tests/") || path.startsWith("docs/")) {
            const id: DurableObjectId = c.env.COUNTER.idFromName("counter");
            const stub: DurableObjectStub<Counter<Bindings>> = c.env.COUNTER.get(id);
            c.executionCtx.waitUntil(stub.add(path))
        }
        const aws = new AwsClient({
            accessKeyId: c.env.S3_GET_ACCESS_KEY_ID,
            secretAccessKey: c.env.S3_GET_SECRET_ACCESS_KEY,
            service: "s3",
        })
        return aws.fetch("https://s3.byrdocs.org/byrdocs/" + path)
    })
    .use(page)
