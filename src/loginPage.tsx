import type { FC } from 'hono/jsx'


const Layout: FC = (props) => {
    return (
        <html lang='zh-CN'>
            <head>
                <title>登录 BYR Docs</title>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="icon" href="/logo_512.png" type='image/png' />
            </head>
            <body>
                {props.children}
            </body>
        </html>
    )
}

export const Login: FC<{ errorMsg?: string }> = ({ errorMsg }) => {
    return (
        <Layout>
            <div className="h-[100vh] flex flex-col dark:bg-black">
                <div className="md:rounded-lg border bg-card text-card-foreground shadow-sm w-full md:w-[500px] m-auto p-4 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <div className="flex flex-col p-6 pb-0 space-y-1">
                        <h3 className="whitespace-nowrap font-semibold tracking-tight text-2xl dark:text-white">登录 BYR Docs</h3>
                        <p className="text-sm text-muted-foreground pt-2 dark:text-gray-400">
                            由于您没有使用北邮校园网(IPv6)访问本站，所以我们需要使用
                            <a href="https://auth.bupt.edu.cn/authserver/login" target="_blank"
                                className="text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300">北邮统一认证</a>
                            确认您的身份。
                        </p>
                        {errorMsg && <p className="text-sm text-red-500 dark:text-red-400">{errorMsg}</p>}
                    </div>
                    <form method="post" action="/login">
                        <div className="p-6 pt-2 space-y-4">
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    for="student-id">
                                    学号
                                </label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:placeholder:text-gray-500"
                                    id="studentId" type="text" name="studentId" minlength={10} maxlength={10} required pattern="20\d{8}" />
                            </div>
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    for="password">
                                    密码
                                </label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:placeholder:text-gray-500"
                                    id="password" type="password" name="password" required />
                            </div>
                        </div>
                        <div className="flex items-center p-6 pt-0">
                            <button
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-black/80 h-10 px-4 py-2 w-full dark:bg-gray-900 dark:hover:bg-gray-700"
                                type="submit" id="login">
                                登录
                            </button>
                        </div>
                    </form>
                </div>
                <footer className="h-12 text-center text-sm flex text-gray-500 dark:text-gray-400">
                    <p className="m-auto">
                        您的认证信息将会被发送到<a href="https://auth.bupt.edu.cn/authserver/login" target="_blank" className="text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300">北邮统一认证</a>，我们不会存储任何信息。
                    </p>
                </footer>
            </div>

        </Layout>
    )
}
