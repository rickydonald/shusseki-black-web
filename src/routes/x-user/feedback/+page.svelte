<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import MessageChatCircleIcon from '@untitled-theme/icons-svelte/MessageChatCircleIcon.svelte';
	import CheckCircleIcon from '@untitled-theme/icons-svelte/CheckCircleIcon.svelte';
	import AlertCircleIcon from '@untitled-theme/icons-svelte/AlertCircleIcon.svelte';
	import Send01Icon from '@untitled-theme/icons-svelte/Send01Icon.svelte';
	import FilterLinesIcon from '@untitled-theme/icons-svelte/FilterLinesIcon.svelte';
	import Loading02Icon from '@untitled-theme/icons-svelte/Loading02Icon.svelte';

	type FeedbackType = 'bug' | 'feature' | 'problem' | 'suggestion' | 'others';

	type Feedback = {
		id: number;
		feedbackId: string;
		userId: string;
		feedbackType: FeedbackType;
		feedback: string;
		isReplied: boolean;
		reply: string | null;
		createdAt: string;
		updatedAt: string;
		subject: string;
		errorCode: string | null;
	};

	type Stats = {
		total: number;
		unreplied: number;
		replied: number;
	};

	let feedbackList = $state<Feedback[]>([]);
	let stats = $state<Stats>({ total: 0, unreplied: 0, replied: 0 });
	let loading = $state(true);
	let filter = $state<'all' | 'unreplied' | 'replied'>('all');
	let selectedFeedback = $state<Feedback | null>(null);
	let replyText = $state('');
	let sending = $state(false);

	onMount(async () => {
		await loadFeedback();
	});

	async function loadFeedback() {
		loading = true;
		try {
			const response = await fetch(`/api/x-user/feedback/list?filter=${filter}`);
			const data = await response.json();

			if (data.success) {
				feedbackList = data.data;
				stats = data.stats;
			} else {
				toast.error('Failed to load feedback');
			}
		} catch (error) {
			console.error('Failed to load feedback:', error);
			toast.error('Failed to load feedback');
		} finally {
			loading = false;
		}
	}

	async function handleFilterChange(newFilter: 'all' | 'unreplied' | 'replied') {
		filter = newFilter;
		await loadFeedback();
	}

	function selectFeedback(feedback: Feedback) {
		selectedFeedback = feedback;
		replyText = feedback.reply || '';
	}

	async function sendReply() {
		if (!selectedFeedback || !replyText.trim()) {
			toast.error('Please enter a reply');
			return;
		}

		sending = true;
		try {
			const response = await fetch('/api/x-user/feedback/reply', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					feedbackId: selectedFeedback.feedbackId,
					reply: replyText.trim(),
				}),
			});

			const data = await response.json();

			if (data.success) {
				toast.success('Reply sent successfully');
				selectedFeedback = null;
				replyText = '';
				await loadFeedback();
			} else {
				toast.error(data.error || 'Failed to send reply');
			}
		} catch (error) {
			console.error('Failed to send reply:', error);
			toast.error('Failed to send reply');
		} finally {
			sending = false;
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function getFeedbackTypeColor(type: FeedbackType): string {
		const colors = {
			bug: 'bg-red-100 text-red-700',
			feature: 'bg-blue-100 text-blue-700',
			problem: 'bg-orange-100 text-orange-700',
			suggestion: 'bg-purple-100 text-purple-700',
			others: 'bg-gray-100 text-gray-700',
		};
		return colors[type] || colors.others;
	}

	function getFeedbackTypeLabel(type: FeedbackType): string {
		const labels = {
			bug: 'Bug',
			feature: 'Feature',
			problem: 'Problem',
			suggestion: 'Suggestion',
			others: 'Other',
		};
		return labels[type] || 'Other';
	}
</script>

<svelte:head>
	<title>Feedback Management - Admin</title>
</svelte:head>

<div class="p-6">
	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600">Total Feedback</p>
						<p class="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
					</div>
					<MessageChatCircleIcon class="w-8 h-8 text-gray-400" />
				</div>
			</div>

			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600">Unreplied</p>
						<p class="text-2xl font-bold text-orange-600 mt-1">{stats.unreplied}</p>
					</div>
					<AlertCircleIcon class="w-8 h-8 text-orange-400" />
				</div>
			</div>

			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600">Replied</p>
						<p class="text-2xl font-bold text-green-600 mt-1">{stats.replied}</p>
					</div>
					<CheckCircleIcon class="w-8 h-8 text-green-400" />
				</div>
			</div>
		</div>

		<!-- Filters -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
			<div class="flex items-center gap-2 mb-3">
				<FilterLinesIcon class="w-5 h-5 text-gray-600" />
				<h2 class="font-semibold text-gray-900">Filter</h2>
			</div>
			<div class="flex gap-2">
				<button
					onclick={() => handleFilterChange('all')}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
					class:bg-black={filter === 'all'}
					class:text-white={filter === 'all'}
					class:bg-gray-100={filter !== 'all'}
					class:text-gray-700={filter !== 'all'}
				>
					All ({stats.total})
				</button>
				<button
					onclick={() => handleFilterChange('unreplied')}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
					class:bg-black={filter === 'unreplied'}
					class:text-white={filter === 'unreplied'}
					class:bg-gray-100={filter !== 'unreplied'}
					class:text-gray-700={filter !== 'unreplied'}
				>
					Unreplied ({stats.unreplied})
				</button>
				<button
					onclick={() => handleFilterChange('replied')}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
					class:bg-black={filter === 'replied'}
					class:text-white={filter === 'replied'}
					class:bg-gray-100={filter !== 'replied'}
					class:text-gray-700={filter !== 'replied'}
				>
					Replied ({stats.replied})
				</button>
			</div>
		</div>

		<!-- Feedback List -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- List View -->
			<div>
				<h2 class="text-lg font-semibold text-gray-900 mb-4 sticky top-24 bg-gray-50 py-2 z-10">Feedback List</h2>
				<div class="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto pr-2">
				
				{#if loading}
					<div class="flex items-center justify-center py-12">
						<Loading02Icon class="w-8 h-8 animate-spin text-black" />
					</div>
				{:else if feedbackList.length === 0}
					<div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
						<MessageChatCircleIcon class="w-12 h-12 text-gray-300 mx-auto mb-3" />
						<p class="text-gray-500">No feedback found</p>
					</div>
				{:else}
					{#each feedbackList as feedback}
						<button
							onclick={() => selectFeedback(feedback)}
							class="w-full bg-white rounded-lg shadow-sm border-2 p-4 text-left hover:border-gray-300 transition-colors"
							class:border-black={selectedFeedback?.feedbackId === feedback.feedbackId}
							class:border-gray-200={selectedFeedback?.feedbackId !== feedback.feedbackId}
						>
							<div class="flex items-start justify-between mb-2">
								<div class="flex-1 min-w-0">
									<h3 class="font-semibold text-gray-900 truncate">{feedback.subject}</h3>
									<p class="text-sm text-gray-600 mt-0.5">User: {feedback.userId}</p>
								</div>
								<div class="flex flex-col items-end gap-1 ml-2">
									<span class="px-2 py-1 rounded-full text-xs font-medium {getFeedbackTypeColor(feedback.feedbackType)}">
										{getFeedbackTypeLabel(feedback.feedbackType)}
									</span>
									{#if feedback.isReplied}
										<span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
											Replied
										</span>
									{/if}
								</div>
							</div>
							<p class="text-sm text-gray-700 line-clamp-2 mb-2">{feedback.feedback}</p>
							<p class="text-xs text-gray-500">{formatDate(feedback.createdAt)}</p>
						</button>
					{/each}
				{/if}
				</div>
			</div>

			<!-- Detail View -->
			<div class="sticky top-24 self-start">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Feedback Details</h2>
				
				{#if selectedFeedback}
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div class="mb-4">
							<div class="flex items-start justify-between mb-3">
								<h3 class="text-xl font-bold text-gray-900">{selectedFeedback.subject}</h3>
								<span class="px-3 py-1 rounded-full text-sm font-medium {getFeedbackTypeColor(selectedFeedback.feedbackType)}">
									{getFeedbackTypeLabel(selectedFeedback.feedbackType)}
								</span>
							</div>
							<div class="space-y-2 text-sm text-gray-600">
								<p><span class="font-medium">User ID:</span> {selectedFeedback.userId}</p>
								<p><span class="font-medium">Submitted:</span> {formatDate(selectedFeedback.createdAt)}</p>
								{#if selectedFeedback.errorCode}
									<p><span class="font-medium">Error Code:</span> {selectedFeedback.errorCode}</p>
								{/if}
							</div>
						</div>

						<div class="mb-6">
							<h4 class="font-semibold text-gray-900 mb-2">Feedback</h4>
							<div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
								{selectedFeedback.feedback}
							</div>
						</div>

						{#if selectedFeedback.isReplied && selectedFeedback.reply}
							<div class="mb-6">
								<h4 class="font-semibold text-gray-900 mb-2">Your Reply</h4>
								<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-gray-700">
									{selectedFeedback.reply}
								</div>
								<p class="text-xs text-gray-500 mt-2">Replied on {formatDate(selectedFeedback.updatedAt)}</p>
							</div>
						{/if}

						<div>
							<h4 class="font-semibold text-gray-900 mb-2">
								{selectedFeedback.isReplied ? 'Update Reply' : 'Send Reply'}
							</h4>
							<textarea
								bind:value={replyText}
								placeholder="Type your reply here..."
								maxlength="500"
								rows="5"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black resize-none"
							></textarea>
							<div class="flex items-center justify-between mt-2">
								<span class="text-xs text-gray-500">{replyText.length}/500 characters</span>
								<button
									onclick={sendReply}
									disabled={sending || !replyText.trim()}
									class="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
								>
									{#if sending}
										<Loading02Icon class="w-4 h-4 animate-spin" />
										Sending...
									{:else}
										<Send01Icon class="w-4 h-4" />
										Send Reply
									{/if}
								</button>
							</div>
						</div>
					</div>
				{:else}
					<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
						<MessageChatCircleIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<p class="text-gray-500">Select a feedback to view details and reply</p>
				</div>
			{/if}
		</div>
	</div>
</div>