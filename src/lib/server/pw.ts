import { chromium as pwChromium } from "playwright-core";
import chromium from "@sparticuz/chromium";

const isProd = !!process.env.VERCEL;

export async function launch() {
    return pwChromium.launch({
        headless: true,
        args: isProd ? chromium.args : [],
        executablePath: isProd ? await chromium.executablePath() : undefined
    });
}