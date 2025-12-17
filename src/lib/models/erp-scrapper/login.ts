import { getBrowser } from "$lib/server/browser";

const LOGIN_URL =
    "https://erp.loyolacollege.edu/loyolaonline/students/loginManager/youLogin.jsp";

interface ErpLoginProps {
    username: string;
    password: string;
}

/**
 * A scrapper function that logs into the ERP using Playwright.
 * @param input - An object containing username and password.
 * @returns An object indicating success or failure, along with relevant data.
 */
export async function erpLoginWithPlaywright(input: ErpLoginProps) {
    const browser = await getBrowser();
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'Asia/Kolkata'
    });
    const page = await context.newPage();

    page.setDefaultTimeout(10_000);

    // Block unnecessary resources more aggressively
    await page.route("**/*", (route) => {
        const t = route.request().resourceType();
        if (["image", "font", "media", "stylesheet"].includes(t)) {
            route.abort();
        } else {
            route.continue();
        }
    });

    let erpError: string | null = null;
    page.on("dialog", async (d) => {
        erpError = d.message();
        await d.dismiss();
    });

    try {
        await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });

        // Wait for CAPTCHA with optimized selector
        await page.waitForFunction(() => {
            const el = document.getElementById("tdCaptchText");
            return (el?.textContent?.trim()?.length ?? 0) > 0;
        }, { timeout: 8_000 });

        const captcha = (await page.textContent("#tdCaptchText"))?.trim();
        if (!captcha) {
            throw new Error("CAPTCHA_NOT_FOUND");
        }

        // Fill fields with human-like delays
        await page.locator("input[name='login']").pressSequentially(input.username, { delay: 50 });
        await page.locator("input[name='passwd']").pressSequentially(input.password, { delay: 50 });
        await page.locator("input[name='ccode']").pressSequentially(captcha, { delay: 80 });

        // Set hidden fields
        await page.evaluate(
            ({ u, p }) => {
                (document.getElementById("txtAN") as HTMLInputElement).value = u;
                (document.getElementById("txtSK") as HTMLInputElement).value = p;
                (document.getElementById("txtPageAction") as HTMLInputElement).value = "1";
            },
            { u: input.username, p: input.password }
        );

        // Small delay before submit (human-like)
        await page.waitForTimeout(200);

        // Submit and wait for navigation
        await Promise.all([
            page.click("input[name='_save'], input[type='submit']"),
            page.waitForLoadState("domcontentloaded")
        ]);

        const finalUrl = page.url();

        // Check for errors early
        if (erpError) {
            return {
                success: false,
                erpError,
                captchaUsed: captcha
            };
        }

        // Get HTML and check for error patterns
        const html = await page.content();
        if (/invalid|captcha|incorrect|error/i.test(html)) {
            return {
                success: false,
                erpError: "Login failed",
                captchaUsed: captcha
            };
        }

        const cookies = await context.cookies();

        return {
            success: true,
            redirectUrl: finalUrl,
            html,
            cookies,
            captchaUsed: captcha
        };
    } finally {
        await context.close();
    }
}