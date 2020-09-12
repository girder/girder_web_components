<script>
export default {
  props: {
    breadcrumbs: {
      required: true,
      type: Array,
    },
  },
  computed: {
    // have a separate computed to prevent append triggering remote requests
    vBreadcrumbItems() {
      return this.breadcrumbs.map((el, i) => ({
        object: el,
        index: i,
        disabled: i === this.breadcrumbs.length - 1,
      }));
    },
  },
};
</script>

<template>
  <v-breadcrumbs
    :items="vBreadcrumbItems"
    class="font-weight-bold pa-0"
  >
    <template v-slot:item="{ item }">
      <v-breadcrumbs-item :disabled="item.disabled">
        <template v-if="item.disabled">{{ item.object.name }}</template>
        <a
          v-else
          @click="$emit('breadcrumb-click', item)"
        >{{ item.object.name }}</a>
      </v-breadcrumbs-item>
    </template>
  </v-breadcrumbs>
</template>
