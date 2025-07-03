import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Download, Search, Building2, Users, Phone, Mail, MapPin, Calendar, 
  FileText, ExternalLink, Copy, CheckCircle, AlertCircle, DollarSign,
  TrendingUp, Clock, Database
} from 'lucide-react';
import PlanillasViewer from './PlanillasViewer';

const AportanteDetalleModal = ({ nit, detalle, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [planillasModalOpen, setPlanillasModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [planillasInfo, setPlanillasInfo] = useState(null);
  const [loadingPlanillasInfo, setLoadingPlanillasInfo] = useState(true);

  // Cargar información de planillas al montar el componente
  useEffect(() => {
    if (nit) {
      verificarPlanillasDisponibles();
    }
  }, [nit]);

  const verificarPlanillasDisponibles = async () => {
    setLoadingPlanillasInfo(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/verificar_planillas_disponibles/${nit}`);
      if (response.ok) {
        const data = await response.json();
        setPlanillasInfo(data);
      }
    } catch (error) {
      console.error('Error verificando planillas:', error);
      setPlanillasInfo({ tiene_planillas: false, total_planillas: 0 });
    } finally {
      setLoadingPlanillasInfo(false);
    }
  };

  // Función SÚPER ROBUSTA para encontrar la columna de municipio
  const encontrarColumnaMunicipio = (row) => {
    if (!row) return '-';
    
    // Primero: buscar por nombres exactos (incluyendo posibles espacios)
    const nombresExactos = [
      'MUNICIPIO / ISLA',
      'MUNICIPIO /ISLA', 
      'MUNICIPIO/ ISLA',
      'MUNICIPIO/ISLA',
      'MUNICIPIO',
      'Municipio',
      'municipio'
    ];
    
    for (const nombre of nombresExactos) {
      if (row.hasOwnProperty(nombre) && row[nombre] != null && row[nombre] !== '') {
        return row[nombre];
      }
    }
    
    // Segundo: buscar por cualquier clave que contenga "MUNICIPIO" (case insensitive)
    for (const [key, value] of Object.entries(row)) {
      if (key && typeof key === 'string' && 
          key.toUpperCase().includes('MUNICIPIO') && 
          value != null && value !== '') {
        return value;
      }
    }
    
    // Tercero: buscar en las claves por posición (si sabemos que es una columna específica)
    const keys = Object.keys(row);
    // Basándome en tu estructura, municipio podría estar en posición 7 u 8
    for (let i = 7; i <= 8; i++) {
      if (keys[i] && row[keys[i]] != null && row[keys[i]] !== '') {
        const value = row[keys[i]];
        // Verificar si el valor parece un municipio (no es un número, código, etc.)
        if (typeof value === 'string' && 
            !value.match(/^\d+$/) && // No es solo números
            !value.match(/^[A-Z]{2,4}$/) && // No es código corto
            value.length > 2) { // Tiene más de 2 caracteres
          return value;
        }
      }
    }
    
    return '-';
  };

  // Función SÚPER ROBUSTA para encontrar la columna de departamento
  const encontrarColumnaDepartamento = (row) => {
    if (!row) return '-';
    
    // Primero: buscar por nombres exactos
    const nombresExactos = [
      'DEPARTAMENTO',
      'Departamento', 
      'departamento'
    ];
    
    for (const nombre of nombresExactos) {
      if (row.hasOwnProperty(nombre) && row[nombre] != null && row[nombre] !== '') {
        return row[nombre];
      }
    }
    
    // Segundo: buscar por cualquier clave que contenga "DEPARTAMENTO"
    for (const [key, value] of Object.entries(row)) {
      if (key && typeof key === 'string' && 
          key.toUpperCase().includes('DEPARTAMENTO') && 
          value != null && value !== '') {
        return value;
      }
    }
    
    // Tercero: buscar en posiciones conocidas (departamento suele estar antes que municipio)
    const keys = Object.keys(row);
    for (let i = 5; i <= 7; i++) {
      if (keys[i] && row[keys[i]] != null && row[keys[i]] !== '') {
        const value = row[keys[i]];
        // Verificar si parece un departamento colombiano
        if (typeof value === 'string' && 
            (value.includes('SANTANDER') || 
             value.includes('CUNDINAMARCA') || 
             value.includes('NORTE DE SANTANDER') ||
             value.includes('AMAZONAS') ||
             value.length > 5)) {
          return value;
        }
      }
    }
    
    return '-';
  };

  // Filtrar datos
  const filteredDetalle = useMemo(() => {
    if (!searchTerm) return detalle;
    return detalle.filter(row =>
      Object.values(row).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [detalle, searchTerm]);

  // Información general del primer registro
  const generalInfo = detalle[0] || {};

  // Estadísticas (búsqueda mejorada de municipios)
  const stats = {
    totalRegistros: detalle.length,
    entidadesUnicas: new Set(detalle.map(item => item['ENTIDAD APORTANTE'] || item['Nombre Aportante'] || item.nombre)).size,
    departamentos: new Set(detalle.map(item => encontrarColumnaDepartamento(item)).filter(val => val !== '-')).size,
    municipios: new Set(detalle.map(item => encontrarColumnaMunicipio(item)).filter(val => val !== '-')).size
  };

  const openPlanillasModal = (record) => {
    setSelectedRecord(record);
    setPlanillasModalOpen(true);
  };

  const closePlanillasModal = () => {
    setPlanillasModalOpen(false);
    setSelectedRecord(null);
  };

  const toggleRowExpansion = (rowIndex) => {
    setExpandedRow(expandedRow === rowIndex ? null : rowIndex);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number') return value.toLocaleString();
    return value.toString();
  };

  const formatNIT = (nit) => {
    return nit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const exportToCSV = () => {
    if (!detalle || detalle.length === 0) return;

    const headers = Object.keys(detalle[0]);
    const csvContent = [
      headers.join(','),
      ...detalle.map(row => 
        headers.map(header => 
          `"${(row[header] || '').toString().replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aportantes_nit_${nit}.csv`;
    link.click();
  };

  const formatCurrency = (value) => {
    if (!value || value === 0) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col overflow-hidden">
        {/* Header Premium */}
        <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-8">
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold">NIT: {formatNIT(nit)}</h2>
                  <button 
                    onClick={() => copyToClipboard(nit)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                    title="Copiar NIT"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-blue-200 text-lg">
                  {formatValue(generalInfo['ENTIDAD APORTANTE'] || generalInfo['Nombre Aportante'])}
                </p>
                <p className="text-blue-300 text-sm mt-1">
                  {stats.totalRegistros} {stats.totalRegistros === 1 ? 'registro' : 'registros'} • {stats.entidadesUnicas} {stats.entidadesUnicas === 1 ? 'entidad' : 'entidades'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Botón mejorado para ver planillas con información */}
              <button
                onClick={() => openPlanillasModal(generalInfo)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-200 ${
                  planillasInfo?.tiene_planillas
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                }`}
                disabled={loadingPlanillasInfo}
              >
                {loadingPlanillasInfo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verificando...
                  </>
                ) : planillasInfo?.tiene_planillas ? (
                  <>
                    <Database className="w-5 h-5" />
                    Ver Planillas ({planillasInfo.total_planillas})
                    <CheckCircle className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Sin Planillas
                    <AlertCircle className="w-4 h-4" />
                  </>
                )}
              </button>
              
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-6 py-3 bg-white bg-opacity-20 text-white rounded-xl hover:bg-opacity-30 transition-all backdrop-blur-sm font-medium"
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

          {/* Stats Bar Mejorado */}
          <div className="grid grid-cols-5 gap-6 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.totalRegistros}</div>
              <div className="text-blue-200 text-sm">Registros</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{stats.entidadesUnicas}</div>
              <div className="text-blue-200 text-sm">Entidades</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{stats.departamentos}</div>
              <div className="text-blue-200 text-sm">Departamentos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{stats.municipios}</div>
              <div className="text-blue-200 text-sm">Municipios</div>
            </div>
            <div className="text-center">
              {loadingPlanillasInfo ? (
                <div className="text-2xl font-bold text-gray-400">...</div>
              ) : (
                <div className={`text-3xl font-bold ${planillasInfo?.tiene_planillas ? 'text-green-400' : 'text-gray-400'}`}>
                  {planillasInfo?.total_planillas || 0}
                </div>
              )}
              <div className="text-blue-200 text-sm">Planillas</div>
            </div>
          </div>

          {/* Información adicional de planillas si están disponibles */}
          {planillasInfo?.tiene_planillas && (
            <div className="mt-4 p-4 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-blue-200">Datos financieros disponibles</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-200">Historial de pagos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-blue-200">Información completa</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Layout de dos paneles */}
        <div className="flex-1 flex overflow-hidden">
          {/* Panel Izquierdo - Información Resumida */}
          <div className="w-80 flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Información Principal */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Información Principal</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <label className="text-sm font-medium text-blue-700">Entidad</label>
                    <p className="text-blue-900 font-semibold mt-1">
                      {formatValue(generalInfo['ENTIDAD APORTANTE'] || generalInfo['Nombre Aportante'])}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">NIT</label>
                      <p className="text-gray-900 font-mono text-lg">{formatNIT(nit)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Sufijo</label>
                      <p className="text-gray-900 font-semibold text-lg">
                        {formatValue(generalInfo.SUFIJO || generalInfo.sufijo)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado de Planillas */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Estado de Planillas</h3>
                </div>
                {loadingPlanillasInfo ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Verificando...</p>
                  </div>
                ) : planillasInfo?.tiene_planillas ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">Planillas Disponibles</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {planillasInfo.total_planillas}
                        </div>
                        <div className="text-sm text-gray-600">Total de planillas</div>
                      </div>
                    </div>
                    <button
                      onClick={() => openPlanillasModal(generalInfo)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Ver Todas las Planillas
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Sin planillas procesadas</p>
                    <p className="text-xs text-gray-500 mt-1">
                      No se encontraron planillas en el sistema para este NIT
                    </p>
                  </div>
                )}
              </div>

              {/* Ubicación */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Ubicación</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <label className="text-sm font-medium text-green-700">Departamento</label>
                    <p className="text-green-900 font-semibold mt-1">
                      {encontrarColumnaDepartamento(generalInfo)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <label className="text-sm font-medium text-green-700">Municipio</label>
                    <p className="text-green-900 font-semibold mt-1">
                      {encontrarColumnaMunicipio(generalInfo)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Territorial ESAP</label>
                    <p className="text-gray-900">
                      {formatValue(generalInfo['TERRITORIAL ESAP'] || generalInfo.territorial)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Códigos */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Códigos</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Código Depto</label>
                    <p className="text-gray-900 font-mono text-lg">
                      {formatValue(generalInfo['CÓDIGO DIVIPOLA DEPARTAMENTO'] || generalInfo.codigoDepto)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Código Municipio</label>
                    <p className="text-gray-900 font-mono text-lg">
                      {formatValue(generalInfo['CÓDIGO DIVIPOLA MUNICIPIO / ISLA'] || generalInfo.codigoMunicipio)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho - Tabla de Registros */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header de la tabla */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    Registros Detallados
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Todos los registros asociados a este NIT
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar en registros..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-80"
                    />
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-100 px-4 py-3 rounded-xl font-medium">
                    {filteredDetalle.length} registros
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla con scroll suave */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-auto scroll-smooth">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap bg-gray-50">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap bg-gray-50">
                        NIT
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap bg-gray-50">
                        Entidad Aportante
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap bg-gray-50">
                        Departamento
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap bg-gray-50">
                        Municipio / Isla
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap bg-gray-50">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredDetalle.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                          <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay resultados</h3>
                          <p className="text-gray-600">No se encontraron registros que coincidan con tu búsqueda</p>
                        </td>
                      </tr>
                    ) : (
                      filteredDetalle.map((row, idx) => (
                        <React.Fragment key={idx}>
                          {/* Fila principal */}
                          <tr className="hover:bg-blue-50 transition-colors duration-200 group">
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              <div className="flex items-center">
                                <div className="w-1 h-6 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="font-medium">
                                  {formatValue(row.ID || row.id)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-mono">
                              {formatNIT(row.NIT || nit)}
                            </td>
                            <td className="px-6 py-4 text-gray-900">
                              <div className="max-w-48 truncate font-medium" title={formatValue(row['ENTIDAD APORTANTE'] || row['Nombre Aportante'])}>
                                {formatValue(row['ENTIDAD APORTANTE'] || row['Nombre Aportante'])}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {encontrarColumnaDepartamento(row)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {encontrarColumnaMunicipio(row)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => openPlanillasModal(row)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  planillasInfo?.tiene_planillas
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                }`}
                                disabled={!planillasInfo?.tiene_planillas}
                              >
                                {planillasInfo?.tiene_planillas ? (
                                  <>
                                    <Database className="w-4 h-4" />
                                    Ver Planillas
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-4 h-4" />
                                    Sin Planillas
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer de la tabla */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  Mostrando <span className="font-semibold text-gray-900">{filteredDetalle.length}</span> de{' '}
                  <span className="font-semibold text-gray-900">{detalle.length}</span> registros
                </div>
                {searchTerm && (
                  <div className="text-gray-600">
                    Filtrado por: <span className="font-semibold text-blue-600">"{searchTerm}"</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Planillas con el nuevo componente */}
        {planillasModalOpen && selectedRecord && (
          <PlanillasViewer
            nit={nit}
            entidadNombre={formatValue(selectedRecord['ENTIDAD APORTANTE'] || selectedRecord['Nombre Aportante'])}
            onClose={closePlanillasModal}
          />
        )}
      </div>
    </div>
  );
};

export default AportanteDetalleModal;