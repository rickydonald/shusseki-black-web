import { launch } from "./pw";

const URL =
    "https://erp.loyolacollege.edu/loyolaonline/students/loginManager/youLogin.jsp";

export async function inspectERP() {
    const browser = await launch();
    const page = await browser.newPage();

    await page.goto(URL, { waitUntil: "domcontentloaded" });

    const result = [];

    for (const frame of page.frames()) {
        const info = {
            url: frame.url(),
            inputs: [] as string[],
            forms: 0
        };

        try {
            info.inputs = await frame.evaluate(() =>
                Array.from(document.querySelectorAll("input")).map(i =>
                    [
                        i.type,
                        i.id || "-",
                        i.name || "-"
                    ].join(":")
                )
            );

            info.forms = await frame.evaluate(
                () => document.forms.length
            );
        } catch {
            // cross-origin or empty frame
        }

        result.push(info);
    }

    await browser.close();
    return result;
}