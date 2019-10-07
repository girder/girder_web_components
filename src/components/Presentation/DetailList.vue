<template lang="pug">
v-list.detail-list(v-if="rows.length", :style="{ backgroundColor: color }")
  v-subheader {{ title }}
  div(v-for="val, i in rows", :key="i")
    v-list-item
      slot(name="row", :datum="val")
        v-list-item-content.py-1
          span.secondary--text.text--darken-3.no-overflow {{ val }}
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
  },
};
</script>

<style lang="scss">
.detail-list {
  &.v-list {
    background: transparent;
    max-height: 400px;
    overflow: auto;
  }

  .v-list-item {
    font-size: 13px;
    height: inherit;
    min-height: 28px;
  }

  .v-subheader {
    font-size: 16px;
    font-weight: 700;
    height: 32px;
  }

  .no-overflow {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    width: 100%;
  }

  .v-btn__content {
    justify-content: flex-start;
  }
}
</style>
