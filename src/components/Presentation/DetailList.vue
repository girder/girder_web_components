<template lang="pug">
v-list(v-if="rows.length", dense, :style="{ backgroundColor: color }")
  v-subheader.subtitle-1.font-weight-bold.pl-4 {{ title }}
  template(v-for="val, i in rows")
    v-list-item.allow-select(:key="i", v-on="clickable ? {click: () => $emit('click', val)} : {}")
      slot(name="row", :datum="val")
        v-list-item-content
          .body-2.secondary--text.text--darken-3.no-overflow {{ val }}
    v-divider.mx-3(v-if="i < rows.length - 1")
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
    color: {
      type: String,
      default: 'inherit',
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
