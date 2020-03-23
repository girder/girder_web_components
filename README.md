# Girder web component library

Try the [demo app](https://gwc.girder.org/).
It works with [data.kitware.com](https://data.kitware.com/).

## Usage Quickstart

### Installation

```bash
npm install @girder/components
# or
yarn add @girder/components
```

[VueCLI](https://cli.vuejs.org/) is required for building applications with Girder web components.
However, a few additional packages must still be manually installed:

```bash
npm install -D sass sass-loader@^7.3.1 vue-cli-plugin-vuetify vuetify-loader
# or
yarn add -D sass sass-loader@^7.3.1 vue-cli-plugin-vuetify vuetify-loader
```

> **Note:** If you are building with custom webpack (without vue-cli-service),
> you should follow Vuetify's [Webpack install instructions](https://vuetifyjs.com/en/getting-started/quick-start/#webpack-install)

### Initialization

Encapsulating the configuration in another file (typically `src/plugins/girder.js`) is a good practice.

```javascript
/* src/plugins/girder.js */
import Vue from 'vue';
import Girder, { RestClient } from '@girder/components/src';

// Install the Vue plugin that lets us use the components
Vue.use(Girder);

// This connects to another server if the VUE_APP_API_ROOT
// environment variable is set at build-time
const apiRoot = process.env.VUE_APP_API_ROOT || 'http://localhost:8080/api/v1';

// Create the axios-based client to be used for all API requests
const girderRest = new RestClient({
  apiRoot,
});

// This is passed to our Vue instance; it will be available in all components
const GirderProvider = {
  girderRest,
};
export default GirderProvider;
```

Reference the configuration from your application initialization (typically `src/main.js`):

```javascript
/* src/main.js */
import GirderProvider from '@/plugins/girder';
import { vuetify } from '@girder/components/src';

// ...

new Vue({
  provide: GirderProvider,
  // Import and use vuetify config from girder/components without modification
  // See below for how to inject your own config
  vuetify,
  // ...
}).$mount('#app');
```

### Using Components

Components should be imported by name from `@girder/components/src/components`, as this location will be stable across releases.
For instance:

```javascript
import { Upload as GirderUpload } from '@girder/components/src/components';  // Good
import GirderUpload from '@girder/components/src/components/Upload.vue'; // Unsafe -- may move in future
```

Since Girder web components uses Vuetify, your application must provide
[`v-app` and `v-content` containers](https://vuetifyjs.com/en/framework/default-markup#all-about-app)
at some ancestor level.

For example, to create a login / registration widget in `src/App.vue`:

```html
<!-- src/App.vue -->
<template>
  <v-app>
    <v-content>
      <h1>Welcome {{ currentUserLogin }}</h1>
      <GirderAuthentication register />
    </v-content>
  </v-app>
</template>

<script>
import { Authentication as GirderAuthentication } from '@girder/components/src/components';

export default {
  components: {
    GirderAuthentication,
  },

  // Injecting is not necessary to use the component,
  // but is required to access the results of API calls
  inject: ['girderRest'],
  computed: {
    currentUserLogin() {
      return this.girderRest.user ? this.girderRest.user.login : 'anonymous';
    },
  },
};
</script>
```

See [the demo app](demo/App.vue) for a more comprehensive example.

## Advanced Usage

### Customizing Vuetify Configuration

If your downstream application is also using Vuetify and needs to pass additional configuration
options, it must be careful to coordinate with Girder web components.

Additional Vuetify configuration should inherit from Girder web components' own configuration:

```javascript
import { merge } from 'lodash';
import { vuetifyConfig as girderVuetifyConfig } from '@girder/components/src/utils';

const appVuetifyConfig = merge(girderVuetifyConfig, {
  icons: {
    values: {
      myCustomIcon: 'mdi-custom-icon'
    }
  }
});
```

> **Note:** You must use the mdi icon pack. Icon packs cannot be mixed.

```javascript
import Vuetify from 'vuetify/lib';
new Vue({
  provide: GirderProvider,
  vuetify: new Vuetify(appVuetifyConfig),
}).$mount('#app');
```

> **Note:** Girder web components imports a-la-carte `vuetify/lib`, so you should
> do the same to avoid building duplicate dependencies into your artifacts.

### Other installation methods

It's not necessary to install Girder web components yourself, you can import the prebuilt bundle
into your page by including the following tags:

```html
<script src="https://unpkg.com/vue/dist/vue.min.js"></script>
<script src="https://unpkg.com/@girder/components"></script>
<link rel="stylesheet" href="https://unpkg.com/@girder/components/dist/girder.css">
```

This will expose all the library's components under the global variable `girder`, e.g.
`girder.components.Upload`.

> **Note:** If importing this library's UMD bundle via a ``<script>`` tag, the incantation for
> installing the Vue plugin is slightly different:
>
> ```javascript
> Vue.use(girder.default);
> ```

## For developers

```bash
# Project Setup
yarn

# Compile and hot-reload for development
yarn serve

# Build the library for production
yarn build

# Lint and fix source code
yarn lint

# Run unit tests
yarn test:unit
```

### Use an external Girder API

To build the demo app against an external Girder API, set the
`VUE_APP_API_ROOT` environment variable. For example:

```bash
export VUE_APP_API_ROOT=https://data.kitware.com/api/v1
yarn serve
```

This variable value defaults to `http://localhost:8080/api/v1` for
normal development (which assumes the developer has a local instance of
the Girder API server running).
When running against your own instance of the Girder API server,
make sure to set [CORS](https://girder.readthedocs.io/en/stable/security.html#cors-cross-origin-resource-sharing) accordingly.

### Deploy and Publish

The demo app is automatically deployed to https://gwc.girder.org

Any contributor can request an update to the published npmjs version by changing the version string in `package.json` and opening a pull request.  Our CI runner will detect the change and publish on merge.  Version update PRs should generally happen independently of feature PRs.
