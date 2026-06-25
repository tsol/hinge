/** Optional host-app hooks. Set from the consuming Vue app for richer debug context. */
export interface HingeHostRouter {
    currentRoute: {
        value: {
            name?: string | symbol | null;
            path?: string;
        };
    };
}
declare global {
    interface Window {
        /** Set from the host app (e.g. `window.__hingeRouter = router`) for route-aware component names. */
        __hingeRouter?: HingeHostRouter;
    }
}
export {};
