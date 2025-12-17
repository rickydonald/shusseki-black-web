<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import SearchMdIcon from '@untitled-theme/icons-svelte/SearchMdIcon.svelte';
	import RefreshCw01Icon from '@untitled-theme/icons-svelte/RefreshCw01Icon.svelte';
	import ChevronLeftIcon from '@untitled-theme/icons-svelte/ChevronLeftIcon.svelte';
	import ChevronRightIcon from '@untitled-theme/icons-svelte/ChevronRightIcon.svelte';
	import Edit05Icon from '@untitled-theme/icons-svelte/Edit05Icon.svelte';
	import CheckCircleIcon from '@untitled-theme/icons-svelte/CheckCircleIcon.svelte';
	import XCircleIcon from '@untitled-theme/icons-svelte/XCircleIcon.svelte';
	import CalendarIcon from '@untitled-theme/icons-svelte/CalendarIcon.svelte';
	import { DateTime } from 'luxon';

	let timetables = $state<any[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let filterActive = $state<boolean | null>(null);
	let page = $state(1);
	let totalPages = $state(1);
	let totalTimetables = $state(0);
	let showEditModal = $state(false);
	let selectedTimetable = $state<any | null>(null);
	let editedTimetable = $state<string>('');
	let editedIsActive = $state(true);
	let updatingTimetable = $state(false);

	onMount(() => {
		loadTimetables();
	});

	async function loadTimetables() {
		loading = true;
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: '20',
			});

			if (searchQuery) params.set('search', searchQuery);
			if (filterActive !== null) {
				params.set('active', filterActive.toString());
			}

			const response = await fetch(`/api/x-user/timetables?${params}`);
			if (response.ok) {
				const data = await response.json();
				timetables = data.data.timetables;
				totalPages = data.data.pagination.totalPages;
				totalTimetables = data.data.pagination.total;
			} else {
				toast.error('Failed to load timetables');
			}
		} catch (error) {
			console.error('Failed to load timetables:', error);
			toast.error('Failed to load timetables');
		} finally {
			loading = false;
		}
	}

	function openEditModal(timetable: any) {
		selectedTimetable = timetable;
		editedTimetable = JSON.stringify(timetable.timetable, null, 2);
		editedIsActive = timetable.isActive;
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		selectedTimetable = null;
		editedTimetable = '';
	}

	async function saveTimetable() {
		if (!selectedTimetable) return;

		try {
			const parsedTimetable = JSON.parse(editedTimetable);
			updatingTimetable = true;

			const response = await fetch(`/api/x-user/timetables/${selectedTimetable.classCode}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					timetable: parsedTimetable,
					isActive: editedIsActive,
				}),
			});

			if (response.ok) {
				toast.success('Timetable updated successfully');
				closeEditModal();
				await loadTimetables();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to update timetable');
			}
		} catch (error: any) {
			if (error instanceof SyntaxError) {
				toast.error('Invalid JSON format. Please check your timetable data.');
			} else {
				console.error('Failed to update timetable:', error);
				toast.error('Failed to update timetable');
			}
		} finally {
			updatingTimetable = false;
		}
	}

	function handleSearch() {
		page = 1;
		loadTimetables();
	}

	function handleFilterChange() {
		page = 1;
		loadTimetables();
	}

	function nextPage() {
		if (page < totalPages) {
			page++;
			loadTimetables();
		}
	}

	function prevPage() {
		if (page > 1) {
			page--;
			loadTimetables();
		}
	}

	function formatDateIST(dateString: string | Date | null) {
		if (!dateString) return 'N/A';
		try {
			const dateStr = dateString instanceof Date ? dateString.toISOString() : dateString;
			const dt = DateTime.fromISO(dateStr, { zone: 'utc' }).setZone('Asia/Kolkata');
			return dt.toFormat('dd MMM yyyy, hh:mm a');
		} catch {
			return 'Invalid date';
		}
	}

	function formatTimetablePreview(timetable: any): string {
		if (!timetable) return 'No data';
		try {
			const str = JSON.stringify(timetable);
			return str.length > 100 ? str.substring(0, 100) + '...' : str;
		} catch {
			return 'Invalid data';
		}
	}
</script>

<div class="space-y-6 p-6 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Class Timetables</h1>
			<p class="text-gray-600 mt-1">
				{totalTimetables} total timetables
			</p>
		</div>
		<button
			onclick={loadTimetables}
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
					placeholder="Search by class code or user ID..."
					class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
				/>
			</div>

			<!-- Filters -->
			<div class="flex items-center gap-2">
				<select
					bind:value={filterActive}
					onchange={handleFilterChange}
					class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value={null}>All Timetables</option>
					<option value={true}>Active Only</option>
					<option value={false}>Inactive Only</option>
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

	<!-- Timetables Table -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		{#if loading}
			<div class="p-12 text-center">
				<RefreshCw01Icon class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
				<p class="text-gray-600">Loading timetables...</p>
			</div>
		{:else if timetables.length === 0}
			<div class="p-12 text-center">
				<CalendarIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<p class="text-gray-600">No timetables found</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Class Code
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								User ID
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Created At (IST)
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Updated At (IST)
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each timetables as timetable}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4">
									<p class="font-medium text-gray-900">{timetable.classCode}</p>
								</td>
								<td class="px-6 py-4 text-sm text-gray-600">
									{timetable.userId}
								</td>
								<td class="px-6 py-4">
									{#if timetable.isActive}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
											<CheckCircleIcon class="w-3 h-3" />
											Active
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
											<XCircleIcon class="w-3 h-3" />
											Inactive
										</span>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm text-gray-600">
									{formatDateIST(timetable.createdAt)}
								</td>
								<td class="px-6 py-4 text-sm text-gray-600">
									{formatDateIST(timetable.updatedAt)}
								</td>
								<td class="px-6 py-4 text-right">
									<button
										onclick={() => openEditModal(timetable)}
										class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
									>
										<Edit05Icon class="w-4 h-4" />
										Edit
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

<!-- Edit Timetable Modal -->
{#if showEditModal && selectedTimetable}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onclick={closeEditModal}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-bold text-gray-900">Edit Timetable</h2>
				<button
					onclick={closeEditModal}
					class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					aria-label="Close"
				>
					<XCircleIcon class="w-5 h-5 text-gray-500" />
				</button>
			</div>
			
			<div class="mb-4 p-4 bg-gray-50 rounded-lg">
				<p class="text-sm text-gray-600 mb-1">
					<span class="font-medium">Class Code:</span> {selectedTimetable.classCode}
				</p>
				<p class="text-sm text-gray-600">
					<span class="font-medium">User ID:</span> {selectedTimetable.userId}
				</p>
			</div>

			<div class="mb-4">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={editedIsActive}
						class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
					/>
					<span class="text-sm font-medium text-gray-700">Active</span>
				</label>
			</div>

			<div class="mb-6">
				<div class="block text-sm font-medium text-gray-700 mb-2">
					Timetable JSON
				</div>
				<textarea
					bind:value={editedTimetable}
					rows="20"
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
					placeholder="Enter timetable JSON data..."
				></textarea>
				<p class="text-xs text-gray-500 mt-2">
					Edit the timetable data in JSON format. Ensure the JSON is valid before saving.
				</p>
			</div>

			<div class="flex gap-3">
				<button
					onclick={closeEditModal}
					class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
				>
					Cancel
				</button>
				<button
					onclick={saveTimetable}
					disabled={updatingTimetable}
					class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if updatingTimetable}
						<RefreshCw01Icon class="w-4 h-4 animate-spin inline mr-2" />
						Saving...
					{:else}
						Save Changes
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
