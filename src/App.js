import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Tooltip, useMap, Polyline } from 'react-leaflet';
import { divIcon } from 'leaflet';
import proj4 from 'proj4';
import 'leaflet/dist/leaflet.css';
import './App.css';
import districts from './data/combined_districts.json';
import mapIcon from './icon/map_icon.svg';
import hospitals from './data/hospital.json';

// Local Storage utility functions
const setLocalStorage = (name, value) => {
  try {
    localStorage.setItem(name, JSON.stringify(value));
    console.log('Local storage set:', name, 'value:', value.length);
  } catch (error) {
    console.error('Error setting local storage:', error);
  }
};

const getLocalStorage = (name) => {
  try {
    const value = localStorage.getItem(name);
    if (value) {
      const parsedValue = JSON.parse(value);
      console.log('Local storage retrieved:', name, 'value:', parsedValue.length);
      return parsedValue;
    }
    console.log('Local storage not found:', name);
    return null;
  } catch (error) {
    console.error('Error getting local storage:', error);
    return null;
  }
};

const deleteLocalStorage = (name) => {
  try {
    localStorage.removeItem(name);
    console.log('Local storage deleted:', name);
  } catch (error) {
    console.error('Error deleting local storage:', error);
  }
};

// Generic function to search artificial data files
const searchArtificialData = (artificialData, query) => {
  return artificialData.filter(item => 
    item.nameZH.toLowerCase().includes(query)
  ).map(item => ({
    nameZH: item.nameZH,
    nameEN: item.nameEN,
    x: item.x,
    y: item.y,
    addressEN: `Key: ${item.key || 'Unknown'}`
  }));
};

// fill color for different marker types
const typeToColor = {
  0: '#BB271A',
  1: '#de00aaff',
  2: '#1a73e8ff',
  3: '#0f9d58ff',
  4: '#f4b400ff',
};

// Custom SVG marker icon 
const customMarkerIcon = new divIcon({
  className: 'map-div-icon',
  html: `
  <span class="map-div-icon-text"></span>
  <svg xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 -960 960 960" width="100%" fill="#BB271A" stroke="#3e3e3eff" stroke-width="30px">
  <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 400Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Z"/></svg>
  `,
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48],
});

// Define coordinate systems for HK80 to WGS84 conversion
proj4.defs('EPSG:2326', '+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.1785555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

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

// Component for markers with custom spiderfication logic
function MarkersWithSpiderfication({ markers, useTooltip, typeToColor }) {
  const map = useMap();
  const [spiderfiedClusters, setSpiderfiedClusters] = useState(new Set());
  
  // Create dynamic marker icon based on type
  const createMarkerIcon = (type) => {
    const color = typeToColor[type] || typeToColor[0];
    return new divIcon({
      className: 'map-div-icon',
      html: `
      <span class="map-div-icon-text"></span>
      <svg xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 -960 960 960" width="100%" fill="${color}" stroke="#3e3e3eff" stroke-width="30px">
      <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 400Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Z"/></svg>
      `,
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -48],
    });
  };
  
  // Group markers by coordinates (for clustering)
  const markerGroups = markers.reduce((groups, marker) => {
    const key = `${marker.lat.toFixed(6)},${marker.lon.toFixed(6)}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(marker);
    return groups;
  }, {});
  
  // Handle cluster click to spiderfy
  const handleClusterClick = (lat, lon) => {
    const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
    setSpiderfiedClusters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };
  
  return (
    <>
      {Object.entries(markerGroups).map(([coordKey, group]) => {
        const [lat, lon] = coordKey.split(',').map(Number);
        const isSpiderfied = spiderfiedClusters.has(coordKey);
        
        if (group.length === 1) {
          // Single marker - no spiderfication needed
          const marker = group[0];
          return (
            <Marker 
              key={marker.id} 
              position={[lat, lon]} 
              icon={createMarkerIcon(marker.type)}
            >
              {useTooltip ? (
                <Tooltip permanent direction='top' offset={[0,-30]}>
                  <div>{marker.nameZH}</div>
                  <div className="tooltip-description">{marker.description}</div>
                </Tooltip>
              ) : (
                <Popup>
                  <div>{marker.nameZH}</div>
                  <div>({marker.nameEN})</div>
                </Popup>
              )}
            </Marker>
          );
          } else {
            // Multiple markers at same coordinates - implement spiderfication
            if (isSpiderfied) {
              // Spiderfied state - spread markers out
              const angleStep = (2 * Math.PI) / group.length;
              const spiderRadius = 0.0005; // Distance to spread markers
              
              return (
                <React.Fragment key={coordKey}>
                  {group.map((marker, index) => {
                    const angle = index * angleStep;
                    const spiderLat = lat + Math.sin(angle) * spiderRadius;
                    const spiderLon = lon + Math.cos(angle) * spiderRadius;
                    
                    return (
                      <Marker 
                        key={marker.id} 
                        position={[spiderLat, spiderLon]} 
                        icon={createMarkerIcon(marker.type)}
                      >
                        {useTooltip ? (
                          <Tooltip permanent direction='top' offset={[0,-30]}>
                            <div>{marker.nameZH}</div>
                            <div className="tooltip-description">{marker.description}</div>
                          </Tooltip>
                        ) : (
                          <Popup>
                            <div>{marker.nameZH}</div>
                            <div>({marker.nameEN})</div>
                          </Popup>
                        )}
                      </Marker>
                    );
                  })}
                  {/* Spider legs connecting to center */}
                  {group.map((marker, index) => {
                    const angle = index * angleStep;
                    const spiderLat = lat + Math.sin(angle) * spiderRadius;
                    const spiderLon = lon + Math.cos(angle) * spiderRadius;
                    
                    return (
                      <React.Fragment key={`leg-${marker.id}`}>
                        {/* Invisible larger clickable area */}
                        <Polyline
                          positions={[[lat, lon], [spiderLat, spiderLon]]}
                          color="transparent"
                          weight={40} // Much larger clickable area
                          opacity={0}
                          className="spider-leg-click-area"
                          eventHandlers={{
                            click: () => handleClusterClick(lat, lon)
                          }}
                        />
                        {/* Visible spider leg */}
                        <Polyline
                          positions={[[lat, lon], [spiderLat, spiderLon]]}
                          color="#222"
                          weight={1.5}
                          opacity={0.5}
                          className="spider-leg"
                          eventHandlers={{
                            click: () => handleClusterClick(lat, lon)
                          }}
                        />
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
          } else {
          // Clustered state - show single marker with marker names and counts
          const markerCounts = group.reduce((counts, marker) => {
            counts[marker.nameZH] = (counts[marker.nameZH] || 0) + 1;
            return counts;
          }, {});
          
          const tooltipText = Object.entries(markerCounts)
            .map(([name, count]) => count > 1 ? `${name} x${count}` : name)
            .join('\n');

          return (
            <Marker 
              key={coordKey} 
              position={[lat, lon]} 
              icon={customMarkerIcon}
              eventHandlers={{
                click: () => handleClusterClick(lat, lon)
              }}
            >
              <Popup>
                <div>
                  <strong>{group.length} markers at this location</strong>
                  <div><strong>Markers:</strong> {tooltipText}</div>
                  <div>Click to spread markers</div>
                </div>
              </Popup>
              {useTooltip ? (
                <Tooltip permanent>
                  <pre style={{margin:0}}>{tooltipText}</pre>
                </Tooltip>
              ) : null}
            </Marker>
          );
          }
        }
      })}
    </>
  );
}

function App() {
  const [markers, setMarkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [panToCoords, setPanToCoords] = useState(null);
  const [useTooltip, setUseTooltip] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isMarkerListHidden, setIsMarkerListHidden] = useState(false);
  const [editingMarkerId, setEditingMarkerId] = useState(null);
  const [editingMarkerData, setEditingMarkerData] = useState({ nameZH: '', description: '' });
  const [editingMode, setEditingMode] = useState(null); // 'color' or 'name'
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Flag to track initial load

  // Load markers from local storage on component mount
  useEffect(() => {
    console.log('App component mounted, checking for saved markers...');
    const savedMarkers = getLocalStorage('mapMarkers');
    console.log('Retrieved from local storage:', savedMarkers);
    console.log('Type of savedMarkers:', typeof savedMarkers);
    console.log('Is array:', Array.isArray(savedMarkers));
    if (savedMarkers && Array.isArray(savedMarkers)) {
      console.log('Setting markers from local storage:', savedMarkers);
      console.log('Number of markers loaded:', savedMarkers.length);
      setMarkers(savedMarkers);
    } else {
      console.log('No valid markers found in local storage, starting with empty array');
      console.log('savedMarkers value:', savedMarkers);
    }
    // Set initial load flag to false after loading
    setIsInitialLoad(false);
  }, []); // Empty dependency array - only run once on mount

  // Update local storage when markers change (but not during initial load)
  useEffect(() => {
    if (!isInitialLoad) {
      console.log('Markers changed, saving to local storage:', markers);
      console.log('Markers length:', markers.length);
      console.log('First marker (if exists):', markers[0]);
      setLocalStorage('mapMarkers', markers);
    } else {
      console.log('Skipping save during initial load');
    }
  }, [markers, isInitialLoad]);

  // Handle click outside to close dropdown and save changes
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any marker item
      const markerItems = document.querySelectorAll('.marker-item');
      let clickedInside = false;
      
      markerItems.forEach(item => {
        if (item.contains(event.target)) {
          clickedInside = true;
        }
      });

      // If clicked outside marker items and editing is active, save changes and close
      if (!clickedInside && editingMarkerId !== null && editingMode === 'name') {
        // Save changes before closing (only for name/description editing)
        const marker = markers.find(m => m.id === editingMarkerId);
        if (marker) {
          updateMarker(editingMarkerId, editingMarkerData);
        }
        setEditingMarkerId(null);
        setEditingMode(null);
      } else if (!clickedInside && editingMarkerId !== null && editingMode === 'color') {
        // For color editing, just close without saving any data
        setEditingMarkerId(null);
        setEditingMode(null);
      }
    };

    // Add event listener when editing is active
    if (editingMarkerId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingMarkerId, editingMarkerData, markers]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setHasSearched(true);
    
    const query = searchQuery.trim().toLowerCase();
    
    // 1. Search artificial data files (generic function)
    const artificialMatches = searchArtificialData(hospitals, query);
    
    try {
      const response = await fetch(`https://www.map.gov.hk/gs/api/v1.0.0/locationSearch?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        // Handle 400, 500 and other error status codes
        setSearchResults(artificialMatches);
        return;
      }
      const data = await response.json();
      
      // 2. Combine artificial matches (priority) with API results
      const combinedResults = [...artificialMatches, ...data];
      
      // 3. Remove duplicates based on name (case insensitive)
      const seen = new Set();
      const uniqueResults = combinedResults.filter(result => {
        const key = (result.nameEN || result.nameZH || '').toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      
      setSearchResults(uniqueResults.slice(0, 5)); // Limit to 5 results
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(artificialMatches);
    }
  };

  const convertHK80ToWGS84 = (x, y) => {
    try {
      // Convert HK80 coordinates (EPSG:2326) to WGS84 (EPSG:4326)
      const [lon, lat] = proj4('EPSG:2326', 'EPSG:4326', [x, y]);
      return { lat, lon };
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
      lon: coords.lon,
      type: 0, // Default type
      description: '' // Default empty description
    };
    setMarkers([...markers, newMarker]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const deleteMarker = (id) => {
    setMarkers(markers.filter(marker => marker.id !== id));
  };

  const updateMarkerType = (id, newType) => {
    setMarkers(markers.map(marker => 
      marker.id === id ? { ...marker, type: newType } : marker
    ));
  };

  const updateMarker = (id, newData) => {
    setMarkers(markers.map(marker => 
      marker.id === id ? { ...marker, nameZH: newData.nameZH, description: newData.description } : marker
    ));
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
          <button onClick={handleSearch} className="search-btn">
            <i className="bi bi-search"></i>
          </button>
        </div>
        {searchQuery.trim() && searchResults.length > 0 ? (
          <div className="search-results">
            {searchResults.map((result, index) => (
              <div key={index} className="search-result" onClick={() => addMarker(result)}>
                <div>{result.nameZH} ({result.nameEN})</div>
                {result.addressEN && <div className="address">{result.addressEN}</div>}
              </div>
            ))}
          </div>
        ) : hasSearched && searchQuery.trim() && (
          <div className="search-results">
            <div className="no-results">No search result</div>
          </div>
        )}
      </div>
      {!isMarkerListHidden && (
        <div className="marker-list">
          
          <div className="marker-list-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
            Marked Places ({markers.length})
            <button 
              className="toggle-btn" 
              onClick={() => setUseTooltip(!useTooltip)}
              style={{marginLeft: '10px', 
                      fontSize: '12px',
                      padding: '2px 6px',
                      border: 'none',
                      color: useTooltip ? '#e7e7e7ff' : '#a4a4a4ff',
                      background: useTooltip ? '#a4a4a4ff' : '#e7e7e7ff',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'}}
            >
              <span className="material-symbols-outlined">
              tooltip_2
              </span>
            </button>
            <button 
              className="hide-btn" 
              onClick={() => setIsMarkerListHidden(true)}
              style={{marginLeft: 'auto',
                      fontSize: '12px', 
                      padding: '2px 6px',
                      border: 'none',
                      background:'none',
                      cursor: 'pointer',
                      fontSize: '25px'
                    }}
            >
              ×
            </button>
          </div>
          {markers.map(marker => (
            <div key={marker.id} className="marker-item" onClick={() => setPanToCoords([marker.lat, marker.lon])}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' ,width: '100%'}}>
                <div
                  className="marker-type-icon-container"
                  style={{ 
                    
                    minWidth: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
              
                  }}>
                    <svg 
                      className="marker-type-icon"
                      style={{ 
                        
                        cursor: 'pointer',
                  
                      }}
                      xmlns="http://www.w3.org/2000/svg" 
                      height="30px" 
                      viewBox="0 -960 960 960" 
                      width="30px" 
                      fill={typeToColor[marker.type]}
                      stroke="#490000ff" 
                      strokeWidth="30px"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editingMarkerId === marker.id) {
                          setEditingMarkerId(null);
                          setEditingMode(null);
                        } else {
                          setEditingMarkerId(marker.id);
                          setEditingMode('color');
                        }
                      }}
                    ><path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 400Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Z"/>
                    </svg>
                </div>
                <div style={{ flex: 1 }}>
                  {editingMarkerId === marker.id && editingMode === 'name' ? (
                    <div>
                      <input
                        type="text"
                        value={editingMarkerData.nameZH}
                        onChange={(e) => setEditingMarkerData({ ...editingMarkerData, nameZH: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '2px 5px',
                          border: '1px solid #ccc',
                          borderRadius: '3px',
                          fontSize: '14px',
                          marginBottom: '5px'
                        }}
                        autoFocus
                      />
                      <textarea
                        value={editingMarkerData.description}
                        onChange={(e) => setEditingMarkerData({ ...editingMarkerData, description: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '2px 5px',
                          border: '1px solid #ccc',
                          borderRadius: '3px',
                          fontSize: '14px',
                          minHeight: '40px',
                          resize: 'vertical'
                        }}
                        placeholder="Enter description..."
                      />
                    </div>
                  ) : (
                    <div>
                      <div>{marker.nameZH}</div>
                      <div className="description">{marker.description}</div>
                    </div>
                  )}
                </div>
                <button 
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingMarkerData({ nameZH: marker.nameZH, description: marker.description });
                    setEditingMarkerId(marker.id);
                    setEditingMode('name');
                  }}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#666',
                    padding: '5px'
                  }}
                >
                  <i className="bi bi-pencil-square"></i>
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteMarker(marker.id); }}>×</button>
              </div>
              {editingMarkerId === marker.id && editingMode === 'color' && (
                <div className="color-selection-dropdown">
                  {Object.entries(typeToColor).map(([type, color]) => (
                    <svg 
                    className="marker-type-icon"
                    style={{                      
                      cursor: 'pointer',
                    }}
                    xmlns="http://www.w3.org/2000/svg" 
                    height="24px" 
                    viewBox="0 -960 960 960" 
                    width="24px" 
                    fill={color}
                    stroke="#490000ff" 
                    strokeWidth="30px"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateMarkerType(marker.id, parseInt(type));
                        setEditingMarkerId(null);
                        setEditingMode(null);
                      }}
                    ><path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 400Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Z"/>
                    </svg>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {isMarkerListHidden && (
        <div 
          className="marker-list-corner"
          onClick={() => setIsMarkerListHidden(false)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '3px',
            cursor: 'pointer',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '40px',
            minHeight: '40px'
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{markers.length}</span>
        </div>
      )}
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
        <MarkersWithSpiderfication 
          markers={markers} 
          useTooltip={useTooltip} 
          typeToColor={typeToColor} 
        />
      </MapContainer>
      
      {/* Clear Local Storage Button */}
      <button 
        className="clear-storage-btn"
        onClick={() => {
          deleteLocalStorage('mapMarkers');
          setMarkers([]);
        }}
        
        title="Clear saved markers"
      >
        <i className="bi bi-trash3"></i>
      </button>
    </div>
  );
}

export default App;
