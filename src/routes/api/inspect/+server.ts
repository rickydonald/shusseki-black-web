import { json } from "@sveltejs/kit";
import { inspectERP } from "$lib/server/erp.inspect";

export const GET = async () => {
    const data = await inspectERP();
    return json(data);
};