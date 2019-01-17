<template lang="pug">
v-btn(icon, @click="$emit('click')")
    v-icon.mdi-24px {{ icon }}
    v-fade-transition
      div.arrow-up(v-if="value", :style="{ top: nudgeTop + 'px' }")
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      required: true,
    },
    nudgeTop: {
      type: Number,
      default: 32,
    },
  },
};
</script>

<style lang="scss" scoped>
.arrow-up {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid white;
  left: 10px;
  position: absolute;
  z-index: 100;
}
</style>
