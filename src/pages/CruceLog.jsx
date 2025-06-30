import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CruceLogCompacto = () => {
  const [archivoLog, setArchivoLog] = useState(null);
  const [archivosTxt, setArchivosTxt] = useState([]);
  const [mesesReferencia, setMesesReferencia] = useState(2);
  const [procesando, setProcesando] = useState(false);
  const [validando, setValidando] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [validacion, setValidacion] = useState(null);
  const [error, setError] = useState('');
  const [progreso, setProgreso] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [guardadoEnBD, setGuardadoEnBD] = useState(false);
  const [mostrarBotonGuardar, setMostrarBotonGuardar] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState(null);
  
  const logInputRef = useRef();
  const txtInputRef = useRef();

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const response = await fetch('http://localhost:8000/cruce-log/historial');
      if (response.ok) {
        const data = await response.json();
        setHistorial(data.historial || []);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const manejarArchivoLog = (event) => {
    const archivo = event.target.files[0];
    if (archivo) {
      setArchivoLog(archivo);
      setValidacion(null);
      setError('');
      setMostrarBotonGuardar(false);
      setEstadisticas(null);
    }
  };

  const manejarArchivosTxt = (event) => {
    const archivos = Array.from(event.target.files);
    setArchivosTxt(archivos);
    setValidacion(null);
    setError('');
    setMostrarBotonGuardar(false);
    setEstadisticas(null);
  };

  const validarArchivos = async () => {
    if (!archivoLog || archivosTxt.length === 0) {
      setError('🚨 Debes seleccionar un archivo LOG y al menos un archivo TXT/ZIP');
      return;
    }

    setValidando(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('archivo_log', archivoLog);
      archivosTxt.forEach(archivo => {
        formData.append('archivos_txt', archivo);
      });

      const response = await fetch('http://localhost:8000/cruce-log/validar-archivos/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const resultado = await response.json();
        setValidacion(resultado);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '❌ Error al validar archivos');
      }
    } catch (error) {
      setError('🔌 Error de conexión al validar archivos');
      console.error('Error:', error);
    } finally {
      setValidando(false);
    }
  };

  const procesarCruce = async (guardarEnBD = true) => {
    if (!archivoLog || archivosTxt.length === 0) {
      setError('🚨 Debes seleccionar un archivo LOG y al menos un archivo TXT/ZIP');
      return;
    }

    setProcesando(true);
    setError('');
    setProgreso(0);
    setMostrarBotonGuardar(false);
    setGuardadoEnBD(false);
    
    try {
      const formData = new FormData();
      formData.append('archivo_log', archivoLog);
      formData.append('meses_referencia', mesesReferencia.toString());
      formData.append('guardar_en_bd', guardarEnBD.toString());
      
      archivosTxt.forEach(archivo => {
        formData.append('archivos_txt', archivo);
      });

      const progresoInterval = setInterval(() => {
        setProgreso(prev => prev < 90 ? prev + 8 : prev);
      }, 400);

      const response = await fetch('http://localhost:8000/cruce-log/procesar/', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progresoInterval);
      setProgreso(100);

      if (response.ok) {
        const obtenerHeader = (nombre) => {
          const valor = response.headers.get(nombre);
          return valor ? parseInt(valor) || 0 : 0;
        };

        const stats = {
          matchesEncontrados: obtenerHeader('X-Matches-Encontrados'),
          capitalActual: obtenerHeader('X-Capital-Actual'),
          capitalAnterior: obtenerHeader('X-Capital-Anterior'),
          interesActual: obtenerHeader('X-Interes-Actual'),
          interesAnterior: obtenerHeader('X-Interes-Anterior'),
          totalArchivosI: obtenerHeader('X-Total-Archivos-I'),
          errores: obtenerHeader('X-Errores')
        };
        
        setEstadisticas(stats);
        setUltimoResultado({ stats, response });

        const guardadoBD = response.headers.get('X-Guardado-BD') === 'true';
        setGuardadoEnBD(guardadoBD);

        const deberaMostrarBoton = !guardadoBD && 
                                   (stats.matchesEncontrados > 0 || stats.totalArchivosI > 0) &&
                                   stats.errores <= 2;
        
        setMostrarBotonGuardar(deberaMostrarBoton);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cruce_log_resultado_${new Date().getTime()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        if (guardadoBD) {
          cargarHistorial();
        }
        
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '❌ Error al procesar el cruce');
      }
    } catch (error) {
      setError('🔌 Error de conexión durante el procesamiento');
      console.error('Error:', error);
    } finally {
      setProcesando(false);
      setTimeout(() => setProgreso(0), 2000);
    }
  };

  const guardarResultadoEnBD = async () => {
    if (!ultimoResultado) return;

    try {
      setMostrarBotonGuardar(false);
      await procesarCruce(true);
    } catch (error) {
      setError('❌ Error al guardar en base de datos');
      console.error('Error:', error);
    }
  };

  const limpiarFormulario = () => {
    setArchivoLog(null);
    setArchivosTxt([]);
    setValidacion(null);
    setEstadisticas(null);
    setError('');
    setProgreso(0);
    setMostrarBotonGuardar(false);
    setGuardadoEnBD(false);
    if (logInputRef.current) logInputRef.current.value = '';
    if (txtInputRef.current) txtInputRef.current.value = '';
  };

  const formatearTamaño = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    try {
      return new Date(fechaStr).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fechaStr;
    }
  };

  const formatearNumero = (valor) => {
    if (valor === 0) return '0';
    return new Intl.NumberFormat('es-CO').format(valor);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3">
      <div className="max-w-6xl mx-auto">
        {/* Header Compacto */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h1 className="text-xl font-bold text-slate-800 mb-1 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-sm">🔄</span>
              </div>
              Cruce LOG Bancario
            </h1>
            <p className="text-sm text-slate-600 ml-11">
              Sistema de validación y cruce de datos bancarios
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Panel Principal */}
          <div className="lg:col-span-3 space-y-4">
            {/* Formulario de carga */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="bg-blue-600 px-4 py-3 rounded-t-lg">
                <h2 className="text-lg font-semibold text-white">📁 Cargar Archivos</h2>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Archivo LOG */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🗂️ Archivo LOG (.TXT)
                  </label>
                  <div className="relative">
                    <input
                      ref={logInputRef}
                      type="file"
                      accept=".txt,.TXT"
                      onChange={manejarArchivoLog}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={procesando}
                    />
                    <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-all ${
                      archivoLog 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-300 bg-gray-50 hover:border-blue-400'
                    }`}>
                      <div className="text-2xl mb-1">
                        {archivoLog ? '✅' : '📄'}
                      </div>
                      <div className="text-sm font-medium">
                        {archivoLog ? archivoLog.name : 'Seleccionar archivo LOG'}
                      </div>
                      {archivoLog && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatearTamaño(archivoLog.size)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Archivos TXT/ZIP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📦 Archivos TXT o ZIP (con archivos tipo I)
                  </label>
                  <div className="relative">
                    <input
                      ref={txtInputRef}
                      type="file"
                      multiple
                      accept=".txt,.TXT,.zip,.ZIP"
                      onChange={manejarArchivosTxt}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={procesando}
                    />
                    <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-all ${
                      archivosTxt.length > 0 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-300 bg-gray-50 hover:border-blue-400'
                    }`}>
                      <div className="text-2xl mb-1">
                        {archivosTxt.length > 0 ? '✅' : '📁'}
                      </div>
                      <div className="text-sm font-medium">
                        {archivosTxt.length > 0 
                          ? `${archivosTxt.length} archivo(s) seleccionado(s)` 
                          : 'Seleccionar archivos TXT/ZIP'
                        }
                      </div>
                      {archivosTxt.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          {archivosTxt.slice(0, 2).map((archivo, index) => (
                            <div key={index}>• {archivo.name}</div>
                          ))}
                          {archivosTxt.length > 2 && (
                            <div>• ... y {archivosTxt.length - 2} más</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Configuración y Botones */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ⏱️ Meses de referencia
                    </label>
                    <select
                      value={mesesReferencia}
                      onChange={(e) => setMesesReferencia(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      disabled={procesando}
                    >
                      <option value={1}>1 mes</option>
                      <option value={2}>2 meses</option>
                      <option value={3}>3 meses</option>
                      <option value={6}>6 meses</option>
                      <option value={12}>12 meses</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={limpiarFormulario}
                      disabled={procesando}
                      className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      🧹 Limpiar
                    </button>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="grid md:grid-cols-3 gap-3">
                  <button
                    onClick={validarArchivos}
                    disabled={!archivoLog || archivosTxt.length === 0 || validando || procesando}
                    className="px-4 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {validando ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Validando...
                      </div>
                    ) : (
                      '🔍 Validar'
                    )}
                  </button>

                  <button
                    onClick={() => procesarCruce(false)}
                    disabled={!archivoLog || archivosTxt.length === 0 || procesando}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {procesando ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Procesando...
                      </div>
                    ) : (
                      '⚡ Procesar'
                    )}
                  </button>

                  {/* Botón de debug para debuggear */}
                  <button
                    onClick={() => setMostrarBotonGuardar(!mostrarBotonGuardar)}
                    className="px-3 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all text-sm"
                    title="Botón de prueba para ver el estado de guardar"
                  >
                    🧪 Debug
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Barra de progreso */}
            <AnimatePresence>
              {procesando && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-lg shadow-sm border p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">🔄 Procesando cruce...</h3>
                    <span className="text-lg font-bold text-blue-600">{progreso}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progreso}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Analizando archivos y generando resultados...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resultados de validación */}
            <AnimatePresence>
              {validacion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-lg shadow-sm border"
                >
                  <div className="bg-green-600 px-4 py-3 rounded-t-lg">
                    <h3 className="text-lg font-semibold text-white">✅ Resultado de Validación</h3>
                  </div>
                  
                  <div className="p-4 grid md:grid-cols-2 gap-4">
                    {/* Validación LOG */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                        📄 Archivo LOG
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Archivo:</span>
                          <span className="font-medium">{validacion.archivo_log.nombre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tamaño:</span>
                          <span className="font-medium">{formatearTamaño(validacion.archivo_log.tamaño)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Líneas:</span>
                          <span className="font-medium">{validacion.archivo_log.lineas_estimadas}</span>
                        </div>
                        <div className={`text-center py-1 rounded ${
                          validacion.archivo_log.valido 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {validacion.archivo_log.valido ? "✅ Válido" : "❌ Inválido"}
                        </div>
                      </div>
                    </div>

                    {/* Validación archivos TXT */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                        📦 Archivos TXT/ZIP
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total archivos:</span>
                          <span className="font-medium">{validacion.archivos_txt.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipo I encontrados:</span>
                          <span className="font-medium">{validacion.archivos_txt.archivos_tipo_i}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Válidos:</span>
                          <span className="font-medium text-green-600">{validacion.archivos_txt.archivos_validos.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Inválidos:</span>
                          <span className="font-medium text-red-600">{validacion.archivos_txt.archivos_invalidos.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Estadísticas de resultado */}
            <AnimatePresence>
              {estadisticas && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-lg shadow-sm border"
                >
                  <div className="bg-purple-600 px-4 py-3 rounded-t-lg">
                    <h3 className="text-lg font-semibold text-white">📊 Resultados del Procesamiento</h3>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid md:grid-cols-3 gap-3 mb-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <h4 className="font-medium text-blue-800 mb-1">🎯 Coincidencias</h4>
                        <p className="text-2xl font-bold text-blue-600">{estadisticas.matchesEncontrados}</p>
                        <p className="text-xs text-blue-600">de {estadisticas.totalArchivosI} archivos tipo I</p>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <h4 className="font-medium text-green-800 mb-1">💰 Capital</h4>
                        <p className="text-xs text-green-600">Actual: {formatearNumero(estadisticas.capitalActual)}</p>
                        <p className="text-xs text-green-600">Anterior: {formatearNumero(estadisticas.capitalAnterior)}</p>
                        <p className="text-lg font-bold text-green-600">
                          Total: {formatearNumero(estadisticas.capitalActual + estadisticas.capitalAnterior)}
                        </p>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                        <h4 className="font-medium text-purple-800 mb-1">📈 Interés</h4>
                        <p className="text-xs text-purple-600">Actual: {formatearNumero(estadisticas.interesActual)}</p>
                        <p className="text-xs text-purple-600">Anterior: {formatearNumero(estadisticas.interesAnterior)}</p>
                        <p className="text-lg font-bold text-purple-600">
                          Total: {formatearNumero(estadisticas.interesActual + estadisticas.interesAnterior)}
                        </p>
                      </div>
                    </div>

                    {/* Estado del guardado */}
                    <div className="space-y-3">
                      {guardadoEnBD && (
                        <div className="bg-green-100 border border-green-300 rounded-lg p-3 flex items-center">
                          <div className="text-green-600 text-xl mr-2">💾</div>
                          <div>
                            <p className="font-semibold text-green-800">¡Guardado en Base de Datos!</p>
                            <p className="text-sm text-green-700">Este procesamiento se ha registrado exitosamente.</p>
                          </div>
                        </div>
                      )}

                      {mostrarBotonGuardar && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-lg p-4"
                        >
                          <div className="text-center mb-3">
                            <div className="text-3xl mb-1">🎉</div>
                            <h4 className="text-lg font-bold text-yellow-800">¡Procesamiento Exitoso!</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                              El cruce se completó con {estadisticas?.matchesEncontrados || 0} coincidencias encontradas.
                            </p>
                          </div>
                          
                          <div className="bg-white rounded p-3 mb-3">
                            <p className="text-sm text-gray-700 text-center font-medium">
                              ¿Deseas guardar este resultado en la base de datos?
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setMostrarBotonGuardar(false)}
                              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-semibold text-sm"
                            >
                              ❌ No guardar
                            </button>
                            <button
                              onClick={guardarResultadoEnBD}
                              className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-sm"
                            >
                              💾 Guardar en BD
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {estadisticas.errores > 0 && (
                        <div className="bg-red-100 border border-red-300 rounded-lg p-3 flex items-center">
                          <div className="text-red-600 text-xl mr-2">⚠️</div>
                          <div>
                            <p className="font-semibold text-red-800">Errores Detectados</p>
                            <p className="text-sm text-red-700">
                              Se encontraron {estadisticas.errores} errores. Revisa el archivo de errores en el ZIP.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 flex items-center">
                        <div className="text-blue-600 text-xl mr-2">📦</div>
                        <div>
                          <p className="font-semibold text-blue-800">Archivo Generado</p>
                          <p className="text-sm text-blue-700">
                            El archivo ZIP con los resultados se descargó automáticamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mensajes de error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-300 rounded-lg p-3"
                >
                  <div className="flex items-center">
                    <div className="text-red-500 text-xl mr-2">🚨</div>
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Panel Lateral - Historial y Guía */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="bg-indigo-600 px-4 py-3 rounded-t-lg flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">📚 Historial</h3>
                <button
                  onClick={() => setMostrarHistorial(!mostrarHistorial)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  {mostrarHistorial ? '🔼' : '🔽'}
                </button>
              </div>
              
              <AnimatePresence>
                {mostrarHistorial && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 max-h-64 overflow-y-auto">
                      {historial.length > 0 ? (
                        <div className="space-y-2">
                          {historial.slice(0, 5).map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-gray-50 border border-gray-200 rounded p-2 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-800">
                                  📅 {formatearFecha(item.fecha_archivos)}
                                </span>
                                <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                                  {item.matches_encontrados} matches
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                                <div>💰 Capital: {formatearNumero(item.capital_actual + item.capital_anterior)}</div>
                                <div>📈 Interés: {formatearNumero(item.interes_actual + item.interes_anterior)}</div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatearFecha(item.fecha_procesamiento)}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <div className="text-3xl mb-2">📭</div>
                          <p className="text-gray-500">No hay cruces registrados</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Los cruces exitosos aparecerán aquí
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Panel de información y ayuda */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="bg-emerald-600 px-4 py-3 rounded-t-lg">
                <h3 className="text-lg font-semibold text-white">💡 Guía Rápida</h3>
              </div>
              
              <div className="p-4">
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold text-xs">1.</span>
                    <p className="text-xs">Selecciona un archivo LOG (.TXT) con los datos bancarios principales</p>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold text-xs">2.</span>
                    <p className="text-xs">Agrega archivos TXT con "_I_" en el nombre, o archivos ZIP</p>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold text-xs">3.</span>
                    <p className="text-xs">Configura los meses de referencia para clasificación</p>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold text-xs">4.</span>
                    <p className="text-xs">Valida los archivos antes de procesar</p>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-500 font-bold text-xs">5.</span>
                    <p className="text-xs">Procesa el cruce y revisa los resultados</p>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-500 font-bold text-xs">6.</span>
                    <p className="text-xs">Guarda en BD si el resultado es exitoso</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-1">
                    <span className="text-blue-600 text-lg mr-2">🎯</span>
                    <h4 className="font-semibold text-blue-800 text-sm">Tip Profesional</h4>
                  </div>
                  <p className="text-xs text-blue-700">
                    Siempre valida los archivos antes de procesar para detectar problemas de formato temprano.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Estadísticas rápidas */}
            {historial.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-sm border"
              >
                <div className="bg-amber-600 px-4 py-3 rounded-t-lg">
                  <h3 className="text-lg font-semibold text-white">📈 Estadísticas</h3>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-blue-50 rounded p-2">
                      <div className="text-lg font-bold text-blue-600">{historial.length}</div>
                      <div className="text-xs text-blue-600">Cruces realizados</div>
                    </div>
                    
                    <div className="bg-green-50 rounded p-2">
                      <div className="text-lg font-bold text-green-600">
                        {historial.reduce((sum, item) => sum + item.matches_encontrados, 0)}
                      </div>
                      <div className="text-xs text-green-600">Total matches</div>
                    </div>
                  </div>
                  
                  {historial.length > 0 && (
                    <div className="mt-3 p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-600 text-center">
                        Último: {formatearFecha(historial[0]?.fecha_procesamiento)}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer informativo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center text-gray-500 text-sm"
        >
          <p>🔒 Sistema seguro de procesamiento bancario • Versión 2.0 Compacta • Base de datos integrada</p>
        </motion.div>
      </div>
    </div>
  );
};

export default CruceLogCompacto;