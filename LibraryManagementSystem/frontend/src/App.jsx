import NavBar from "./components/NavBar";
import Home from "./pages/home";
import Loans from "./pages/Loans";
import Reservations from "./pages/Reservations";
import Fines from "./pages/Fines";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import { Routes, Route } from "react-router-dom";
import { SessionProvider } from "./contexts/SessionContext";
function App() {
  return (
    <SessionProvider>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/fines" element={<Fines />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login/:path" element={<Login />} />
        </Routes>
      </main>
    </SessionProvider>
  );
}

export default App;
