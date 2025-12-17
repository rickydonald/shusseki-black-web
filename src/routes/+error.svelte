<script lang="ts">
    import { page } from "$app/state";
    import Error404 from "$lib/components/pages/Error404.svelte";
</script>

{#if page.status === 404}
    <Error404 />
{/if}
