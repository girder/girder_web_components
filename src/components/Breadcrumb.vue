<script>
import { createLocationValidator } from '../utils';

export default {
  props: {
    location: {
      type: Object,
      required: true,
      validator: createLocationValidator(true),
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    append: {
      type: Array,
      default: () => [],
    },
    noRoot: {
      type: Boolean,
      default: false,
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
      default: [],
      async get() {
        this.loading = true;
        const breadcrumb = [];
        // The reason for this local user variable is that
        // we have to set up reactivity dependancy before the first async function call
        const { user } = this.girderRest;
        const type = this.location._modelType || this.location.type;
        const { name, _id } = this.location;
        if (type === 'folder') {
          // The last breadcrumb isn't returned by rootpath.
          if (name) {
            breadcrumb.unshift(this.location);
          } else {
            const { data } = await this.girderRest.get(`folder/${_id}`);
            breadcrumb.unshift(this.extractCrumbData(data));
          }
          // Get the rest of the path.
          const { data } = await this.girderRest.get(`folder/${_id}/rootpath`);
          data.reverse().forEach((crumb) => {
            breadcrumb.unshift(this.extractCrumbData(crumb.object));
          });
        } else if (type === 'user' || type === 'collection') {
          const { data } = await this.girderRest.get(`${type}/${_id}`);
          breadcrumb.unshift(this.extractCrumbData(data));
        }
        if (!this.noRoot) {
          if (
            type === 'users' ||
            (user && breadcrumb.length && breadcrumb[0].type === 'user')
          ) {
            breadcrumb.unshift({ type: 'users' });
          }
          if (
            type === 'collections' ||
            (breadcrumb.length && breadcrumb[0].type === 'collection')
          ) {
            breadcrumb.unshift({ type: 'collections' });
          }
          breadcrumb.unshift({ type: 'root' });
        }
        this.loading = false;
        return breadcrumb;
      },
    },
  },
  created() {
    if (!createLocationValidator(false)(this.location) && this.noRoot) {
      throw new Error("non root location can't be used with no-root prop at the same time");
    }
  },
  methods: {
    extractCrumbData(object) {
      return {
        ...object,
        type: object.type ? object.type : object._modelType,
        name: object._modelType !== 'user' ? object.name : object.login,
      };
    },
  },
};
</script>

<template lang="pug">
.girder-breadcrumb-component
  v-icon.home-button(
      v-if="girderRest.user",
      color="accent",
      @click="$emit('crumbclick', girderRest.user)",
      :disabled="location._id === girderRest.user._id") {{$vuetify.icons.userHome}}
  v-breadcrumbs.font-weight-bold.pa-0.ml-3
    span.subheading.font-weight-bold(:disabled="disabled", slot="divider") /
    v-breadcrumbs-item(
        v-for="(item, index) in breadcrumb",
        :disabled="(disabled || index == breadcrumb.length-1)",
        :key="index",
        @click.native="$emit('crumbclick', item)")
      template(
        v-if="['folder', 'user', 'collection'].indexOf(item.type) !== -1") {{ item.name }}
      template(
        v-else-if="item.type==='users'")
        v-icon.mdi-18px {{ $vuetify.icons.user }}
      template(
        v-else-if="item.type==='collections'")
        v-icon.mdi-18px {{ $vuetify.icons.collection }}
      template(
        v-else-if="item.type==='root'")
        v-icon.mdi-18px {{ $vuetify.icons.globe }}
    v-breadcrumbs-item(
        v-for="item in append",
        :key="item._id") {{ item }}
</template>

<style lang="scss">
.girder-breadcrumb-component {
  display: flex;

  .home-button {
    font-size: 22px;
    cursor: pointer;
  }

  .v-breadcrumbs {
    .v-breadcrumbs__divider {
      padding: 0 7px;
    }

    .v-icon {
      color: inherit;
    }
  }
}
</style>
