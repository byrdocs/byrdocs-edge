import type { FC } from 'hono/jsx'
import { html } from 'hono/html'

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
                {html`
                    <script>
                        document.getElementById("explaination").addEventListener("click", (e) => {
                            e.preventDefault();
                            document.getElementById("loginCard").classList.add("hidden");
                            document.getElementById("explainationCard").classList.remove("hidden");
                        });
                        document.getElementById("return").addEventListener("click", (e) => {
                            e.preventDefault();
                            document.getElementById("loginCard").classList.remove("hidden");
                            document.getElementById("explainationCard").classList.add("hidden");
                        });
                    </script>
                `}
            </body>
        </html>
    )
}

export const Login: FC<{ errorMsg?: string, ip: string }> = ({ errorMsg, ip }) => {
    return (
        <Layout>
            <div className="h-[100vh] flex flex-col dark:bg-black">
                <div className="md:rounded-lg border bg-card text-card-foreground shadow-sm w-full md:w-[500px] m-auto p-4 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" id="loginCard">
                    <div className="flex flex-col p-6 pb-0 space-y-1">
                        <h3 className="whitespace-nowrap font-semibold tracking-tight text-2xl dark:text-white">登录 BYR Docs</h3>
                        <p className="text-sm text-muted-foreground pt-2 dark:text-gray-400">
                            由于您没有使用北邮校园网(IPv6)访问本站
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-[1px] mb-1 w-4 h-4 inline-block cursor-pointer" id="explaination">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                            </svg>
                            ，所以我们需要使用
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
                <div className="md:rounded-lg border bg-card text-card-foreground shadow-sm w-full md:w-[500px] m-auto p-4 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 hidden" id="explainationCard">
                    <div className="flex flex-col p-6 pb-0 space-y-1">
                        <h3 className="whitespace-nowrap font-semibold tracking-tight text-2xl dark:text-white mb-4">
                            关于网络环境
                        </h3>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                            您当前的 IP 地址是 <span className="font-semibold">{ip}</span>。
                        </p>
                        <h4 className="font-bold dark:text-gray-400">
                            为什么需要登录？
                        </h4>
                        <p className="text-sm dark:text-gray-400">
                            本项目仅对北京邮电大学在校学生提供服务。若您未通过 IPv6 访问本站或您的 IPv6 地址不属于北邮校园网范围内，我们将需通过北邮统一认证来验证您的身份。
                        </p>
                        <h4 className="font-bold dark:text-gray-400">
                            我的网络支持 IPv6 吗？
                        </h4>
                        <p className="text-sm dark:text-gray-400">
                            您可以通过 <a href="https://test-ipv6.com/" target="_blank" className="text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300">IPv6 测试网站</a> 来确认您的网络是否支持 IPv6。
                            如果您处于北邮校园网环境中，您的网络应当已支持 IPv6。如果上述检测未通过，请检查您的设备的网络设置。
                        </p>
                        <h4 className="font-bold dark:text-gray-400">
                            我已经使用了 IPv6，为什么还需要登录？
                        </h4>
                        <p className="text-sm dark:text-gray-400">
                            尽管您已启用 IPv6，但由于本站同时支持 IPv4 和 IPv6，您可能还是通过 IPv4 访问了本站。您可以尝试提高 IPv6 的使用优先级或禁用 IPv4。
                        </p>
                    </div>
                    <div className="flex items-center p-6">
                        <button
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-black/80 h-10 px-4 py-2 w-full dark:bg-gray-900 dark:hover:bg-gray-700"
                            type="submit" id="return">
                            返回
                        </button>
                    </div>
                </div>
                <footer className="h-12 text-center text-xs sm:text-sm flex text-gray-500 dark:text-gray-400 px-4">
                    <p className="m-auto">
                        您的认证信息将会被发送到<a href="https://auth.bupt.edu.cn/authserver/login" target="_blank" className="text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300">北邮统一认证</a>，我们不会存储任何信息。
                    </p>
                </footer>
            </div>

        </Layout>
    )
}
