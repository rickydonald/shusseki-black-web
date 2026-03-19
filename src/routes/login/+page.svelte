<script lang="ts">
    import axios, { AxiosError } from "axios";
    import type { PageProps } from "./$types";
    import type { LoginResponse } from "$lib/types/api-response.type";
    import { goto } from "$app/navigation";
    import ShussekiLogo from "$lib/components/icons/ShussekiLogo.svelte";
    import { browser } from "$app/environment";
    import { BottomSheet } from "svelte-bottom-sheet";
    import XCloseIcon from "@untitled-theme/icons-svelte/XCloseIcon.svelte";
    import { toast } from "svelte-sonner";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";

    let { data }: PageProps = $props();

    let departmentNumber: string | null = $state(null);
    let erpPassword: string | null = $state(null);
    let error: string | null = $state(null);
    let parameterError: string | null = $state(null);
    let isLoading: boolean = $state(false);
    let openErpPasswordBottomSheet: boolean = $state(false);
    let departmentInputFocused: boolean = $state(false);
    let showErpPassword: boolean = $state(false);

    let isSubmitButtonDisabled = $derived(!departmentNumber || isLoading);
    let isDobButtonDisabled = $derived(
        !departmentNumber || !erpPassword || isLoading,
    );

    function handleDepartmentNumberInput() {
        if (!departmentNumber || departmentNumber.length < 8) {
            parameterError = "Department number must be at least 8 characters";
            return;
        }
        if (departmentNumber.length > 10) {
            parameterError = "Department number cannot exceed 10 characters";
            return;
        }
        parameterError = null;
        openErpPasswordBottomSheet = true;
    }

    function handleErpPasswordChange(e: CustomEvent) {
        erpPassword = e.detail.value;
    }

    async function handleLogin() {
        error = null;
        parameterError = null;

        if (!departmentNumber || !erpPassword) {
            parameterError = "Please fill in all fields.";
            return;
        }

        if (departmentNumber.length > 10 || departmentNumber.length < 8) {
            parameterError = "Enter a valid Department Number.";
            return;
        }

        isLoading = true;

        const toastId = toast.loading("Logging in...");

        try {
            const formData = new FormData();
            formData.append("departmentNumber", departmentNumber);
            formData.append("password", erpPassword);
            formData.append("_token", data.csrfToken);

            const res = await axios({
                url: "/api/v2/user/login",
                method: "POST",
                data: formData,
            });

            if (res.status !== 200) {
                error = "An unexpected error occurred. Please try again.";
                toast.error("Login failed.", { id: toastId, duration: 2000 });
                isLoading = false;
                return;
            }

            const response: LoginResponse = res.data;
            if (response.error) {
                error = response.error;
                isLoading = false;
                toast.error("Login failed.", { id: toastId, duration: 2000 });
                return;
            }

            if (response.redirectUrl) {
                toast.success("Login successful!", {
                    id: toastId,
                    duration: 1000,
                });
                goto(response.redirectUrl);
            }
        } catch (err) {
            const errorHandle = err as AxiosError;
            if (errorHandle.status === 429) {
                error =
                    "Too many login attempts. Please wait a while before trying again.";
                toast.error("Login failed.", { id: toastId, duration: 2000 });
                isLoading = false;
                return;
            }
            if (errorHandle.status === 403) {
                error =
                    "Invalid CSRF token. Please refresh the page and try again.";
                toast.error("Login failed.", { id: toastId, duration: 2000 });
                isLoading = false;
                return;
            }
            if (errorHandle.status === 401) {
                error = "DNO or Password is incorrect, please try again!";
                toast.error("Login failed.", { id: toastId, duration: 2000 });
                isLoading = false;
                return;
            }
            error = "Network error. Please check your connection.";
            toast.error("Login failed.", { id: toastId, duration: 2000 });
            isLoading = false;
        }
    }

    $effect(() => {
        if (data.paramError) {
            parameterError = data.paramError;
        }
    });
</script>

<!-- Main container with minimal background -->
<div
    class="min-h-screen bg-white px-4 py-10 flex flex-col items-center justify-center"
>
    <!-- Login form card -->
    <div class="w-full max-w-md">
        <form
            onsubmit={(e) => e.preventDefault()}
            class="flex flex-col w-full"
            in:fly={{ y: 20, duration: 600, easing: cubicOut }}
        >
            <!-- Logo and header -->
            <div
                class="text-center flex flex-col items-center justify-center mb-12"
            >
                <ShussekiLogo
                    width={100}
                    height={100}
                    className="mb-8"
                />
                <h1
                    class="text-3xl font-semibold text-gray-900 mb-3 tracking-tight"
                >
                    Welcome to Shusseki
                </h1>
                <p class="text-base text-gray-600">Sign in to continue</p>
            </div>

            <!-- Department Number Input -->
            <div class="mb-4">
                <input
                    id="departmentNumber"
                    type="text"
                    name="departmentNumber"
                    placeholder="Department Number"
                    class="w-full rounded-xl border border-gray-300 transition-all duration-200 p-3.5 px-4 text-center text-xl tracking-widest font-geist-mono! font-semibold uppercase placeholder:font-sans placeholder:font-normal placeholder:text-gray-400 placeholder:tracking-normal placeholder:normal-case placeholder:text-base focus:outline-none focus:border-[#3b82f6] bg-white"
                    class:border-gray-300={!departmentInputFocused &&
                        !parameterError}
                    class:border-[#3b82f6]={departmentInputFocused &&
                        !parameterError}
                    class:border-red-500={parameterError}
                    max="10"
                    maxlength="10"
                    bind:value={departmentNumber}
                    onfocus={() => (departmentInputFocused = true)}
                    onblur={() => (departmentInputFocused = false)}
                    onkeydown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleDepartmentNumberInput();
                        }
                    }}
                />
            </div>

            <input type="hidden" name="_token" value={data.csrfToken} />

            <!-- Continue Button -->
            <button
                type="button"
                disabled={isSubmitButtonDisabled}
                onclick={handleDepartmentNumberInput}
                class="w-full bg-gray-800 text-white rounded-xl p-3.5 font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
            >
                Continue
            </button>

            <!-- Error message -->
            {#if parameterError && !openErpPasswordBottomSheet}
                <div
                    class="mt-3 p-3 rounded-lg bg-red-50 flex items-start gap-2"
                    in:fly={{ y: -10, duration: 300 }}
                >
                    <svg
                        class="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <p class="text-sm text-red-600 flex-1">{parameterError}</p>
                </div>
            {/if}
        </form>
    </div>
</div>

{#if browser}
    <BottomSheet
        bind:isSheetOpen={openErpPasswordBottomSheet}
        settings={{
            maxHeight: 0.58,
            disableClosing: false,
            disableDragging: false,
        }}
    >
        <BottomSheet.Overlay>
            <BottomSheet.Sheet>
                <BottomSheet.Handle />
                <BottomSheet.Content class="px-6 pt-6 pb-8 relative">
                    <!-- Close button -->
                    <button
                        type="button"
                        class="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors duration-200 z-50"
                        onclick={() => {
                            openErpPasswordBottomSheet = false;
                            error = null;
                            parameterError = null;
                        }}
                    >
                        <XCloseIcon
                            width={18}
                            height={18}
                            class="text-gray-700"
                        />
                    </button>

                    <!-- Header -->
                    <div class="mb-6">
                        <h2
                            class="text-2xl font-semibold text-gray-900 mb-2 tracking-tight"
                        >
                            Verify Identity
                        </h2>
                        <p class="text-base text-gray-600">
                            Enter your ERP password to verify your identity.
                        </p>
                    </div>

                    <!-- Password Input -->
                    <div class="mb-3">
                        <div class="relative">
                        <input
                            type={showErpPassword ? "text" : "password"}
                            placeholder="Enter ERP Password"
                            class="border-2 px-5 py-3 pr-20 rounded-xl w-full"
                            bind:value={erpPassword}
                        />
                            <button
                                type="button"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-600 hover:text-gray-900"
                                onclick={() => (showErpPassword = !showErpPassword)}
                                aria-label={showErpPassword
                                    ? "Hide ERP password"
                                    : "Show ERP password"}
                            >
                                {showErpPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <!-- Login Button -->
                    <button
                        type="button"
                        onclick={handleLogin}
                        disabled={isDobButtonDisabled}
                        class="w-full bg-gray-800 text-white rounded-xl p-3.5 font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        {#if isLoading}
                            <svg
                                class="animate-spin h-5 w-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                ></circle>
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Logging in...
                        {:else}
                            Sign In
                        {/if}
                    </button>

                    <!-- Error message -->
                    {#if error || parameterError}
                        <div
                            class="mt-3 p-3 rounded-lg bg-red-50 flex items-start gap-2"
                            in:fly={{ y: -10, duration: 300 }}
                        >
                            <svg
                                class="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                            <p class="text-sm text-red-600 flex-1">
                                {error || parameterError}
                            </p>
                        </div>
                    {/if}
                </BottomSheet.Content>
            </BottomSheet.Sheet>
        </BottomSheet.Overlay>
    </BottomSheet>
{/if}