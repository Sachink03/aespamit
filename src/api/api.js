const API_URL = import.meta.env.VITE_API_URL;

export const getHealth = async () => {
  const response = await fetch(`${API_URL}/auth/health`);

  if (!response.ok) {
    throw new Error("Failed to connect to backend");
  }

  return response.json();
};