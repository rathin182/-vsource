// app/lib/api.ts
import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "NEXT_PUBLIC_API_URL";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// if (typeof window !== "undefined") {
//   api.interceptors.request.use((config) => {
//     const token = localStorage.getItem("accessToken");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   });
// }
