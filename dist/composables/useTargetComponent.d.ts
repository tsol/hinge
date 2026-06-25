import { Reactive } from 'vue';
import { HingeTarget } from '../types/target';
import { CogPosition } from './useCogPosition';
export declare function useTargetComponent(position: Reactive<CogPosition>): {
    target: import('vue').Ref<{
        component: string;
        dom: string;
        props: Record<string, unknown>;
    }, HingeTarget | {
        component: string;
        dom: string;
        props: Record<string, unknown>;
    }>;
    targetLabel: import('vue').Ref<string, string>;
    selectedElement: import('vue').ShallowRef<Element | null, Element | null>;
    cycleTarget: () => void;
    updateHighlight: () => void;
};
