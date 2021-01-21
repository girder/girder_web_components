<script>
export default {
  inject: ['girderRest'],
  props: {
    folder: {
      type: Object,
      required: false,
    },
  },
  data() {
    return {
      public_: false,
      acl: null,
      loading: false,
      addUsername: '',
      addGroupname: '',
    };
  },
  computed: {
    permissions() {
      return [
        {
          text: 'Can read',
          value: 'read',
        },
        {
          text: 'Can write',
          value: 'write',
        },
        {
          text: 'Admin',
          value: 'admin',
        },
      ];
    },
    publicText() {
      return this.public_ ? 'Anyone can view' : 'Access is required to view';
    },
  },
  watch: {
    folder(val) {
      if (val) {
        this.getAccessControlData();
      }
    },
  },
  created() {
    if (this.folder) {
      this.getAccessControlData();
    }
  },
  methods: {
    async getAccessControlData() {
      this.loading = true;
      this.public_ = this.folder.public;
      const { data } = await this.girderRest.get(`folders/${this.folder.id}/permissions`);
      this.acl = data;
      this.loading = false;
    },
    remove(resource) {
      const index = this.acl.indexOf(resource);
      if (index !== -1) {
        this.acl.splice(index, 1);
      }
    },
    async save() {
      const promises = [this.girderRest.put(`folders/${this.folder.id}/permissions`, this.acl)];

      if (this.public_ !== this.folder.public) {
        promises.push(this.girderRest.put(`folders/${this.folder.id}/public`, {
          public: this.public_,
        }));
      }

      await Promise.all(promises);

      this.$emit('model-access-changed', { acl: this.acl, public: this.public_ });
      this.$emit('close');
    },
    addUser() {
      if (!this.addUsername.trim()) {
        return;
      }
      if (!this.acl.find((el) => el.name === this.addUsername && el.model === 'user')) {
        this.acl.push({
          'name': this.addUsername,
          'model': 'user',
          'permission': 'read',
        });
      }
      this.addUsername = '';
    },
    addGroup() {
      if (!this.addGroupname.trim()) {
        return;
      }
      if (!this.acl.find((el) => el.name === this.addGroupname && el.model === 'group')) {
        this.acl.push({
          'name': this.addGroupname,
          'model': 'group',
          'permission': 'read',
        });
      }
      this.addGroupname = '';
    },
  },
};
</script>

<template>
  <v-card class="access-control">
    <v-card-title>
      Access control
    </v-card-title>
    <v-card-subtitle>
      <v-icon>mdi-folder</v-icon>
      {{ folder.name }}
    </v-card-subtitle>
    <v-card-text>
      <v-alert
        color="info"
        border="left"
      >
        <v-icon>mdi-alert-box</v-icon>
        These settings apply to this folder and <b>all</b> files and folders it contains.
      </v-alert>
      <v-switch
        v-model="public_"
        :hint="publicText"
        class="mb-4"
        label="Public"
        persistent-hint="persistent-hint"
      />
      <v-subheader>Permissions</v-subheader>
      <transition
        name="height"
        mode="out-in"
      >
        <v-list
          v-if="acl.length"
          class="group-user"
          two-line="two-line"
        >
          <transition-group name="height2">
            <v-list-item
              v-for="resource of acl"
              :key="`${resource.model}::${resource.id}`"
            >
              <v-list-item-action class="mr-3">
                <v-icon>{{ $vuetify.icons.values[resource.model] }}</v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{ resource.name }}</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action class="mr-5">
                <v-select
                  v-model="resource.permission"
                  :items="permissions"
                  class="level-select"
                  light
                  solo
                  hide-details
                  dense
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
          v-if="!acl.length && !loading"
          class="mt-1 mb-2"
        >
          Empty
        </div>
      </transition>
      <v-subheader>Grant access</v-subheader>
      <v-text-field
        v-model="addUsername"
        prepend-inner-icon="mdi-account-plus"
        append-outer-icon="mdi-plus"
        label="Enter username"
        @click:append-outer="addUser"
        @keypress.enter="addUser"
      />
      <v-text-field
        v-model="addGroupname"
        prepend-inner-icon="mdi-account-multiple-plus"
        append-outer-icon="mdi-plus"
        label="Enter group name"
        @click:append-outer="addGroup"
        @keypress.enter="addGroup"
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

.level-select {
  max-width: 180px;
}
</style>
