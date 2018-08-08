<template lang="pug">
v-app#app
  upload(:dest="folder")
</template>

<script>
import Upload from './components/Upload.vue';
import RestClient from './rest';

export default {
  name: 'app',
  provide: {
    girderRest: new RestClient({ apiRoot: 'http://localhost:8080/api/v1' }),
  },
  components: { Upload },
  data: () => ({
    folder: {
      _id: 'foo',
      _modelType: 'folder',
      name: 'Parent folder',
    },
  }),
};
</script>

<style lang="stylus">
#app
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
</style>
