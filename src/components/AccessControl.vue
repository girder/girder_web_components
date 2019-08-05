<script>
import { stringify } from 'qs';

import { createLocationValidator } from '../utils';
import GirderBreadcrumb from './Breadcrumb.vue';
import GirderSearch from './Search.vue';

export default {
  name: 'AccessControl',
  components: {
    GirderBreadcrumb,
    GirderSearch,
  },
  inject: ['girderRest'],
  props: {
    item: {
      type: Object,
      default: null,
      validator: item =>
        createLocationValidator(false)(item) && item._modelType !== 'user',
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
    item(value) {
      if (value) {
        this.getAccessControlData();
      } else {
        this.access = false;
      }
    },
  },
  created() {
    if (this.item) {
      this.getAccessControlData();
    }
  },
  methods: {
    async getAccessControlData() {
      this.public = this.item.public;
      const { data: access } = await this.girderRest.get(`${this.item._modelType}/${this.item._id}/access`);
      this.access = access;
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
        `${this.item._modelType}/${this.item._id}/access`,
        stringify(data),
      );
      this.$emit('item-access-changed', this.item);
      this.$emit('close', false);
    },
  },
};
</script>

<template lang="pug">
  v-card.px-3.py-2.access-control-dialog
    v-card-title
      div
        .title Access control
        girder-breadcrumb(
            :location="item",
            readonly,
            no-root)
      v-spacer
      v-btn(v-if="!noActionButtons", icon, @click="$emit('close', false)")
        v-icon mdi-close
    v-card-text.pt-0
      v-switch.mb-4(
          v-model="public",
          label="Public",
          :hint="public?'Anyone can view this folder':'Access is required to view this folder'",
          persistent-hint)
      v-subheader Users / Groups
      transition(name="height")
        v-list.group-user(v-if="groupsAndUsers.length", two-line)
          transition-group(name="height2")
            v-list-tile(v-for="model of groupsAndUsers", :key="model.id")
              v-list-tile-action
                v-icon {{$vuetify.icons[model.login?'user':'group']}}
              v-list-tile-content
                v-list-tile-title {{model.name}}
                v-list-tile-sub-title {{model.login||model.description}}
              v-list-tile-action
                v-select.level(:items="permissions",
                    box,
                    single-line,
                    hide-details,
                    v-model="model.level")
              v-list-tile-action
                v-btn(icon, @click="remove(model)")
                  v-icon mdi-minus-circle
      .mt-1.mb-2(v-if="!groupsAndUsers.length") Empty
      v-subheader Grant access
      girder-search.search.mb-3(
          no-search-icon,
          no-more-item,
          :search-types="['user', 'group']",
          :text-field-props="{box: true,\
            'single-line':true,\
            label: 'label',\
            placeholder: 'User or group name'}",
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
      v-btn(flat, @click="$emit('close', false)") Cancel
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
  max-height: 0 !important;
}
</style>


<style lang="scss">
.access-control-dialog {
  .v-messages__message {
    // input hint has an unnecessary built-in transition
    transition: none !important;
  }

  .v-input.level {
    max-width: 150px;

    .v-input__control,
    .v-input__slot {
      min-height: 40px;

      .v-input__append-inner {
        margin-top: 9px;
      }
    }
  }

  .search .v-input .v-input__control .v-input__slot {
    min-height: 40px;

    input {
      margin-top: 5px;
    }

    .v-input__append-inner {
      margin-top: 9px;
    }
  }

  .v-list__tile {
    padding-left: 10px;

    .v-list__tile__action {
      min-width: 40px;
    }
  }
}

// Fix for https://github.com/vuetifyjs/vuetify/issues/6951
.v-dialog__container {
  display: block !important;
}
</style>
