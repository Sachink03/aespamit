import api from "../lib/axios.js";

export const register = async (name, email, phone, password) => {
  const { data } = await api.post("/auth/register", {
    name,
    email,
    phone,
    password,
  });

  return data;
};

export const login = async (phone, password) => {
  const { data } = await api.post("/auth/login", { phone, password });
  return data.data; // { user, accessToken }
};

export const refresh = async () => {
  const { data } = await api.post("/auth/refresh");
  return data.data; // { accessToken }
};

export const logout = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};

export const getMe = async () => {
  const { data } = await api.get("/auth/me");
  return data.data; // { user }
};

export const getHealth = async () => {
  const { data } = await api.get("/auth/health");
  return data;
};

// Send a phone OTP. Dev mode: the backend returns { otp, expiresAt } in `data`.
export const sendOTP = async (phone) => {
  const { data } = await api.post("/auth/send", { phone });
  return data; // { success, message, otp, expiresAt }
};

// Verify a phone OTP. Returns { success, message }.
export const verifyOTP = async (phone, otp) => {
  const { data } = await api.post("/auth/verify", { phone, otp });
  return data; // { success, message }
};
