<template lang="pug">
  .dropzone-wrapper(
      v-if="!files.length", :class="dropzoneClass", @dragenter="dropzoneClass = 'animate'",
      @dragleave="dropzoneClass = null", @drop="dropzoneClass = null")
    v-layout.dropzone-message(column, justify-center, align-center, fill-height)
      v-icon(size="50px") $vuetify.icons.fileUpload
      .title.mt-3 {{ message }}
    input.file-input(type="file", :multiple="multiple", @change="$emit('change', $event)")
</template>

<script>
export default {
  props: {
    files: {
      type: Array,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    multiple: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      dropzoneClass: null,
    };
  },
};
</script>

<style lang="scss" scoped>
$stripeColor: #f0f0f3;
$img: linear-gradient(
  -45deg,
  $stripeColor 25%,
  transparent 25%,
  transparent 50%,
  $stripeColor 50%,
  $stripeColor 75%,
  transparent 75%,
  transparent
);

.dropzone-wrapper {
  position: relative;
  cursor: pointer;
  min-height: 260px;
  height: 100%;
  background-color: #f6f6f9;
  background-repeat: repeat;
  background-size: 30px 30px;

  &:hover {
    background-image: $img;
  }

  &.animate {
    animation: stripes 2s linear infinite;
    background-image: $img;
  }

  .dropzone-message {
    position: absolute;
    width: 100%;
  }

  .file-input {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    height: 100%;
    width: 100%;
    opacity: 0;
    z-index: 1;
    cursor: pointer;
  }
}

@keyframes stripes {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 30px 60px;
  }
}
</style>
