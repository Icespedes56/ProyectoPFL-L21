import React, { useState, useEffect } from 'react';
import AportantesTable from '../components/AportantesTable';
import AportanteDetalleModal from '../components/AportanteDetalleModal';
import ColombiaMap from '../components/ColombiaMap';
import { Upload, FileSpreadsheet, Users, Database, Filter, MapPin, Trash2, Eye, EyeOff } from 'lucide-react';

const ControlAportantes = () => {
  // Estados principales
  const [sessionId, setSessionId] = useState(localStorage.getItem('aportantes_session_id'));
  const [nits, setNits] = useState([]);
  const [filteredNits, setFilteredNits] = useState([]);
  const [selectedNit, setSelectedNit] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [fileInfo, setFileInfo] = useState(JSON.parse(localStorage.getItem('aportantes_file_info') || 'null'));
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    departamento: '',
    municipio: '',
    nitSearch: ''
  });
  const [availableFilters, setAvailableFilters] = useState({
    departamentos: [],
    municipios: []
  });

  // Estados para el mapa
  const [showMap, setShowMap] = useState(true);
  const [aportantesData, setAportantesData] = useState([]);

  // Cargar datos al iniciar si hay una sesión guardada
  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  const loadSessionData = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      // Cargar NITs
      const response = await fetch(`http://127.0.0.1:8000/aportantes_nits/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setNits(data.nits || []);
        setFilteredNits(data.nits || []);
        
        // Cargar filtros geográficos
        await fetchGeographicFilters(sessionId);
        
        // Cargar todos los datos para el mapa
        await fetchAllDataForMap(sessionId);
      } else {
        throw new Error('Error loading NITs');
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDataForMap = async (sessionId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/aportantes_all_data/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setAportantesData(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
      setAportantesData([]);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setUploadProgress(true);
    const newFileInfo = { name: file.name, size: (file.size / 1024 / 1024).toFixed(2) };
    setFileInfo(newFileInfo);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:8000/upload_aportantes', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.session_id) {
        const newSessionId = data.session_id;
        setSessionId(newSessionId);
        
        localStorage.setItem('aportantes_session_id', newSessionId);
        localStorage.setItem('aportantes_file_info', JSON.stringify(newFileInfo));
        
        await fetchNits(newSessionId);
        await fetchGeographicFilters(newSessionId);
        await fetchAllDataForMap(newSessionId);
      } else {
        throw new Error('Error al procesar el archivo');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo. Por favor, intente nuevamente.');
      setFileInfo(null);
    } finally {
      setLoading(false);
      setUploadProgress(false);
    }
  };

  const fetchNits = async (sessionId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/aportantes_nits/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setNits(data.nits || []);
        setFilteredNits(data.nits || []);
      } else {
        throw new Error('Error fetching NITs');
      }
    } catch (error) {
      console.error('Error fetching NITs:', error);
      setNits([]);
      setFilteredNits([]);
      throw error;
    }
  };

  const fetchGeographicFilters = async (sessionId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/aportantes_filtros/${sessionId}`);
      const data = await response.json();
      setAvailableFilters({
        departamentos: data.filtros?.departamentos || [],
        municipios: data.filtros?.municipios || []
      });
    } catch (error) {
      console.error('Error fetching geographic filters:', error);
      setAvailableFilters({
        departamentos: [],
        municipios: []
      });
    }
  };

  const fetchMunicipiosByDepartamento = async (departamento) => {
    if (!sessionId || !departamento) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/aportantes_municipios/${sessionId}/${encodeURIComponent(departamento)}`);
      const data = await response.json();
      setAvailableFilters(prev => ({
        ...prev,
        municipios: data.municipios || []
      }));
    } catch (error) {
      console.error('Error fetching municipios:', error);
      setAvailableFilters(prev => ({
        ...prev,
        municipios: []
      }));
    }
  };

  const applyGeographicFilter = async () => {
    if (!sessionId) return;
    
    try {
      const params = new URLSearchParams();
      if (filters.departamento) params.append('departamento', filters.departamento);
      if (filters.municipio) params.append('municipio', filters.municipio);
      
      const response = await fetch(`http://127.0.0.1:8000/aportantes_filtrar/${sessionId}?${params}`);
      const data = await response.json();
      
      let filtered = data.nits || [];
      
      if (filters.nitSearch) {
        filtered = filtered.filter(nit => 
          nit.toString().includes(filters.nitSearch)
        );
      }
      
      setFilteredNits(filtered);
    } catch (error) {
      console.error('Error applying geographic filter:', error);
      setFilteredNits([]);
    }
  };

  const handleNitClick = async (nit) => {
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/aportantes_detalle/${sessionId}/${nit}`);
      const data = await response.json();
      setDetalle(data.detalle);
      setSelectedNit(nit);
      setModalOpen(true);
    } catch (error) {
      console.error('Error fetching NIT details:', error);
      alert('Error al cargar los detalles del NIT');
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    setSessionId(null);
    setNits([]);
    setFilteredNits([]);
    setFileInfo(null);
    setSelectedNit(null);
    setDetalle([]);
    setModalOpen(false);
    setFilters({ departamento: '', municipio: '', nitSearch: '' });
    setAvailableFilters({ departamentos: [], municipios: [] });
    setAportantesData([]);
    
    localStorage.removeItem('aportantes_session_id');
    localStorage.removeItem('aportantes_file_info');
  };

  const handleFilterChange = async (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    
    if (filterType === 'departamento') {
      newFilters.municipio = '';
      setFilters(newFilters);
      
      if (value) {
        await fetchMunicipiosByDepartamento(value);
      } else {
        setAvailableFilters(prev => ({ ...prev, municipios: [] }));
      }
    } else {
      setFilters(newFilters);
    }
  };

  const handleMapLocationClick = (locationName) => {
    // Si es un departamento válido, aplicar filtro
    if (availableFilters.departamentos.includes(locationName)) {
      handleFilterChange('departamento', locationName);
    }
  };

  // Aplicar filtros cuando cambien
  useEffect(() => {
    if (!sessionId) return;
    
    if (filters.departamento || filters.municipio) {
      applyGeographicFilter();
    } else if (nits && nits.length > 0) {
      let filtered = nits;
      if (filters.nitSearch) {
        filtered = nits.filter(nit => 
          nit.toString().includes(filters.nitSearch)
        );
      }
      setFilteredNits(filtered);
    }
  }, [filters.departamento, filters.municipio, sessionId]);

  useEffect(() => {
    if (!sessionId || !nits || nits.length === 0) return;
    
    const baseNits = (filters.departamento || filters.municipio) ? filteredNits || [] : nits;
    
    if (filters.nitSearch) {
      const filtered = baseNits.filter(nit => 
        nit.toString().includes(filters.nitSearch)
      );
      setFilteredNits(filtered);
    } else if (!filters.departamento && !filters.municipio) {
      setFilteredNits(nits);
    }
  }, [filters.nitSearch, sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header compacto */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-7 h-7" />
              <div>
                <h1 className="text-2xl font-bold">Control de Aportantes</h1>
                <p className="text-blue-100 text-sm">
                  Gestión y análisis de entidades aportantes del sector público
                </p>
              </div>
            </div>
            
            {/* Área de carga y controles */}
            <div className="flex items-center gap-4">
              {fileInfo && !loading && (
                <div className="text-right">
                  <div className="text-sm font-medium">{fileInfo.name}</div>
                  <div className="text-xs text-blue-200">{filteredNits?.length || 0} NITs cargados</div>
                </div>
              )}
              
              {/* Control del mapa */}
              {(nits?.length || 0) > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all text-sm"
                    title={showMap ? 'Ocultar mapa' : 'Mostrar mapa'}
                  >
                    {showMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showMap ? 'Ocultar' : 'Mostrar'} Mapa
                  </button>
                </div>
              )}
              
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm
                    ${loading 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-white text-blue-700 hover:bg-blue-50 cursor-pointer shadow-lg hover:shadow-xl'
                    }
                  `}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {fileInfo ? 'Cambiar Archivo' : 'Cargar Excel'}
                    </>
                  )}
                </label>
              </div>

              {fileInfo && (
                <button
                  onClick={clearSession}
                  className="flex items-center gap-1 text-blue-200 hover:text-white text-sm px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                  title="Limpiar datos y archivo"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros superiores */}
      {(nits?.length || 0) > 0 && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Departamento
                </label>
                <select
                  value={filters.departamento}
                  onChange={(e) => handleFilterChange('departamento', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Todos los departamentos</option>
                  {(availableFilters.departamentos || []).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Municipio
                </label>
                <select
                  value={filters.municipio}
                  onChange={(e) => handleFilterChange('municipio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={!filters.departamento}
                >
                  <option value="">Todos los municipios</option>
                  {(availableFilters.municipios || []).map(mun => (
                    <option key={mun} value={mun}>{mun}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border w-full text-center">
                  <Filter className="w-4 h-4 inline mr-1" />
                  <strong>{filteredNits?.length || 0}</strong> de <strong>{nits?.length || 0}</strong> NITs
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal: LAYOUT DE 2 COLUMNAS */}
      {(nits?.length || 0) > 0 && (
        <div className="container mx-auto px-6 py-6">
          <div className={`grid gap-6 h-[calc(100vh-300px)] ${showMap ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {/* Columna Izquierda: Tabla de NITs - 2/3 del espacio */}
            <div className={showMap ? "lg:col-span-2" : "col-span-1"}>
              <AportantesTable 
                nits={filteredNits} 
                onNitClick={handleNitClick} 
                loading={loading}
                compact={true}
              />
            </div>
            
            {/* Columna Derecha: Mapa FIJO y STICKY - 1/3 del espacio */}
            {showMap && (
              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <ColombiaMap 
                    aportantesData={aportantesData}
                    selectedDepartamento={filters.departamento}
                    selectedMunicipio={filters.municipio}
                    onLocationClick={handleMapLocationClick}
                    onFilterChange={handleFilterChange}
                    showStats={true}
                    isFloating={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estado inicial cuando no hay datos */}
      {(nits?.length || 0) === 0 && !loading && (
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {sessionId ? 'Cargando datos guardados...' : 'No hay datos cargados'}
            </h3>
            <p className="text-gray-600">
              {sessionId ? 'Por favor espere mientras cargamos sus datos' : 'Carga un archivo Excel para comenzar el análisis de aportantes'}
            </p>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {modalOpen && (
        <AportanteDetalleModal
          nit={selectedNit}
          detalle={detalle}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ControlAportantes;