import { useEffect, useState } from "react";
import { getHealth } from "../api/api.js";

function ConnectionStatus() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    checkConnection();
  }, []);
  const checkConnection = async () => {
    try {
      const data = await getHealth();

      console.log("Backend response:", data);

      setStatus("Backend Connected");
    } catch (error) {
      console.error("Backend connection error:", error);

      setStatus("Backend Not Connected");
    }
  };

}

export default ConnectionStatus;