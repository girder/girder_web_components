<script>
export default {
  props: {
    location: {
      type: Object,
      required: true,
      validator: val => val.type && val.id,
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
        const { id, type, name } = this.location;
        if (type === 'folder') {
          // The last breadcrumb isn't returned by rootpath.
          if (name) {
            breadcrumb.path.unshift(this.location);
          } else {
            const { data } = await this.girderRest.get(`folder/${id}`);
            breadcrumb.path.unshift(this.extractCrumbData(data));
          }
          // Get the rest of the path.
          const { data } = await this.girderRest.get(`folder/${id}/rootpath`);
          data.reverse().forEach((crumb) => {
            const { object } = crumb;
            const entity = this.extractCrumbData(object);
            if (entity.type === 'folder') {
              breadcrumb.path.unshift(entity);
            } else {
              breadcrumb.root = entity;
            }
          });
        } else {
          const { data } = await this.girderRest.get(`${type}/${id}`);
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
        name: object._modelType !== 'user' ? object.name : object.login,
        id: object._id,
        type: object._modelType,
        parentId: object.parentId,
        parentType: object.parentCollection,
      };
    },
  },
};
</script>

<template lang="pug">
v-breadcrumbs.headline.pa-0
  v-icon.mdi-24px(
      :class="{ disabled }",
      slot="divider",
      color="accent") {{ $vuetify.icons.chevron }}
  v-breadcrumbs-item(
      :class="{ disabled }",
      @click.native="$emit('crumbclick', breadcrumb.root)")
    v-icon.mdi-24px.pr-2(color="accent") {{ $vuetify.icons.globe }}
    | {{ breadcrumb.root.name }}
  v-breadcrumbs-item(
      :class="{ disabled }",
      v-for="item in breadcrumb.path",
      :key="`${item.id}.crumb`",
      @click.native="$emit('crumbclick', item)") {{ item.name }}
  v-breadcrumbs-item(
      v-for="item in append",
      :key="item.id") {{ item }}
</template>

<style lang="scss">
.girder-breadcrumb-component {
  font-weight: 700;

  &.v-breadcrumbs li:nth-child(2n) {
    padding: 0 4px !important;
  }

  li.disabled a,
  li.v-breadcrumbs__divider i.disabled {
    color: gray !important;
    cursor: default !important;
  }
}
</style>
