import { Ref } from 'vue';
export declare function useElementHighlight(element: Ref<Element | null>): {
    rect: Ref<{
        height: number;
        width: number;
        x: number;
        y: number;
        readonly bottom: number;
        readonly left: number;
        readonly right: number;
        readonly top: number;
        toJSON: () => any;
    } | null, DOMRect | {
        height: number;
        width: number;
        x: number;
        y: number;
        readonly bottom: number;
        readonly left: number;
        readonly right: number;
        readonly top: number;
        toJSON: () => any;
    } | null>;
    update: () => void;
};
