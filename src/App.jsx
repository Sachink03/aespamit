import { BrowserRouter, Routes, Route } from "react-router-dom";

import Register from "./pages/Register";
import Welcome from "./pages/Welcome";
import Login from "./pages/auth/Login";
import PrivateRoute from "./routes/PrivateRoute";
import Dashboard from "./pages/user/Dashboard";
import Wallet from "./pages/user/wallet/Wallet";
import AepsWithdraw from "./pages/user/aesp/AespWithdraw"
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/register" element={<Register />} />
         <Route path="/" element={<Welcome />} />
         <Route path="/login" element={<Login />} />
         <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/aesp-withdraw" element={<AepsWithdraw />}/>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;