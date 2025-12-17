import { chromium as pwChromium } from "playwright-core";
import chromium from "@sparticuz/chromium";

export async function getBrowser() {
    const isVercel = !!process.env.VERCEL;

    return await pwChromium.launch({
        headless: true,
        args: isVercel ? chromium.args : [],
        executablePath: isVercel
            ? await chromium.executablePath()
            : undefined
    });
}