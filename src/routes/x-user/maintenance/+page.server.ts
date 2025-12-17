import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, locals }) => {
  // Check authentication from parent layout
  const { authenticated } = await parent();
  if (!authenticated) {
    throw redirect(302, "/x-user/login");
  }

  // Return empty object - data will be fetched via API
  return {};
};
