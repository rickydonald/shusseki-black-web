<script lang="ts">
    import { BottomSheet } from "svelte-bottom-sheet";

    interface Props {
        open: boolean;
    }
    let { open }: Props = $props();
</script>

<BottomSheet
    bind:isSheetOpen={open}
    settings={{ contentAlignment: "start-fit", maxHeight: 0.9 }}
>
    <BottomSheet.Overlay>
        <BottomSheet.Sheet>
            <BottomSheet.Handle />
            <BottomSheet.Content>
            </BottomSheet.Content>
        </BottomSheet.Sheet>
    </BottomSheet.Overlay>
</BottomSheet>
