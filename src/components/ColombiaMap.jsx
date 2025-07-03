import React, { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { MapPin, ZoomIn, ZoomOut, RotateCcw, Target, TrendingUp, Building2, Users } from 'lucide-react';

const ColombiaMapSeparatedInfo = ({ 
  aportantesData = [], 
  selectedDepartamento = '', 
  selectedMunicipio = '',
  onLocationClick,
  onFilterChange,
  showStats = true,
  isFloating = false 
}) => {
  // ZOOM POR DEFECTO CAMBIADO A 0.9x
  const [position, setPosition] = useState({ coordinates: [-74.0, 4.0], zoom: 0.9 });
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // MAPEO COMPLETO DE DEPARTAMENTOS
  const departmentNameMapping = {
    'BOGOTÁ D.C.': 'BOGOTÁ, D.C.',
    'BOGOTA D.C.': 'BOGOTÁ, D.C.',
    'BOGOTÁ': 'BOGOTÁ, D.C.',
    'BOGOTA': 'BOGOTÁ, D.C.',
    'QUINDÍO': 'QUINDÍO',
    'QUINDIO': 'QUINDÍO',
    'VICHADA': 'VICHADA',
    'GUAINÍA': 'GUAINÍA',
    'GUAINIA': 'GUAINÍA',
    'ANTIOQUIA': 'ANTIOQUIA',
    'BOYACÁ': 'BOYACÁ',
    'BOYACA': 'BOYACÁ',
    'NORTE DE SANTANDER': 'NORTE DE SANTANDER',
    'ARCHIPIÉLAGO DE SAN ANDRÉS PROVIDENCIA Y SANTA CATALINA': 'ARCHIPIÉLAGO DE SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA',
    'SAN ANDRÉS Y PROVIDENCIA': 'ARCHIPIÉLAGO DE SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA',
    'SAN ANDRES Y PROVIDENCIA': 'ARCHIPIÉLAGO DE SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA',
  };

  // Función de normalización
  const normalizeDepartmentName = (name) => {
    if (!name) return '';
    
    let cleanName = name.toString().toUpperCase().trim();
    
    if (departmentNameMapping[cleanName]) {
      return departmentNameMapping[cleanName];
    }
    
    const withoutAccents = cleanName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (withoutAccents === 'QUINDIO') return 'QUINDÍO';
    if (withoutAccents === 'GUAINIA') return 'GUAINÍA';
    if (withoutAccents === 'BOYACA') return 'BOYACÁ';
    if (withoutAccents === 'BOGOTA D.C.' || withoutAccents === 'BOGOTA DC' || withoutAccents === 'BOGOTA') return 'BOGOTÁ, D.C.';
    
    return cleanName;
  };

  // FUNCIONES ROBUSTAS PARA ENCONTRAR MUNICIPIOS
  const encontrarColumnaMunicipio = (row) => {
    if (!row) return null;
    
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
        return row[nombre].toString().trim();
      }
    }
    
    for (const [key, value] of Object.entries(row)) {
      if (key && typeof key === 'string' && 
          key.toUpperCase().includes('MUNICIPIO') && 
          value != null && value !== '') {
        return value.toString().trim();
      }
    }
    
    return null;
  };

  const encontrarColumnaDepartamento = (row) => {
    if (!row) return null;
    
    const nombresExactos = [
      'DEPARTAMENTO',
      'Departamento', 
      'departamento'
    ];
    
    for (const nombre of nombresExactos) {
      if (row.hasOwnProperty(nombre) && row[nombre] != null && row[nombre] !== '') {
        return row[nombre].toString().trim();
      }
    }
    
    for (const [key, value] of Object.entries(row)) {
      if (key && typeof key === 'string' && 
          key.toUpperCase().includes('DEPARTAMENTO') && 
          value != null && value !== '') {
        return value.toString().trim();
      }
    }
    
    return null;
  };

  // Configuración de zoom - FACTORES REDUCIDOS PARA 0.9x BASE
  const departmentConfig = {
    'ANTIOQUIA': { coordinates: [-75.6, 6.2], zoom: 3.2 },
    'CUNDINAMARCA': { coordinates: [-74.1, 4.6], zoom: 3.2 },
    'VALLE DEL CAUCA': { coordinates: [-76.5, 3.4], zoom: 3.2 },
    'SANTANDER': { coordinates: [-73.1, 7.1], zoom: 3.2 },
    'ATLÁNTICO': { coordinates: [-74.8, 10.9], zoom: 4.5 },
    'BOGOTÁ, D.C.': { coordinates: [-74.08, 4.6], zoom: 4.5 },
    'BOLÍVAR': { coordinates: [-75.0, 9.0], zoom: 3.2 },
    'BOYACÁ': { coordinates: [-73.0, 5.5], zoom: 3.2 },
    'CALDAS': { coordinates: [-75.5, 5.3], zoom: 3.6 },
    'CAQUETÁ': { coordinates: [-75.0, 1.5], zoom: 3.2 },
    'CASANARE': { coordinates: [-72.0, 5.5], zoom: 3.2 },
    'CAUCA': { coordinates: [-76.5, 2.5], zoom: 3.2 },
    'CESAR': { coordinates: [-73.5, 9.5], zoom: 3.2 },
    'CHOCÓ': { coordinates: [-77.0, 6.0], zoom: 3.2 },
    'CÓRDOBA': { coordinates: [-75.5, 8.5], zoom: 3.2 },
    'HUILA': { coordinates: [-75.5, 2.5], zoom: 3.2 },
    'LA GUAJIRA': { coordinates: [-72.5, 11.5], zoom: 3.2 },
    'MAGDALENA': { coordinates: [-74.5, 10.5], zoom: 3.2 },
    'META': { coordinates: [-73.5, 3.5], zoom: 3.2 },
    'NARIÑO': { coordinates: [-77.5, 1.5], zoom: 3.2 },
    'NORTE DE SANTANDER': { coordinates: [-72.5, 8.0], zoom: 3.2 },
    'PUTUMAYO': { coordinates: [-76.5, 0.5], zoom: 3.2 },
    'QUINDÍO': { coordinates: [-75.7, 4.5], zoom: 4.5 },
    'RISARALDA': { coordinates: [-75.9, 5.0], zoom: 3.6 },
    'SUCRE': { coordinates: [-75.0, 9.0], zoom: 3.6 },
    'TOLIMA': { coordinates: [-75.0, 4.0], zoom: 3.2 },
    'ARAUCA': { coordinates: [-71.0, 7.0], zoom: 3.2 },
    'AMAZONAS': { coordinates: [-70.0, -2.0], zoom: 2.3 },
    'GUAINÍA': { coordinates: [-68.0, 2.5], zoom: 3.2 },
    'GUAVIARE': { coordinates: [-72.5, 2.0], zoom: 3.2 },
    'VAUPÉS': { coordinates: [-70.5, 1.0], zoom: 3.2 },
    'VICHADA': { coordinates: [-69.5, 5.0], zoom: 2.7 },
    'ARCHIPIÉLAGO DE SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA': { coordinates: [-81.7, 12.5], zoom: 4.5 }
  };

  // Cargar datos del mapa
  useEffect(() => {
    const loadMapData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/colombia-departamentos.json');
        
        if (response.ok) {
          const geoData = await response.json();
          
          if (geoData && geoData.features && Array.isArray(geoData.features) && geoData.features.length > 0) {
            setMapData(geoData);
          } else {
            throw new Error('Datos del mapa inválidos');
          }
        } else {
          throw new Error(`Error HTTP: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Error cargando mapa:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, []);

  // Zoom automático cuando se selecciona departamento
  useEffect(() => {
    if (selectedDepartamento) {
      const normalizedSelected = normalizeDepartmentName(selectedDepartamento);
      const config = departmentConfig[normalizedSelected];
      if (config) {
        setPosition({
          coordinates: config.coordinates,
          zoom: config.zoom
        });
      }
    } else {
      // VISTA POR DEFECTO CON 0.9x
      setPosition({
        coordinates: [-74.0, 4.0],
        zoom: 0.9
      });
    }
  }, [selectedDepartamento]);

  // ESTADÍSTICAS CORREGIDAS
  const geoStats = useMemo(() => {
    console.log('🔍 [MAPA] Calculando estadísticas con', aportantesData?.length || 0, 'registros');
    
    if (!aportantesData || aportantesData.length === 0) {
      return {};
    }

    const departamentos = {};

    aportantesData.forEach((item, index) => {
      const dept = encontrarColumnaDepartamento(item);
      const mun = encontrarColumnaMunicipio(item);
      const nit = item.NIT || item.nit || item['No. Identificación Aportante'] || 
                  item['Número NIT'] || item.identificacion;

      if (dept) {
        const normalizedDept = normalizeDepartmentName(dept);
        
        if (!departamentos[normalizedDept]) {
          departamentos[normalizedDept] = { 
            count: 0, 
            nits: new Set(), 
            municipios: new Set(),
            originalName: dept
          };
        }
        
        departamentos[normalizedDept].count++;
        
        if (nit) {
          departamentos[normalizedDept].nits.add(nit.toString().trim());
        }
        
        if (mun) {
          departamentos[normalizedDept].municipios.add(mun.toUpperCase().trim());
        }
      }
    });

    // Calcular estadísticas finales
    Object.keys(departamentos).forEach(key => {
      departamentos[key].nitsUnicos = departamentos[key].nits.size;
      departamentos[key].municipiosUnicos = departamentos[key].municipios.size;
    });

    console.log('🔍 [MAPA] Departamentos procesados:', Object.keys(departamentos).sort());
    return departamentos;
  }, [aportantesData]);

  const handleZoomIn = () => {
    if (position.zoom >= 6) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.3 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 0.7) return; // Límite reducido para 0.9x base
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.3 }));
  };

  const handleResetView = () => {
    // RESET A 0.9x
    setPosition({ coordinates: [-74.0, 4.0], zoom: 0.9 });
    if (onFilterChange) {
      onFilterChange('departamento', '');
      onFilterChange('municipio', '');
    }
  };

  const handleMapClick = (geography) => {
    const properties = geography.properties;
    const locationName = properties.DPTO_CNMBR || properties.name;
    
    if (onLocationClick && locationName) {
      onLocationClick(locationName);
    }
  };

  // Colores profesionales
  const getDepartmentColor = (feature) => {
    const properties = feature.properties;
    const mapName = properties.DPTO_CNMBR || properties.name || '';
    const normalizedMapName = normalizeDepartmentName(mapName);
    
    const normalizedSelected = normalizeDepartmentName(selectedDepartamento);
    if (normalizedSelected && normalizedMapName === normalizedSelected) {
      return '#DC2626';
    }
    
    if (geoStats[normalizedMapName]) {
      const nitsCount = geoStats[normalizedMapName].nitsUnicos;
      
      if (nitsCount >= 100) return '#0F172A';
      if (nitsCount >= 50) return '#1E293B';
      if (nitsCount >= 20) return '#334155';
      if (nitsCount >= 10) return '#475569';
      if (nitsCount >= 5) return '#64748B';
      return '#94A3B8';
    }
    
    return '#F1F5F9';
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="w-full h-[380px] flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-slate-200 shadow-lg">
          <div className="text-center">
            <div className="relative mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            </div>
            <p className="text-slate-800 text-lg font-bold mb-2">Cargando Mapa de Colombia</p>
            <p className="text-slate-600 text-sm">Preparando visualización territorial...</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 shadow-lg">
          <div className="animate-pulse">
            <div className="h-3 bg-slate-300 rounded w-1/4 mb-3"></div>
            <div className="h-4 bg-slate-300 rounded w-1/2 mb-3"></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-12 bg-slate-300 rounded"></div>
              <div className="h-12 bg-slate-300 rounded"></div>
              <div className="h-12 bg-slate-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mapData || !mapData.features || mapData.features.length === 0) {
    return (
      <div className="space-y-3">
        <div className="w-full h-[380px] flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 rounded-xl border border-red-200 shadow-lg">
          <div className="text-center p-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <p className="text-red-800 text-lg font-bold mb-2">Error al cargar el mapa</p>
            <p className="text-red-600 mb-4 text-sm">{error || 'Datos territoriales no disponibles'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Reintentar Carga
            </button>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-4">
          <div className="text-center">
            <p className="font-bold text-sm">Error en la carga de datos territoriales</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* MAPA COMPLETAMENTE SOLO - ALTURA REDUCIDA - ESCALA 0.9x */}
      <div className="w-full h-[380px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 4050, // Reducido de 4500 a 4050 para efecto 0.9x
            center: [-74, 4]
          }}
          width={1200}
          height={800}
          className="w-full h-full"
        >
          <ZoomableGroup zoom={position.zoom} center={position.coordinates}>
            <Geographies geography={mapData}>
              {({ geographies }) => {
                return geographies.map((geo, index) => {
                  const isSelected = selectedDepartamento && 
                    normalizeDepartmentName(geo.properties.DPTO_CNMBR || geo.properties.name) === 
                    normalizeDepartmentName(selectedDepartamento);
                  
                  return (
                    <Geography
                      key={geo.rsmKey || index}
                      geography={geo}
                      onClick={() => handleMapClick(geo)}
                      onMouseEnter={() => setHoveredLocation(geo)}
                      onMouseLeave={() => setHoveredLocation(null)}
                      style={{
                        default: {
                          fill: getDepartmentColor(geo),
                          stroke: '#FFFFFF',
                          strokeWidth: isSelected ? 3 : 1.5,
                          outline: 'none',
                          transition: 'all 0.3s ease-in-out',
                          filter: isSelected 
                            ? 'drop-shadow(0 0 20px rgba(220, 38, 38, 0.7)) brightness(1.1)' 
                            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        },
                        hover: {
                          fill: '#F59E0B',
                          stroke: '#FFFFFF',
                          strokeWidth: 2.5,
                          outline: 'none',
                          cursor: 'pointer',
                          filter: 'brightness(1.15) drop-shadow(0 6px 25px rgba(245, 158, 11, 0.5))',
                          transform: 'scale(1.03)',
                        },
                        pressed: {
                          fill: '#D97706',
                          stroke: '#FFFFFF',
                          strokeWidth: 3,
                          outline: 'none',
                          transform: 'scale(1.01)',
                        },
                      }}
                    />
                  );
                });
              }}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* CONTROLES DE ZOOM - MUY COMPACTOS */}
      <div className="flex justify-center">
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-md">
          <button
            onClick={handleZoomOut}
            disabled={position.zoom <= 0.7}
            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-all disabled:opacity-50"
            title="Alejar vista"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          
          <button
            onClick={handleResetView}
            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-all"
            title="Vista completa"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          
          <button
            onClick={handleZoomIn}
            disabled={position.zoom >= 6}
            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-all disabled:opacity-50"
            title="Acercar vista"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          
          <div className="flex items-center px-2 text-slate-600 text-xs border-l border-slate-200 ml-1">
            {position.zoom.toFixed(1)}x
          </div>
        </div>
      </div>

      {/* BANNER DE INFORMACIÓN - MUY COMPACTO */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white rounded-xl shadow-lg">
        <div className="p-2.5">
          {selectedDepartamento ? (
            /* Vista de departamento seleccionado */
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center">
                  <Target className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{selectedDepartamento}</div>
                  <div className="text-slate-300 text-xs">Seleccionado</div>
                </div>
                
                {(() => {
                  const normalizedSelected = normalizeDepartmentName(selectedDepartamento);
                  const deptData = geoStats[normalizedSelected];
                  
                  if (deptData) {
                    return (
                      <div className="flex gap-2 ml-2">
                        <div className="bg-blue-500/20 rounded-lg px-2 py-1 border border-blue-400/30">
                          <div className="text-blue-200 font-bold text-xs">{deptData.nitsUnicos}</div>
                          <div className="text-blue-300 text-xs">NITs</div>
                        </div>
                        <div className="bg-emerald-500/20 rounded-lg px-2 py-1 border border-emerald-400/30">
                          <div className="text-emerald-200 font-bold text-xs">{deptData.municipiosUnicos}</div>
                          <div className="text-emerald-300 text-xs">Municipios</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              
              <button
                onClick={handleResetView}
                className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-all"
              >
                ← Nacional
              </button>
            </div>
          ) : (
            /* Vista nacional */
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">República de Colombia</div>
                  <div className="text-slate-300 text-xs">Vista Nacional - Escala 0.9x</div>
                </div>

                {hoveredLocation && (
                  <div className="flex items-center gap-1 pl-2 border-l border-slate-600">
                    <div className="w-4 h-4 bg-amber-500 rounded flex items-center justify-center">
                      <MapPin className="w-2 h-2 text-white" />
                    </div>
                    <div className="text-white text-xs truncate max-w-[100px]">
                      {hoveredLocation.properties.DPTO_CNMBR || hoveredLocation.properties.name}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <div className="text-center">
                  <div className="text-white font-bold text-xs">{Object.keys(geoStats).length}</div>
                  <div className="text-slate-300 text-xs">Deptos</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-xs">
                    {Object.values(geoStats).reduce((sum, dept) => sum + dept.nitsUnicos, 0).toLocaleString()}
                  </div>
                  <div className="text-slate-300 text-xs">NITs</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-xs">
                    {Object.values(geoStats).reduce((sum, dept) => sum + dept.municipiosUnicos, 0)}
                  </div>
                  <div className="text-slate-300 text-xs">Municipios</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TOP DEPARTAMENTOS Y LEYENDA - TODO COMPACTO */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200">
        <div className="p-2.5">
          {!selectedDepartamento ? (
            /* Top departamentos cuando no hay selección */
            <div className="space-y-2">
              <h3 className="text-slate-800 font-bold text-sm">Top Departamentos por NITs</h3>
              
              <div className="grid grid-cols-1 gap-1.5">
                {Object.entries(geoStats)
                  .sort(([,a], [,b]) => b.nitsUnicos - a.nitsUnicos)
                  .slice(0, 6)
                  .map(([dept, data], index) => (
                    <div 
                      key={dept}
                      className="flex items-center bg-slate-50 hover:bg-slate-100 rounded-lg p-2 cursor-pointer transition-all border border-slate-200"
                      onClick={() => onLocationClick && onLocationClick(dept)}
                    >
                      <div className="w-5 h-5 bg-blue-500 rounded text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 mx-2 min-w-0">
                        <p className="font-medium text-slate-800 text-xs truncate" title={dept}>
                          {dept}
                        </p>
                        <p className="text-xs text-slate-600">{data.municipiosUnicos} municipios</p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-blue-600 text-sm">{data.nitsUnicos}</p>
                        <p className="text-xs text-slate-500">NITs</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* Información del departamento seleccionado */
            <div className="text-center py-2">
              <p className="text-slate-600 text-sm">
                Información de <span className="font-bold text-slate-800">{selectedDepartamento}</span>
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Clic en "← Nacional" para volver
              </p>
            </div>
          )}
          
          {/* LEYENDA COMPACTA */}
          <div className="border-t border-slate-200 pt-2 mt-2">
            <h4 className="text-xs font-bold text-slate-700 mb-1">Leyenda</h4>
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-900 rounded flex-shrink-0"></div>
                <span className="text-slate-700">100+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-600 rounded flex-shrink-0"></div>
                <span className="text-slate-700">20-99</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded flex-shrink-0"></div>
                <span className="text-slate-700">5-19</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-600 rounded flex-shrink-0"></div>
                <span className="text-slate-700">Seleccionado</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-xs">💡 Clic en depto</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColombiaMapSeparatedInfo;

