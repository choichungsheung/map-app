import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import districts from './data/combined_districts.json';
import mapIcon from './icon/map_icon.svg';

// Custom SVG marker icon using the map_icon.svg with black outline
const customMarkerIcon = new Icon({
  iconUrl: mapIcon,
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48]
});

// Component to handle map panning
function MapController({ panTo }) {
  const map = useMap();
  React.useEffect(() => {
    if (panTo) {
      map.panTo(panTo);
    }
  }, [panTo, map]);
  return null;
}

function App() {
  const [markers, setMarkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [panToCoords, setPanToCoords] = useState(null);
  const [useTooltip, setUseTooltip] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await fetch(`https://www.map.gov.hk/gs/api/v1.0.0/locationSearch?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.slice(0, 5)); // Limit to 5 results
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const convertHK80ToWGS84 = async (x, y) => {
    try {
      const response = await fetch(`http://www.geodetic.gov.hk/transform/v2/?inSys=hkgrid&outSys=wgsgeog&e=${x}&n=${y}`);
      const data = await response.json();
      return { lat: data.wgsLat, lon: data.wgsLong };
    } catch (error) {
      console.error('Coordinate conversion error:', error);
      return null;
    }
  };

  const addMarker = async (result) => {
    const coords = await convertHK80ToWGS84(result.x, result.y);
    if (!coords) return;

    const newMarker = {
      id: Date.now(),
      nameZH: result.nameZH,
      nameEN: result.nameEN,
      districtZH: result.districtZH,
      lat: coords.lat,
      lon: coords.lon
    };
    setMarkers([...markers, newMarker]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const deleteMarker = (id) => {
    setMarkers(markers.filter(marker => marker.id !== id));
  };

  return (
    <div className="app">
      <div className="search-container">
        <div className="input-row">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a place in Hong Kong..."
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="search-btn">🔍</button>
        </div>
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, index) => (
              <div key={index} className="search-result" onClick={() => addMarker(result)}>
                <div>{result.nameZH} ({result.nameEN})</div>
                {result.addressEN && <div className="address">{result.addressEN}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="marker-list">
        <h3>
          Marked Places
          <button 
            className="toggle-btn" 
            onClick={() => setUseTooltip(!useTooltip)}
            style={{ marginLeft: '10px', fontSize: '12px', padding: '2px 6px' }}
          >
            {useTooltip ? 'Show Popups' : 'Show Tooltips'}
          </button>
        </h3>
        {markers.map(marker => (
          <div key={marker.id} className="marker-item" onClick={() => setPanToCoords([marker.lat, marker.lon])}>
            <div>
              <div>{marker.nameZH} ({marker.districtZH})</div>
              <div className="english-name">({marker.nameEN})</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); deleteMarker(marker.id); }}>×</button>
          </div>
        ))}
      </div>
      <MapContainer center={[22.3193, 114.1694]} zoom={10} style={{ height: '100vh', width: '100%' }}>
        <MapController panTo={panToCoords} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <GeoJSON
          data={districts}
          style={(feature) => {
            let fillColor, borderColor;
            switch (feature.properties.area) {
              case 'Hong Kong Island':
                fillColor = 'lightgreen';
                borderColor = 'green';
                break;
              case 'Kowloon':
                fillColor = 'lightsalmon'; // light orange
                borderColor = 'orange';
                break;
              case 'New Territories':
                fillColor = 'lightblue';
                borderColor = 'blue';
                break;
              default:
                fillColor = 'lightgray';
                borderColor = 'gray';
            }
            return {
              color: borderColor,
              weight: 1,
              opacity: 0.5, // semi-transparent borders
              fillColor: fillColor,
              fillOpacity: 0.3
            };
          }}
        />
        {markers.map(marker => (
          <Marker key={marker.id} position={[marker.lat, marker.lon]} icon={customMarkerIcon}>
            {useTooltip ? (
              <Tooltip permanent>
                <div>{marker.nameZH}</div>
              </Tooltip>
            ) : (
              <Popup>
                <div>{marker.nameZH}</div>
                <div>({marker.nameEN})</div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;
