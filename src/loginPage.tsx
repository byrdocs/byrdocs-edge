import type { FC, PropsWithChildren } from 'hono/jsx'
import { html } from 'hono/html'

const Layout: FC = ({ current, children }: PropsWithChildren<{ current?: string }>) => {
    return (
        <html lang='zh-CN'>
            <head>
                <title>BYR Docs</title>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="icon" href="/logo_512.png" type='image/png' />
                <meta name="description" content="北京邮电大学资料分享平台，旨在使校内学生更方便地获取与北邮课程有关的教育资源，包括电子书籍、考试题目和复习资料等。" />
                <meta name="keywords" content="北邮, 北京邮电大学, 资料, 电子书籍, 考试题目, 复习资料" />
                <meta name="author" content="BYR Docs" />
                <meta property="og:image" content="/logo_512.png" />
                <meta property="og:image:width" content="512" />
                <meta property="og:image:height" content="512" />
                <meta property="og:title" content="BYR Docs" />
                <meta property="og:description" content="北京邮电大学资料分享平台，旨在使校内学生更方便地获取与北邮课程有关的教育资源，包括电子书籍、考试题目和复习资料等。" />
                <meta property="og:type" content="website" />
            </head>
            <body>
                {children}
                {html`
                    <script>
                        let current = "${current}", stack = [];
                        function go(card) {
                            document.getElementById(current + 'Card').classList.add('hidden')
                            document.getElementById(card + 'Card').classList.remove('hidden')
                            stack.push(current)
                            current = card
                            if (current === 'login')
                                document.getElementById('studentId').focus()
                        }
                        for (const e of document.getElementsByClassName("explaination"))
                            e.addEventListener("click", (e) => {
                                go('explain')
                            });
                        for (const e of document.getElementsByClassName("return"))
                            e.addEventListener("click", (e) => {
                                go(stack.pop() || 'login')
                            });
                        for (const e of document.getElementsByClassName("login"))
                            e.addEventListener("click", (e) => {
                                go('login')
                            });
                        document.getElementById("loginExplaination").addEventListener("click", (e) => {
                            go('loginExplain')
                        })
                        const q = new URLSearchParams(window.location.search);
                        const to = q.get("to");
                        if (to) {
                            document.getElementById("loginForm").action = "/login?" + new URLSearchParams({ to }).toString();
                        }
                    </script>
                `}
            </body>
        </html>
    )
}

function Link({ to, children, className }: PropsWithChildren<{ to: string, className?: string }>) {
    return (
        <a href={to} target="_blank"
            className={"text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300 " + (className || '')}>{children}</a>
    )
}

function P({ children, className }: PropsWithChildren<{ className?: string }>) {
    return <p className={"text-sm  dark:text-gray-400 " + (className || '')}>{children}</p>
}

export const Login: FC<{ errorMsg?: string, ip: string }> = ({ errorMsg, ip }) => {
    return (
        <Layout current={'login'}>
            <div className="min-h-[100vh] flex flex-col dark:bg-black">
                <div className={"md:rounded-lg border bg-card text-card-foreground shadow-sm w-full md:w-[500px] m-auto p-4 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 "} id="loginCard">
                    <div className="flex flex-col p-6 pb-2 space-y-1">
                        <h3 className="whitespace-nowrap font-semibold tracking-tight text-2xl dark:text-white">登录 BYR Docs</h3>
                        <P className='pt-2'>
                            您没有使用北邮校园网(IPv6)访问本站
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-[1px] mb-1 w-4 h-4 inline-block cursor-pointer explaination">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                            </svg>
                            ，我们无法确定您的身份，请您考虑使用
                            <button target="_blank"
                                className={"text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300 login"}>
                                北邮统一认证
                            </button>
                            账号登录。
                        </P>
                        {errorMsg && <p className="text-sm text-red-500 dark:text-red-400">{errorMsg}</p>}
                    </div>
                    <form method="post" action="/login" id="loginForm">
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
                        <div className="flex items-center px-6">
                            <button
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-black/80 h-10 px-4 py-2 w-full dark:bg-gray-900 dark:hover:bg-gray-700"
                                type="submit" id="login">
                                登录
                            </button>
                        </div>
                    </form>
                    <div className="flex flex-col px-6 pt-0 space-y-1">
                        <P className='space-x-2 text-xs'>
                            <button target="_blank" id="loginExplaination"
                                className={"text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300 "}>
                                此登录是如何工作的?
                            </button>
                            <span>|</span>
                            <button target="_blank" id="loginExplaination"
                                className={"text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300 explaination "}>
                                关于网络环境
                            </button>
                        </P>
                    </div>
                </div>
                <div className="md:rounded-lg border bg-card text-card-foreground shadow-sm w-full md:w-[500px] m-auto p-4 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 hidden" id="explainCard">
                    <div className="flex flex-col p-6 pb-0 space-y-1">
                        <h3 className="whitespace-nowrap font-semibold tracking-tight text-2xl dark:text-white mb-4">
                            关于网络环境
                        </h3>
                        <P>
                            本项目仅对北京邮电大学在校学生提供服务。我们使用您的 IP 地址来验证您是否在校内。
                        </P>
                        <P>
                            您当前的 IP 地址是 <span className="font-semibold">{ip}</span>。
                        </P>
                        <P>
                            若您的 IP 地址不属于北邮教育网地址，我们将需通过其他方式验证您的身份。
                        </P>
                        <h4 className="font-bold dark:text-gray-400">
                            可以使用 IPv4 吗？
                        </h4>
                        <P>
                            北邮到 Cloudflare 的 IPv4 出口为北京移动，我们可能无法通过 IPv4 分辨您的身份。
                        </P>
                        <h4 className="font-bold dark:text-gray-400">
                            我的网络支持 IPv6 吗？
                        </h4>
                        <P>
                            您可以通过
                            <Link to="https://test-ipv6.com/">IPv6 测试网站</Link>
                            测试。
                            如果您处于北邮校园网环境中，您的网络应当已支持 IPv6。如果上述检测未通过，请检查您的设备的网络设置。
                        </P>
                        <h4 className="font-bold dark:text-gray-400">
                            我已经使用了 IPv6，为什么还需要登录？
                        </h4>
                        <P>
                            尽管您已启用 IPv6，但由于本站同时支持 IPv4 和 IPv6，您可能还是通过 IPv4 访问了本站。您可以尝试提高 IPv6 的使用优先级或禁用 IPv4，或者使用 IPv6 only 的网站镜像：
                            <Link to="https://v6.byrdocs.org/">v6.byrdocs.org</Link>。
                        </P>
                        <h4 className="font-bold dark:text-gray-400">
                            如果我不在校内，我该怎么办？
                        </h4>
                        <P>
                            如果您不在校内，可以使用
                            <button
                                className={"text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300 login"}>
                                北邮统一认证
                            </button>登录。
                        </P>
                    </div>
                    <div className="flex items-center p-6">
                        <button
                            className="return inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-black/80 h-10 px-4 py-2 w-full dark:bg-gray-900 dark:hover:bg-gray-700"
                            type="submit">
                            返回
                        </button>
                    </div>
                </div>
                <div className="md:rounded-lg border bg-card text-card-foreground shadow-sm w-full md:w-[500px] m-auto p-4 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 hidden" id="loginExplainCard">
                    <div className="flex flex-col p-6 pb-0 space-y-1">
                        <h3 className="whitespace-nowrap font-semibold tracking-tight text-2xl dark:text-white mb-4">
                            此登录是如何工作的？
                        </h3>
                        <P>
                            本站使用
                            <Link to="https://auth.bupt.edu.cn/authserver/login">北京邮电大学统一认证系统</Link>
                            来验证用户身份。以下是我们的登录流程和隐私保护措施的详细说明：
                        </P>
                        <P><b>1. 用户认证过程</b></P>
                        <P>当您在我们的网站上发起登录请求时，我们的系统会模拟一个登录过程，与北京邮电大学的统一认证系统进行通信。</P>
                        <P>您需要输入您的北京邮电大学统一认证的用户名和密码。这些信息将会在登录过程中被传递给北京邮电大学统一认证系统，用于验证您的身份。</P>
                        <P>我们的系统<b>不会存储</b>您的用户名和密码。</P>
                        <P><b>2. 数据处理与安全</b></P>
                        <P>我们严格遵守数据保护原则，<b>不</b>收集或存储任何敏感信息，如您的姓名等个人信息。</P>
                        <P>您成功登录后，我们只会在您的设备上存储一个名为 <code>login</code> 、值为 <code>1</code> 的 Cookie。该 Cookie 不包含任何可以识别您身份的信息。</P>
                        <P><b>3. Cookie 的使用</b></P>
                        <P>该 Cookie 仅用于识别用户是否已经成功登录，帮助我们提供更流畅的用户体验，并维持登录状态。</P>
                        <P>该 Cookie 不会被用来追踪您的个人浏览活动或用于任何其他目的。</P>
                        <P><b>4. 保护与隐私</b></P>
                        <P>我们采取了适当的技术和组织安全措施来保护您的数据安全和隐私。</P>
                        <P>我们承诺遵守所有相关的隐私法规保护用户信息不被未授权访问或泄露。</P>
                        <P><b>5. 开放源代码</b></P>
                        <P>
                            为增加透明度，我们提供了登录过程的源代码。您可以通过访问我们的
                            <Link to="https://github.com/byrdocs/byrdocs-edge/blob/main/src/login.ts" className='mx-1'>
                                GitHub
                            </Link>
                            页面查看详细的实现方法。
                        </P>
                    </div>
                    <div className="flex items-center p-6">
                        <button
                            className="return inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-black/80 h-10 px-4 py-2 w-full dark:bg-gray-900 dark:hover:bg-gray-700"
                            type="submit">
                            返回
                        </button>
                    </div>
                </div>
                <footer className="h-12 text-center text-xs sm:text-sm flex text-gray-500 dark:text-gray-400 px-4">
                    <p className="m-auto text-xs px-5 group">
                        <Link to="mailto:contact@byrdocs.org" className=''>
                            联系我们
                        </Link>
                        <span className="mx-2">|</span>
                        <Link to="https://github.com/orgs/byrdocs/discussions">
                            GitHub Discussions
                        </Link>
                        <span className="mx-2">|</span>
                        <Link to="https://qm.qq.com/q/sxv5SAKP0A">
                            QQ 群
                        </Link>
                    </p>
                </footer>
            </div>

        </Layout>
    )
}
