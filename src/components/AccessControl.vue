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
      validator: model =>
        createLocationValidator(false)(model) && model._modelType !== 'user',
    },
    noActionButtons: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      public: false,
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
  },
  watch: {
    model() {
      this.getAccessControlData();
    },
  },
  created() {
    if (this.model) {
      this.getAccessControlData();
    }
  },
  methods: {
    async getAccessControlData() {
      this.loading = true;
      this.public = this.model.public;
      const { data: access } = await this.girderRest.get(`${this.model._modelType}/${this.model._id}/access`);
      this.access = access;
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
      if (!this.groupsAndUsers.find(model => model.id === selectedModel._id)) {
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
        public: this.public,
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

<template lang="pug">
  v-card.px-3.py-2.access-control
    v-card-title
      div
        .title Access control
        breadcrumb(
            :location="model",
            readonly,
            no-root)
      v-spacer
      v-btn(v-if="!noActionButtons", icon, @click="$emit('close')")
        v-icon mdi-close
    v-card-text.pt-0
      v-switch.mb-4(
          v-model="public",
          label="Public",
          :hint="public?'Anyone can view this folder':'Access is required to view this folder'",
          persistent-hint)
      v-subheader Users / Groups
      transition(name="height", mode="out-in")
        v-list.group-user(v-if="groupsAndUsers.length", two-line)
          transition-group(name="height2")
            v-list-item(v-for="model of groupsAndUsers", :key="model.id")
              v-list-item-action.mr-5
                v-icon {{$vuetify.icons.values[model.login?'user':'group']}}
              v-list-item-content
                v-list-item-title {{model.name}}
                v-list-item-subtitle {{model.login||model.description}}
              v-list-item-action.mr-5
                v-select.level(:items="permissions",
                    light,
                    solo,
                    hide-details,
                    dense,
                    v-model="model.level")
              v-list-item-action.mr-5
                v-btn(icon, @click="remove(model)")
                  v-icon mdi-minus-circle
        .mt-1.mb-2(v-if="!groupsAndUsers.length && !loading") Empty
      v-subheader Grant access
      search.search.mb-3(
          hide-search-icon,
          :search-type-options="[{ name: 'User', value: 'user'},\
            { name: 'Group', value: 'group'}]",
          :search-types="['user', 'group']",
          placeholder="User or group name",
          @select="groupOrUserSelected")
      v-switch.mt-0(
          v-model="recursive",
          label="Include subfolders",
          :hint="recursive?\
            'Also set this permissions on all subfolders':\
            'Apply permissions only to this folder'",
          persistent-hint)
    v-card-actions(v-if="!noActionButtons")
      v-spacer
      v-btn(text, @click="$emit('close')") Cancel
      v-btn(color="primary", depressed, @click="save") Save
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
