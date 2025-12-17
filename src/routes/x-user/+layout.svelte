<script lang="ts">
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { toast } from "svelte-sonner";
	import { onMount } from "svelte";
	import type { Snippet } from "svelte";
	import Users01Icon from "@untitled-theme/icons-svelte/Users01Icon.svelte";
	import Bell02Icon from "@untitled-theme/icons-svelte/Bell02Icon.svelte";
	import MessageChatCircleIcon from "@untitled-theme/icons-svelte/MessageChatCircleIcon.svelte";
	import Settings01Icon from "@untitled-theme/icons-svelte/Settings01Icon.svelte";
	import BarChart01Icon from "@untitled-theme/icons-svelte/BarChart01Icon.svelte";
	import LogOut01Icon from "@untitled-theme/icons-svelte/LogOut01Icon.svelte";
	import AlertCircleIcon from "@untitled-theme/icons-svelte/AlertCircleIcon.svelte";
	import CalendarIcon from "@untitled-theme/icons-svelte/CalendarIcon.svelte";
	import Menu01Icon from "@untitled-theme/icons-svelte/Menu01Icon.svelte";
	import XCloseIcon from "@untitled-theme/icons-svelte/XCloseIcon.svelte";
	import ShussekiLogo from "$lib/components/icons/ShussekiLogo.svelte";

	let { children }: { children: Snippet } = $props();
	let maintenanceEnabled = $state(false);
	let mobileMenuOpen = $state(false);

	onMount(() => {
		checkMaintenanceStatus();
		// Check every 30 seconds
		const interval = setInterval(checkMaintenanceStatus, 30000);
		return () => clearInterval(interval);
	});

	async function checkMaintenanceStatus() {
		try {
			const response = await fetch("/api/x-user/maintenance/get");
			if (response.ok) {
				const data = await response.json();
				console.log("Layout checked maintenance status:", data);
				maintenanceEnabled = data.maintenanceMode;
			}
		} catch (error) {
			console.error("Failed to check maintenance status:", error);
		}
	}

	const navItems = [
		{ href: "/x-user/dashboard", label: "Dashboard", icon: BarChart01Icon },
		{ href: "/x-user/users", label: "Users", icon: Users01Icon },
		{
			href: "/x-user/timetables",
			label: "Timetables",
			icon: CalendarIcon,
		},
		{
			href: "/x-user/push-notifications",
			label: "Push Notifications",
			icon: Bell02Icon,
		},
		{
			href: "/x-user/feedback",
			label: "Feedback",
			icon: MessageChatCircleIcon,
		},
		{
			href: "/x-user/maintenance",
			label: "Maintenance",
			icon: Settings01Icon,
		},
	];

	function isActive(href: string) {
		return (
			page.url.pathname === href ||
			page.url.pathname.startsWith(href + "/")
		);
	}

	async function handleLogout() {
		try {
			const response = await fetch("/api/x-user/logout", {
				method: "POST",
			});
			if (response.ok) {
				toast.success("Logged out successfully");
				goto("/x-user/login");
			}
		} catch (error) {
			toast.error("Logout failed");
		}
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

{#if page.url.pathname === "/x-user/login"}
	{@render children()}
{:else}
	<div class="min-h-screen bg-gray-50">
		<!-- Top Navigation Bar -->
		<nav class="bg-white border-b border-gray-200 sticky top-0 z-40">
			<div class="w-full px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between h-16">
					<div class="flex items-center gap-3">
						<!-- Mobile Menu Button -->
						<button
							onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
							class="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
						>
							{#if mobileMenuOpen}
								<XCloseIcon class="w-6 h-6" />
							{:else}
								<Menu01Icon class="w-6 h-6" />
							{/if}
						</button>

						<ShussekiLogo
							width={32}
							height={32}
							color="000"
							strokeWidth={14}
						/>
						<div class="hidden sm:block">
							<h1 class="text-base lg:text-lg font-bold text-gray-900">
								Shusseki X-User
							</h1>
						</div>
						{#if maintenanceEnabled}
							<div
								class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200 text-center"
							>
								<span class="text-xs font-medium">Maintenance Mode ON</span>
							</div>
						{/if}
					</div>
					<div class="flex items-center gap-2 sm:gap-4">
						<a
							href="/view/attendance"
							class="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
						>
							<span class="hidden sm:inline">Back to App →</span>
							<span class="sm:hidden">App →</span>
						</a>
						<button
							onclick={handleLogout}
							class="flex items-center gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
						>
							<LogOut01Icon class="w-4 h-4" />
							<span class="hidden sm:inline">Logout</span>
						</button>
					</div>
				</div>

				<!-- Mobile Maintenance Badge -->
				{#if maintenanceEnabled}
					<div
						class="md:hidden flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-2"
					>
						<AlertCircleIcon class="w-4 h-4" />
						<span class="text-xs font-medium">Maintenance Mode ON</span>
					</div>
				{/if}
			</div>
		</nav>

		<!-- Mobile Menu Overlay -->
		{#if mobileMenuOpen}
			<div
				class="lg:hidden fixed inset-0 z-30 bg-black/50 top-16"
				onclick={closeMobileMenu}
			></div>
		{/if}

		<!-- Side Navigation + Content -->
		<div class="flex w-full">
			<!-- Sidebar - Desktop -->
			<aside
				class="hidden lg:block w-64 min-h-screen bg-white border-r border-gray-100 sticky top-16 self-start"
			>
				<nav class="p-4 space-y-1">
					{#each navItems as item}
						{@const Icon = item.icon}
						<a
							href={item.href}
							class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all {isActive(
								item.href,
							)
								? 'bg-black text-white shadow-sm'
								: 'text-gray-700 hover:bg-gray-50'}"
						>
							<Icon class="w-5 h-5" />
							{item.label}
						</a>
					{/each}
				</nav>
			</aside>

			<!-- Sidebar - Mobile -->
			<aside
				class="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-100 z-40 transform transition-transform duration-300 {mobileMenuOpen
					? 'translate-x-0'
					: '-translate-x-full'}"
			>
				<nav class="p-4 space-y-1">
					{#each navItems as item}
						{@const Icon = item.icon}
						<a
							href={item.href}
							onclick={closeMobileMenu}
							class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all {isActive(
								item.href,
							)
								? 'bg-black text-white shadow-sm'
								: 'text-gray-700 hover:bg-gray-50'}"
						>
							<Icon class="w-5 h-5" />
							{item.label}
						</a>
					{/each}
				</nav>
			</aside>

			<!-- Main Content -->
			<main class="flex-1 bg-gray-50 w-full min-w-0">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
