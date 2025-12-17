<script lang="ts">
    import { onMount } from "svelte";

    let username = "";
    let password = "";
    let captcha = "";
    let captchaText: string | null = null;

    let loading = false;
    let error: string | null = null;
    let success = false;

    async function loadCaptcha() {
        error = null;
        captcha = "";

        try {
            const res = await fetch("/api/captcha");
            const data = await res.json();
            captchaText = data.captcha;
        } catch {
            error = "Failed to load captcha. Please refresh.";
        }
    }

    async function submitLogin() {
        error = null;
        success = false;

        if (!username || !password || !captcha) {
            error = "All fields are required.";
            return;
        }

        loading = true;

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    password,
                    captcha,
                }),
            });

            if (!res.ok) {
                throw new Error("Login failed");
            }

            success = true;
        } catch {
            error = "Invalid credentials or captcha.";
            await loadCaptcha();
        } finally {
            loading = false;
        }
    }

    onMount(loadCaptcha);
</script>

<svelte:head>
    <title>ERP Login</title>
</svelte:head>

<div class="login-wrapper">
    <form class="login-card" on:submit|preventDefault={submitLogin}>
        <h2>Loyola ERP Login</h2>

        {#if error}
            <p class="error">{error}</p>
        {/if}

        {#if success}
            <p class="success">Login successful</p>
        {/if}

        <label>
            Dept. No
            <input
                type="text"
                bind:value={username}
                autocomplete="username"
                placeholder="25-PCS-018"
            />
        </label>

        <label>
            Password
            <input
                type="password"
                bind:value={password}
                autocomplete="current-password"
            />
        </label>

        <div class="captcha">
            <div class="captcha-text">
                {#if captchaText}
                    {captchaText}
                {:else}
                    Loading…
                {/if}
            </div>

            <button
                type="button"
                class="refresh"
                on:click={loadCaptcha}
                aria-label="Refresh captcha"
            >
                ↻
            </button>
        </div>

        <label>
            Enter Captcha
            <input type="text" bind:value={captcha} autocomplete="off" />
        </label>

        <button type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Log In"}
        </button>
    </form>
</div>

<style>
    .login-wrapper {
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f6f7f9;
        padding: 1rem;
    }

    .login-card {
        width: 100%;
        max-width: 380px;
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    }

    h2 {
        margin-bottom: 1.5rem;
        text-align: center;
    }

    label {
        display: block;
        margin-bottom: 1rem;
        font-size: 0.9rem;
    }

    input {
        width: 100%;
        padding: 0.6rem 0.7rem;
        margin-top: 0.3rem;
        border-radius: 6px;
        border: 1px solid #ccc;
    }

    button {
        width: 100%;
        padding: 0.7rem;
        border-radius: 6px;
        border: none;
        font-weight: 600;
        cursor: pointer;
        background: #dc2626;
        color: white;
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .captcha {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .captcha-text {
        flex: 1;
        padding: 0.6rem;
        font-family: Georgia, serif;
        font-size: 1.2rem;
        background: #f1f1f1;
        text-align: center;
        border-radius: 6px;
        letter-spacing: 0.2rem;
    }

    .refresh {
        width: auto;
        padding: 0 0.7rem;
        font-size: 1.1rem;
        background: #374151;
    }

    .error {
        color: #b91c1c;
        margin-bottom: 1rem;
        text-align: center;
    }

    .success {
        color: #15803d;
        margin-bottom: 1rem;
        text-align: center;
    }
</style>
