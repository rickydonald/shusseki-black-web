<script lang="ts">
    interface ShussekiLogoProps {
        width?: number;
        height?: number;
        className?: string;
        color?: string;
        startColor?: string | undefined;
        endColor?: string | undefined;
        strokeWidth?: number;
    }
    let {
        width = 512,
        height = 512,
        className = "",
        color = "000000",
        startColor,
        endColor,
        strokeWidth = 12,
    }: ShussekiLogoProps = $props();

    const useGradient = startColor && endColor;
    const strokeValue = useGradient ? "url(#logoGradient)" : `#${color}`;
</script>

<svg
    {width}
    {height}
    viewBox="0 0 285.74999 285.75"
    xmlns="http://www.w3.org/2000/svg"
    class={className}
>
    {#if useGradient}
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color={startColor} />
                <stop offset="100%" stop-color={endColor} />
            </linearGradient>
        </defs>
    {/if}

    <g fill="none">
        <path
            d="m 101.36074,256.60314 -52.32908,-36.97922 64.19033,-64.19033 v -1.39544 l -90.006007,-14.65214 19.536188,-61.399451 80.935639,41.863261 1.39544,-0.69772 -13.2567,-90.006011 h 62.79489 l -13.95442,90.006011 2.09316,0.69772 80.23792,-41.863261 19.53619,61.399451 -89.30829,13.95442 v 2.09316 l 63.49261,62.79489 -50.93363,38.37466 -41.86326,-81.63336 h -1.39544 z"
            stroke={strokeValue}
            stroke-width={strokeWidth}
        />
    </g>
</svg>
