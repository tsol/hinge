<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  transcribed: [text: string]
}>()

const recording = ref(false)
const transcribing = ref(false)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

function startRecording() {
  if (recording.value) return
  audioChunks = []
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data) }
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      if (audioChunks.length === 0) return
      transcribing.value = true
      const blob = new Blob(audioChunks, { type: 'audio/webm' })
      try {
        const res = await fetch('/api/transcribe', { method: 'POST', body: blob })
        const { text, error: err } = await res.json()
        if (err) throw new Error(err)
        if (text) {
          emit('transcribed', text)
        }
      } catch { /* silent */ }
      transcribing.value = false
      audioChunks = []
    }
    mediaRecorder.start()
    recording.value = true
  }).catch(() => { /* no mic permission */ })
}

function stopRecording() {
  if (!recording.value || !mediaRecorder) return
  recording.value = false
  mediaRecorder.stop()
  mediaRecorder = null
}
</script>

<template>
  <button
    class="hinge-mic"
    :class="{ 'hinge-mic--recording': recording, 'hinge-mic--transcribing': transcribing }"
    :disabled="transcribing"
    @pointerdown.prevent="!transcribing && startRecording()"
    @pointerup.prevent="stopRecording"
    @pointerleave="recording && stopRecording()"
    :title="recording ? 'Release to send' : transcribing ? '⏳' : '🎤'"
  >{{ recording ? '🔴' : transcribing ? '⏳' : '🎤' }}</button>
</template>

<style scoped>
.hinge-mic {
  height: 28px !important;
  border: none !important;
  border-radius: 50% !important;
  background: #2a2a4a !important;
  color: #e0e0e0 !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 14px !important;
  padding: 0 !important;
  flex-shrink: 0 !important;
  width: 28px !important;
}
.hinge-mic--recording {
  background: #da3633 !important;
}
.hinge-mic--transcribing {
  opacity: 0.6 !important;
}
.hinge-mic:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
