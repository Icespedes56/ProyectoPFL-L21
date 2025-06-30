import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  UsersRound, 
  ArrowLeftRight, 
  Settings2, 
  FolderOpen, 
  SearchX, 
  SlidersHorizontal, 
  LogOut, 
  ShieldCheck,
  ChevronRight
} from "lucide-react";

const menuItems = [
  { icon: <Home size={16} />, label: "Dashboard", path: "/" },
  { icon: <UsersRound size={16} />, label: "Control Aportantes", path: "/control-aportantes" },
  { icon: <ArrowLeftRight size={16} />, label: "Cruce Log Bancario", path: "/cruce-log" },
  { icon: <Settings2 size={16} />, label: "Procesamiento", path: "/procesamiento" },
  { icon: <FolderOpen size={16} />, label: "Repositorio", path: "/repositorio" },
  { icon: <SearchX size={16} />, label: "Buscador", path: "/buscador" },
  { icon: <SlidersHorizontal size={16} />, label: "Configuración", path: "/configuracion" },
];

export default function Sidebar() {
  const location = useLocation();

  const handleLogout = () => {
    console.log("Cerrando sesión...");
    // Aquí puedes agregar tu lógica de logout
    // Por ejemplo: logout(), navigate('/login'), etc.
  };

  return (
    <div className="bg-gradient-to-b from-blue-800 via-blue-900 to-slate-900 text-white w-52 min-h-screen relative shadow-2xl border-r border-blue-700/20">
      {/* Abstract banking background - very subtle like Banco de Occidente */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large soft abstract shapes */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-gradient-to-br from-blue-500/6 via-cyan-400/4 to-blue-600/6 rounded-full blur-lg"></div>
        <div className="absolute top-32 -right-12 w-32 h-48 bg-gradient-to-l from-blue-400/5 via-indigo-500/3 to-blue-500/5 transform rotate-12 rounded-3xl blur-lg"></div>
        <div className="absolute bottom-24 -left-8 w-36 h-36 bg-gradient-to-br from-indigo-400/6 via-blue-500/4 to-slate-500/6 transform -rotate-6 rounded-full blur-lg"></div>
        
        {/* Flowing banking lines - very subtle */}
        <div className="absolute top-20 right-0 w-1 h-80 bg-gradient-to-b from-blue-400/15 via-cyan-400/10 to-transparent transform rotate-6"></div>
        <div className="absolute bottom-32 left-0 w-56 h-1 bg-gradient-to-r from-blue-400/12 via-indigo-400/15 to-transparent transform -rotate-3"></div>
        
        {/* Geometric banking elements */}
        <div className="absolute top-40 right-6 w-16 h-16 border border-blue-400/12 transform rotate-45 bg-gradient-to-br from-blue-500/8 to-indigo-600/5 rounded-lg blur-sm"></div>
        <div className="absolute bottom-56 left-8 w-12 h-20 border border-cyan-400/10 transform rotate-12 bg-gradient-to-b from-blue-400/6 to-transparent rounded-xl blur-sm"></div>
        
        {/* Banking accent particles */}
        <div className="absolute top-48 left-12 w-3 h-3 bg-blue-400/20 rounded-full blur-sm"></div>
        <div className="absolute top-64 right-16 w-2 h-2 bg-cyan-400/25 rounded-full blur-sm"></div>
        <div className="absolute bottom-48 left-16 w-4 h-4 bg-indigo-400/18 rounded-full blur-sm"></div>
        
        {/* Professional banking overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/92 via-blue-900/95 to-slate-900/95"></div>
      </div>

      <div className="relative z-10">
        {/* Professional Banking Header */}
        <div className="p-4 border-b border-blue-700/30 bg-gradient-to-r from-blue-800/40 via-blue-700/20 to-blue-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500/90 via-cyan-500/80 to-blue-600/90 rounded-xl flex items-center justify-center shadow-lg border border-blue-400/40">
              <ShieldCheck className="w-4 h-4 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide drop-shadow-sm">Administrador</h1>
              <h2 className="text-xs text-blue-200 font-medium">Parafiscales</h2>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-2 py-4 space-y-1 pb-20">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-300 hover:scale-[1.01] ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600/25 via-cyan-500/18 to-blue-700/25 text-white shadow-xl border border-blue-400/40 backdrop-blur-sm"
                    : "text-blue-200 hover:bg-gradient-to-r hover:from-blue-800/50 hover:via-blue-700/30 hover:to-blue-800/50 hover:text-white hover:border hover:border-blue-600/30"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-lg transition-all duration-300 border ${
                    isActive 
                      ? "bg-gradient-to-br from-blue-400/30 via-cyan-400/20 to-blue-500/30 border-blue-400/50 shadow-inner" 
                      : "bg-blue-800/40 border-blue-700/30 group-hover:bg-blue-700/50 group-hover:border-blue-600/40"
                  }`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-cyan-300 drop-shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Professional Banking Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900 via-blue-900/60 to-transparent border-t border-blue-700/30">
          <button 
            onClick={handleLogout}
            className="group w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-800/40 via-red-700/30 to-red-800/40 text-red-300 hover:from-red-700/50 hover:via-red-600/40 hover:to-red-700/50 hover:text-red-200 transition-all duration-300 hover:scale-[1.01] border border-red-600/40 hover:border-red-500/50"
          >
            <div className="p-1.5 bg-red-700/40 rounded-lg group-hover:bg-red-600/50 transition-all duration-300 border border-red-600/30">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Professional banking accents */}
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-blue-400/40 via-cyan-400/30 via-blue-500/20 to-blue-400/40"></div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700/60 via-cyan-400/70 to-blue-700/60"></div>
      
      {/* Banking shine effects */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-300/15 to-transparent"></div>
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-300/10 via-transparent to-blue-300/10"></div>
    </div>
  );
}