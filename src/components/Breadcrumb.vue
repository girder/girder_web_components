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
        const { id, type } = this.location;
        if (type === 'folder') {
          breadcrumb.path.unshift(this.location);
          const { data } = await this.girderRest.get(`folder/${id}/rootpath`);
          data.reverse().forEach((crumb) => {
            const { object } = crumb;
            const entity = {
              name: object._modelType !== 'user' ? object.name : object.login,
              id: object._id,
              type: object._modelType,
              parentId: object.parentId,
              parentType: object.parentCollection,
            };
            if (entity.type === 'folder') {
              breadcrumb.path.unshift(entity);
            } else {
              breadcrumb.root = entity;
            }
          });
        } else {
          breadcrumb.root = this.location;
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
