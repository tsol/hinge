type __VLS_Props = {
    open: boolean;
    cogStyle: Record<string, string>;
    targetLabel: string;
};
declare const _default: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    pointerdown: (event: PointerEvent) => any;
    pointermove: (event: PointerEvent) => any;
    pointerup: (event: PointerEvent) => any;
    pointercancel: (event: PointerEvent) => any;
    contextmenu: (event: MouseEvent) => any;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    onPointerdown?: ((event: PointerEvent) => any) | undefined;
    onPointermove?: ((event: PointerEvent) => any) | undefined;
    onPointerup?: ((event: PointerEvent) => any) | undefined;
    onPointercancel?: ((event: PointerEvent) => any) | undefined;
    onContextmenu?: ((event: MouseEvent) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, HTMLDivElement>;
export default _default;
