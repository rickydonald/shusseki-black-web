import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
    const shareCode = url.searchParams.get("_inviteCode")
    if (shareCode) {

    }
    
    return {};
}