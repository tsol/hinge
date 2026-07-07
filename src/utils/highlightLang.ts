/** Map file extension → highlight.js language id. */
export const HIGHLIGHT_LANG_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  vue: 'html',
  html: 'html',
  htm: 'html',
  svg: 'xml',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  less: 'scss',
  json: 'json',
  jsonc: 'json',
  md: 'markdown',
  mdx: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
}

export function highlightLangForPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  return HIGHLIGHT_LANG_MAP[ext] ?? ''
}
