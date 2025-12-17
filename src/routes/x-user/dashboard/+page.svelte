<script lang="ts">
	import { onMount } from "svelte";
	import Users01Icon from "@untitled-theme/icons-svelte/Users01Icon.svelte";
	import UserCheck01Icon from "@untitled-theme/icons-svelte/UserCheck01Icon.svelte";
	import UserX01Icon from "@untitled-theme/icons-svelte/UserX01Icon.svelte";
	import Bell02Icon from "@untitled-theme/icons-svelte/Bell02Icon.svelte";
	import TrendUp01Icon from "@untitled-theme/icons-svelte/TrendUp01Icon.svelte";
	import { MessageChatCircleIcon } from "@untitled-theme/icons-svelte";

	let stats = $state<any>(null);
	let loading = $state(true);

	onMount(async () => {
		await loadStats();
	});

	async function loadStats() {
		loading = true;
		try {
			const response = await fetch("/api/x-user/stats");
			if (response.ok) {
				const data = await response.json();
				stats = data.stats;
			}
		} catch (error) {
			console.error("Failed to load stats:", error);
		} finally {
			loading = false;
		}
	}

	const statCards = $derived(
		stats
			? [
					{
						label: "Total Users",
						value: stats.totalUsers,
						icon: Users01Icon,
						color: "blue",
						change: null as string | null,
					},
					{
						label: "Active Users",
						value: stats.activeUsers,
						icon: UserCheck01Icon,
						color: "green",
						change: null as string | null,
					},
					{
						label: "Banned Users",
						value: stats.bannedUsers,
						icon: UserX01Icon,
						color: "red",
						change: null as string | null,
					},
					{
						label: "Push Subscriptions",
						value: stats.uniquePushUsers,
						icon: Bell02Icon,
						color: "purple",
						subtext: `${stats.totalPushSubscriptions} total devices`,
						change: null as string | null,
					},
				]
			: [],
	);

	function getColorClasses(color: string) {
		const colors = {
			blue: "bg-blue-50 text-blue-600",
			green: "bg-green-50 text-green-600",
			red: "bg-red-50 text-red-600",
			purple: "bg-purple-50 text-purple-600",
		};
		return colors[color as keyof typeof colors] || colors.blue;
	}
</script>

<div class="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="mb-2">
		<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
		<p class="text-sm sm:text-base text-gray-600 mt-1">System overview and key metrics</p>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
			{#each Array(4) as _}
				<div
					class="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 animate-pulse"
				>
					<div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
					<div class="h-8 bg-gray-200 rounded w-3/4"></div>
				</div>
			{/each}
		</div>
	{:else if stats}
		<!-- Stats Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
			{#each statCards as stat}
				{@const Icon = stat.icon}
				<div
					class="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:scale-[1.02]"
				>
					<div class="flex items-center justify-between mb-3 sm:mb-4">
						<div
							class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl {getColorClasses(
								stat.color,
							)} flex items-center justify-center shadow-sm"
						>
							<Icon class="w-5 h-5 sm:w-6 sm:h-6" />
						</div>
						{#if stat.change}
							<div
								class="flex items-center gap-1 text-xs sm:text-sm font-medium text-green-600"
							>
								<TrendUp01Icon class="w-3 h-3 sm:w-4 sm:h-4" />
								{stat.change}
							</div>
						{/if}
					</div>
					<p class="text-xs sm:text-sm font-medium text-gray-600 mb-1">
						{stat.label}
					</p>
					<p class="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
					{#if stat.subtext}
						<p class="text-xs text-gray-500 mt-1 sm:mt-2">{stat.subtext}</p>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Users by Shift -->
		<div class="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
			<h2 class="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
				Users by Shift
			</h2>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
				<div
					class="text-center p-4 sm:p-6 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200"
				>
					<p class="text-xs sm:text-sm font-medium text-gray-600 mb-2">
						Not Set
					</p>
					<p class="text-2xl sm:text-3xl font-bold text-gray-900">
						{stats.usersByShift.shift0 || 0}
					</p>
				</div>
				<div
					class="text-center p-4 sm:p-6 bg-linear-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200"
				>
					<p class="text-xs sm:text-sm font-medium text-blue-600 mb-2">
						Shift 1
					</p>
					<p class="text-2xl sm:text-3xl font-bold text-blue-900">
						{stats.usersByShift.shift1 || 0}
					</p>
				</div>
				<div
					class="text-center p-4 sm:p-6 bg-linear-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200"
				>
					<p class="text-xs sm:text-sm font-medium text-purple-600 mb-2">
						Shift 2
					</p>
					<p class="text-2xl sm:text-3xl font-bold text-purple-900">
						{stats.usersByShift.shift2 || 0}
					</p>
				</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
			<h2 class="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
				Quick Actions
			</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
				<a
					href="/x-user/users"
					class="flex items-center gap-3 p-3 sm:p-4 bg-linear-to-br from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all hover:scale-[1.02]"
				>
					<Users01Icon class="w-5 h-5 text-gray-700 flex-shrink-0" />
					<span class="font-medium text-sm sm:text-base text-gray-900">Manage Users</span>
				</a>
				<a
					href="/x-user/push-notifications"
					class="flex items-center gap-3 p-3 sm:p-4 bg-linear-to-br from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all hover:scale-[1.02]"
				>
					<Bell02Icon class="w-5 h-5 text-gray-700 flex-shrink-0" />
					<span class="font-medium text-sm sm:text-base text-gray-900"
						>Send Notification</span
					>
				</a>
				<a
					href="/x-user/feedback"
					class="flex items-center gap-3 p-3 sm:p-4 bg-linear-to-br from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all hover:scale-[1.02]"
				>
					<MessageChatCircleIcon class="w-5 h-5 text-gray-700 flex-shrink-0" />
					<span class="font-medium text-sm sm:text-base text-gray-900">View Feedback</span>
				</a>
			</div>
		</div>
	{/if}
</div>
