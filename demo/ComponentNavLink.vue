<script setup>
  import { computed } from 'vue'
  import { useGoTo } from 'vuetify'

  // ---- Props ----
  const props = defineProps({
    title: {
      type: String,
      required: true,
    },
    href: {
      type: String,
      default: null,
    },
  })

  const onClick = computed(() => {
    if (!props.href) {return null}
    return () => useGoTo(props.href)
  })
</script>

<template>
  <v-list-item
    :href="props.href"
    :link="!!props.href"
    @click="onClick"
  >
    <v-list-item-title class="text-subtitle-1">
      {{ props.title }}
    </v-list-item-title>
  </v-list-item>
</template>
