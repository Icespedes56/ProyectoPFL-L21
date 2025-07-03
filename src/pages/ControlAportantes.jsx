import React, { useState, useEffect, useRef } from 'react';
import AportantesTable from '../components/AportantesTable';
import AportanteDetalleModal from '../components/AportanteDetalleModal';
import ColombiaMap from '../components/ColombiaMap';
import { Upload, FileSpreadsheet, Database, Filter, MapPin, Trash2, Eye, EyeOff, ChevronDown, Search, Check, TrendingUp } from 'lucide-react';

// Componente Dropdown Profesional Compacto
const ProfessionalDropdown = ({ options, value, onChange, placeholder, disabled = false, searchable = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const filteredOptions = searchable 
    ? options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 text-left border rounded-xl transition-all duration-200 font-medium text-sm flex items-center justify-between ${
          disabled 
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
            : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 hover:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
        } ${isOpen ? 'ring-2 ring-blue-500 ring-opacity-20 border-blue-500' : ''}`}
      >
        <div className="flex items-center gap-3">
          <MapPin className={`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-blue-600'}`} />
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>{displayText}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[9999] backdrop-blur-xl">
          {searchable && (
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto py-2">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-all duration-150 flex items-center justify-between ${
                  value === option.value 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ControlAportantes = () => {
  // Estados principales
  const [sessionId, setSessionId] = useState(localStorage.getItem('aportantes_session_id'));
  const [nits, setNits] = useState([]);
  const [filteredNits, setFilteredNits] = useState([]);
  const [selectedNit, setSelectedNit] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Estado para NITs con planillas
  const [nitsWithPlanillas, setNitsWithPlanillas] = useState(new Set());

  // Cargar datos al iniciar
  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  const loadSessionData = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/aportantes_nits/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setNits(data.nits || []);
        setFilteredNits(data.nits || []);
        
        await fetchGeographicFilters(sessionId);
        await fetchAllDataForMap(sessionId);
        await fetchNitsWithPlanillas(sessionId);
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

  const fetchNitsWithPlanillas = async (sessionId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/aportantes_nits_with_planillas/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        const nitsSet = new Set();
        (data.nits_with_planillas || []).forEach(nit => {
          nitsSet.add(nit);
          nitsSet.add(nit.toString());
          nitsSet.add(parseInt(nit));
        });
        setNitsWithPlanillas(nitsSet);
      }
    } catch (error) {
      console.error('Error fetching NITs with planillas:', error);
      setNitsWithPlanillas(new Set());
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
        await fetchNitsWithPlanillas(newSessionId);
      } else {
        throw new Error('Error al procesar el archivo');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo. Por favor, intente nuevamente.');
      setFileInfo(null);
    } finally {
      setLoading(false);
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
    setNitsWithPlanillas(new Set());
    
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

  // Preparar opciones para los dropdowns
  const departamentosOptions = [
    { value: '', label: 'Todos los departamentos' },
    ...(availableFilters.departamentos || []).map(dept => ({ value: dept, label: dept }))
  ];

  const municipiosOptions = [
    { value: '', label: 'Todos los municipios' },
    ...(availableFilters.municipios || []).map(mun => ({ value: mun, label: mun }))
  ];

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
            
            <div className="flex items-center gap-4">
              {fileInfo && !loading && (
                <div className="text-right">
                  <div className="text-sm font-medium">{fileInfo.name}</div>
                  <div className="text-xs text-blue-200">{filteredNits?.length || 0} NITs cargados</div>
                </div>
              )}
              
              {(nits?.length || 0) > 0 && (
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all text-sm"
                >
                  {showMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showMap ? 'Ocultar' : 'Mostrar'} Mapa
                </button>
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
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    loading 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-white text-blue-700 hover:bg-blue-50 cursor-pointer shadow-lg hover:shadow-xl'
                  }`}
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
                >
                  <Trash2 className="w-4 h-4" />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Filtros Geográficos */}
      {(nits?.length || 0) > 0 && (
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-6 py-6">
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Filtros Geográficos</h3>
                  <p className="text-sm text-gray-600">Refina tu búsqueda por ubicación geográfica</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <div className="text-2xl font-bold text-blue-600">{filteredNits?.length || 0}</div>
                <div className="text-sm text-blue-600">de {nits?.length || 0} NITs</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </label>
                <ProfessionalDropdown
                  options={departamentosOptions}
                  value={filters.departamento}
                  onChange={(value) => handleFilterChange('departamento', value)}
                  placeholder="Selecciona un departamento"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {availableFilters.departamentos?.length || 0} departamentos disponibles
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipio
                </label>
                <ProfessionalDropdown
                  options={municipiosOptions}
                  value={filters.municipio}
                  onChange={(value) => handleFilterChange('municipio', value)}
                  placeholder="Selecciona un municipio"
                  disabled={!filters.departamento}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {!filters.departamento 
                    ? "0 municipios disponibles (selecciona un departamento primero)"
                    : `${availableFilters.municipios?.length || 0} municipios disponibles`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de estadísticas */}
      {(nits?.length || 0) > 0 && (
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="container mx-auto px-6 py-4">
            <div className="flex flex-wrap items-center gap-6">
              
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-gray-900">NITs Únicos</h4>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <span className="text-gray-600">
                  <span className="font-bold text-xl text-gray-900">{filteredNits?.length || 0}</span>
                  <span className="text-gray-500"> de {nits?.length || 0} registros</span>
                </span>

                <div className="w-px h-4 bg-gray-300"></div>

                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="font-bold text-emerald-700">
                    {filteredNits?.filter(nit => 
                      nitsWithPlanillas.has(nit) || nitsWithPlanillas.has(nit.toString())
                    ).length || 0}
                  </span>
                  <span className="text-gray-600">con planillas procesadas</span>
                </div>

                <div className="w-px h-4 bg-gray-300"></div>

                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="font-bold text-gray-700">
                    {filteredNits?.filter(nit => 
                      !nitsWithPlanillas.has(nit) && !nitsWithPlanillas.has(nit.toString())
                    ).length || 0}
                  </span>
                  <span className="text-gray-600">pendientes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {(nits?.length || 0) > 0 && (
        <div className="container mx-auto px-6 py-6">
          <div className={`grid gap-6 h-[calc(100vh-320px)] ${showMap ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
            <div className={showMap ? "lg:col-span-2" : "col-span-1"}>
              <AportantesTable 
                nits={filteredNits} 
                onNitClick={handleNitClick} 
                loading={loading}
                compact={true}
                nitsWithPlanillas={nitsWithPlanillas}
              />
            </div>
            
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

      {/* Estado inicial */}
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