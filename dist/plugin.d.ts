import { Plugin } from 'vite';
export interface HingePluginOptions {
    /** Path to the markdown file where queue entries are appended. Defaults to HINGE_QUEUE.md in process.cwd(). */
    queueFile?: string;
}
export default function hingePlugin(options?: HingePluginOptions): Plugin;
