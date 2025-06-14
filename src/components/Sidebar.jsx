import { Link, useLocation } from "react-router-dom";
import { Home, FileText, Layers, Folder, Search, HelpCircle, LogOut } from "lucide-react";

const menuItems = [
  { icon: <Home size={20} />, label: "Dashboard", path: "/" },
  { icon: <FileText size={20} />, label: "Procesamiento", path: "/procesamiento" },
  { icon: <Layers size={20} />, label: "Cruce Log Bancario", path: "/cruce" },
  { icon: <Folder size={20} />, label: "Repositorio", path: "/repositorio" },
  { icon: <Search size={20} />, label: "Buscador", path: "/buscador" },
  { icon: <HelpCircle size={20} />, label: "Configuración", path: "/configuracion" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="bg-blue-900 text-white w-64 min-h-screen p-5 shadow-lg">
      {/* Logo y título */}
      <div className="text-2xl font-bold mb-10">
        <img src="/image.png" alt="ESAP" className="h-10 mb-3" />
        <span className="text-lg">ESAP Aportes</span>
      </div>

      {/* Menú lateral */}
      <ul className="space-y-1">
        {menuItems.map((item, i) => (
          <li key={i}>
            <Link
              to={item.path}
              className={`flex items-center px-4 py-2 rounded transition-all ${
                location.pathname === item.path
                  ? "bg-blue-800 text-white font-semibold"
                  : "hover:bg-blue-800 text-white"
              }`}
            >
              {item.icon}
              <span className="ml-3 text-sm">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Cerrar sesión */}
      <div className="mt-10">
        <button className="flex items-center text-red-300 hover:text-red-500 px-4 py-2 transition-all">
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}




