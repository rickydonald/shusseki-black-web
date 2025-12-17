<script lang="ts">
    let { children } = $props();
</script>

<main class="min-h-screen bg-black flex flex-col items-center">
    <div class="sm:max-w-lg w-full min-h-screen">
        {@render children()}
    </div>
</main>
