
import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, TrendingUp, ArrowUpDown, FileCheck, FileX } from 'lucide-react';

const AportantesTable = ({ nits, onNitClick, loading, compact = false, nitsWithPlanillas = new Set() }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [sortOrder, setSortOrder] = useState('asc');

  // Filtrar y ordenar NITs
  const filteredAndSortedNits = useMemo(() => {
    let filtered = nits.filter(nit => 
      nit.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Ordenar
    filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.toString().localeCompare(b.toString(), undefined, { numeric: true });
      } else {
        return b.toString().localeCompare(a.toString(), undefined, { numeric: true });
      }
    });

    return filtered;
  }, [nits, searchTerm, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedNits.length / itemsPerPage);
  const currentNits = filteredAndSortedNits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const formatNIT = (nit) => {
    return nit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Debug: mostrar en consola qué NITs tienen planillas
  console.log('NITs con planillas:', Array.from(nitsWithPlanillas));
  console.log('Todos los NITs:', nits);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header de la tabla */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              NITs Únicos
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredAndSortedNits.length} de {nits.length} registros
            </p>
          </div>

          {/* Buscador */}
          <div className="relative max-w-md w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar NIT..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Controles de filtro */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Mostrando {currentNits.length} resultados
              </span>
            </div>

            {/* Leyenda de colores */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Con planillas procesadas</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <span className="text-gray-600">Sin planillas procesadas</span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleSort}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIT
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Formato
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : currentNits.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No se encontraron resultados</p>
                      <p className="text-sm">Intenta ajustar tu búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentNits.map((nit) => {
                  // Verificar si el NIT tiene planillas
                  const hasPlans = nitsWithPlanillas.has(nit) || nitsWithPlanillas.has(nit.toString());
                  
                  return (
                    <tr
                      key={nit}
                      onClick={() => onNitClick(nit)}
                      className={`cursor-pointer transition-all duration-150 group ${
                        hasPlans 
                          ? 'hover:bg-green-50 bg-green-25' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {hasPlans ? (
                            <div className="w-3 h-3 bg-green-500 rounded-full" title="Tiene planillas procesadas"></div>
                          ) : (
                            <div className="w-3 h-3 bg-gray-300 rounded-full" title="Sin planillas procesadas"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                            hasPlans ? 'bg-green-500' : 'bg-blue-500'
                          }`}></div>
                          <div>
                            <div className={`text-sm font-medium font-mono ${
                              hasPlans ? 'text-green-900' : 'text-gray-900'
                            }`}>
                              {formatNIT(nit)}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {nit}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          hasPlans 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {nit.toString().length} dígitos
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNitClick(nit);
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
                            hasPlans
                              ? 'text-green-600 hover:text-green-800 hover:bg-green-100'
                              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              
              {/* Números de página */}
              <div className="flex space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNumber = Math.max(1, currentPage - 2) + i;
                  if (pageNumber > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-8 h-8 text-sm rounded-md transition-colors ${
                        pageNumber === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AportantesTable;