import React, { useEffect, useState } from 'react';
import { fromArrayBuffer } from 'geotiff';
// import { loadDEM } from '../utils/loadDEM.js';
import { getBBLatLon, trimToSquareArray, arrayOneDToTwoD, applyWaterDepth } from "./../utils/geoUtils";


/**
 * Test component for loading and displaying DEM data
 * Add this to your Experience component to test the loadDEM function
 */
const DEMTest = () => {
    const [loading, setLoading] = useState(false);
    const [dem, setDem] = useState(null);
    const [error, setError] = useState(null);

    // Input states
   
    const [lat, setLat] = useState('-33.752292'); // Default Sydney area
    const [lon, setLon] = useState('151.296711');
    const [sideMeters, setSideMeters] = useState('10000'); // 20km default

    const fetchDEM = async () => {

        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        const sideMetersNum = parseFloat(sideMeters);

        let { south, north, west, east } = getBBLatLon(latNum, lonNum, sideMetersNum)
        const url = `/getDem?south=${south}&north=${north}&west=${west}&east=${east}`; // our cloud function
        setLoading(true);
        setError(null);
        try {

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch DEM');
            }
            console.log("response: ", response)
            // Get as ArrayBuffer for geotiff.js
            const arrayBuffer = await response.arrayBuffer();

            const tiff = await fromArrayBuffer(arrayBuffer);
            // ... rest of your code




            setDem(tiff);
            console.log('DEM loaded successfully [on click]!', dem);
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
            <h3 style={{ marginTop: 0 }}>DEM Loader Test</h3>

            {/* Input fields */}
            <div style={{ marginBottom: '15px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                        Latitude:
                    </label>
                    <input
                        type="number"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        // placeholder="-33.889468"
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
                        // placeholder="151.199508"
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
                        // placeholder="20000"
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
            </div>

            <button
                onClick={fetchDEM}
                disabled={loading}
                style={{
                    padding: '10px 20px',
                    marginBottom: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    width: '100%',
                    borderRadius: '4px',
                    border: 'none',
                    background: loading ? '#555' : '#4CAF50',
                    color: 'white',
                    fontWeight: 'bold'
                }}
            >
                {loading ? 'Loading...' : 'Load DEM'}
            </button>

            {error && (
                <div style={{ color: '#ff6b6b', marginTop: '10px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {dem && (
                <div style={{ marginTop: '10px' }}>
                    <div><strong>✓ Loaded successfully!</strong></div>
                    <div>Dimensions: {dem.width} × {dem.height}</div>
                    <div style={{ marginTop: '10px' }}>
                        <strong>Bounds:</strong>
                        <div>Lon: {dem.bounds.west.toFixed(6)} to {dem.bounds.east.toFixed(6)}</div>
                        <div>Lat: {dem.bounds.south.toFixed(6)} to {dem.bounds.north.toFixed(6)}</div>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '10px', color: '#aaa' }}>
                        Check console for full details
                    </div>
                </div>
            )}
        </div>
    );
};

export default DEMTest;