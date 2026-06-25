import { HingeTarget } from '../types/target';
export interface QueuePayload {
    note: string;
    url: string;
    component: string;
    dom: string;
    props: Record<string, unknown>;
    elementHtml?: string;
    computedStyles?: Record<string, string>;
    elementRect?: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
}
interface UseQueueSubmitOptions {
    getTarget: () => HingeTarget;
    getElement: () => Element | null;
}
export declare function useQueueSubmit({ getTarget, getElement }: UseQueueSubmitOptions): {
    note: import('vue').Ref<string, string>;
    sendNote: (onSuccess?: () => void) => Promise<void>;
};
export {};
