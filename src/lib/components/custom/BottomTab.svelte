<script lang="ts">
    import { page } from "$app/state";
    import clsx from "clsx";
    import CalendarIcon from "@untitled-theme/icons-svelte/CalendarIcon.svelte";
    import { Settings01Icon, Home02Icon, MessageChatCircleIcon } from "@untitled-theme/icons-svelte";

    const navLinks = [
        { name: "Attendance", href: "/view/attendance", icon: Home02Icon},
        { name: "Calendar", href: "/view/academic-calendar", icon: CalendarIcon },
        { name: "Feedback", href: "/view/feedback", icon: MessageChatCircleIcon },
        { name: "Settings", href: "/view/settings", icon: Settings01Icon },
    ];
</script>

<nav
    class="bottom-tab bg-white border border-gray-200 dark:border-gray-700 rounded-full shadow-2xl"
>
    {#each navLinks as link}
        <a
            href={link.href}
            class={clsx(
                "tab-item flex flex-col items-center justify-center text-center text-sm transition-all",
                link.href === page.url.pathname
                    ? "text-gray-900"
                    : "text-gray-500",
            )}
        >
            <svelte:component this={link.icon} width="22" height="22" />
            <span class="label text-xs mt-0.5">{link.name}</span>
        </a>
    {/each}
</nav>

<style>
    .bottom-tab {
        width: calc(100% - 30px);
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60px;
        display: flex;
        justify-content: space-around;
        align-items: center;
        z-index: 1000;
        margin: 15px;
    }
</style>
