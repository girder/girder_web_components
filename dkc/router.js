import Vue from 'vue';
import VueRouter from 'vue-router';
import MainApp from './MainApp.vue';
import AuthorizedUpload from './views/AuthorizedUpload.vue';
import Browse from './views/Browse.vue';

Vue.use(VueRouter);

export default new VueRouter({
  routes: [{
    path: '/',
    redirect: '/folders',
    component: MainApp,
    children: [
      {
        path: 'folders',
        component: Browse,
        props: { folderId: null },
      },
      {
        path: 'folders/:folderId',
        component: Browse,
        props: true,
      },
    ],
  }, {
    path: '/authorizedUpload/:id/:authorization',
    component: AuthorizedUpload,
    props: true,
  }],
});
