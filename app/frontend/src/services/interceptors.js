import axios from 'axios';
import { useAuthStore } from '~/store/auth';
import { useAppStore } from '~/store/app';

/**
 * @function appAxios
 * Returns an Axios instance with auth header and preconfiguration
 * @param {integer} [timeout=10000] Number of milliseconds before timing out the request
 * @returns {object} An axios instance
 */
export function appAxios(timeout = 60000) {
  // 2024-01-12 Urgent timeout increase from 10000 to help with performance.
  const appStore = useAppStore();
  const axiosOptions = { timeout: timeout };
  if (appStore.config) {
    axiosOptions.baseURL = `${appStore.config.basePath}/${appStore.config.apiPath}`;
  }

  const instance = axios.create(axiosOptions);

  const authStore = useAuthStore();

  instance.interceptors.request.use(
    (cfg) => {
      if (authStore?.ready && authStore?.authenticated) {
        cfg.headers.Authorization = `Bearer ${authStore.keycloak.token}`;
      }
      return Promise.resolve(cfg);
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 503) {
        window.dispatchEvent(
          new CustomEvent('service-unavailable', {
            detail: error.response?.data?.details || error,
          })
        );
      }
      return Promise.reject(error);
    }
  );

  return instance;
}
