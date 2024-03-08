import React from 'react';
import './App.css';
import MapComponent1 from './Components/Map';

function App() {
  return (
    <div className="App">
      <header style={{ display: 'flex', justifyContent: 'center' }} className="App-header">
        <h1 >OpenLayers Map</h1>
      </header>
      <MapComponent1 />
      {/* <MapComponent /> */}
    </div>
  );
}

export default App;
