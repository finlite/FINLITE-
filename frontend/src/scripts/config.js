const runtimeApiUrl = window.FINLITE_API_URL;
const defaultApiUrl = 'https://finlite-nizr.onrender.com/api';

export const API_URL = (runtimeApiUrl || defaultApiUrl).replace(/\/+$/, '');
