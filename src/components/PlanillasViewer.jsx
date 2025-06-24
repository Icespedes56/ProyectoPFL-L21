import React, { useState, useEffect, useMemo } from 'react';
import { X, Filter, Download, Calendar, FileText, DollarSign, Search, ChevronDown, Users, Building2, AlertCircle, Loader } from 'lucide-react';

const PlanillasViewer = ({ nit, entidadNombre, onClose }) => {
  const [planillasData, setPlanillasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTipoPlanilla, setSelectedTipoPlanilla] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' o 'list'
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);

  // Tipos de planillas según especificación
  const tiposPlanilla = {
    'E': 'Empleados',
    'A': 'Novedad de Ingreso', 
    'M': 'Mora',
    'N': 'Correcciones',
    'J': 'Sentencias Judiciales',
    'K': 'Estudiantes',
    'Y': 'Independientes en Empresas'
  };

  // Lista de operadores/bancos
  const operadores = {
    1: 'Banco de Bogotá',
    2: 'Banco Popular',
    6: 'Banco Itaú',
    7: 'Bancolombia',
    9: 'Banco Citibank Colombia',
    12: 'Banco GNB Sudameris',
    13: 'BBVA',
    19: 'Scotiabank - Red Multibanca Colpatria S. A.',
    23: 'Banco de Occidente',
    32: 'Banco Caja Social',
    40: 'Banco Agrario',
    51: 'Banco Davivienda S.A.',
    52: 'Banco AV Villas',
    53: 'Banco W S. A.',
    58: 'Banco Credifinanciera S. A.',
    59: 'Bancamía',
    60: 'Banco Pichincha S. A.',
    61: 'Bancoomeva',
    62: 'Banco Falabella S. A.',
    63: 'Banco Finandina S. A.',
    65: 'Banco Santander de Negocios',
    66: 'Banco Cooperativo Coopcentral',
    67: 'Mibanco S. A.',
    69: 'Banco Serfinanza',
    73: 'Banco Unión',
    82: 'Soi',
    83: 'Mi Planilla',
    84: 'Aportes en Línea',
    86: 'Asopagos',
    88: 'Simple',
    89: 'Arus'
  };

  const meses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const mesesCompletos = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Generar años desde 1992 hasta 2025
  const años = Array.from({ length: 34 }, (_, i) => 2025 - i);

  // Cargar datos de planillas
  useEffect(() => {
    const cargarPlanillas = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Por ahora, usar datos de demostración directamente
        // En el futuro se habilitará la consulta a la API real:
        // const response = await fetch(`http://localhost:8000/api/planillas?nit=${nit}`);
        // const data = await response.json();
        
        console.log('Cargando datos de demostración para NIT:', nit);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simular carga
        
        const datosDemo = generarDatosDemostracion();
        setPlanillasData(datosDemo);
        
      } catch (err) {
        setError('Error al cargar las planillas: ' + err.message);
        console.error('Error cargando planillas:', err);
      } finally {
        setLoading(false);
      }
    };

    // Función auxiliar para datos de demostración
    const generarDatosDemostracion = () => {
      // Los datos reales vendrían del procesamiento de planillas (backend)
      // Estos incluirían capital, interés y código operador del archivo Tipo I
      
      const datosDemo = [];
      const tiposDisponibles = Object.keys(tiposPlanilla);
      const operadoresDisponibles = Object.keys(operadores);
      
      for (let año = 2023; año <= 2024; año++) {
        for (let mes = 1; mes <= 12; mes++) {
          if (Math.random() > 0.3) {
            const tipoRandom = tiposDisponibles[Math.floor(Math.random() * tiposDisponibles.length)];
            const operadorRandom = operadoresDisponibles[Math.floor(Math.random() * operadoresDisponibles.length)];
            const capital = Math.floor(Math.random() * 5000000) + 500000;
            const interes = Math.floor(Math.random() * 100000);
            
            datosDemo.push({
              año,
              mes,
              tipoPlanilla: tipoRandom,
              nombreAportante: entidadNombre,
              periodosPago: `${año}${mes.toString().padStart(2, '0')}`,
              fechaPago: `${año}-${mes.toString().padStart(2, '0')}-15`,
              totalEmpleados: Math.floor(Math.random() * 100) + 10,
              totalAfiliados: Math.floor(Math.random() * 90) + 10,
              ibc: Math.floor(Math.random() * 50000000) + 10000000,
              capital: capital,
              interes: interes,
              valorTotal: capital + interes,
              codigoOperador: parseInt(operadorRandom),
              nombreOperador: operadores[operadorRandom],
              archivo: `planilla_${año}_${mes}_${nit}_${tipoRandom}.txt`,
              estado: 'Procesado'
            });
          }
        }
      }
      
      return datosDemo;
    };

    if (nit) {
      cargarPlanillas();
    }
  }, [nit]);

  // Filtrar datos
  const datosFiltrados = useMemo(() => {
    let datos = [...planillasData];
    
    if (selectedTipoPlanilla !== 'todas') {
      datos = datos.filter(item => item.tipoPlanilla === selectedTipoPlanilla);
    }
    
    if (searchTerm) {
      datos = datos.filter(item =>
        item.tipoPlanilla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.archivo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return datos;
  }, [planillasData, selectedTipoPlanilla, searchTerm]);

  // Crear matriz para vista de grilla año/mes
  const crearMatrizPlanillas = () => {
    const matriz = {};
    
    años.forEach(año => {
      matriz[año] = {};
      for (let mes = 1; mes <= 12; mes++) {
        const planillas = datosFiltrados.filter(p => p.año === año && p.mes === mes);
        matriz[año][mes] = planillas.length > 0 ? planillas : null;
      }
    });
    
    return matriz;
  };

  const matrizPlanillas = crearMatrizPlanillas();

  // Obtener tipos de planilla únicos
  const tiposDisponibles = [...new Set(planillasData.map(item => item.tipoPlanilla))];

  // Función para obtener el tipo de planilla más frecuente
  const obtenerTipoMasFrecuente = (datos) => {
    const conteo = {};
    datos.forEach(item => {
      conteo[item.tipoPlanilla] = (conteo[item.tipoPlanilla] || 0) + 1;
    });
    const tipoMasFrecuente = Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b);
    return `${tipoMasFrecuente} (${tiposPlanilla[tipoMasFrecuente]})`;
  };

  // Estadísticas
  const estadisticas = useMemo(() => {
    const datos = datosFiltrados;
    return {
      totalPlanillas: datos.length,
      totalEmpleados: datos.reduce((sum, item) => sum + item.totalEmpleados, 0),
      totalValores: datos.reduce((sum, item) => sum + item.valorTotal, 0),
      promedioEmpleados: datos.length > 0 ? Math.round(datos.reduce((sum, item) => sum + item.totalEmpleados, 0) / datos.length) : 0,
      tiposMasComun: datos.length > 0 ? obtenerTipoMasFrecuente(datos) : 'N/A'
    };
  }, [datosFiltrados]);

  // Función para abrir detalle de valor
  const abrirDetalleValor = (planilla) => {
    setDetalleSeleccionado(planilla);
    setDetalleModalOpen(true);
  };

  const cerrarDetalleValor = () => {
    setDetalleModalOpen(false);
    setDetalleSeleccionado(null);
  };

  const formatearValor = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const formatearNIT = (nit) => {
    return nit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const exportarCSV = () => {
    const headers = ['Año', 'Mes', 'Tipo', 'Descripción', 'Empleados', 'Valor Total', 'Capital', 'Interés', 'Operador', 'Archivo'];
    const csvContent = [
      headers.join(','),
      ...datosFiltrados.map(item => [
        item.año,
        mesesCompletos[item.mes - 1],
        item.tipoPlanilla,
        tiposPlanilla[item.tipoPlanilla],
        item.totalEmpleados,
        item.valorTotal,
        item.capital,
        item.interes,
        item.nombreOperador,
        item.archivo
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `planillas_${nit}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-[60]">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-96 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Cargando planillas...</p>
            <p className="text-gray-400 text-sm mt-2">Consultando datos del NIT {formatearNIT(nit)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-[60]">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar planillas</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-[60]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white p-6">
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">Módulo de Planillas</h2>
                <p className="text-indigo-200 text-lg">NIT: {formatearNIT(nit)}</p>
                <p className="text-indigo-300 text-sm">{entidadNombre}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={exportarCSV}
                disabled={datosFiltrados.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-white bg-opacity-20 text-white rounded-xl hover:bg-opacity-30 transition-all backdrop-blur-sm font-medium disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Exportar
              </button>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white hover:bg-opacity-20 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Controles y filtros */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Selector de vista */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('matrix')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'matrix'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Vista Matriz
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Vista Lista
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                />
              </div>

              {/* Filtro por tipo de planilla */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  <Filter className="w-4 h-4" />
                  Tipo Planilla
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setSelectedTipoPlanilla('todas');
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          selectedTipoPlanilla === 'todas' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        Todos los tipos
                      </button>
                      {tiposDisponibles.map(tipo => (
                        <button
                          key={tipo}
                          onClick={() => {
                            setSelectedTipoPlanilla(tipo);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded text-sm ${
                            selectedTipoPlanilla === tipo ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="font-semibold">{tipo}</span> - {tiposPlanilla[tipo]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estadísticas actualizadas */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-xs font-medium">Total Registros</p>
                  <p className="text-2xl font-bold text-blue-900">{estadisticas.totalPlanillas}</p>
                </div>
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-xs font-medium">Total Empleados</p>
                  <p className="text-2xl font-bold text-green-900">{estadisticas.totalEmpleados.toLocaleString()}</p>
                </div>
                <Users className="w-6 h-6 text-green-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-xs font-medium">Valor Total</p>
                  <p className="text-xl font-bold text-purple-900">{formatearValor(estadisticas.totalValores)}</p>
                </div>
                <DollarSign className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-xs font-medium">Tipo Más Común</p>
                  <p className="text-lg font-bold text-orange-900">{estadisticas.tiposMasComun}</p>
                </div>
                <Building2 className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto p-6">
            {viewMode === 'matrix' ? (
              /* Vista Matriz Año/Mes */
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Vista Cronológica por Año y Mes
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Distribución de planillas desde 1992 hasta 2025
                  </p>
                </div>
                
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                          Año
                        </th>
                        {meses.map((mes, index) => (
                          <th key={index} className="px-3 py-3 text-center font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200 min-w-[80px]">
                            {mes}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {años.map(año => (
                        <tr key={año} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                            {año}
                          </td>
                          {Array.from({length: 12}, (_, mesIndex) => {
                            const mes = mesIndex + 1;
                            const planillas = matrizPlanillas[año][mes];
                            return (
                              <td key={mesIndex} className="px-3 py-3 text-center border-r border-gray-200">
                                {planillas ? (
                                  <div className="space-y-1">
                                    {planillas.map((planilla, idx) => (
                                      <div
                                        key={idx}
                                        className={`px-2 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all hover:scale-105 bg-blue-100 text-blue-800 hover:bg-blue-200`}
                                        title={`Tipo: ${planilla.tipoPlanilla} - ${tiposPlanilla[planilla.tipoPlanilla]}\nEmpleados: ${planilla.totalEmpleados}\nValor: ${formatearValor(planilla.valorTotal)}\nOperador: ${planilla.nombreOperador}`}
                                        onClick={() => abrirDetalleValor(planilla)}
                                      >
                                        {formatearValor(planilla.valorTotal).replace('$', '').replace(/\./g, '')}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-300 text-xs">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Vista Lista */
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Lista Detallada de Planillas
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Información completa de cada planilla procesada
                  </p>
                </div>
                
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Período</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Tipo</th>
                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Empleados</th>
                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Valor Total</th>
                        <th className="px-6 py-4 text-center font-semibold text-gray-700">Operador</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Archivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {datosFiltrados
                        .sort((a, b) => b.año - a.año || b.mes - a.mes)
                        .map((planilla, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-900 font-medium">
                            {mesesCompletos[planilla.mes - 1]} {planilla.año}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {planilla.tipoPlanilla}
                              </span>
                              <span className="text-sm text-gray-600">{tiposPlanilla[planilla.tipoPlanilla]}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-900 font-semibold text-right">
                            {planilla.totalEmpleados.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-gray-900 font-semibold text-right">
                            <button
                              onClick={() => abrirDetalleValor(planilla)}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                            >
                              {formatearValor(planilla.valorTotal)}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900">{planilla.codigoOperador}</div>
                              <div className="text-xs text-gray-600 truncate max-w-32" title={planilla.nombreOperador}>
                                {planilla.nombreOperador}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-900 text-sm font-mono">
                            {planilla.archivo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {datosFiltrados.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay planillas</h3>
                    <p className="text-gray-600">No se encontraron planillas para los filtros seleccionados</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Detalle de Valor */}
        {detalleModalOpen && detalleSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-[70]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header del modal */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Detalle del Valor</h3>
                    <p className="text-blue-200 text-sm">
                      {mesesCompletos[detalleSeleccionado.mes - 1]} {detalleSeleccionado.año} - Tipo {detalleSeleccionado.tipoPlanilla}
                    </p>
                  </div>
                  <button
                    onClick={cerrarDetalleValor}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="p-6 space-y-6">
                {/* Valor Total */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatearValor(detalleSeleccionado.valorTotal)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {tiposPlanilla[detalleSeleccionado.tipoPlanilla]} - {detalleSeleccionado.totalEmpleados} empleados
                  </div>
                </div>

                {/* Desglose Capital e Interés */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <div className="text-green-600 text-sm font-medium mb-1">Capital</div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatearValor(detalleSeleccionado.capital)}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {((detalleSeleccionado.capital / detalleSeleccionado.valorTotal) * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                    <div className="text-orange-600 text-sm font-medium mb-1">Interés</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {formatearValor(detalleSeleccionado.interes)}
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      {((detalleSeleccionado.interes / detalleSeleccionado.valorTotal) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Información del Operador */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {detalleSeleccionado.codigoOperador}
                    </div>
                    <div>
                      <div className="text-blue-600 text-sm font-medium">Operador</div>
                      <div className="font-semibold text-blue-900">
                        {detalleSeleccionado.nombreOperador}
                      </div>
                      <div className="text-xs text-blue-600">
                        Código: {detalleSeleccionado.codigoOperador}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Archivo origen:</span>
                    <span className="font-mono text-gray-900">{detalleSeleccionado.archivo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Período de pago:</span>
                    <span className="font-semibold text-gray-900">{detalleSeleccionado.periodosPago}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fecha de pago:</span>
                    <span className="text-gray-900">{detalleSeleccionado.fechaPago}</span>
                  </div>
                </div>
              </div>

              {/* Footer del modal */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end">
                <button
                  onClick={cerrarDetalleValor}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanillasViewer;