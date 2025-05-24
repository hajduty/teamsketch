import apiClient from "../../lib/apiClient";
import { User } from "../../types/user";

async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
}

async function register(email: string, password: string): Promise<{ user: User; token: string }> {
  const response = await apiClient.post('/auth/register', { email, password });
  return response.data;
}