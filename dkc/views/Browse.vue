<script>
import { Breadcrumb, DataBrowser } from '@/components';

export default {
  components: {
    Breadcrumb,
    DataBrowser,
  },
  data: () => ({
    folder: null,
    breadcrumbs: [],
  }),
  // TODO watch folder and update the route
};
</script>

<template>
  <data-browser :folder.sync="folder" />
</template>
