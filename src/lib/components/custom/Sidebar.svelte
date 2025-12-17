<script lang="ts">
    import { goto } from "$app/navigation";
    import { fade } from "svelte/transition";
    import { expoOut } from "svelte/easing";
    import LogOutIcon01 from "@untitled-theme/icons-svelte/LogOut01Icon.svelte";
    import CalendarIcon from "@untitled-theme/icons-svelte/CalendarIcon.svelte";
    import XCloseIcon from "@untitled-theme/icons-svelte/XCloseIcon.svelte";
    import { Constants } from "$lib/constants";
    import { MessageChatCircleIcon, Settings01Icon } from "@untitled-theme/icons-svelte";

    // Props
    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen = $bindable(), onClose }: Props = $props();
    let isClosing = $state(false);

    function handleClose() {
        isClosing = true;
        setTimeout(() => {
            isClosing = false;
            onClose();
        }, 350); // Match animation duration
    }

    function handleNavigation(path: string) {
        goto(path);
        handleClose();
    }

    function handleLogout() {
        goto("/api/v1/user/logout");
    }
</script>

<!-- Overlay -->
{#if isOpen}
    <button
        class="fixed inset-0 bg-linear-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-md z-40 cursor-default"
        onclick={handleClose}
        transition:fade={{ duration: 300, easing: expoOut }}
        aria-label="Close sidebar"
    ></button>
{/if}

<!-- Sidebar -->
{#if isOpen}
    <aside
        class="fixed top-0 right-0 h-screen w-full bg-linear-to-b from-white to-gray-50 border-l border-gray-200 shadow-2xl z-50 flex flex-col overflow-hidden"
        class:sidebar-slide-in={!isClosing}
        class:sidebar-slide-out={isClosing}
    >
        <!-- Ambient Glow Effect -->
        <div
            class="absolute top-0 right-0 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl pointer-events-none"
        ></div>
        <div
            class="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl pointer-events-none"
        ></div>

        <!-- Header -->
        <header
            class="relative backdrop-blur-xl bg-white/80 border-b border-gray-200 px-8 py-6 shrink-0"
            style="animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;"
        >
            <div class="flex items-center justify-between">
                <div>
                    <h2
                        class="text-[32px] font-bold text-gray-900 tracking-tight mb-0.5"
                    >
                        {Constants._SITE.NAME}
                    </h2>
                    <!-- <p class="text-[13px] text-gray-600 font-medium">Shusseki Platform</p> -->
                </div>
                <button
                    onclick={handleClose}
                    class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-300"
                >
                    <XCloseIcon class="w-5 h-5" />
                </button>
            </div>
        </header>

        <!-- Navigation Items -->
        <nav
            class="relative flex-1 overflow-y-auto overflow-x-hidden px-6 py-8 space-y-3 scrollbar-hide"
        >
            <!-- Navigation Item -->
            <button
                onclick={() => handleNavigation("/view/academic-calendar")}
                class="flex items-center gap-2 font-medium text-xl w-full"
            >
                <CalendarIcon class="w-6 h-6 mr-3" />
                <span>Academic Calendar</span>
            </button>
            <hr class="my-6" />
            <button
                onclick={() => handleNavigation("/view/settings")}
                class="flex items-center gap-2 font-medium text-xl w-full"
            >
                <Settings01Icon class="w-6 h-6 mr-3" />
                <span>Settings</span>
            </button>
        </nav>

        <!-- Footer -->
        <footer
            class="relative backdrop-blur-xl border-t border-white/5 px-8 py-5 shrink-0"
            style="animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;"
        >
            <div class="mt-3 pt-3 border-t border-white/5">
                <p class="text-[11px] text-gray-600 text-center font-mono">
                    v{Constants._SITE.VERSION}
                </p>
            </div>
        </footer>
    </aside>
{/if}

<style>
    @keyframes slideInRight {
        0% {
            opacity: 0;
            transform: translate3d(100%, 0, 0);
        }
        100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
        }
    }

    @keyframes slideOutRight {
        0% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
        }
        100% {
            opacity: 0;
            transform: translate3d(100%, 0, 0);
        }
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .sidebar-slide-in {
        animation: slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .sidebar-slide-out {
        animation: slideOutRight 0.35s cubic-bezier(0.64, 0, 0.78, 0) both;
    }

    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }

    /* Smooth scrolling for the entire sidebar */
    aside {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -webkit-transform: translate3d(0, 0, 0);
        transform: translate3d(0, 0, 0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        -webkit-perspective: 1000px;
        perspective: 1000px;
        will-change: transform;
    }
</style>
