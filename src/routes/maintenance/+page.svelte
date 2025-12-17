<script lang="ts">
    import { Constants } from "$lib/constants";
    import ShussekiLogo from "$lib/components/icons/ShussekiLogo.svelte";
    import type { PageData } from "./$types";
    import { onMount } from "svelte";

    export let data: PageData;

    const STORAGE_KEY = "maintenance_cache";
    const sanitizedTitle = data.title
    const sanitizedMessage = data.message

    onMount(() => {
        if (data.cachedData) {
            const localCache = localStorage.getItem(STORAGE_KEY);
            if (localCache !== data.cachedData) {
                localStorage.setItem(STORAGE_KEY, data.cachedData);
            }
        }
    });
</script>

<main class="min-h-screen bg-black flex flex-col items-center">
    <section
        class="w-full md:max-w-full py-6 px-6 bg-[#F7F6FA] rounded-b-2xl flex-1 flex flex-col items-center justify-center"
    >
        <ShussekiLogo width={80} height={80} color="000" className="mb-5" />
        <h1 class="font-semibold text-center text-3xl tracking-tight mb-2">
            {sanitizedTitle}
        </h1>
        <div class="text-center max-w-2xl">
            <div class="text-center text-sm mt-3 text-gray-700 font-medium whitespace-pre-line">
                {sanitizedMessage}
            </div>
        </div>
    </section>
    <section
        class="w-full md:max-w-full py-6 px-6 bg-[#F7F6FA] rounded-t-2xl mt-2"
    >
        <p class="text-sm text-gray-500 text-center">
            © 2025 Shusseki |
            {Constants._SITE.VERSION_CODE}
        </p>
    </section>
</main>

<!-- <style>
    .maintenance-bg {
        background: linear-gradient(90deg, #28a1f1, #211fc1) !important;
    }
</style> -->
