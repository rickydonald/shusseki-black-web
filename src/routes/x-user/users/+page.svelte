<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import SearchMdIcon from '@untitled-theme/icons-svelte/SearchMdIcon.svelte';
	import RefreshCw01Icon from '@untitled-theme/icons-svelte/RefreshCw01Icon.svelte';
	import ChevronLeftIcon from '@untitled-theme/icons-svelte/ChevronLeftIcon.svelte';
	import ChevronRightIcon from '@untitled-theme/icons-svelte/ChevronRightIcon.svelte';
	import UserCheck01Icon from '@untitled-theme/icons-svelte/UserCheck01Icon.svelte';
	import UserX01Icon from '@untitled-theme/icons-svelte/UserX01Icon.svelte';
	import FilterLinesIcon from '@untitled-theme/icons-svelte/FilterLinesIcon.svelte';
	import Edit05Icon from '@untitled-theme/icons-svelte/Edit05Icon.svelte';
	import { DateTime } from 'luxon';

	let users = $state<any[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let filterBanned = $state<'all' | 'active' | 'banned'>('all');
	let filterShift = $state<'all' | '0' | '1' | '2'>('all');
	let page = $state(1);
	let totalPages = $state(1);
	let totalUsers = $state(0);
	let banningUserId = $state<string | null>(null);
	let editingShiftUserId = $state<string | null>(null);
	let showShiftModal = $state(false);
	let selectedUser = $state<any | null>(null);
	let newShiftValue = $state<0 | 1 | 2>(0);

	onMount(() => {
		loadUsers();
	});

	async function loadUsers() {
		loading = true;
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: '20',
			});

			if (searchQuery) params.set('search', searchQuery);
			if (filterBanned !== 'all') {
				params.set('banned', filterBanned === 'banned' ? 'true' : 'false');
			}
			if (filterShift !== 'all') {
				params.set('shift', filterShift);
			}

			const response = await fetch(`/api/x-user/users?${params}`);
			if (response.ok) {
				const data = await response.json();
				users = data.data.users;
				totalPages = data.data.pagination.totalPages;
				totalUsers = data.data.pagination.total;
			} else {
				toast.error('Failed to load users');
			}
		} catch (error) {
			console.error('Failed to load users:', error);
			toast.error('Failed to load users');
		} finally {
			loading = false;
		}
	}

	async function toggleBan(userId: string, currentlyBanned: boolean) {
		if (banningUserId) return;

		const action = currentlyBanned ? 'unban' : 'ban';
		const confirmed = confirm(`Are you sure you want to ${action} this user?`);
		if (!confirmed) return;

		banningUserId = userId;
		try {
			const response = await fetch(`/api/x-user/users/${userId}/ban`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ banned: !currentlyBanned }),
			});

			if (response.ok) {
				toast.success(`User ${action}ned successfully`);
				await loadUsers();
			} else {
				const error = await response.json();
				toast.error(error.error || `Failed to ${action} user`);
			}
		} catch (error) {
			console.error(`Failed to ${action} user:`, error);
			toast.error(`Failed to ${action} user`);
		} finally {
			banningUserId = null;
		}
	}

	function openShiftModal(user: any) {
		selectedUser = user;
		newShiftValue = user.shift;
		showShiftModal = true;
	}

	function closeShiftModal() {
		showShiftModal = false;
		selectedUser = null;
	}

	async function updateShift() {
		if (!selectedUser) return;
		
		editingShiftUserId = selectedUser.userId;
		try {
			const response = await fetch(`/api/x-user/users/${selectedUser.userId}/shift`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ shift: newShiftValue }),
			});

			if (response.ok) {
				toast.success('User shift updated successfully');
				closeShiftModal();
				await loadUsers();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to update shift');
			}
		} catch (error) {
			console.error('Failed to update shift:', error);
			toast.error('Failed to update shift');
		} finally {
			editingShiftUserId = null;
		}
	}

	function handleSearch() {
		page = 1;
		loadUsers();
	}

	function handleFilterChange() {
		page = 1;
		loadUsers();
	}

	function nextPage() {
		if (page < totalPages) {
			page++;
			loadUsers();
		}
	}

	function prevPage() {
		if (page > 1) {
			page--;
			loadUsers();
		}
	}

	function formatDateIST(dateString: string | Date | null) {
		if (!dateString || dateString === 'start' || dateString === 'never') return 'Never';
		try {
			const dateStr = dateString instanceof Date ? dateString.toISOString() : dateString;
			const dt = DateTime.fromISO(dateStr, { zone: 'utc' }).setZone('Asia/Kolkata');
			return dt.toFormat('dd MMM yyyy, hh:mm a');
		} catch {
			return 'Invalid date';
		}
	}

	function getShiftBadgeColor(shift: number) {
		if (shift === 1) return 'bg-blue-100 text-blue-700';
		if (shift === 2) return 'bg-purple-100 text-purple-700';
		return 'bg-gray-100 text-gray-700';
	}
</script>

<div class="space-y-6 p-6 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">User Management</h1>
			<p class="text-gray-600 mt-1">
				{totalUsers} total users
			</p>
		</div>
		<button
			onclick={loadUsers}
			disabled={loading}
			class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:shadow-sm disabled:opacity-50"
		>
			<div class:animate-spin={loading}>
				<RefreshCw01Icon class="w-4 h-4" />
			</div>
			Refresh
		</button>
	</div>

	<!-- Filters & Search -->
	<div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
		<div class="flex flex-col md:flex-row gap-4">
			<!-- Search -->
			<div class="flex-1 relative">
				<SearchMdIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
				<input
					type="text"
					bind:value={searchQuery}
					onkeydown={(e) => e.key === 'Enter' && handleSearch()}
					placeholder="Search by user ID or name..."
					class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
				/>
			</div>

			<!-- Filters -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
				<div class="flex items-center gap-2">
					<FilterLinesIcon class="w-5 h-5 text-gray-400" />
					<select
						bind:value={filterBanned}
						onchange={handleFilterChange}
						class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="all">All Status</option>
						<option value="active">Active Only</option>
						<option value="banned">Banned Only</option>
					</select>
				</div>

				<select
					bind:value={filterShift}
					onchange={handleFilterChange}
					class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="all">All Shifts</option>
					<option value="0">Not Set</option>
					<option value="1">Shift 1</option>
					<option value="2">Shift 2</option>
				</select>
			</div>

			<button
				onclick={handleSearch}
				class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
			>
				Search
			</button>
		</div>
	</div>

	<!-- Users Table -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		{#if loading}
			<div class="p-12 text-center">
				<RefreshCw01Icon class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
				<p class="text-gray-600">Loading users...</p>
			</div>
		{:else if users.length === 0}
			<div class="p-12 text-center">
				<p class="text-gray-600">No users found</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								User
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Shift
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Type
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Joined (IST)
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Last Login (IST)
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each users as user}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4">
									<div>
										<p class="font-medium text-gray-900">{user.name || 'Guest'}</p>
										<p class="text-sm text-gray-500">{user.userId}</p>
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-2">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getShiftBadgeColor(user.shift)}">
											{user.shift === 0 ? 'Not Set' : `Shift ${user.shift}`}
										</span>
										<button
											onclick={() => openShiftModal(user)}
											class="p-1 hover:bg-gray-100 rounded transition-colors"
											title="Edit shift"
										>
											<Edit05Icon class="w-4 h-4 text-gray-600" />
										</button>
									</div>
								</td>
								<td class="px-6 py-4">
									<span class="text-sm text-gray-900">
										{user.userType === 'x-admin-user' ? 'Admin' : 'User'}
									</span>
								</td>
								<td class="px-6 py-4 text-sm text-gray-600">
									{formatDateIST(user.createdAt)}
								</td>
								<td class="px-6 py-4 text-sm text-gray-600">
									{formatDateIST(user.lastLogin)}
								</td>
								<td class="px-6 py-4">
									{#if user.isBanned}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
											<UserX01Icon class="w-3 h-3" />
											Banned
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
											<UserCheck01Icon class="w-3 h-3" />
											Active
										</span>
									{/if}
								</td>
								<td class="px-6 py-4 text-right">
									<button
										onclick={() => toggleBan(user.userId, user.isBanned)}
										disabled={banningUserId === user.userId || user.userType === 'x-admin-user'}
										class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
											{user.isBanned 
												? 'bg-green-100 text-green-700 hover:bg-green-200' 
												: 'bg-red-100 text-red-700 hover:bg-red-200'}"
									>
										{#if banningUserId === user.userId}
											<RefreshCw01Icon class="w-4 h-4 animate-spin inline" />
										{:else}
											{user.isBanned ? 'Unban' : 'Ban'}
										{/if}
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			<div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
				<p class="text-sm text-gray-600">
					Page {page} of {totalPages}
				</p>
				<div class="flex gap-2">
					<button
						onclick={prevPage}
						disabled={page === 1 || loading}
						class="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<ChevronLeftIcon class="w-4 h-4" />
						Previous
					</button>
					<button
						onclick={nextPage}
						disabled={page === totalPages || loading}
						class="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next
						<ChevronRightIcon class="w-4 h-4" />
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Shift Edit Modal -->
{#if showShiftModal && selectedUser}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onclick={closeShiftModal}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onclick={(e) => e.stopPropagation()}>
			<h2 class="text-xl font-bold text-gray-900 mb-4">Edit User Shift</h2>
			
			<div class="mb-4">
				<p class="text-sm text-gray-600 mb-1">User: <span class="font-medium text-gray-900">{selectedUser.name}</span></p>
				<p class="text-sm text-gray-600">ID: <span class="font-medium text-gray-900">{selectedUser.userId}</span></p>
			</div>

			<div class="mb-6">
				<div class="block text-sm font-medium text-gray-700 mb-2">Select Shift</div>
				<div class="space-y-2">
					<label class="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all {newShiftValue === 0 ? 'border-gray-600 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}">
						<input
							type="radio"
							bind:group={newShiftValue}
							value={0}
							class="w-4 h-4 text-gray-600 focus:ring-gray-500"
						/>
						<span class="ml-3 text-sm font-medium">Not Set</span>
					</label>
					<label class="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all {newShiftValue === 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}">
						<input
							type="radio"
							bind:group={newShiftValue}
							value={1}
							class="w-4 h-4 text-blue-600 focus:ring-blue-500"
						/>
						<span class="ml-3 text-sm font-medium">Shift 1</span>
					</label>
					<label class="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all {newShiftValue === 2 ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}">
						<input
							type="radio"
							bind:group={newShiftValue}
							value={2}
							class="w-4 h-4 text-purple-600 focus:ring-purple-500"
						/>
						<span class="ml-3 text-sm font-medium">Shift 2</span>
					</label>
				</div>
			</div>

			<div class="flex gap-3">
				<button
					onclick={closeShiftModal}
					class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
				>
					Cancel
				</button>
				<button
					onclick={updateShift}
					disabled={editingShiftUserId !== null}
					class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if editingShiftUserId}
						<RefreshCw01Icon class="w-4 h-4 animate-spin inline mr-2" />
						Updating...
					{:else}
						Update Shift
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
