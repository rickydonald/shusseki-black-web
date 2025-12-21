<script lang="ts">
    import { browser } from "$app/environment";
    import { Constants } from "$lib/constants";
    import InfoCircleIcon from "@untitled-theme/icons-svelte/InfoCircleIcon.svelte";
    import { qr } from "@svelte-put/qr/svg";
    import ShussekiLogo from "$lib/assets/shusseki-logo-512x512.webp";

    let isMobile = $state(true);
    let showRestriction = $state(false);
    let copied = $state(false);

    $effect(() => {
        if (browser && Constants._SITE.MOBILE_ONLY_MODE) {
            // Check if device is mobile based on screen width and user agent
            const checkMobile = () => {
                const width = window.innerWidth;
                const userAgent = navigator.userAgent.toLowerCase();
                const isMobileUA =
                    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
                        userAgent,
                    );
                const isMobileWidth = width < 1024; // lg breakpoint

                isMobile = isMobileUA || isMobileWidth;
                showRestriction = !isMobile;
            };

            checkMobile();
            window.addEventListener("resize", checkMobile);

            return () => {
                window.removeEventListener("resize", checkMobile);
            };
        }
    });

    function copyToClipboard() {
        if (browser) {
            navigator.clipboard.writeText(window.location.origin).then(() => {
                copied = true;
                setTimeout(() => (copied = false), 2000);
            });
        }
    }
</script>

{#if showRestriction && Constants._SITE.MOBILE_ONLY_MODE}
    <div
        class="fixed inset-0 z-9999 bg-white flex items-center justify-center p-6 max-h-screen"
    >
        <div class="max-w-md w-full text-center space-y-8">
            <!-- Phone Icon -->
            <div class="text-7xl">📱</div>

            <!-- Message -->
            <div class="space-y-4">
                <h1 class="text-3xl font-bold text-gray-900">Mobile Only</h1>
                <p class="text-gray-600 leading-relaxed">
                    {Constants._SITE.NAME} is designed exclusively for mobile devices
                    to give you the best attendance tracking experience on-the-go.
                </p>
            </div>

            <!-- Info Box -->
            <!-- <div class="bg-blue-50 border border-blue-200 rounded-xl p-5 text-left">
                <h3 class="font-semibold text-blue-900 mb-2">Access Options:</h3>
                <ul class="space-y-2 text-sm text-blue-800">
                    <li class="flex items-start gap-2">
                        <span>•</span>
                        <span>Scan the QR code below with your phone's camera</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span>•</span>
                        <span>Copy the URL and send it to your mobile device</span>
                    </li>
                </ul>
            </div> -->

            <!-- QR Code -->
            <!-- <div class="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
                <svg
                    use:qr={{
                        data: browser
                            ? window.location.origin
                            : "https://shusseki.co.in",
                        logo: "https://www.shusseki.co.in/_app/immutable/assets/shusseki-logo-512x512.BIQBbkWe.webp",
                    }}
                    width="200"
                    height="200"
                    class="mx-auto"
                />
                <p class="text-xs text-gray-500">
                    Scan with your phone camera
                </p>
            </div> -->

            <!-- Divider -->
            <!-- <div class="flex items-center gap-3">
                <div class="flex-1 h-px bg-gray-200"></div>
                <span class="text-xs text-gray-400 font-medium">OR</span>
                <div class="flex-1 h-px bg-gray-200"></div>
            </div> -->

            <!-- URL Copy -->
            <div class="space-y-3">
                <p class="text-sm text-gray-700 font-medium">Copy this link:</p>
                <div class="bg-gray-100 border border-gray-200 rounded-lg p-3">
                    <p class="text-xs font-mono text-gray-700 break-all">
                        {browser ? window.location.origin : ""}
                    </p>
                </div>

                <button
                    onclick={copyToClipboard}
                    class="w-full py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
                >
                    {copied ? "✓ Copied to Clipboard" : "Copy Link"}
                </button>
            </div>

            <!-- Footer -->
            <div class="text-xs text-gray-400 pt-4 border-t border-gray-200">
                Desktop version coming soon
            </div>
        </div>
    </div>
{/if}
