import axiosInstance from "./axiosInstance";
import { jwtDecode } from "jwt-decode";

interface UserRole {
  role: string;
}
interface AuthResponse {
  token: string;
  role: string;
}
export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post("/auth/signin", {
      email,
      password,
    });

    if (response.status === 200) {
      const { token } = response.data;
      const decodedToken = jwtDecode(token) as UserRole;
      const userRole = decodedToken.role;
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", userRole);

      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      return { token, role: userRole };
    } else {
      throw new Error("Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Function to handle logout
export const logout = () => {
  localStorage.removeItem("token"); // Remove token from local storage
  delete axiosInstance.defaults.headers.common["Authorization"]; // Remove the token from axios defaults
};

// Function to check if the user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  const payload = JSON.parse(atob(token.split(".")[1]));
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp > currentTime; // Check if token is expired
};

// Function to get the current user
export const getCurrentUser = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = token.split(".")[1];
  const decodedPayload = atob(payload);

  try {
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null; // Return null if decoding fails
  }
};

// Function to handle registration
export const register = async (
  nom: string,
  email: string,
  password: string
) => {
  try {
    const response = await axiosInstance.post("/auth/signup", {
      nom,
      email,
      password,
      role: "Client",
    });

    if (response.status === 201) {
      // Check for created status
      const { token } = response.data; // Get the token from the response
      localStorage.setItem("token", token); // Store token in local storage
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`; // Set the token for future requests
      return token; // Return the token for further processing if needed
    } else {
      throw new Error("Registration failed");
    }
  } catch (error: any) {
    console.error("Registration error:", error);
    throw new Error(error.response?.data?.message || "Registration failed");
  }
};
