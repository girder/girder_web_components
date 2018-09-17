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
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons">
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
    import GirderUpload from '@girder/components/src/components/Upload.vue';
    
    export default {
      components: { GirderUpload },
      ...
    };
    </script>


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
