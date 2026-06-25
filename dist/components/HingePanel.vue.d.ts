import { HingeTarget } from '../types/target';
type __VLS_Props = {
    target: HingeTarget;
};
type __VLS_PublicProps = {
    modelValue: string;
} & __VLS_Props;
declare const _default: import('vue').DefineComponent<__VLS_PublicProps, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    send: () => any;
    close: () => any;
    "update:modelValue": (value: string) => any;
}, string, import('vue').PublicProps, Readonly<__VLS_PublicProps> & Readonly<{
    onSend?: (() => any) | undefined;
    onClose?: (() => any) | undefined;
    "onUpdate:modelValue"?: ((value: string) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, HTMLDivElement>;
export default _default;
