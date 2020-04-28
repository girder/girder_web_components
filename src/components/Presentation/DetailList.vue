<template>
  <v-list
    v-if="rows.length"
    dense="dense"
  >
    <v-subheader class="subtitle-1 font-weight-bold pl-4">
      {{ title }}
    </v-subheader>
    <template v-for="(val, i) in rows">
      <v-list-item
        :key="`${i}-li`"
        class="allow-select"
        :href="val.href"
        :target="val.target"
        v-on="clickable ? {click: () => $emit('click', val)} : {}"
      >
        <slot
          :datum="val"
          name="row"
        >
          <v-list-item-content>
            <div class="body-2 no-overflow">
              {{ val }}
            </div>
          </v-list-item-content>
        </slot>
      </v-list-item>
      <v-divider
        v-if="i < rows.length - 1"
        :key="`${i}-divider`"
        class="mx-3"
      />
    </template>
  </v-list>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true,
    },
    rows: {
      type: Array,
      required: true,
    },
    clickable: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.allow-select {
  user-select: auto;
}
</style>
