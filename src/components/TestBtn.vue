<template>
  <a :data-test="dataTest" @click.prevent="$emit('click')">
    <slot />
  </a>
</template>

<script setup lang="ts">
defineProps<{
  dataTest: string
}>()

defineEmits<{
  click: []
}>()
</script>
