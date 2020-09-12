import Vue from 'vue';
import VueRouter from 'vue-router';
import Browse from './views/Browse.vue';

Vue.use(VueRouter);

export default new VueRouter({
  routes: [{
    path: '/',
    redirect: '/folders'
  },
  {
    path: '/folders',
    component: Browse,
    props: { folderId: null }
  },
  {
    path: '/folders/:folderId',
    component: Browse,
    props: true,
  }],
});
