import { getBrowser } from "./browser";

const LOGIN_URL =
    "https://erp.loyolacollege.edu/loyolaonline/students/loginManager/youLogin.jsp";

export async function erpLoginWithPlaywright(input: {
    username: string;
    password: string;
}) {
    const browser = await getBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();

    page.setDefaultTimeout(15_000);

    // 🚀 speed: block heavy assets
    await page.route("**/*", (route) => {
        const t = route.request().resourceType();
        if (["image", "font", "media"].includes(t)) route.abort();
        else route.continue();
    });

    // Capture ERP alerts (REAL ERP errors)
    let erpError: string | null = null;
    page.on("dialog", async (d) => {
        erpError = d.message();
        await d.dismiss();
    });

    // 1️⃣ Load login page
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });

    // 2️⃣ WAIT FOR CAPTCHA TEXT (AJAX SAFE)
    await page.waitForFunction(() => {
        const el = document.getElementById("tdCaptchText");
        return el && el.textContent && el.textContent.trim().length > 0;
    }, { timeout: 10_000 });

    const captcha = (await page.textContent("#tdCaptchText"))?.trim();
    if (!captcha) {
        await context.close();
        throw new Error("CAPTCHA_NOT_FOUND");
    }

    // 3️⃣ Fill inputs
    await page.fill("input[name='login']", input.username);
    await page.fill("input[name='passwd']", input.password);
    await page.fill("input[name='ccode']", captcha);

    // 4️⃣ Mirror ERP funSave()
    await page.evaluate(
        ({ u, p }) => {
            (document.getElementById("txtAN") as HTMLInputElement).value = u;
            (document.getElementById("txtSK") as HTMLInputElement).value = p;
            (document.getElementById("txtPageAction") as HTMLInputElement).value = "1";
        },
        { u: input.username, p: input.password }
    );

    // 5️⃣ Submit + allow redirect
    await Promise.allSettled([
        page.click("input[name='_save'], input[type='submit']"),
        page.waitForNavigation({
            waitUntil: "domcontentloaded",
            timeout: 10_000
        })
    ]);

    // 6️⃣ Small buffer for JS redirects
    await page.waitForTimeout(1500);

    const finalUrl = page.url();
    const html = await page.content();

    // 7️⃣ ERP-side error detection
    if (
        erpError ||
        /invalid|captcha|incorrect|error/i.test(html)
    ) {
        await context.close();
        return {
            success: false,
            erpError: erpError ?? "Login failed",
            captchaUsed: captcha
        };
    }

    // 8️⃣ Extract cookies for reuse
    const cookies = await context.cookies();
    await context.close();

    return {
        success: true,
        redirectUrl: finalUrl,
        html,
        cookies,
        captchaUsed: captcha
    };
}