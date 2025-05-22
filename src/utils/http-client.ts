import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Configuración base para axios
const baseURL = process.env.API_URL || "http://localhost:3000/api";

// Crear instancia de axios con configuración base
export const httpClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para logs de peticiones
httpClient.interceptors.request.use(
  (config) => {
    console.log(`[REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[REQUEST ERROR]", error);
    return Promise.reject(error);
  }
);

// Interceptor para logs de respuestas
httpClient.interceptors.response.use(
  (response) => {
    console.log(
      `[RESPONSE] ${response.status} ${response.config.method?.toUpperCase()} ${
        response.config.url
      }`
    );
    return response;
  },
  (error) => {
    console.error(
      "[RESPONSE ERROR]",
      error.response?.status,
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default httpClient;
