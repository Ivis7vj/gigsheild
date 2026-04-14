import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api';

export const isDebugMode = () =>
  import.meta.env.VITE_DEBUG_API === 'true' ||
  localStorage.getItem('debug_mode') === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    // #region agent log
    fetch('http://127.0.0.1:7695/ingest/92344bf6-a0bf-478b-ad15-5d0e984edfef',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f473cf'},body:JSON.stringify({sessionId:'f473cf',runId:'dashboard-unreachable',hypothesisId:'H1',location:'frontend/src/api/client.js:request',message:'Outgoing API request',data:{baseURL:config.baseURL,url:config.url,method:config.method},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (isDebugMode()) {
      console.log('[API REQUEST]', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        baseURL: config.baseURL,
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // #region agent log
    fetch('http://127.0.0.1:7695/ingest/92344bf6-a0bf-478b-ad15-5d0e984edfef',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f473cf'},body:JSON.stringify({sessionId:'f473cf',runId:'dashboard-unreachable',hypothesisId:'H2',location:'frontend/src/api/client.js:response',message:'API response received',data:{url:response.config?.url,status:response.status},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (isDebugMode()) {
      console.log('[API RESPONSE]', {
        url: response.config?.url,
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    // #region agent log
    fetch('http://127.0.0.1:7695/ingest/92344bf6-a0bf-478b-ad15-5d0e984edfef',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f473cf'},body:JSON.stringify({sessionId:'f473cf',runId:'dashboard-unreachable',hypothesisId:'H3',location:'frontend/src/api/client.js:error',message:'API response error',data:{url:error.config?.url,status:error.response?.status||null,message:error.message,hasResponse:Boolean(error.response)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (isDebugMode()) {
      console.error('[API ERROR]', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }
    return Promise.reject(error);
  }
);

export function normalizeApiError(error, fallbackMessage = 'Something went wrong') {
  if (!error) {
    return { message: fallbackMessage, isNetworkError: false, status: null };
  }

  if (!error.response) {
    return {
      message: 'Backend unreachable. Please check connection and try again.',
      isNetworkError: true,
      status: null,
    };
  }

  return {
    message: error.response?.data?.detail || error.message || fallbackMessage,
    isNetworkError: false,
    status: error.response.status,
  };
}

export async function apiRequest(requestFn, { retries = 1, retryDelayMs = 500 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export default api;
