const LOGIN_URL =
    "https://erp.loyolacollege.edu/loyolaonline/students/loginManager/youLogin.jsp";

const CAPTCHA_URL = "https://erp.loyolacollege.edu/loyolaonline/captchas";

const HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-GB,en;q=0.9",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Dest": "document",
};

function getSetCookies(headers: Headers): string[] {
    if (typeof (headers as any).getSetCookie === "function") {
        return (headers as any).getSetCookie() as string[];
    }
    return headers.get("set-cookie")?.split(/,(?=[^ ])/) ?? [];
}

function buildCookieHeader(rawCookies: string[]): string {
    return rawCookies
        .map((c) => c.split(";")[0].trim())
        .join("; ");
}

export async function erpLogin(input: {
    username: string;
    password: string;
}) {
    // 1️⃣ Load login page + grab session cookie
    const pageRes = await fetch(LOGIN_URL, { headers: HEADERS });

    if (!pageRes.ok) {
        throw new Error(`Login page fetch failed: ${pageRes.status}`);
    }

    const rawSessionCookies = getSetCookies(pageRes.headers);
    const sessionCookieHeader = buildCookieHeader(rawSessionCookies);

    // 2️⃣ Fetch captcha from AJAX endpoint
    const captchaRes = await fetch(CAPTCHA_URL, {
        method: "POST",
        headers: {
            ...HEADERS,
            Referer: LOGIN_URL,
            Cookie: sessionCookieHeader,
        },
    });

    if (!captchaRes.ok) {
        throw new Error(`Captcha fetch failed: ${captchaRes.status}`);
    }

    const captcha = (await captchaRes.text()).trim();
    if (!captcha) {
        throw new Error("CAPTCHA_NOT_FOUND");
    }

    // 3️⃣ Build form body — exact fields from the real POST payload
    const body = new URLSearchParams({
        txtSK: input.password,
        txtAN: input.username,
        _tries: "1",
        _md5: "",
        txtPageAction: "1",
        hdnContextPath:
            "https://erp.loyolacollege.edu/loyolaonline/students/loginManager/studentslRegistrationtMailVerification.jsp",
        login: input.username,
        passwd: input.password,
        ccode: captcha,
        hdnId: "0",
        _save: "Log In",
    });

    // 4️⃣ Submit form
    const loginRes = await fetch(LOGIN_URL, {
        method: "POST",
        redirect: "manual",
        headers: {
            ...HEADERS,
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: LOGIN_URL,
            Origin: "https://erp.loyolacollege.edu",
            Cookie: sessionCookieHeader,
        },
        body,
    });

    const responseHtml = await loginRes.text();
    const redirectUrl = loginRes.headers.get("location") ?? null;

    const responseCookies = getSetCookies(loginRes.headers);
    const allCookies = buildCookieHeader([...rawSessionCookies, ...responseCookies]);

    // 5️⃣ ERP error detection
    const alertMatch = responseHtml.match(/alert\(["']([^"']+)["']\)/i);
    const erpError = alertMatch?.[1]?.trim() ?? null;

    if (erpError || (/invalid|captcha|incorrect|error/i.test(responseHtml) && !redirectUrl)) {
        return {
            success: false as const,
            erpError: erpError ?? "Login failed",
            captchaUsed: captcha,
        };
    }

    return {
        success: true as const,
        redirectUrl,
        cookies: allCookies,
        captchaUsed: captcha,
    };
}