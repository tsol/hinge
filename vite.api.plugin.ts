/**
 * Dev-server plugin for Hinge dev playground.
 *
 * Re-exports the main hingePlugin from src/plugin.ts.
 * In the dev environment (vite.dev.config.ts / vite.config.ts),
 * the plugin runs as-is — no additional dev-only APIs needed.
 *
 * Consumers import 'hinge/plugin' which resolves to dist/plugin.js
 * (built from src/plugin.ts). This file keeps dev and published
 * plugin in sync — they are THE SAME code.
 */
import hingePlugin from './src/plugin'
export const hingeApiPlugin = hingePlugin
