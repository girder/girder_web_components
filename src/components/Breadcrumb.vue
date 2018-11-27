<script>
export default {
  props: {
    location: {
      type: Object,
      required: true,
      validator: val => val._modelType && val._id,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    append: {
      type: Array,
      default: () => [],
    },
  },
  inject: ['girderRest'],
  data() {
    return {
      loading: false,
    };
  },
  asyncComputed: {
    breadcrumb: {
      default: { root: {}, path: [] },
      async get() {
        this.loading = true;
        const breadcrumb = { root: {}, path: [] };
        const { _id, _modelType, name } = this.location;
        if (_modelType === 'folder') {
          // The last breadcrumb isn't returned by rootpath.
          if (name) {
            breadcrumb.path.unshift(this.location);
          } else {
            const { data } = await this.girderRest.get(`folder/${_id}`);
            breadcrumb.path.unshift(this.extractCrumbData(data));
          }
          // Get the rest of the path.
          const { data } = await this.girderRest.get(`folder/${_id}/rootpath`);
          data.reverse().forEach((crumb) => {
            const { object } = crumb;
            const entity = this.extractCrumbData(object);
            if (entity._modelType === 'folder') {
              breadcrumb.path.unshift(entity);
            } else {
              breadcrumb.root = entity;
            }
          });
        } else {
          const { data } = await this.girderRest.get(`${_modelType}/${_id}`);
          breadcrumb.root = this.extractCrumbData(data);
        }
        this.loading = false;
        return breadcrumb;
      },
    },
  },
  methods: {
    extractCrumbData(object) {
      return {
        ...object,
        name: object._modelType !== 'user' ? object.name : object.login,
      };
    },
  },
};
</script>

<template lang="pug">
v-breadcrumbs.girder-breadcrumb-component.font-weight-bold.pa-0
  span.subheading.font-weight-bold(:disabled="disabled", slot="divider") /
  v-breadcrumbs-item(
      :disabled="disabled || breadcrumb.path.length === 0",
      @click.native="$emit('crumbclick', breadcrumb.root)")
    v-icon.mdi-24px.pr-2(color="accent") {{ $vuetify.icons.globe }}
    | {{ breadcrumb.root.name }}
  v-breadcrumbs-item(
      :disabled="disabled || index == breadcrumb.path.length-1",
      v-for="(item, index) in breadcrumb.path",
      :key="item._id",
      @click.native="$emit('crumbclick', item)") {{ item.name }}
  v-breadcrumbs-item(
      v-for="item in append",
      :key="item._id") {{ item }}
</template>
