<script>
import { stringify } from 'qs';
import { createLocationValidator } from '@/utils';
import GirderBreadcrumb from './Breadcrumb.vue';
import GirderSearch from './Search.vue';
import { computed, ref, watch, inject } from 'vue';

export default {
  name: 'GirderAccessControl',

  components: {
    GirderBreadcrumb,
    GirderSearch,
  },

  props: {
    model: { type: Object, required: true, validator: (model) => createLocationValidator(false)(model) && model._modelType !== 'user' },
    hasPermission: { type: Boolean, required: false, default: false },
  },

  emits: ['update:modelAccess', 'update:hasPermission', 'close'],

  setup(props, ctx) {
    // ---- Injected Client ----
    const { rest } = inject('girder');

    // ---- State ----
    const publicModel = ref(false);
    const access = ref(null);
    const recursive = ref(false);
    const loading = ref(false);
    
    // ---- Computed ----
    const groupsAndUsers = computed(() => access.value ? [...access.value.groups, ...access.value.users] : []);
    const permissions = computed(() => [
      { title: 'Can view', value: 0 },
      { title: 'Can edit', value: 1 },
      { title: 'Is owner', value: 2 },
    ]);
    const publicText = computed(() => publicModel.value ? 'Anyone can view this folder' : 'Access is required to view this folder')
    const recursiveText = computed(() => recursive.value ? 'Also set this permissions on all subfolders' : 'Apply permissions only to this folder');
    
    // ---- Methods ----
    async function getAccessControlData() {
      const { model } = props;
      access.value = null;
      loading.value = true;
      publicModel.value = model.public;
      try {
        const { data } = await rest.get(`${model._modelType}/${model._id}/access`);
        access.value = data;
      } catch (_err) {
        access.value = null;
      }
      loading.value = false;
    }

    async function save() {
      const groupAndUserAccess = {
        users: access.value.users.map(({ id, level, flags }) => ({
          id,
          level,
          flags,
        })),
        groups: access.value.groups.map(({ id, level, flags }) => ({
          id,
          level,
          flags,
        })),
      };
      const data = {
        access: JSON.stringify(groupAndUserAccess),
        public: publicModel.value,
        publicFlags: [],
        recurse: recursive.value,
        progress: true,
      };

      const { model } = props
      await rest.put(
        `${model._modelType}/${model._id}/access`,
        stringify(data),
      );
      ctx.emit('update:modelAccess', model);
      ctx.emit('close');
    }

    function remove(model) {
      const groupIndex = access.value.groups.indexOf(model);
      if (groupIndex !== -1) {
        access.value.groups.splice(groupIndex, 1);
        return;
      }
      const userIndex = access.value.users.indexOf(model);
      if (userIndex !== -1) {
        access.value.users.splice(userIndex, 1);
      }
    }

    function groupOrUserSelected(selectedModel) {
      if (!groupsAndUsers.value.find((model) => model.id === selectedModel._id)) {
        access.value[`${selectedModel._modelType}s`].push({
          flags: [],
          id: selectedModel._id,
          level: 0,
          name: selectedModel.login
            ? `${selectedModel.firstName} ${selectedModel.lastName}`
            : selectedModel.name,
          [selectedModel.login ? 'login' : 'description']:
            selectedModel.login || selectedModel.description,
        });
      }
    }

    // ---- Watchers ----
    watch(
      () => props.model,
      (val) => {if (val) {getAccessControlData()}},
      { immediate: true, deep: false }
    );
    watch(
      () => access.value,
      (val) => ctx.emit('update:hasPermission', !!val),
    );
    return {
      publicModel,
      access,
      recursive,
      loading,
      publicText,
      recursiveText,
      groupsAndUsers,
      permissions,
      save,
      groupOrUserSelected,
      remove,
    };
  },
};
</script>

<template>
  <v-card class="access-control">
    <v-card-item title="Access Control">
      <v-card-subtitle>
        <girder-breadcrumb
          :location="model"
          readonly="readonly"
          no-root="no-root"
        />
      </v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <girder-search
        :search-type-options="[{ name: 'User', value: 'user'}, { name: 'Group', value: 'group'}]"
        :search-types="['user', 'group']"
        class="search mb-3"
        placeholder="User or group name"
        @select="groupOrUserSelected"
      />
      <v-list
        v-if="groupsAndUsers.length"
        max-height="400px"
      >
        <v-list-item
          v-for="resource in groupsAndUsers"
          :key="resource.id"
          :title="resource.name"
          :subtitle="resource.login || resource.description"
        >
          <template #prepend>
            <v-icon :icon="resource.login ? '$user' : '$group'" />
          </template>
          <template #append>
            <v-select
              v-model="resource.level"
              :items="permissions"
              :item-props="true"
              class="level"
              variant="solo-filled"
              flat
              hide-details
              density="compact"
              width="200px"
            />
            <v-btn
              v-tooltip="'Delete'"
              icon="$delete"
              variant="text"
              @click="remove(resource)"
            />
          </template>
        </v-list-item>
        <v-list-item
          v-if="!groupsAndUsers.length && !loading"
          title="No access granted yet"
        />
      </v-list>
      <div class="d-flex pb-2">
        <v-switch
          v-model="publicModel"
          :hint="publicText"
          label="Public"
          persistent-hint
          density="compact"
          width="50%"
          color="primary"
          class="ma-3"
          prepend-icon="$lock"
        />
        <v-switch
          v-model="recursive"
          :hint="recursiveText"
          label="Include subfolders"
          persistent-hint
          density="compact"
          width="50%"
          color="primary"
          class="ma-3"
          prepend-icon="$folderMultiple"
        />
        <v-spacer />
      </div>
    </v-card-text>
    <slot
      v-bind="{ save, loading }"
      name="card-actions"
    >
      <v-card-actions>
        <v-spacer />
        <v-btn
          text="Cancel"
          @click="$emit('close')"
        />
        <v-btn
          text="Save"
          color="primary"
          @click="save"
        />
      </v-card-actions>
    </slot>
  </v-card>
</template>

<style scoped lang="scss">
.access-control {
  :deep(.v-card-item) {
    background-color: rgb(var(--v-theme-surface-light));
  }

  :deep(.v-card-text) {
    padding: 16px;
  }
}
</style>
