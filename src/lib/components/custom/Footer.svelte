<script lang="ts">
    import ShussekiLogo from "$lib/components/icons/ShussekiLogo.svelte";
    import { Constants } from "$lib/constants";

    interface FooterProps {
        onWhatsNewClick?: () => void;
        classCode?: string;
    }

    let { onWhatsNewClick, classCode }: FooterProps = $props();
</script>

<section class="w-full py-8 px-6 bg-gray-50 rounded-t-3xl mt-1">
    <div class="max-w-md mx-auto">
        <!-- Logo and Name -->
        <div class="text-center space-y-1">
            <div class="flex justify-center">
                <ShussekiLogo width={38} height={38} color="000" />
            </div>
            <h3 class="text-base font-semibold text-gray-900">
                {Constants._SITE.NAME}
            </h3>
        </div>

        <!-- Pronunciation -->
        <p class="text-xs text-gray-500 text-center mb-5 mt-2">
            pronounced <span class="text-gray-800 font-medium italic"
                >"shoo-seh-kee"</span
            >
        </p>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-3">
            <div
                class="bg-white rounded-xl p-3.5 border border-gray-200 text-center"
            >
                <p
                    class="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5"
                >
                    Version
                </p>
                <p class="text-sm text-gray-900 font-semibold">
                    {Constants._SITE.VERSION}
                </p>
            </div>
            <div
                class="bg-white rounded-xl p-3.5 border border-gray-200 text-center"
            >
                <p
                    class="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5"
                >
                    Sake Of
                </p>
                <p class="text-sm text-gray-900 font-semibold">
                    {Constants._SITE.VERSION_CODE}
                </p>
            </div>
        </div>

        <!-- Copyright -->
        <div class="text-center pt-4">
            <p class="text-[10px] text-gray-400">
                © {new Date().getFullYear()}
                {Constants._SITE.NAME} • SRGM30N25
            </p>
        </div>
    </div>
</section>
