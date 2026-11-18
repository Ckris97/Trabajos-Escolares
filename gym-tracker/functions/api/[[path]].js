// Pages Functions (para despliegue conectado a Git). La lógica vive en src/api.js
import { handleApi } from '../../src/api.js';

export const onRequest = ({ request, env, params }) => handleApi(request, env, params.path || []);
