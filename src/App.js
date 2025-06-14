import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Procesamiento from "./pages/Procesamiento";
import CruceLog from "./pages/CruceLog";
import Repositorio from "./pages/Repositorio";
import Buscador from "./pages/Buscador";
import Ayuda from "./pages/Ayuda";

export default function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-10 bg-gray-100">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/procesamiento" element={<Procesamiento />} />
            <Route path="/cruce-log" element={<CruceLog />} />
            <Route path="/repositorio" element={<Repositorio />} />
            <Route path="/buscador" element={<Buscador />} />
            <Route path="/ayuda" element={<Ayuda />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}


























