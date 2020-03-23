<script>
import { stringify } from 'qs';

import { createLocationValidator } from '../utils';
import Breadcrumb from './Breadcrumb.vue';
import Search from './Search.vue';

export default {
  name: 'AccessControl',
  components: {
    Breadcrumb,
    Search,
  },
  inject: ['girderRest'],
  props: {
    model: {
      type: Object,
      required: true,
      validator: (model) => createLocationValidator(false)(model) && model._modelType !== 'user',
    },
    hasPermission: { type: Boolean, required: false, default: false },
  },
  data() {
    return {
      public_: false,
      access: null,
      recursive: false,
      loading: false,
    };
  },
  computed: {
    groupsAndUsers() {
      if (!this.access) {
        return [];
      }
      return [...this.access.groups, ...this.access.users];
    },
    permissions() {
      return [
        {
          text: 'Can view',
          value: 0,
        },
        {
          text: 'Can edit',
          value: 1,
        },
        {
          text: 'Is owner',
          value: 2,
        },
      ];
    },
    publicText() {
      if (this.public_) {
        return 'Anyone can view this folder';
      }
      return 'Access is required to view this folder';
    },
    recursiveText() {
      if (this.recursive) {
        return 'Also set this permissions on all subfolders';
      }
      return 'Apply permissions only to this folder';
    },
  },
  watch: {
    model() {
      this.getAccessControlData();
    },
    access(value) {
      this.$emit('update:hasPermission', !!value);
    },
  },
  created() {
    if (this.model) {
      this.getAccessControlData();
    }
  },
  methods: {
    async getAccessControlData() {
      this.access = null;
      this.loading = true;
      this.public_ = this.model.public;
      try {
        const { data: access } = await this.girderRest.get(`${this.model._modelType}/${this.model._id}/access`);
        this.access = access;
      } catch (ex) {
        this.access = null;
      }
      this.loading = false;
    },
    remove(model) {
      let index = this.access.groups.indexOf(model);
      if (index !== -1) {
        this.access.groups.splice(index, 1);
        return;
      }
      index = this.access.users.indexOf(model);
      if (index !== -1) {
        this.access.users.splice(index, 1);
      }
    },
    groupOrUserSelected(selectedModel) {
      if (!this.groupsAndUsers.find((model) => model.id === selectedModel._id)) {
        this.access[`${selectedModel._modelType}s`].push({
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
    },
    async save() {
      const access = {
        users: this.access.users.map(({ id, level, flags }) => ({
          id,
          level,
          flags,
        })),
        groups: this.access.groups.map(({ id, level, flags }) => ({
          id,
          level,
          flags,
        })),
      };
      const data = {
        access: JSON.stringify(access),
        public: this.public_,
        publicFlags: [],
        recurse: this.recursive,
        progress: true,
      };
      await this.girderRest.put(
        `${this.model._modelType}/${this.model._id}/access`,
        stringify(data),
      );
      this.$emit('model-access-changed', this.model);
      this.$emit('close');
    },
  },
};
</script>

<template>
  <v-card class="px-3 py-2 access-control">
    <v-card-title>
      <div>
        <div class="title">
          Access control
        </div>
        <breadcrumb
          :location="model"
          readonly="readonly"
          no-root="no-root"
        />
      </div>
    </v-card-title>
    <v-card-text class="pt-0">
      <v-switch
        v-model="public_"
        :hint="publicText"
        class="mb-4"
        label="Public"
        persistent-hint="persistent-hint"
      />
      <v-subheader>Users / Groups</v-subheader>
      <transition
        name="height"
        mode="out-in"
      >
        <v-list
          v-if="groupsAndUsers.length"
          class="group-user"
          two-line="two-line"
        >
          <transition-group name="height2">
            <v-list-item
              v-for="resource of groupsAndUsers"
              :key="resource.id"
            >
              <v-list-item-action class="mr-5">
                <v-icon>{{ $vuetify.icons.values[resource.login?'user':'group'] }}</v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{ resource.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ resource.login||resource.description }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action class="mr-5">
                <v-select
                  v-model="resource.level"
                  :items="permissions"
                  class="level"
                  light="light"
                  solo="solo"
                  hide-details="hide-details"
                  dense="dense"
                />
              </v-list-item-action>
              <v-list-item-action class="mr-5">
                <v-btn
                  icon="icon"
                  @click="remove(resource)"
                >
                  <v-icon>mdi-minus-circle</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </transition-group>
        </v-list>
        <div
          v-if="!groupsAndUsers.length && !loading"
          class="mt-1 mb-2"
        >
          Empty
        </div>
      </transition>
      <v-subheader>Grant access</v-subheader>
      <search
        :search-type-options="[{ name: 'User', value: 'user'}, { name: 'Group', value: 'group'}]"
        :search-types="['user', 'group']"
        class="search mb-3"
        hide-search-icon="hide-search-icon"
        placeholder="User or group name"
        @select="groupOrUserSelected"
      />
      <v-switch
        v-model="recursive"
        :hint="recursiveText"
        class="mt-0"
        label="Include subfolders"
        persistent-hint="persistent-hint"
      />
    </v-card-text>
    <slot
      v-bind="{ save, loading }"
      name="card-actions"
    >
      <v-card-actions>
        <v-spacer />
        <v-btn
          text="text"
          @click="$emit('close')"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          depressed="depressed"
          @click="save"
        >
          Save
        </v-btn>
      </v-card-actions>
    </slot>
  </v-card>
</template>

<style lang="scss" scoped>
.v-subheader {
  padding-left: 0;
  height: unset;
}

.v-input.v-input--switch .v-input__slot {
  margin-bottom: 6px;
}

.v-list.group-user {
  max-height: 400px;
  overflow-y: auto;
}

.height-enter-active,
.height-leave-active {
  transition: all 0.3s;
  max-height: 400px !important;
  overflow-y: hidden;
}

.height-enter,
.height-leave-to {
  opacity: 0;
  max-height: 0 !important;
}

.height2-enter-active,
.height2-leave-active {
  transition: all 0.2s;
  max-height: 72px !important;
  overflow-y: hidden;
}

.height2-enter,
.height2-leave-to {
  opacity: 0;
  min-height: 0 !important;
  max-height: 0 !important;
}

.level {
  max-width: 150px;
}
</style>
