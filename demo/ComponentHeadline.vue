<script setup>
  import { ref } from 'vue'

  // ---- Props ----
  defineProps({
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
  })

  // ---- State ----
  const repoBase = ref('https://github.com/girder/girder_web_components/blob/master/');
</script>

<template>
  <div class="mt-4">
    <div class="text-h6 mono">
      {{ title }}
      <v-btn
        :href="repoBase + link"
        class="ml-2"
        variant="text"
        icon="$externalLink"
        title="View source"
        size="small"
      />
    </div>
    <div class="subtitle-1 ml-2">
      {{ description }}
    </div>
  </div>
</template>

<style scoped>
.mono {
  font-family: "Lucida Console", Monaco, monospace !important;
}
</style>
