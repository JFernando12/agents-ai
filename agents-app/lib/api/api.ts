import axios, { AxiosInstance } from "axios";
import { getUserFromStorage } from '../user';

export class ApiService {
  api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const user = getUserFromStorage();
        if (user?.token) {
          config.headers['Authorization'] = `Bearer ${user.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }
}