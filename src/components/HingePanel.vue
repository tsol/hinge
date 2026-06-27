<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { HingeTarget } from '../types/target'
import { useFileTree } from '../composables/useFileTree'
import { useFileSource } from '../composables/useFileSource'
import { useSelectionStore } from '../composables/useSelectionStore'
import HingeAttention from './HingeAttention.vue'
import HingeTabQueue from './HingeTabQueue.vue'
import hljs from 'highlight.js/lib/core'
import 'highlight.js/styles/github-dark.css'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import markdown from 'highlight.js/lib/languages/markdown'
import yaml from 'highlight.js/lib/languages/yaml'
import scss from 'highlight.js/lib/languages/scss'
import bash from 'highlight.js/lib/languages/bash'

hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('scss', scss)
hljs.registerLanguage('bash', bash)

const props = defineProps<{
  target: HingeTarget
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  send: [onSuccess?: () => void]
  close: []
}>()

const { selection, fromFile } = useSelectionStore()

const activeTab = ref<'input' | 'files' | 'source'>('input')
const note = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const fileTree = useFileTree()
const fileSrc = useFileSource()
const queueRefreshKey = ref(0)
const editingFile = ref('')
const editingNoteRef = ref('')

function onAdd() {
  if (editingFile.value) {
    // Save edit — increment key after PATCH completes
    fetch('/api/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: editingFile.value, note: note.value }),
    }).then(() => {
      editingFile.value = ''
      editingNoteRef.value = ''
      queueRefreshKey.value++
    })
  } else {
    // Delegate to parent (Hinge.vue sends the POST).
    // Key increment happens via onSuccess callback after POST completes.
    emit('send', () => queueRefreshKey.value++)
  }
}

function onEditTask(item: { name: string; note: string }) {
  editingFile.value = item.name
  editingNoteRef.value = item.note
  note.value = item.note
}

// Load root files on mount when switching to files tab
const tabs = [
  { id: 'input' as const, label: 'Input' },
  { id: 'files' as const, label: 'Files' },
  { id: 'source' as const, label: 'Source' },
]

function switchTab(tab: typeof activeTab.value) {
  activeTab.value = tab
  if (tab === 'files' && fileTree.root.value.length === 0) {
    fileTree.loadRoot()
  }
}

async function openFile(path: string) {
  fromFile(path)
  activeTab.value = 'source'
}

function fileIcon(entry: { name: string; isDir: boolean }): string {
  if (entry.isDir) return '📁'
  const ext = entry.name.split('.').pop()?.toLowerCase()
  const icons: Record<string, string> = {
    ts: '🔷', vue: '💚', js: '🟨', html: '🟠', css: '🟦',
    scss: '🟣', json: '📋', md: '📝', yaml: '📄', yml: '📄',
  }
  return icons[ext ?? ''] || '📄'
}

/** Split file path into directory prefix and filename */
const filePathParts = computed(() => {
  const path = selection.filePath
  if (!path) return { dir: null, file: null, full: '' }
  const idx = path.lastIndexOf('/')
  let dir = idx >= 0 ? path.slice(0, idx) : ''
  let file = idx >= 0 ? path.slice(idx + 1) : path
  // Middle ellipsis for long directory paths
  if (dir.length > 28) {
    const first = dir.slice(0, 12)
    const last = dir.slice(-12)
    dir = `${first}…${last}`
  }
  return { dir, file, full: path }
})

/** Highlight code based on file extension */
const highlightedCode = computed(() => {
  const content = fileSrc.content.value
  if (!content) return ''
  const path = selection.filePath
  if (!path) return `<code class="hljs">${hljs.highlightAuto(content).value}</code>`
  const ext = path.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    vue: 'html', html: 'html', htm: 'html', svg: 'xml',
    css: 'css', scss: 'scss', sass: 'scss', less: 'scss',
    json: 'json', jsonc: 'json',
    md: 'markdown', mdx: 'markdown',
    yaml: 'yaml', yml: 'yaml',
    sh: 'bash', bash: 'bash', zsh: 'bash',
  }
  const lang = langMap[ext ?? ''] || ''
  if (lang && hljs.getLanguage(lang)) {
    return `<code class="hljs">${hljs.highlight(content, { language: lang }).value}</code>`
  }
  return `<code class="hljs">${hljs.highlightAuto(content).value}</code>`
})

// When source tab activated or selection.filePath changes → load file content
watch([activeTab, () => selection.filePath], async ([tab, file]) => {
  if (tab !== 'source' || !file) return
  if (!fileSrc.loading.value && fileSrc.path.value === file) return // already loaded
  await fileSrc.loadFile(file)
})

// When selection.filePath changes (from gear) → expand tree to that file
watch(() => selection.filePath, (filePath) => {
  if (filePath) {
    fileTree.expandToPath(filePath)
  }
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <div class="hinge-panel-wrapper">
      <div class="drawer-backdrop" @click="emit('close')"></div>

      <div class="drawer">
        <!-- Tabs -->
        <div class="drawer-tabs">
          <button
            v-for="t in tabs"
            :key="t.id"
            class="drawer-tab"
            :class="{ 'drawer-tab--active': activeTab === t.id }"
            @click="switchTab(t.id)"
          >
            {{ t.label }}
          </button>
          <button class="drawer-close" @click="emit('close')" title="Закрыть">✕</button>
        </div>

        <!-- Tab: Input -->
        <div v-if="activeTab === 'input'" class="tab-content">
          <HingeAttention :target="target" />

          <div class="input-scroll">
            <textarea
              class="drawer-textarea"
              :value="note"
              @input="note = ($event.target as HTMLTextAreaElement).value"
              placeholder="Заметка / описание..."
              rows="3"
            ></textarea>

            <div class="input-actions">
              <button
                class="drawer-btn drawer-btn--add"
                :disabled="!note.trim()"
                @click="onAdd"
              >
                {{ editingFile ? 'Сохранить' : 'Добавить' }}
              </button>
              <button
                v-if="editingFile"
                class="drawer-btn drawer-btn--cancel"
                @click="editingFile = ''; editingNoteRef = ''"
              >
                ✕
              </button>
            </div>

            <HingeTabQueue
              compact
              :refresh-key="queueRefreshKey"
              :editing-file="editingFile"
              @edit-task="onEditTask"
            />

            <div class="queue-footer">
              <button class="drawer-btn drawer-btn--exec">Выполнить</button>
            </div>
          </div>
        </div>

        <!-- Tab: Files -->
        <div v-if="activeTab === 'files'" class="tab-content">
          <div class="tab-header">Project Files</div>

          <div v-if="fileTree.loading.value" class="drawer-body">
            <p class="drawer-muted">Loading…</p>
          </div>

          <div v-else-if="fileTree.error.value" class="drawer-body">
            <p class="drawer-error">{{ fileTree.error.value }}</p>
          </div>

          <div v-else class="drawer-body drawer-body--scroll">
            <template v-for="entry in fileTree.root.value" :key="entry.path">
              <!-- Root entry -->
              <div
                class="file-row"
                :class="{ 'file-row--highlighted': fileTree.highlightedPath.value === entry.path }"
                @click="entry.isDir ? fileTree.toggleDir(entry.path) : openFile(entry.path)"
              >
                <span v-if="entry.isDir" class="file-toggle">
                  {{ fileTree.isExpanded(entry.path) ? '▼' : '▶' }}
                </span>
                <span v-else class="file-toggle file-toggle--spacer"></span>
                <span class="file-icon">{{ fileIcon(entry) }}</span>
                <span class="file-name">{{ entry.name }}</span>
              </div>

              <!-- Level-1 children (directly under their parent) -->
              <template v-if="entry.isDir && fileTree.isExpanded(entry.path)">
                <template v-for="child in fileTree.getChildren(entry.path)" :key="child.path">
                  <div
                    class="file-row file-row--l1"
                    :class="{ 'file-row--highlighted': fileTree.highlightedPath.value === child.path }"
                    @click="child.isDir ? fileTree.toggleDir(child.path) : openFile(child.path)"
                  >
                    <span v-if="child.isDir" class="file-toggle">
                      {{ fileTree.isExpanded(child.path) ? '▼' : '▶' }}
                    </span>
                    <span v-else class="file-toggle file-toggle--spacer"></span>
                    <span class="file-icon">{{ fileIcon(child) }}</span>
                    <span class="file-name">{{ child.name }}</span>
                  </div>

                  <!-- Level-2 children (directly under their parent) -->
                  <template v-if="child.isDir && fileTree.isExpanded(child.path)">
                    <div
                      v-for="gc in fileTree.getChildren(child.path)"
                      :key="gc.path"
                      class="file-row file-row--l2"
                      :class="{ 'file-row--highlighted': fileTree.highlightedPath.value === gc.path }"
                      @click="gc.isDir ? fileTree.toggleDir(gc.path) : openFile(gc.path)"
                    >
                      <span v-if="gc.isDir" class="file-toggle">
                        {{ fileTree.isExpanded(gc.path) ? '▼' : '▶' }}
                      </span>
                      <span v-else class="file-toggle file-toggle--spacer"></span>
                      <span class="file-icon">{{ fileIcon(gc) }}</span>
                      <span class="file-name">{{ gc.name }}</span>
                    </div>
                  </template>
                </template>
              </template>
            </template>
          </div>
        </div>

        <!-- Tab: Source -->
        <div v-if="activeTab === 'source'" class="tab-content">
          <div class="tab-header tab-header--source">
            <span v-if="filePathParts.dir" class="tab-header__dir">{{ filePathParts.dir }}/</span>
            <span v-if="filePathParts.file" class="tab-header__file">{{ filePathParts.file }}</span>
            <span v-else class="tab-header__file tab-header__file--muted">No file selected</span>
          </div>

          <div v-if="fileSrc.loading.value" class="drawer-body">
            <p class="drawer-muted">Loading…</p>
          </div>

          <div v-else-if="fileSrc.error.value" class="drawer-body">
            <p class="drawer-error">{{ fileSrc.error.value }}</p>
          </div>

          <div v-else class="drawer-body drawer-body--scroll source-body">
            <pre class="source-code" v-html="highlightedCode"></pre>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 99999;
}

.drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(85vw, 380px);
  background: #1a1a2e;
  color: #e0e0e0;
  z-index: 100000;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  overflow: hidden;
}

.drawer-tabs {
  display: flex;
  border-bottom: 1px solid #2a2a4a;
  flex-shrink: 0;
}

.drawer-close {
  background: transparent;
  border: none;
  color: #888;
  font-size: 16px;
  cursor: pointer;
  padding: 10px 12px;
  line-height: 1;
  transition: color 0.15s;
  flex-shrink: 0;
}
.drawer-close:hover {
  color: #f85149;
}

.drawer-tab {
  flex: 1;
  padding: 10px 8px;
  background: transparent;
  border: none;
  color: #888;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color 0.15s, background 0.15s;
}

.drawer-tab:hover {
  color: #ccc;
  background: rgba(255, 255, 255, 0.05);
}

.drawer-tab--active {
  color: #58a6ff;
  box-shadow: inset 0 -2px 0 #58a6ff;
}

.tab-header {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #888;
  border-bottom: 1px solid #2a2a4a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.tab-header--source {
  gap: 0;
  min-height: 38px;
}

.tab-header__dir {
  overflow: hidden;
  white-space: nowrap;
  color: #666;
  font-size: 11px;
  font-weight: 500;
}

.tab-header__file {
  overflow: hidden;
  white-space: nowrap;
  color: #e0e0e0;
  font-weight: 700;
  font-size: 12px;
}

.tab-header__file--muted {
  color: #666;
  font-weight: 500;
  font-size: 11px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.input-scroll {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 4px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.input-scroll::-webkit-scrollbar {
  width: 6px;
}
.input-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.input-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.drawer-body {
  padding: 14px;
  flex: 1;
}

.drawer-body--scroll {
  overflow-y: auto;
  padding: 4px 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.drawer-body--scroll::-webkit-scrollbar {
  width: 6px;
}

.drawer-body--scroll::-webkit-scrollbar-track {
  background: transparent;
}

.drawer-body--scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.drawer-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  background: #16162a;
  color: #e0e0e0;
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
  min-height: 60px;
  box-sizing: border-box;
}

.drawer-textarea:focus {
  outline: none;
  border-color: #58a6ff;
}

.input-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.drawer-btn--add {
  background: #238636;
  color: #fff;
}
.drawer-btn--add:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.drawer-btn--cancel {
  background: #30363d;
  color: #ccc;
  padding: 8px 12px;
}

.queue-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.drawer-btn--exec {
  background: #1f6feb;
  color: #fff;
}

.drawer-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.drawer-btn:hover {
  opacity: 0.85;
}

.drawer-btn--back {
  background: transparent;
  color: #58a6ff;
  font-size: 11px;
  padding: 4px 10px;
}

.drawer-muted {
  color: #666;
  font-style: italic;
}

.drawer-error {
  color: #f85149;
}

/* File tree */
.file-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 14px;
  cursor: pointer;
  transition: background 0.12s;
  font-size: 13px;
  font-family: ui-monospace, 'SF Mono', monospace;
  user-select: none;
}

.file-row:hover {
  background: rgba(88, 166, 255, 0.1);
}

.file-row--highlighted {
  background: rgba(88, 166, 255, 0.18) !important;
  outline: 1px solid rgba(88, 166, 255, 0.4);
  outline-offset: -1px;
}

.file-row--l1 {
  padding-left: 32px;
}

.file-row--l2 {
  padding-left: 52px;
}

.file-row--child {
  padding-left: 32px;
}

.file-row--child2 {
  padding-left: 52px;
}

.file-toggle {
  width: 12px;
  text-align: center;
  font-size: 9px;
  color: #888;
  flex-shrink: 0;
}

.file-toggle--spacer {
  visibility: hidden;
}

.file-icon {
  font-size: 13px;
  flex-shrink: 0;
  width: 18px;
  text-align: center;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #c9d1d9;
}

.file-children {
  /* no extra styling needed */
}

.file-children--nested {
  /* deeper nesting handled by padding-left on child2 */
}

.file-nested {
  /* container for grandchildren */
}

/* Source viewer */
.source-body {
  padding: 0 !important;
}

.source-code {
  margin: 0;
  padding: 12px 14px;
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #c9d1d9;
  white-space: pre;
  overflow-x: auto;
}

/* Mobile: full-width drawer */
@media (max-width: 767px) {
  .drawer {
    width: 100vw;
  }
}
</style>
