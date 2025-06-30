import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProcesamientoProfesionalCompacto() {
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
  const [datosAdvertencia, setDatosAdvertencia] = useState(null);
  const [mostrarValidacion, setMostrarValidacion] = useState(false);
  const [etapaProcesamiento, setEtapaProcesamiento] = useState("");
  const [archivosInfo, setArchivosInfo] = useState({
    peso: 0,
    registrosGenerados: 0,
    totalRegistros: 0,
    fechaArchivos: null,
    tieneCruceLog: false,
    validado: false
  });
  
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const etapasProcesamiento = [
    { id: 1, nombre: "Validación", icono: "🔍", descripcion: "Verificando integridad" },
    { id: 2, nombre: "Extracción", icono: "📁", descripcion: "Procesando archivos" },
    { id: 3, nombre: "Validación Bancaria", icono: "🏦", descripcion: "Verificando LOG" },
    { id: 4, nombre: "Procesamiento", icono: "⚡", descripcion: "Generando registros" },
    { id: 5, nombre: "Generación", icono: "📊", descripcion: "Creando Excel" },
    { id: 6, nombre: "Finalización", icono: "✅", descripcion: "Completando" }
  ];

  const getEtapaActual = () => {
    if (progreso < 15) return 1;
    if (progreso < 30) return 2;
    if (progreso < 45) return 3;
    if (progreso < 70) return 4;
    if (progreso < 90) return 5;
    return 6;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await procesarArchivoSeleccionado(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await procesarArchivoSeleccionado(e.target.files[0]);
    }
  };

  const procesarArchivoSeleccionado = async (file) => {
    setArchivo(file);
    setError("");
    setMostrarAdvertencia(false);
    setMostrarValidacion(true);
    
    setArchivosInfo({
      peso: file.size,
      registrosGenerados: 0,
      totalRegistros: 0,
      fechaArchivos: null,
      tieneCruceLog: false,
      validado: false
    });

    try {
      const formData = new FormData();
      formData.append("archivo", file);

      const response = await fetch("http://localhost:8000/info-zip/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setArchivosInfo(prev => ({
          ...prev,
          totalRegistros: data.total_archivos,
          fechaArchivos: data.fecha_archivos,
          tieneCruceLog: data.tiene_cruce_log,
          validado: true
        }));
      }
    } catch (error) {
      console.error("Error al analizar archivo:", error);
      setError("❌ Error al validar el archivo ZIP");
    } finally {
      setMostrarValidacion(false);
    }
  };

  const simularProgreso = () => {
    setProgreso(0);
    let registrosGenerados = 0;
    
    const interval = setInterval(() => {
      setProgreso(prev => {
        const incremento = prev < 30 ? 12 : prev < 60 ? 8 : prev < 80 ? 6 : 3;
        const nuevoProg = Math.min(prev + incremento, 95);
        
        const etapaActual = getEtapaActual();
        const etapa = etapasProcesamiento[etapaActual - 1];
        setEtapaProcesamiento(etapa.descripcion);
        
        const nuevosRegistros = Math.floor((nuevoProg / 95) * archivosInfo.totalRegistros);
        if (nuevosRegistros > registrosGenerados) {
          registrosGenerados = nuevosRegistros;
          setArchivosInfo(prevInfo => ({
            ...prevInfo,
            registrosGenerados: registrosGenerados
          }));
        }
        
        if (nuevoProg >= 95) {
          clearInterval(interval);
          setEtapaProcesamiento("Completando proceso...");
        }
        
        return nuevoProg;
      });
    }, 400);
    
    return interval;
  };

  const procesarArchivo = async (aceptoResponsabilidad = false) => {
    if (!archivo) {
      setError("⚠️ Por favor selecciona un archivo ZIP válido.");
      return;
    }

    setProcesando(true);
    setError("");
    setMostrarAdvertencia(false);
    setArchivosInfo(prev => ({ 
      ...prev, 
      registrosGenerados: 0
    }));

    const intervalProgreso = simularProgreso();

    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      formData.append("acepto_responsabilidad", aceptoResponsabilidad.toString());

      const response = await fetch("http://localhost:8000/procesar/", {
        method: "POST",
        body: formData,
      });

      if (response.status === 422) {
        const data = await response.json();
        if (data.requires_confirmation) {
          setDatosAdvertencia(data);
          setMostrarAdvertencia(true);
          clearInterval(intervalProgreso);
          setProcesando(false);
          setProgreso(0);
          setEtapaProcesamiento("");
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error en el servidor");
      }

      const blob = await response.blob();
      
      clearInterval(intervalProgreso);
      setProgreso(100);
      setEtapaProcesamiento("✅ Proceso completado exitosamente");
      
      const registrosFinales = parseInt(response.headers.get('X-Registros-Generados')) || archivosInfo.registrosGenerados;
      setArchivosInfo(prev => ({ 
        ...prev, 
        registrosGenerados: registrosFinales,
        totalRegistros: registrosFinales
      }));

      setTimeout(() => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "planillas_generadas.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }, 800);

    } catch (err) {
      clearInterval(intervalProgreso);
      setError(`❌ ${err.message}`);
      setEtapaProcesamiento("");
    } finally {
      setTimeout(() => {
        setProcesando(false);
        setProgreso(0);
        setEtapaProcesamiento("");
        setArchivosInfo(prev => ({ 
          ...prev, 
          registrosGenerados: 0
        }));
      }, 3000);
    }
  };

  const resetFormulario = () => {
    setArchivo(null);
    setArchivosInfo({
      peso: 0,
      registrosGenerados: 0,
      totalRegistros: 0,
      fechaArchivos: null,
      tieneCruceLog: false,
      validado: false
    });
    setError("");
    setProgreso(0);
    setEtapaProcesamiento("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3">
      <div className="max-w-6xl mx-auto">
        {/* Header Compacto */}
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h1 className="text-xl font-bold text-slate-800 mb-1 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-sm">🏢</span>
              </div>
              Procesador de Planillas
            </h1>
            <p className="text-sm text-slate-600 ml-11">
              Sistema de conversión y validación de archivos de planillas bancarias
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Panel Principal */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border"
            >
              {/* Header del Panel Compacto */}
              <div className="bg-blue-600 px-4 py-3 rounded-t-lg">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  📁 Carga de Archivos
                  {archivo && archivosInfo.validado && (
                    <span className="ml-3 text-xs bg-green-500 px-2 py-1 rounded">
                      ✓ Validado
                    </span>
                  )}
                </h2>
              </div>

              <div className="p-4">
                {/* Zona de Drop Compacta */}
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-300 ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : archivo 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-slate-300 bg-slate-50 hover:border-blue-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="text-center">
                    <div className={`text-3xl mb-2 ${
                      archivo ? 'text-green-500' : 'text-slate-400'
                    }`}>
                      {mostrarValidacion ? '🔄' : archivo ? '✅' : '📁'}
                    </div>
                    
                    <h3 className={`text-lg font-medium mb-1 ${
                      archivo ? 'text-green-700' : 'text-slate-700'
                    }`}>
                      {mostrarValidacion 
                        ? 'Validando archivo...' 
                        : archivo 
                          ? archivo.name 
                          : 'Arrastra tu archivo ZIP aquí'
                      }
                    </h3>
                    
                    {!archivo && (
                      <p className="text-sm text-slate-500">
                        O haz clic para seleccionar un archivo
                      </p>
                    )}
                    
                    {archivo && (
                      <div className="flex items-center justify-center space-x-4 mt-2">
                        <span className="text-xs text-slate-600">
                          📦 {formatFileSize(archivosInfo.peso)}
                        </span>
                        <button
                          onClick={resetFormulario}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          🗑️ Cambiar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del Archivo Compacta */}
                <AnimatePresence>
                  {archivo && archivosInfo.validado && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-4"
                    >
                      {/* Estadísticas Compactas */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                          <p className="text-xs font-medium text-blue-700">Tamaño</p>
                          <p className="text-lg font-bold text-blue-900">
                            {formatFileSize(archivosInfo.peso)}
                          </p>
                        </div>

                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200 text-center">
                          <p className="text-xs font-medium text-indigo-700">Archivos</p>
                          <p className="text-lg font-bold text-indigo-900">
                            {procesando ? archivosInfo.registrosGenerados : archivosInfo.totalRegistros}
                          </p>
                        </div>

                        <div className={`rounded-lg p-3 border text-center ${
                          archivosInfo.tieneCruceLog 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <p className={`text-xs font-medium ${
                            archivosInfo.tieneCruceLog ? 'text-green-700' : 'text-yellow-700'
                          }`}>
                            Estado
                          </p>
                          <p className={`text-sm font-bold ${
                            archivosInfo.tieneCruceLog ? 'text-green-900' : 'text-yellow-900'
                          }`}>
                            {archivosInfo.tieneCruceLog ? 'Validado' : 'Sin validar'}
                          </p>
                        </div>
                      </div>

                      {/* Estado de Validación Bancaria Compacto */}
                      {archivosInfo.fechaArchivos && (
                        <div className={`rounded-lg border p-3 ${
                          archivosInfo.tieneCruceLog 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-lg">
                                  {archivosInfo.tieneCruceLog ? '🏦' : '⚠️'}
                                </span>
                                <h4 className="font-semibold text-sm text-slate-800">
                                  Validación Bancaria
                                </h4>
                              </div>
                              
                              <p className="text-xs text-slate-700">
                                <span className="font-medium">Fecha:</span> {archivosInfo.fechaArchivos}
                              </p>
                              <p className={`text-xs font-medium ${
                                archivosInfo.tieneCruceLog ? 'text-green-700' : 'text-yellow-700'
                              }`}>
                                {archivosInfo.tieneCruceLog 
                                  ? '✅ Validado con sistema bancario LOG'
                                  : '⚠️ No validado con sistema bancario LOG'
                                }
                              </p>
                            </div>
                            
                            <div className={`px-2 py-1 rounded text-xs font-bold ${
                              archivosInfo.tieneCruceLog 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {archivosInfo.tieneCruceLog ? 'OK' : 'PENDIENTE'}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botón de Procesamiento Compacto */}
                <div className="mt-4">
                  <button
                    onClick={() => procesarArchivo(false)}
                    disabled={procesando || !archivo || !archivosInfo.validado}
                    className={`w-full py-3 px-6 rounded-lg text-white font-semibold transition-all duration-300 ${
                      procesando || !archivo || !archivosInfo.validado
                        ? "bg-slate-400 cursor-not-allowed" 
                        : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {procesando ? (
                      <div className="flex items-center justify-center space-x-3">
                        <motion.div 
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Procesando... ({archivosInfo.registrosGenerados})</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <span>🚀</span>
                        <span>Iniciar Procesamiento</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Panel Lateral Compacto */}
          <div className="lg:col-span-1 space-y-4">
            {/* Estado del Procesamiento */}
            <AnimatePresence>
              {procesando && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-lg shadow-sm border"
                >
                  <div className="bg-green-600 px-3 py-2 rounded-t-lg">
                    <h3 className="text-sm font-semibold text-white flex items-center">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        ⚙️
                      </motion.span>
                      Procesando
                    </h3>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {/* Progreso General */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-slate-700">
                          Progreso
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                          {progreso}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progreso}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* Etapa Actual */}
                    <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 mb-1">
                        Etapa Actual
                      </p>
                      <p className="text-xs text-blue-900">
                        {etapaProcesamiento}
                      </p>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-1 gap-2">
                      <div className="bg-slate-50 rounded p-2 border text-center">
                        <div className="text-xs text-slate-600">Registros</div>
                        <div className="font-bold text-slate-800">
                          {archivosInfo.registrosGenerados}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pasos del Proceso Compactos */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="bg-slate-700 px-3 py-2 rounded-t-lg">
                <h3 className="text-sm font-semibold text-white">
                  📋 Etapas del Proceso
                </h3>
              </div>
              
              <div className="p-3">
                <div className="space-y-2">
                  {etapasProcesamiento.map((etapa, index) => {
                    const etapaActual = getEtapaActual();
                    const completada = etapaActual > etapa.id;
                    const actual = etapaActual === etapa.id && procesando;
                    
                    return (
                      <div
                        key={etapa.id}
                        className={`flex items-center space-x-2 p-2 rounded transition-all ${
                          completada 
                            ? 'bg-green-50 border-l-2 border-green-500' 
                            : actual 
                              ? 'bg-blue-50 border-l-2 border-blue-500' 
                              : 'bg-slate-50 border-l-2 border-slate-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          completada 
                            ? 'bg-green-500 text-white' 
                            : actual 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-slate-300 text-slate-600'
                        }`}>
                          {completada ? '✓' : actual ? etapa.icono : etapa.id}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-xs ${
                            completada 
                              ? 'text-green-700' 
                              : actual 
                                ? 'text-blue-700' 
                                : 'text-slate-600'
                          }`}>
                            {etapa.nombre}
                          </p>
                          <p className={`text-xs ${
                            completada 
                              ? 'text-green-600' 
                              : actual 
                                ? 'text-blue-600' 
                                : 'text-slate-500'
                          }`}>
                            {etapa.descripcion}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Modal de Advertencia Compacto */}
        <AnimatePresence>
          {mostrarAdvertencia && datosAdvertencia && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-lg shadow-2xl max-w-md w-full"
              >
                <div className="bg-yellow-500 px-4 py-3 rounded-t-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">⚠️</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Advertencia</h3>
                      <p className="text-yellow-100 text-sm">Validación requerida</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800 whitespace-pre-line">
                      {datosAdvertencia.mensaje}
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setMostrarAdvertencia(false);
                        setDatosAdvertencia(null);
                      }}
                      className="flex-1 px-3 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        setMostrarAdvertencia(false);
                        procesarArchivo(true);
                      }}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mensajes de Error Compactos */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-4 right-4 max-w-sm"
            >
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800 text-sm">Error</h4>
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                  <button
                    onClick={() => setError("")}
                    className="text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notificación de Éxito Compacta */}
        <AnimatePresence>
          {progreso === 100 && procesando && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 1, -1, 0]
                }}
                transition={{ 
                  duration: 0.6,
                  repeat: 2
                }}
                className="bg-white rounded-lg shadow-2xl p-6 mx-4 max-w-sm text-center"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity
                  }}
                  className="text-4xl mb-3"
                >
                  ✅
                </motion.div>
                <h3 className="text-lg font-bold text-green-700 mb-2">
                  ¡Completado!
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  Las planillas han sido generadas exitosamente.
                </p>
                <div className="bg-green-50 rounded p-2 border border-green-200">
                  <p className="text-xs text-green-700 font-medium">
                    📊 {archivosInfo.registrosGenerados} registros procesados
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}







        
