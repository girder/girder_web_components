import { reactive, toRefs } from 'vue';
import RestClient from '@/utils/restClient';


export default function useGirderClient(options = {}) {
    const restClient = new RestClient(options);

    const state = reactive({
        apiRoot: restClient.apiRoot,
        user: restClient.user,
        token: restClient.toke
    });

    restClient.on('userLoggedIn', user => {
        state.user = user;
        state.token = restClient.token;
    });

    restClient.on('userLoggedOut', () => {
        state.user = restClient.user;
        state.token = restClient.token;
    });

    restClient.on('userRegistered', user => {
        state.user = user;
        state.token = restClient.token;
    });

    restClient.on('userFetched', () => {
        state.user = restClient.user;
        state.token = restClient.token;
    });

    restClient.on('apiRootUpdated', apiRoot => {
        state.apiRoot = apiRoot;
        state.user = restClient.user;
        state.token = restClient.token;
    });
    return { rest: restClient, ...toRefs(state) };
}
