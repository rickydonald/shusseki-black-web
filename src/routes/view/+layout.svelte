<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { Constants } from "$lib/constants";
    import BottomTab from "$lib/components/custom/BottomTab.svelte";
    import MobileOnlyRestriction from "$lib/components/custom/MobileOnlyRestriction.svelte";
    import type { LayoutProps } from "./$types";
    import { injectAnalytics } from "@vercel/analytics/sveltekit";
    import { onMount } from "svelte";

    let { data, children }: LayoutProps = $props();
    let showRestriction = $state(false);

    $effect(() => {
        if (browser && Constants._SITE.MOBILE_ONLY_MODE) {
            const checkMobile = () => {
                const width = window.innerWidth;
                const userAgent = navigator.userAgent.toLowerCase();
                const isMobileUA =
                    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
                        userAgent,
                    );
                const isMobileWidth = width < 1024;

                const isMobile = isMobileUA || isMobileWidth;
                showRestriction = !isMobile;
            };

            checkMobile();
            window.addEventListener("resize", checkMobile);

            return () => {
                window.removeEventListener("resize", checkMobile);
            };
        }
    });
    onMount(() => {
        if (import.meta.env.PROD) {
            injectAnalytics();
        }
    });
</script>

{#if showRestriction && Constants._SITE.MOBILE_ONLY_MODE}
    <MobileOnlyRestriction />
{:else}
    <div class="relative">
        {@render children()}
    </div>
{/if}
