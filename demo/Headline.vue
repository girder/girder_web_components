<script>
const repoBase = 'https://github.com/girder/girder_web_components/blob/master/';

export default {
  props: {
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
  },
  data: () => ({ repoBase }),
};
</script>

<template>
  <div>
    <div class="headline font-weight-bold mono mt-8">{{ title }}
      <v-btn
        :href="repoBase + link"
        class="ml-2"
        icon="icon"
        title="View source"
      >
        <v-icon>$vuetify.icons.externalLink</v-icon>
      </v-btn>
    </div>
    <div class="subtitle-1 mb-4">{{ description }}</div>
  </div>
</template>

<style scoped>
.mono {
  font-family: "Lucida Console", Monaco, monospace !important;
}
</style>
