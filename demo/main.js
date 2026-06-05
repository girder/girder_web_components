import { createApp } from 'vue';
import App from './App.vue';

import GirderPlugin from '@/';

const app = createApp(App)

app.use(GirderPlugin, {
    girder: {apiRoot: import.meta.env.VITE_API_ROOT},
    // useEventSource for Girder 3; useWebSocket for Girder 5
    notifications: {useEventSource: true},
    components: true,
})
app.mount('#app')
