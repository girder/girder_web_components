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

<template lang="pug">
  div
    .headline.font-weight-bold.mono.mt-8
      | {{ title }}
      v-btn.ma-1(icon, :href="repoBase + link")
        v-icon $vuetify.icons.externalLink
    .subtitle-1.mb-4 {{ description }}
</template>

<style scoped>
.mono {
  font-family: "Lucida Console", Monaco, monospace !important;
}
</style>
