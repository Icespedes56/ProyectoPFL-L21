import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Procesamiento() {
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [archivosInfo, setArchivosInfo] = useState({
    peso: 0,
    procesados: 0,
    total: 0
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setArchivo(file);
    setError("");
    
    if (file) {
      try {
        // Obtener información real del ZIP
        const formData = new FormData();
        formData.append("archivo", file);
        
        const response = await fetch("http://localhost:8000/info-zip/", {
          method: "POST",
          body: formData,
        });
        
        if (response.ok) {
          const zipInfo = await response.json();
          setArchivosInfo({
            peso: zipInfo.peso_archivo,
            procesados: 0,
            total: zipInfo.total_archivos
          });
        } else {
          // Si hay error, usar solo el peso del archivo
          setArchivosInfo(prev => ({
            ...prev,
            peso: file.size,
            total: 0
          }));
        }
      } catch (err) {
        console.error("Error al obtener info del ZIP:", err);
        setArchivosInfo(prev => ({
          ...prev,
          peso: file.size,
          total: 0
        }));
      }
    }
  };

  const simularProgreso = (totalArchivos) => {
    setProgreso(0);
    let archivosProcesados = 0;
    
    const interval = setInterval(() => {
      setProgreso(prev => {
        const nuevoProg = prev >= 95 ? 95 : Math.min(prev + (prev < 20 ? 8 : prev < 60 ? 4 : prev < 80 ? 2 : 1), 95);
        
        // Actualizar archivos procesados basado en el nuevo progreso
        if (totalArchivos > 0) {
          const nuevosProcesados = Math.floor((nuevoProg / 95) * totalArchivos);
          if (nuevosProcesados !== archivosProcesados) {
            archivosProcesados = nuevosProcesados;
            setArchivosInfo(prevInfo => ({
              ...prevInfo,
              procesados: archivosProcesados
            }));
          }
        }
        
        if (nuevoProg >= 95) {
          clearInterval(interval);
        }
        
        return nuevoProg;
      });
    }, 200);
    
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
    setArchivosInfo(prev => ({ ...prev, procesados: 0 }));

    const intervalProgreso = simularProgreso(archivosInfo.total);

    try {
      const formData = new FormData();
      formData.append("archivo", archivo);

      const response = await fetch("http://localhost:8000/procesar/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const blob = await response.blob();
      
      // Completar progreso
      clearInterval(intervalProgreso);
      setProgreso(100);
      setArchivosInfo(prev => ({ ...prev, procesados: prev.total }));

      // Pequeña pausa para mostrar el 100%
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
      console.error(err);
      clearInterval(intervalProgreso);
      setError("❌ Error al procesar el archivo.");
    } finally {
      setTimeout(() => {
        setProcesando(false);
        setProgreso(0);
        // Mantener el total, resetear solo los procesados
        setArchivosInfo(prev => ({ ...prev, procesados: 0 }));
      }, 1000);
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
    <div className="flex items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-xl rounded-2xl w-full max-w-lg p-8"
      >
        <h2 className="text-xl font-semibold text-blue-900 mb-2 text-center">
          Procesamiento de Planillas
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Selecciona un archivo ZIP con las planillas tipo A y I para iniciar el procesamiento.
        </p>

        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Archivo ZIP
            </label>
            <div className="flex items-center justify-between border border-blue-600 rounded-lg px-3 py-2 bg-gray-50">
              <label className="cursor-pointer bg-blue-100 text-blue-900 px-4 py-1 rounded-lg font-medium hover:bg-blue-200 transition">
                Seleccionar archivo
                <input type="file" accept=".zip" onChange={handleFileChange} className="hidden" />
              </label>
              <span className="text-sm text-gray-500 ml-3 truncate">
                {archivo ? archivo.name : "Ningún archivo seleccionado"}
              </span>
            </div>
          </div>

          {/* Panel de información mejorado */}
          {archivo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mb-4 overflow-hidden"
            >
              {/* Estadísticas principales */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 mb-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-800">
                      {formatFileSize(archivosInfo.peso)}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">Tamaño del archivo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-800">
                      {archivosInfo.total || 'Analizando...'}
                    </div>
                    <div className="text-xs text-indigo-600 font-medium">Archivos válidos</div>
                  </div>
                </div>
              </div>

              {/* Contador de procesamiento en tiempo real */}
              {procesando && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border-2 border-blue-200 rounded-lg p-4 mb-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{getStatusIcon()}</span>
                      <span className="font-semibold text-gray-800">Estado del Procesamiento</span>
                    </div>
                    <div className={`font-bold text-lg ${getStatusColor()}`}>
                      {progreso}%
                    </div>
                  </div>
                  
                  {/* Contador visual mejorado */}
                  {archivosInfo.total > 0 ? (
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Archivos procesados</span>
                        <span className={`text-sm font-bold ${getStatusColor()}`}>
                          {archivosInfo.procesados}/{archivosInfo.total}
                        </span>
                      </div>
                      
                      {/* Barra de progreso de archivos */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${(archivosInfo.procesados / archivosInfo.total) * 100}%` 
                          }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </div>
                      
                      {/* Indicadores de velocidad */}
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          {archivosInfo.procesados > 0 && progreso > 0 ? 
                            `≈${Math.max(1, Math.round(archivosInfo.procesados / (progreso / 100 * 10)))} arch/s` : 
                            "Iniciando..."
                          }
                        </span>
                        <span>
                          {Math.max(0, archivosInfo.total - archivosInfo.procesados)} restantes
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                      <div className="text-yellow-700 font-medium">
                        🔍 Analizando contenido del archivo...
                      </div>
                      <div className="text-yellow-600 text-sm mt-1">
                        Detectando archivos válidos en el ZIP
                      </div>
                    </div>
                  )}
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
              className="mb-4"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-900">Progreso General</span>
                <span className={`text-sm font-bold ${getStatusColor()}`}>{progreso}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-full shadow-sm relative overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: `${progreso}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {/* Efecto de brillo animado */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.5, 
                      ease: "linear",
                      repeatDelay: 0.5 
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          <button
            onClick={handleSubmit}
            disabled={procesando}
            className={`w-full py-3 px-4 rounded-lg text-white font-bold text-lg ${
              procesando ? "bg-blue-300 cursor-not-allowed" : "bg-blue-800 hover:bg-blue-900"
            } transition duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02]`}
          >
            {procesando ? (
              <div className="flex items-center justify-center">
                <motion.span 
                  className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Procesando {archivosInfo.total > 0 ? `(${archivosInfo.procesados}/${archivosInfo.total})` : "..."}
              </div>
            ) : (
              "Procesar Planillas"
            )}
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-700 font-semibold text-center">{error}</p>
          </motion.div>
        )}

        {/* Mensaje de éxito */}
        {progreso === 100 && procesando && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <p className="text-green-700 font-semibold text-center flex items-center justify-center">
              <span className="mr-2">🎉</span>
              ¡Procesamiento completado exitosamente!
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
