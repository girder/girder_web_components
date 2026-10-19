# Girder web component library

Try the [demo app](https://gwc.girder.org/).
It works with [data.kitware.com](https://data.kitware.com/).

## Usage Quickstart

**Latest version only support Vue3. For Vue2, [@girder/components v3.3.0](https://github.com/girder/girder_web_components/releases/tag/v3.3.0) should be used.**

### Installation

[Vite](https://vite.dev/) is required for building applications with Girder web components.

```bash
# Install GWC
yarn add @girder/components
# or
npm install @girder/components
```

### Initialization
The lib exports the [components](./src/components/) and a [plugin](./src/plugins/index.js) that initializes a [RestClient](./src/utils/restClient.js) and a [NotificationBus](./src/utils/notificationBus.js), provide them and register the vuetify configuration. It can optionally register all components.

Example of application initialization using the plugin (typically `src/main.js`):

```javascript
/* src/main.js */
import { createApp } from 'vue'
import App from './App.vue'

import GirderPlugin from '@girder/components'

const app = createApp(App)

app.use(GirderPlugin, {
  girder: {apiRoot: import.meta.env.VITE_API_ROOT},
  notification: {useEventSource: true},
  components: true // register all components
})
app.mount('#app')
```

### Using Components

All components are prefixed `Girder`.

#### A-la-carte (recommended)
In this case the plugin does not register all components, thus to use components individually, they should be imported by name from `@girder/components/`, as this location will be stable across releases.
For instance:

```javascript
import { GirderUpload } from '@girder/components/'; // Good
import { Upload } from '@girder/components/src/components/Upload/Upload.vue'; // Unsafe -- may move in the future
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
      <GirderAuthentication />
    </v-content>
  </v-app>
</template>

<script setup>
import { inject, computed } from 'vue';
import { GirderAuthentication } from '@girder/components/';

// Injecting 'rest' is not necessary to use the component,
// but is required to access the results of API calls
const { rest, user } = inject('girder');
const currentUserLogin = computed(() => user.value ? user.value.login : 'anonymous');
</script>
```

#### Global registration
In this case, the components are registered by the plugin, so they do not need to be imported.
See [the demo app](demo/App.vue) for a more comprehensive example.

## Advanced Usage

### Customizing Vuetify Configuration
Custom additional vuetify configuration can be passed to the plugin through the `vuetifyConfig` option.
If your downstream application is also using Vuetify and needs to pass additional configuration
options, it must be careful to coordinate with Girder web components.

```javascript
/* src/main.js */
import { createApp } from 'vue'
import App from './App.vue'

import GirderPlugin from '@girder/components'

const app = createApp(App)

app.use(GirderPlugin, {
  girder: {apiRoot: import.meta.env.VITE_API_ROOT},
  notification: {useEventSource: true},
  vuetifyConfig: {icons: {aliases: {login: 'mdi-circle' }}}
})
app.mount('#app')
```

> **Note:** You must use the mdi icon pack. Icon packs cannot be mixed.

### Headless composables

The logic of the browsing, login and selection components is also available as
composables, without any rendering. They can be used to build a custom UI on top
of Girder web components, with or without Vuetify.

- `useDataBrowser({ location, options })`: rows of a location, counts,
  pagination (`options.page`, `options.itemsPerPage`), `loading`, `error` and `refresh()`.
- `useGirderLogin()`: `username`, `password`, `otp`, `otpRequired`, `alerts`,
  `inProgress`, `login()`, `logout()` and `sendVerification()`. `login()` resolves
  to `'success'`, `'otp'` (a one-time password is required) or `'error'`.
- `useSelection(selected, { multiple, selectableTypes })`: `selected`,
  `selectedIds`, `isSelected()`, `toggle()`, `toggleAll()`, `clear()`. The selection
  array is never mutated in place, so `selected` can be a writable computed that
  emits `update:selected`.

By default, the composables use the REST client provided by the plugin. A
`RestClient` can also be passed with the `rest` parameter.

```html
<script setup>
import { ref } from 'vue';
import { useDataBrowser, useSelection } from '@girder/components';

const location = ref({ type: 'root' });
const { rows, loading, options } = useDataBrowser({ location });
const { selected, toggle, isSelected } = useSelection([], { selectableTypes: ['item'] });

function open(row) {
  if (row._modelType === 'item') {
    toggle(row);
  } else {
    location.value = row;
  }
}
</script>

<template>
  <ul :aria-busy="loading">
    <li v-for="row in rows" :key="row._id || row.type" @click="open(row)">
      {{ isSelected(row) ? '[x]' : '[ ]' }} {{ row.name }}
    </li>
  </ul>
</template>
```

#### Custom data source

`useDataBrowser` and `GirderDataBrowser` read rows through a data source. The
default one, `createRestDataSource(rest)`, calls the Girder REST API from the
browser. Another source can be passed, for instance to list the hierarchy
through a backend that queries Girder on behalf of the page:

```javascript
const source = {
  // Counts for a location: the total number of rows is the sum of the values.
  async count(location) {
    const response = await fetch(`/my-backend/count?id=${location._id}`);
    return response.json(); // e.g. { nFolders: 3, nItems: 12 }
  },
  // Rows of one page; counts is the last result of count().
  async list(location, { page, itemsPerPage, counts }) {
    const response = await fetch(
      `/my-backend/list?id=${location._id}&page=${page}&limit=${itemsPerPage}`,
    );
    return response.json();
  },
};

const { rows } = useDataBrowser({ location, source });
```

```html
<GirderDataBrowser :location="location" :data-source="source" />
```

### Other installation methods

It's not necessary to install Girder web components yourself, you can import the pre-built bundle.

#### Using CDN/UMD

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="https://unpkg.com/@girder/components"></script>
<link rel="stylesheet" href="https://unpkg.com/@girder/components/dist/style.css">
<script>
  const app = Vue.createApp({});
  app.use(girder);
  app.mount('#app');
</script>
```
This exposes the plugin under the global variable `girder`.

#### Using ESM
```html
<script type="module">
import Gwc, { GirderUpload } from 'https://unpkg.com/@girder/components?module';

const app = Vue.createApp({});
app.use(Gwc);
app.component('GirderUpload', GirderUpload);
app.mount('#app');
</script>
```

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
yarn lint:style

# Run unit tests
yarn test:unit
```

### Use an external Girder API

To build the demo app against an external Girder API, set the
`VITE_API_ROOT` environment variable. For example:

```bash
export VITE_API_ROOT=https://data.kitware.com/api/v1
yarn serve
```

This variable value defaults to `http://localhost:8080/api/v1` for
normal development (which assumes the developer has a local instance of
the Girder API server running).
When running against your own instance of the Girder API server,
make sure to set [CORS](https://girder.readthedocs.io/en/stable/security.html#cors-cross-origin-resource-sharing) accordingly.

### Displaying private media from Girder on a page

If your app injects media dynamically into the page using `img` or `video` elements that load from Girder, there are several requirements.

* You must use the `authenticateWithCredentials` option in the GirderRest constructor.
* You must modify [Girder's CORS allowed origin settings](https://girder.readthedocs.io/en/stable/security.html?highlight=cors#cors-cross-origin-resource-sharing) to match your app's origin exactly.  You can use a comma-separated list to match multiple origins, for example `*, http://localhost:8080, https://myapp.domain.com`
* To interact with the loaded element data from a canvas or JS, you may need to add the [crossOrigin attribute](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/crossOrigin) to the media element.

### Deploy and Publish

The demo app is automatically deployed to [gwc.girder.org](https://gwc.girder.org).

Any contributor can request an update to the published npmjs version by changing the version string in `package.json` and opening a pull request.  Our CI runner will detect the change and publish on merge.  Version update PRs should generally happen independently of feature PRs.

### Type Definitions

TypeScript type defs are maintained at `index.d.ts`. Please remember to update this file if your change impacts the public api.
