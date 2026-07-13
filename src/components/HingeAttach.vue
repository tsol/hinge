<script setup lang="ts">
import { API_BASE } from '../const'
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n'

const props = defineProps<{
  folder: string
}>()

interface AttachFile {
  name: string
  size: number
}

const emit = defineEmits<{
  changed: []
}>()

const { t: lang } = useI18n()

const open = ref(false)
const files = ref<AttachFile[]>([])
const uploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const btnRef = ref<HTMLButtonElement | null>(null)
const dropdownStyle = ref({ top: '0px', left: '0px' })
const previewFile = ref('')
const count = computed(() => files.value.length)

function previewImage(name: string) {
  previewFile.value = previewFile.value === name ? '' : name
}

function loadFiles() {
  if (!props.folder) return
  fetch(`${API_BASE}/attach?folder=${encodeURIComponent(props.folder)}`)
    .then(r => r.json())
    .then((data: AttachFile[]) => { files.value = data })
    .catch(() => {})
}

onMounted(loadFiles)

async function addFile(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  uploading.value = true

  const fd = new FormData()
  for (let i = 0; i < input.files.length; i++) {
    fd.append('file', input.files[i])
  }

  try {
    const res = await fetch(`${API_BASE}/attach?folder=${encodeURIComponent(props.folder)}`, {
      method: 'POST',
      body: fd,
    })
    if (res.ok) {
      loadFiles()
      emit('changed')
    }
  } catch { /* ignore */ }
  uploading.value = false
  input.value = ''
}

async function removeFile(name: string) {
  try {
    await fetch(
      `${API_BASE}/attach?folder=${encodeURIComponent(props.folder)}&file=${encodeURIComponent(name)}`,
      { method: 'DELETE' }
    )
    loadFiles()
    emit('changed')
  } catch { /* ignore */ }
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    loadFiles()
    // Position dropdown relative to button
    requestAnimationFrame(() => {
      if (btnRef.value) {
        const r = btnRef.value.getBoundingClientRect()
        dropdownStyle.value = {
          top: `${r.bottom + 4}px`,
          left: `${r.left}px`,
        }
      }
    })
  }
}

function closeDropdown() {
  open.value = false
}
</script>

<template>
  <div class="attach-wrapper">
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*,.pdf,.txt,.md,.json,.yaml,.yml"
      style="display:none"
      @change="addFile"
    />

    <button ref="btnRef" class="attach-btn" :class="{ 'attach-btn--active': open }" @click="toggle" :title="lang.attachmentsCount.replace('{count}', String(count))">
      <span class="attach-icon">📎</span>
      <span v-if="count > 0" class="attach-badge">{{ count }}</span>
    </button>

    <Teleport to="body">
      <div v-if="open" class="attach-backdrop" @click="closeDropdown"></div>
      <div v-if="open" class="attach-dropdown" :style="dropdownStyle">
        <div class="attach-dropdown__header">{{ lang.attachments }}</div>

        <div class="attach-dropdown__add" @click="fileInputRef?.click()">
          <span class="attach-dropdown__plus">＋</span>
          <span>{{ uploading ? lang.uploading : lang.addFile }}</span>
        </div>

        <div v-if="files.length === 0" class="attach-dropdown__empty">{{ lang.noFiles }}</div>

        <div v-for="f in files" :key="f.name" class="attach-dropdown__file" @click="f.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) && previewImage(f.name)" :class="{ 'attach-dropdown__file--img': previewFile === f.name }">
          <span class="attach-dropdown__file-icon">
            {{ f.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? '🖼' : '📄' }}
          </span>
          <span class="attach-dropdown__file-name">{{ f.name }}</span>
          <span class="attach-dropdown__file-size">{{ (f.size / 1024).toFixed(1) }} KB</span>
          <button class="attach-dropdown__del" @click.stop="removeFile(f.name)" :title="lang.delete">✕</button>
          <img
            v-if="previewFile === f.name"
            :src="`${API_BASE}/attach-file?folder=${encodeURIComponent(props.folder)}&file=${encodeURIComponent(f.name)}`"
            class="attach-dropdown__preview"
            @click.stop
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
.attach-wrapper {
  position: relative;
  display: inline-flex;
}

.attach-btn {
  position: relative;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #30363d;
  cursor: pointer;
  font-size: var(--hinge-fs-15, 15px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.1s;
  line-height: 1;
  flex-shrink: 0;
}
.attach-btn:hover {
  background: #484f58;
}
.attach-btn:active {
  transform: scale(0.92);
}
.attach-btn--active {
  background: #1f6feb;
}
.attach-icon {
  font-size: var(--hinge-fs-14, 14px);
}
.attach-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  min-width: 14px;
  height: 14px;
  padding: 0 4px;
  border-radius: 7px;
  background: #da3633;
  color: #fff;
  font-size: var(--hinge-fs-9, 9px);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  pointer-events: none;
}

.attach-dropdown {
  position: fixed;
  z-index: 100001;
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  min-width: 220px;
  max-width: 320px;
  max-height: calc(300px * var(--hinge-scale, 1));
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: var(--hinge-fs-12, 12px);
  color: #e0e0e0;
}

.attach-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: transparent;
}
.attach-dropdown::-webkit-scrollbar {
  width: 5px;
}
.attach-dropdown::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.12);
  border-radius: 3px;
}

.attach-dropdown__header {
  padding: 8px 12px;
  font-size: var(--hinge-fs-10, 10px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  border-bottom: 1px solid #2a2a4a;
}

.attach-dropdown__add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.12s;
  font-weight: 600;
  color: #58a6ff;
}
.attach-dropdown__add:hover {
  background: rgba(88, 166, 255, 0.1);
}
.attach-dropdown__plus {
  font-size: var(--hinge-fs-14, 14px);
  width: 16px;
  text-align: center;
}

.attach-dropdown__empty {
  padding: 12px;
  color: #666;
  font-style: italic;
  text-align: center;
}

.attach-dropdown__file {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-top: 1px solid #222;
  cursor: default;
  flex-wrap: wrap;
}
.attach-dropdown__file--img {
  background: rgba(88, 166, 255, 0.06);
  cursor: pointer;
}
.attach-dropdown__file--img:hover {
  background: rgba(88, 166, 255, 0.1);
}
.attach-dropdown__file-icon {
  font-size: var(--hinge-fs-14, 14px);
  flex-shrink: 0;
}
.attach-dropdown__file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, monospace;
  font-size: var(--hinge-fs-11, 11px);
  color: #c9d1d9;
}
.attach-dropdown__file-size {
  color: #666;
  font-size: var(--hinge-fs-10, 10px);
  flex-shrink: 0;
}
.attach-dropdown__del {
  background: transparent;
  border: none;
  color: #f85149;
  cursor: pointer;
  font-size: var(--hinge-fs-11, 11px);
  padding: 2px 4px;
  border-radius: 3px;
  transition: background 0.12s;
  flex-shrink: 0;
  line-height: 1;
}
.attach-dropdown__del:hover {
  background: rgba(248, 81, 73, 0.15);
}
.attach-dropdown__preview {
  width: 100%;
  max-height: calc(200px * var(--hinge-scale, 1));
  object-fit: contain;
  border-radius: 4px;
  margin-top: 4px;
  background: #0d1117;
}
</style>
