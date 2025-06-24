import React, { useState, useRef } from 'react';

const CruceLog = () => {
  const [archivoLog, setArchivoLog] = useState(null);
  const [archivosTxt, setArchivosTxt] = useState([]);
  const [mesesReferencia, setMesesReferencia] = useState(2);
  const [procesando, setProcesando] = useState(false);
  const [validando, setValidando] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [validacion, setValidacion] = useState(null);
  const [error, setError] = useState('');
  const [progreso, setProgreso] = useState(0);
  
  const logInputRef = useRef();
  const txtInputRef = useRef();

  const manejarArchivoLog = (event) => {
    const archivo = event.target.files[0];
    if (archivo) {
      setArchivoLog(archivo);
      setValidacion(null);
      setError('');
    }
  };

  const manejarArchivosTxt = (event) => {
    const archivos = Array.from(event.target.files);
    setArchivosTxt(archivos);
    setValidacion(null);
    setError('');
  };

  const validarArchivos = async () => {
    if (!archivoLog || archivosTxt.length === 0) {
      setError('Debes seleccionar un archivo LOG y al menos un archivo TXT/ZIP');
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
        setError(errorData.detail || 'Error al validar archivos');
      }
    } catch (error) {
      setError('Error de conexión al validar archivos');
      console.error('Error:', error);
    } finally {
      setValidando(false);
    }
  };

  const procesarCruce = async () => {
    if (!archivoLog || archivosTxt.length === 0) {
      setError('Debes seleccionar un archivo LOG y al menos un archivo TXT/ZIP');
      return;
    }

    setProcesando(true);
    setError('');
    setProgreso(0);
    
    try {
      const formData = new FormData();
      formData.append('archivo_log', archivoLog);
      formData.append('meses_referencia', mesesReferencia.toString());
      
      archivosTxt.forEach(archivo => {
        formData.append('archivos_txt', archivo);
      });

      // Simular progreso
      const progresoInterval = setInterval(() => {
        setProgreso(prev => prev < 90 ? prev + 10 : prev);
      }, 500);

      const response = await fetch('http://localhost:8000/cruce-log/procesar/', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progresoInterval);
      setProgreso(100);

      if (response.ok) {
        // Extraer estadísticas de los headers
        const stats = {
          matchesEncontrados: parseInt(response.headers.get('X-Matches-Encontrados') || '0'),
          capitalActual: parseInt(response.headers.get('X-Capital-Actual') || '0'),
          capitalAnterior: parseInt(response.headers.get('X-Capital-Anterior') || '0'),
          interesActual: parseInt(response.headers.get('X-Interes-Actual') || '0'),
          interesAnterior: parseInt(response.headers.get('X-Interes-Anterior') || '0'),
          totalArchivosI: parseInt(response.headers.get('X-Total-Archivos-I') || '0'),
          errores: parseInt(response.headers.get('X-Errores') || '0')
        };
        
        setEstadisticas(stats);

        // Descargar archivo ZIP
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cruce_log_resultado_${new Date().getTime()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al procesar el cruce');
      }
    } catch (error) {
      setError('Error de conexión durante el procesamiento');
      console.error('Error:', error);
    } finally {
      setProcesando(false);
      setProgreso(0);
    }
  };

  const limpiarFormulario = () => {
    setArchivoLog(null);
    setArchivosTxt([]);
    setValidacion(null);
    setEstadisticas(null);
    setError('');
    setProgreso(0);
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Cruce LOG</h1>
        
        {/* Formulario de carga */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Cargar Archivos</h2>
          
          {/* Archivo LOG */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo LOG (.TXT)
            </label>
            <input
              ref={logInputRef}
              type="file"
              accept=".txt,.TXT"
              onChange={manejarArchivoLog}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={procesando}
            />
            {archivoLog && (
              <p className="text-sm text-green-600 mt-1">
                ✅ {archivoLog.name} ({formatearTamaño(archivoLog.size)})
              </p>
            )}
          </div>

          {/* Archivos TXT/ZIP */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivos TXT o ZIP (con archivos tipo I)
            </label>
            <input
              ref={txtInputRef}
              type="file"
              multiple
              accept=".txt,.TXT,.zip,.ZIP"
              onChange={manejarArchivosTxt}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              disabled={procesando}
            />
            {archivosTxt.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-green-600">✅ {archivosTxt.length} archivo(s) seleccionado(s):</p>
                <ul className="text-xs text-gray-600 ml-4">
                  {archivosTxt.slice(0, 5).map((archivo, index) => (
                    <li key={index}>• {archivo.name} ({formatearTamaño(archivo.size)})</li>
                  ))}
                  {archivosTxt.length > 5 && (
                    <li>• ... y {archivosTxt.length - 5} archivo(s) más</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Configuración */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meses de referencia para clasificar período
            </label>
            <select
              value={mesesReferencia}
              onChange={(e) => setMesesReferencia(parseInt(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={procesando}
            >
              <option value={1}>1 mes</option>
              <option value={2}>2 meses</option>
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              onClick={validarArchivos}
              disabled={!archivoLog || archivosTxt.length === 0 || validando || procesando}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {validando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Validando...
                </>
              ) : (
                'Validar Archivos'
              )}
            </button>

            <button
              onClick={procesarCruce}
              disabled={!archivoLog || archivosTxt.length === 0 || procesando}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {procesando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Procesando...
                </>
              ) : (
                'Procesar Cruce'
              )}
            </button>

            <button
              onClick={limpiarFormulario}
              disabled={procesando}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Barra de progreso */}
        {procesando && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Procesando...</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{progreso}% completado</p>
          </div>
        )}

        {/* Resultados de validación */}
        {validacion && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Resultado de Validación</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Validación LOG */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Archivo LOG</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Archivo:</span> {validacion.archivo_log.nombre}</p>
                  <p><span className="font-medium">Tamaño:</span> {formatearTamaño(validacion.archivo_log.tamaño)}</p>
                  <p><span className="font-medium">Líneas:</span> {validacion.archivo_log.lineas_estimadas}</p>
                  <p className={validacion.archivo_log.valido ? "text-green-600" : "text-red-600"}>
                    {validacion.archivo_log.valido ? "✅ Válido" : "❌ Inválido"}
                  </p>
                </div>
              </div>

              {/* Validación archivos TXT */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Archivos TXT/ZIP</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Total archivos:</span> {validacion.archivos_txt.total}</p>
                  <p><span className="font-medium">Archivos tipo I encontrados:</span> {validacion.archivos_txt.archivos_tipo_i}</p>
                  <p><span className="font-medium">Válidos:</span> {validacion.archivos_txt.archivos_validos.length}</p>
                  <p><span className="font-medium">Inválidos:</span> {validacion.archivos_txt.archivos_invalidos.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas de resultado */}
        {estadisticas && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Resultados del Procesamiento</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Coincidencias</h4>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.matchesEncontrados}</p>
                <p className="text-sm text-blue-600">de {estadisticas.totalArchivosI} archivos tipo I</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Capital</h4>
                <p className="text-sm text-green-600">Actual: {estadisticas.capitalActual}</p>
                <p className="text-sm text-green-600">Anterior: {estadisticas.capitalAnterior}</p>
                <p className="text-lg font-bold text-green-600">
                  Total: {estadisticas.capitalActual + estadisticas.capitalAnterior}
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">Interés</h4>
                <p className="text-sm text-purple-600">Actual: {estadisticas.interesActual}</p>
                <p className="text-sm text-purple-600">Anterior: {estadisticas.interesAnterior}</p>
                <p className="text-lg font-bold text-purple-600">
                  Total: {estadisticas.interesActual + estadisticas.interesAnterior}
                </p>
              </div>
            </div>

            {estadisticas.errores > 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700">
                  ⚠️ Se encontraron {estadisticas.errores} errores durante el procesamiento
                </p>
              </div>
            )}

            <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3">
              <p className="text-green-700">
                ✅ Procesamiento completado. El archivo ZIP se descargó automáticamente.
              </p>
            </div>
          </div>
        )}

        {/* Mensajes de error */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
            <p className="text-red-700">❌ {error}</p>
          </div>
        )}

        {/* Información de ayuda */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Instrucciones</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>1. Selecciona un archivo LOG (.TXT) que contenga los datos principales</li>
            <li>2. Selecciona uno o más archivos TXT con "_I_" en el nombre, o archivos ZIP que los contengan</li>
            <li>3. Ajusta los meses de referencia para clasificar registros como "Actual" o "Anterior"</li>
            <li>4. Haz clic en "Validar Archivos" para verificar que todo esté correcto</li>
            <li>5. Haz clic en "Procesar Cruce" para ejecutar el análisis</li>
            <li>6. El resultado se descargará automáticamente como un archivo ZIP</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CruceLog;
