export interface CogPosition {
    x: number;
    y: number;
}
export declare function useCogPosition(): {
    position: {
        x: number;
        y: number;
    };
    cogStyle: import('vue').ComputedRef<{
        transform: string;
    }>;
    clampPosition: () => void;
};
