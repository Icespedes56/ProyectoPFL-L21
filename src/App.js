import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Procesamiento from "./pages/Procesamiento";
import CruceLog from "./pages/CruceLog";
import ControlAportantes from "./pages/ControlAportantes";

// Dashboard temporal
const Dashboard = () => (
  <div>
    <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard - ESAP Aportes</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
        <h3 className="text-xl font-bold mb-2 text-blue-800">🏢 Procesamiento</h3>
        <p className="text-gray-600">Procesa archivos ZIP de planillas tipo A e I</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
        <h3 className="text-xl font-bold mb-2 text-green-800">🔄 Cruce Log</h3>
        <p className="text-gray-600">Cruza archivos LOG con archivos tipo I</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
        <h3 className="text-xl font-bold mb-2 text-purple-800">📊 Control Aportantes</h3>
        <p className="text-gray-600">Gestión y análisis de entidades aportantes</p>
      </div>
    </div>
  </div>
);

// Páginas temporales
const PaginaTemporal = ({ nombre }) => (
  <div className="bg-white p-8 rounded-lg shadow-md text-center">
    <h1 className="text-2xl font-bold mb-4 text-gray-800">{nombre}</h1>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <p className="text-blue-800">🚧 Esta página está en desarrollo</p>
    </div>
  </div>
);

export default function App() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-10 bg-gray-100">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/procesamiento" element={<Procesamiento />} />
          <Route path="/cruce-log" element={<CruceLog />} />
          <Route path="/control-aportantes" element={<ControlAportantes />} />
          <Route path="/repositorio" element={<PaginaTemporal nombre="Repositorio" />} />
          <Route path="/buscador" element={<PaginaTemporal nombre="Buscador" />} />
          <Route path="/configuracion" element={<PaginaTemporal nombre="Configuración" />} />
        </Routes>
      </main>
    </div>
  );
}

























