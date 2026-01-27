<template>
  <v-list
    v-if="rows.length"
    dense="dense"
    class="px-4"
  >
    <div
      v-if="!!title"
      class="text-subtitle-1 font-weight-bold"
    >
      {{ title }}
    </div>
    <template
      v-for="(val, i) in rows"
      :key="`${i}-li`"
    >
      <v-list-item
        class="px-1"
        :href="val.href"
        :target="val.target"
        @click="clickable ? $emit('click', val) : {}"
      >
        <slot
          :datum="val"
          name="row"
        >
          <v-list-item-title>{{ val }}</v-list-item-title>
        </slot>
      </v-list-item>
      <v-divider
        v-if="!noDividers && i < rows.length - 1"
        :key="`${i}-divider`"
      />
    </template>
  </v-list>
</template>

<script>
export default {
  name: 'GirderDetailList',

  props: {
    title: { type: String, default: null },
    rows: { type: Array, required: true },
    clickable: { type: Boolean, default: false },
    noDividers: { type: Boolean, default: false }
  },

  emits: ['click'],
};
</script>
