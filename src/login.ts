async function getCookieAndExecution() {
    const res = await fetch("https://auth.bupt.edu.cn/authserver/login?service=http://ucloud.bupt.edu.cn")
    const cookie = res.headers.get('set-cookie');
    if (!cookie || !cookie.length) {
        throw new Error('Failed to obtain the cookie from the HTML response');
    }
    const html = await res.text();
    const executions = html.match(/<input name="execution" value="(.*?)"/);
    if (!executions || !executions.length) {
        throw new Error('Failed to obtain the execution value from the HTML response');
    }
    return { cookie, execution: executions[1] };
}

export async function login(username: string, password: string) {
    const bodyp = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    const { cookie, execution } = await getCookieAndExecution();
    let response = await fetch('https://auth.bupt.edu.cn/authserver/login', {
        method: 'POST',
        headers: {
            'authority': 'auth.bupt.edu.cn',
            'content-type': 'application/x-www-form-urlencoded',
            'cookie': cookie,
            'referer': 'https://auth.bupt.edu.cn/authserver/login?service=http://ucloud.bupt.edu.cn',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.61',
        },
        body: bodyp + '&submit=%E7%99%BB%E5%BD%95&type=username_password&execution=' + execution + '&_eventId=submit',
        redirect: 'manual'
    });
    if (response.status != 302) {
        if (response.status === 401) {
            throw new Error('用户名或者密码错误');
        }
        throw new Error('Failed to make the initial request: ' + response.status + ' ' + response.statusText);
    }
    return true
}
