<script>
import { computed, inject, ref, watch } from 'vue'
import { createLocationValidator, getLocationType } from '@/utils';

export default {
  name: "GirderBreadcrumb",

  props: {
    location: { type: Object, required: true, validator: createLocationValidator(true) },
    readonly: { type: Boolean, default: false },
    append: { type: Array, default: () => [] },
    rootLocationDisabled: { type: Boolean, default: false },
  },

  emits: ['crumbClick'],
  
  setup(props) {
    // ---- Injected client ----
    const { rest, user, apiRoot } = inject('girder');
    
    // ---- State ----
    const loading = ref(false);
    const pathBreadcrumb = ref([]);
    
    // ---- Computed ----
    const breadcrumb = computed(() => {
      return [...pathBreadcrumb.value, ...props.append];
    })

    // ---- Validation ----
    if (!createLocationValidator(!props.rootLocationDisabled)(props.location)) {
      if (!props.rootLocationDisabled) {
        throw new Error(
          'Location is not valid: must not be empty and have an _id and cannot be root',
        );
      }
      throw new Error(
        'Location is not valid: must not be empty and have an _id',
      );
    }

    // ---- Methods ----
    function extractCrumbData(object) {
      return {
        ...object,
        type: object.type ? object.type : object._modelType,
        name: object._modelType !== 'user' ? object.name : object.login,
      };
    }

    async function computeBreadcrumb() {
      if (!apiRoot.value) {
        return;
      }
      loading.value = true;
      const breadcrumb = [];
      const { rootLocationDisabled, location } = props;
      // The reason for this local user variable is that
      // we have to set up reactivity dependancy before the first async function call
      const type = getLocationType(location);
      const { name, _id } = location;
      if (type === 'folder') {
        // The last breadcrumb not returned by rootpath.
        if (name) {
          breadcrumb.unshift(extractCrumbData(location));
        } else {
          const { data } = await rest.get(`folder/${_id}`);
          breadcrumb.unshift(extractCrumbData(data));
        }
        // Get the rest of the path.
        const { data } = await rest.get(`folder/${_id}/rootpath`);
        data.reverse().forEach((crumb) => {
          breadcrumb.unshift(extractCrumbData(crumb.object));
        });

      } else if (type === 'user' || type === 'collection') {
        const { data } = await rest.get(`${type}/${_id}`);
        breadcrumb.unshift(extractCrumbData(data));
      }

      if (!rootLocationDisabled) {
        if (
          type === 'users'
          || (user && breadcrumb.length && breadcrumb[0].type === 'user')
        ) {
          breadcrumb.unshift({ type: 'users' });
        }
        if (
          type === 'collections'
          || (breadcrumb.length && breadcrumb[0].type === 'collection')
        ) {
          breadcrumb.unshift({ type: 'collections' });
        }
        breadcrumb.unshift({ type: 'root' });
      }
      loading.value = false;
      pathBreadcrumb.value = breadcrumb;
    }

    // ---- Watchers ----
    watch(
      () => [props.location, props.rootLocationDisabled, user],
      computeBreadcrumb,
      { immediate: true, deep: false }
    );

    return {
      user,
      loading,
      breadcrumb,
    };
  },
};
</script>

<template>
  <div class="d-flex align-center">
    <v-icon
      v-if="user && !readonly"
      :disabled="location._id === user._id"
      class="mdi-24px mr-3"
      color="primary"
      icon="$userHome"
      @click="$emit('crumbClick', user)"
    />
    <v-breadcrumbs
      :items="breadcrumb"
      class="font-weight-bold pa-0"
    >
      <template #divider>
        <span
        
          :disabled="readonly"
          class="subheading font-weight-bold"
        >/</span>
      </template>
      <template #item="{ item }">
        <v-breadcrumbs-item
          :disabled="(readonly || breadcrumb.indexOf(item) == breadcrumb.length-1)"
          tag="a"
          style="cursor: pointer;"
          @click="$emit('crumbClick', item)"
        >
          <span
            v-if="['folder', 'user', 'collection'].indexOf(item.type) !== -1"
            class="accent--text"
          >{{ item.name }}</span>
          <v-icon
            v-else-if="item.type==='users'"
            class="mdi-18px accent--text"
            icon="$user"
          />
          <v-icon
            v-else-if="item.type==='collections'"
            class="mdi-18px accent--text"
            icon="$collection"
          />
          <v-icon
            v-else-if="item.type==='root'"
            class="mdi-18px accent--text"
            icon="$globe"
          />
          <span v-else>{{ item }}</span>
        </v-breadcrumbs-item>
      </template>
    </v-breadcrumbs>
  </div>
</template>
