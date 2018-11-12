<script>
export default {
  props: {
    location: {
      type: Object,
      required: true,
      validator: val => val.type && val.id,
    },
    loading: {
      type: Boolean,
      default: false,
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
  asyncComputed: {
    breadcrumb: {
      default: { root: {}, path: [] },
      async get() {
        this.$emit('update:loading', true);
        const breadcrumb = { root: {}, path: [] };
        let { id, type } = this.location;

        while (type) {
          const { data } = await this.girderRest.get(`${type}/${id}`);
          const entity = {
            name: data._modelType !== 'user' ? data.name : data.login,
            id: data._id,
            type: data._modelType,
            parentId: data.parentId,
            parentType: data.parentCollection,
          };
          if (entity.type === 'folder') {
            breadcrumb.path.unshift(entity);
            id = entity.parentId;
            type = entity.parentType;
          } else {
            breadcrumb.root = entity;
            break;
          }
        }
        this.$emit('update:loading', false);
        return breadcrumb;
      },
    },
  },
};
</script>

<template lang="pug">
v-breadcrumbs.girder-breadcrumb-component.pl-0.pt-0.pb-0
  v-icon.mdi-24px(
      :class="{ disabled: disabled }",
      slot="divider",
      color="accent") {{ $vuetify.icons.chevron }}
  v-breadcrumbs-item(
      :class="{ disabled: disabled }",
      @click.native="$emit('changelocation', breadcrumb.root)")
    v-icon.mdi-24px(color="accent") {{ $vuetify.icons.globe }}
    | &nbsp; {{ breadcrumb.root.name }}
  v-breadcrumbs-item(
      :class="{ disabled: disabled }",
      v-for="item in breadcrumb.path",
      :key="`${item.id}.crumb`",
      @click.native="$emit('changelocation', item)") {{ item.name }}
  v-breadcrumbs-item(
      v-for="item in append",
      :key="`${item.id}.crumb`") {{ item }}
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
