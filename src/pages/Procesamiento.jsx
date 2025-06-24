import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Procesamiento() {
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [archivosInfo, setArchivosInfo] = useState({
    peso: 0,
    registrosGenerados: 0,
    totalRegistros: 0
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setArchivo(file);
    setError("");
    
    if (file) {
      setArchivosInfo({
        peso: file.size,
        registrosGenerados: 0,
        totalRegistros: 0
      });
    }
  };

  const simularProgreso = () => {
    setProgreso(0);
    let registrosGenerados = 0;
    
    const interval = setInterval(() => {
      setProgreso(prev => {
        const incremento = prev < 20 ? 15 : prev < 60 ? 10 : prev < 80 ? 5 : 2;
        const nuevoProg = Math.min(prev + incremento, 95);
        
        // Simular generación de registros (estimado)
        const nuevosRegistros = Math.floor((nuevoProg / 95) * 100); // Estimación de 100 registros máximo
        if (nuevosRegistros > registrosGenerados) {
          registrosGenerados = nuevosRegistros;
          setArchivosInfo(prevInfo => ({
            ...prevInfo,
            registrosGenerados: registrosGenerados
          }));
        }
        
        if (nuevoProg >= 95) {
          clearInterval(interval);
        }
        
        return nuevoProg;
      });
    }, 300);
    
    return interval;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!archivo) {
      setError("⚠️ Por favor selecciona un archivo ZIP.");
      return;
    }

    setProcesando(true);
    setError("");
    setArchivosInfo(prev => ({ 
      ...prev, 
      registrosGenerados: 0,
      totalRegistros: 0
    }));

    const intervalProgreso = simularProgreso();

    try {
      const formData = new FormData();
      formData.append("archivo", archivo);

      const response = await fetch("http://localhost:8000/procesar/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error en el servidor");
      }

      const blob = await response.blob();
      
      // Completar progreso
      clearInterval(intervalProgreso);
      setProgreso(100);
      
      // Aquí deberías obtener el número real de registros del servidor
      // Por ahora uso un valor estimado
      const registrosFinales = archivosInfo.registrosGenerados || 50;
      setArchivosInfo(prev => ({ 
        ...prev, 
        registrosGenerados: registrosFinales,
        totalRegistros: registrosFinales
      }));

      // Descargar archivo
      setTimeout(() => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "planillas_generadas.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }, 500);

    } catch (err) {
      console.error("Error:", err);
      clearInterval(intervalProgreso);
      setError(`❌ ${err.message}`);
    } finally {
      setTimeout(() => {
        setProcesando(false);
        setProgreso(0);
        setArchivosInfo(prev => ({ 
          ...prev, 
          registrosGenerados: 0
        }));
      }, 2000);
    }
  };

  const getStatusColor = () => {
    if (!procesando) return "text-gray-600";
    if (progreso < 30) return "text-yellow-600";
    if (progreso < 70) return "text-blue-600";
    if (progreso < 100) return "text-green-600";
    return "text-emerald-600";
  };

  const getStatusIcon = () => {
    if (!procesando) return "📁";
    if (progreso < 30) return "⏳";
    if (progreso < 70) return "⚡";
    if (progreso < 100) return "🔄";
    return "✅";
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-2xl rounded-3xl w-full max-w-lg p-8 border border-blue-100"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            🏢 Procesador de Planillas
          </h2>
          <p className="text-sm text-gray-600">
            Convierte archivos ZIP en planillas Excel organizadas
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📦 Archivo ZIP
            </label>
            <div className="relative border-2 border-dashed border-blue-300 rounded-xl p-4 bg-blue-50 hover:bg-blue-100 transition-colors">
              <input 
                type="file" 
                accept=".zip" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center">
                <div className="text-blue-600 text-3xl mb-2">📂</div>
                <div className="text-sm font-medium text-blue-800">
                  {archivo ? archivo.name : "Arrastra o selecciona un archivo ZIP"}
                </div>
              </div>
            </div>
          </div>

          {/* Panel de información */}
          {archivo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mb-6 space-y-4"
            >
              {/* Estadísticas del archivo */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-800">
                      {formatFileSize(archivosInfo.peso)}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">Tamaño</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-indigo-800">
                      {procesando ? archivosInfo.registrosGenerados : (archivosInfo.totalRegistros || '...')}
                    </div>
                    <div className="text-xs text-indigo-600 font-medium">Archivos</div>
                  </div>
                </div>
              </div>

              {/* Estado del procesamiento */}
              {procesando && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border-2 border-blue-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl animate-pulse">{getStatusIcon()}</span>
                      <span className="font-semibold text-gray-800">Procesando</span>
                    </div>
                    <div className={`font-bold text-lg ${getStatusColor()}`}>
                      {progreso}%
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Contador de registros procesados */}
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-green-700">
                          📊 Registros procesados
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {archivosInfo.registrosGenerados}
                        </span>
                      </div>
                      <div className="text-xs text-green-600">
                        🔄 Generando registros en Excel...
                      </div>
                    </div>

                    {/* Estado general */}
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-blue-700 font-medium">
                        {progreso < 30 ? "🔍 Analizando archivo..." : 
                         progreso < 70 ? "⚡ Procesando datos..." : 
                         progreso < 100 ? "📝 Generando Excel..." : 
                         "✅ ¡Completado!"}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Barra de progreso general */}
          {procesando && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-blue-900">
                  Progreso General
                </span>
                <span className={`text-sm font-bold ${getStatusColor()}`}>
                  {progreso}%
                </span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-4 overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-full relative overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: `${progreso}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2, 
                      ease: "linear",
                      repeatDelay: 1 
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={procesando || !archivo}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-all duration-300 ${
              procesando || !archivo
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            }`}
          >
            {procesando ? (
              <div className="flex items-center justify-center">
                <motion.div 
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Procesando... ({archivosInfo.registrosGenerados} registros)
              </div>
            ) : (
              "🚀 Procesar Planillas"
            )}
          </button>
        </form>

        {/* Mensajes de error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="text-red-700 text-sm font-medium">
              {error}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}







        
