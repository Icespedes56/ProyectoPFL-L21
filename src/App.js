import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  
  // Función para manejar la carga del archivo
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Función para procesar el archivo (en este caso, solo muestra el nombre del archivo)
  const processFile = () => {
    if (!file) {
      alert("Por favor, selecciona un archivo.");
      return;
    }

    alert(`Archivo cargado: ${file.name}`);
    // Aquí puedes agregar la lógica para enviar el archivo al backend y procesarlo
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Procesador de Planillas Parafiscales</h1>
        <input type="file" onChange={handleFileChange} />
        <button onClick={processFile}>Procesar archivo</button>
      </header>
    </div>
  );
}

export default App;

