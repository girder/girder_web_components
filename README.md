# Girder web component library

## For users
### Installation
    npm install @girder/components
    
or

    yarn add @girder/components

### Use as a prebuilt UMD module

It's not necessary to install Girder web components yourself, you can import the prebuilt bundle
into your page by including the following tags:

    <script src="https://unpkg.com/vue/dist/vue.min.js"></script>
    <script src="https://unpkg.com/@girder/components"></script>
    <link rel="stylesheet" href="https://unpkg.com/@girder/components/dist/girder.css">

This will expose all the library's components under the global variable `girder`, e.g.
`girder.components.Upload`.

### Import components into your project

If you're building your own downstream application, you can include individual components from
the library. Either import the full UMD module:

    import girder from '@girder/components';
    
    const restClient = new girder.RestClient();
    
Or import specific components from the `src` directory:

    // Downstream.vue
    <template>
      <girder-upload ... />
    </template>
    
    <script>
    import { Upload as GirderUpload } from '@girder/components/src/components';
    
    export default {
      components: { GirderUpload },
      ...
    };
    </script>

> **Note:** When importing components from the source tree, you should import
  them from `index.js` rather than importing the `.vue` files yourself, as the
  latter is prone to break if files get moved in future releases. For example:
  ```
  import { Upload as GirderUpload } from '@girder/components/src/components';  // Good
  import GirderUpload from '@girder/components/src/components/Upload.vue'; // Unsafe -- may move in future
  ```
  > Files and symbols that do not appear in an index.js should be considered private and it
  is unsafe to use them in downstream projects since they are not part of the supported API surface.

## For developers
### Project setup
    yarn

#### Compile and hot-reload for development
    yarn serve

#### Build the library for production
    yarn build

### Lint and fix source code
    yarn lint

### Run unit tests
    yarn test:unit
