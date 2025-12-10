import React, { useEffect, useState } from 'react';
import { fromArrayBuffer, fromUrl } from 'geotiff';
import simpleDem from '../utils/simpleDem.js';

import { getBBLatLon } from "../utils/geoUtils.js";

// Preset DEM files (preloaded in /geoData/)
const PRESET_DEMS = {
    sydney: {
        file: '/geoData/sydney_20km.tif',
        label: 'Sydney',
        lat: '-33.752',
        lon: '151.297',
        length: '20000'
    },
    uluru: {
        file: '/geoData/uluru_20km.tif',
        label: 'Uluru',
        lat: '-25.346',
        lon: '131.036',
        length: '20000'

    },
    mauritius: {
        file: '/geoData/mauritius_20km.tif',
        label: 'Mauritius',
        lat: '-20.253',
        lon: '57.463',
        length: '20000'
    }
};

/**
 * Test component for loading and displaying DEM data
 * Add this to your Experience component to test the loadDEM function
 */
const DEMLoader = ({ onDemLoaded, onSideMetersLoad }) => {
    // onDemLoaded is the call back to => setTerrainDem() 
    // this means on successful load from api it update the setTerrain state
    const [loading, setLoading] = useState(false);
    const [dem, setDem] = useState(null);
    const [error, setError] = useState(null);
    const [activeDem, setActiveDem] = useState('mauritius'); // Track which DEM is active


    // Input states

    const [lat, setLat] = useState('-33.752292'); // Default Sydney area
    const [lon, setLon] = useState('151.296711');
    const [sideMeters, setSideMeters] = useState('10000'); // 10km default


    // Load DEM from static file
    const loadStaticDEM = async (demKey) => {
        const preset = PRESET_DEMS[demKey];
        if (!preset) return;

        setLoading(true);
        setError(null);
        setActiveDem(demKey); // Update active DEM state
        setSideMeters(preset.length)
        try {
            // Load TIFF from static file
            const tiff = await fromUrl(preset.file);

            // Process using simpleDem
            const demResult = await simpleDem(tiff);

            // Set local state for display
            const demData = {
                tiff,
                image: await tiff.getImage(),
                width: demResult.width,
                height: demResult.height,
                bounds: {
                    // You might want to calculate these from the TIFF metadata
                    // For now, using placeholder
                    south: parseFloat(preset.lat) - 0.1,
                    north: parseFloat(preset.lat) + 0.1,
                    west: parseFloat(preset.lon) - 0.1,
                    east: parseFloat(preset.lon) + 0.1
                }
            };

            setDem(demData);
            console.log('DEM loaded successfully!', demData);

            // Call the callback to update Terrain
            if (onDemLoaded) {
                onDemLoaded(demResult);
            }
            if (onSideMetersLoad){ // this is the setter for sidemeters to scale shader elevation
                onSideMetersLoad(preset.length)

            }
            } catch (err) {
            console.error('Error loading DEM:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Load default DEM on mount
    useEffect(() => {
        loadStaticDEM('mauritius'); // default load
    }, []);

    // on button press cal api and update dem
    const fetchDEM = async () => {
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        const sideMetersNum = parseFloat(sideMeters);

        let { south, north, west, east } = getBBLatLon(latNum, lonNum, sideMetersNum)
        const url = `/getDem?south=${south}&north=${north}&west=${west}&east=${east}`;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch DEM');
            }

            // Get as ArrayBuffer for geotiff.js
            const arrayBuffer = await response.arrayBuffer();
            const tiff = await fromArrayBuffer(arrayBuffer);

            // Process using simpleDem (trims)
            const demResult = await simpleDem(tiff);

            // Set local state for display
            const demData = {
                tiff,
                image: await tiff.getImage(),
                width: demResult.width,
                height: demResult.height,
                bounds: { south, north, west, east }
            };
            setDem(demData);
            console.log('DEM loaded successfully!', demData); // Log the actual data, not the state

            // Call the callback to set external dem in terrain
            if (onDemLoaded) { // check setter exists
                onDemLoaded(demResult); // This calls setTerrainDem(demResult) in App.jsx
            }
        } catch (err) {
            console.error('Error loading DEM [react]:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // useEffect(() => {
    //     // Auto-load on mount (comment out if you want manual trigger)
    //     // testLoadDEM();
    // }, []);

    return (
        <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: 1000,
            maxWidth: '400px'
        }}>
            <h3 style={{ marginTop: 0 }}>DEM Loader</h3>

            {/* Preset DEM Buttons */}
            <div style={{
                marginBottom: '15px',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
            }}>
                {Object.entries(PRESET_DEMS).map(([key, preset]) => (
                    <button
                        key={key}
                        onClick={() => loadStaticDEM(key)}
                        disabled={loading}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid #555',
                            background: activeDem === key ? '#4CAF50' : '#333',
                            color: 'white',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '11px',
                            flex: '1',
                            minWidth: '80px',
                            opacity: loading ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!loading && activeDem !== key) {
                                e.target.style.background = '#444';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeDem !== key) {
                                e.target.style.background = '#333';
                            }
                        }}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            {/* Manual API Input (optional - can be collapsed/hidden) */}
            <details style={{ marginBottom: '15px', fontSize: '11px' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '10px', color: '#aaa' }}>
                    Manual API Load (optional)
                </summary>
                <div style={{ marginTop: '10px' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            Latitude:
                        </label>
                        <input
                            type="number"
                            value={lat}
                            onChange={(e) => setLat(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '5px',
                                borderRadius: '4px',
                                border: '1px solid #555',
                                background: '#222',
                                color: 'white'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            Longitude:
                        </label>
                        <input
                            type="number"
                            value={lon}
                            onChange={(e) => setLon(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '5px',
                                borderRadius: '4px',
                                border: '1px solid #555',
                                background: '#222',
                                color: 'white'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            Side Length (meters):
                        </label>
                        <input
                            type="number"
                            value={sideMeters}
                            onChange={(e) => setSideMeters(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '5px',
                                borderRadius: '4px',
                                border: '1px solid #555',
                                background: '#222',
                                color: 'white'
                            }}
                        />
                    </div>
                    <button
                        onClick={fetchDEM}
                        disabled={loading}
                        style={{
                            padding: '8px 16px',
                            width: '100%',
                            borderRadius: '4px',
                            border: 'none',
                            background: loading ? '#555' : '#2196F3',
                            color: 'white',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        {loading ? 'Loading...' : 'Load from API'}
                    </button>
                </div>
            </details>

            {error && (
                <div style={{ color: '#ff6b6b', marginTop: '10px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {dem && (
                <div style={{ marginTop: '10px' }}>
                    <div><strong>✓ Loaded: {PRESET_DEMS[activeDem]?.label || 'DEM'}</strong></div>
                    <div>Dimensions: {dem.width} × {dem.height}</div>
                    <div style={{ marginTop: '10px', fontSize: '10px', color: '#aaa' }}>
                        Active DEM: {activeDem}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DEMLoader;