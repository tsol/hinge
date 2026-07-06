<script setup lang="ts">
import { API_BASE } from '../const'
import { ref, onMounted } from 'vue'

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
        const res = await fetch(`${API_BASE}/transcribe`, { method: 'POST', body: blob })
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
  font-size: var(--hinge-fs-14, 14px) !important;
  padding: 0 !important;
  flex-shrink: 0 !important;
  width: 28px !important;
  transition: background 0.15s !important;
}
.hinge-mic--recording {
  background: #da3633 !important;
  animation: mic-record-pulse 0.8s ease-in-out infinite !important;
}
.hinge-mic--transcribing {
  background: #1f6feb !important;
  opacity: 0.8 !important;
  animation: mic-transcribe-spin 1s ease-in-out infinite !important;
}
.hinge-mic:disabled {
  opacity: 0.6;
  cursor: default;
}

@keyframes mic-record-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(218, 54, 51, 0.6);
  }
  50% {
    transform: scale(0.82);
    box-shadow: 0 0 0 6px rgba(218, 54, 51, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(218, 54, 51, 0);
  }
}

@keyframes mic-transcribe-spin {
  0% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(0.88) rotate(-10deg);
  }
  75% {
    transform: scale(0.88) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}
</style>
