import { reactive, toRefs } from 'vue';
import RestClient from '@/utils/restClient';


export default function useGirderClient(options = {}) {
    const restClient = new RestClient(options);

    const state = reactive({
        apiRoot: restClient.apiRoot,
        user: restClient.user,
        token: restClient.token,
    });

    restClient.on('login', user => {
        state.user = user;
        state.token = restClient.token;
    });

    restClient.on('logout', () => {
        state.user = restClient.user;
        state.token = restClient.token;
    });

    restClient.on('register', user => {
        state.user = user;
        state.token = restClient.token;
    });

    restClient.on('setApiRoot', apiRoot => {
        state.apiRoot = apiRoot;
        state.user = restClient.user;
        state.token = restClient.token;
    });
    return { rest: restClient, ...toRefs(state) };
}
