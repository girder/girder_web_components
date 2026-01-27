<script>
import { ref } from 'vue';
export default {
  name: 'GirderDropzone',

  props: {
    message: { type: String, required: true },
    multiple: { type: Boolean, required: true },
    accept: { type: String, default: null },
  },

  emits: ['change'],

  setup(props, ctx) {
    const dropzoneClass = ref(null);
    const files = ref([]);

    function onFileChange(newFiles) {
      const fileArray = Array.isArray(newFiles) ? newFiles : [newFiles];
      ctx.emit('change', fileArray);
      files.value = [];
    }

    return {
      dropzoneClass,
      files,
      onFileChange,
    };
  }
};
</script>

<template>
  <div
    class="dropzone-wrapper"
    :class="dropzoneClass"
    @dragenter="dropzoneClass = 'animate'"
    @dragleave="dropzoneClass = null"
    @drop="dropzoneClass = null"
  >
    <v-row
      no-gutters
      class="flex-column align-center justify-center fill-height dropzone-message"
    >
      <v-icon size="50">
        $fileUpload
      </v-icon>
      <div class="title mt-3">
        {{ message }}
      </div>
    </v-row>
    <v-file-input
      v-model="files"
      class="file-input"
      :multiple="multiple"
      :accept="accept"
      hide-details
      density="compact"
      variant="plain"
      @update:model-value="onFileChange"
    />
  </div>
</template>

<style lang="scss" scoped>
$img: linear-gradient(
  -45deg,
  rgb(160 160 160 / 0.12) 25%,
  transparent 25%,
  transparent 50%,
  rgb(160 160 160 / 0.12) 50%,
  rgb(160 160 160 / 0.12) 75%,
  transparent 75%,
  transparent
);

.dropzone-wrapper {
  position: relative;
  cursor: pointer;
  height: 100%;
  background-color: var(--v-dropzone-base);
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
    inset: 0;
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

$overlayDark: linear-gradient(var(--v-dropzone-lighten3),
    var(--v-dropzone-lighten3));

$overlayLight: linear-gradient(var(--v-dropzone-darken4),
    var(--v-dropzone-darken4));
</style>
