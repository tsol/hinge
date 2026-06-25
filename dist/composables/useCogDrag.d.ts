import { Reactive } from 'vue';
import { CogPosition } from './useCogPosition';
interface UseCogDragOptions {
    position: Reactive<CogPosition>;
    clampPosition: () => void;
    /** Short tap — cycle target under cog. */
    onTap: () => void;
    /** Long press or right-click — toggle panel. */
    onPanelToggle: () => void;
    onMove?: () => void;
}
export declare function useCogDrag({ position, clampPosition, onTap, onPanelToggle, onMove, }: UseCogDragOptions): {
    onCogPointerDown: (e: PointerEvent) => void;
    onCogPointerMove: (e: PointerEvent) => void;
    onCogPointerUp: (e: PointerEvent) => void;
    onCogContextMenu: (e: MouseEvent) => void;
};
export {};
