<script lang="ts">
    import ShussekiLogo from "../icons/ShussekiLogo.svelte";

</script>

<svelte:head>
    <title>404 Not Found - Shusseki</title>
    <meta name="description" content="The page you are looking for does not exist." />
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
    <ShussekiLogo 
        width={120}
        height={120}
        startColor="#3b82f6"
        endColor="#06b6d4"
        className="mb-6"
    />
    <h1 class="text-6xl font-bold text-gray-800 mb-4">404</h1>
    <p class="text-xl text-center text-gray-600 mb-8">Oops! The page you are looking for does not exist.</p>
    <a href="/" class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
        Go to Homepage
    </a>
</div>