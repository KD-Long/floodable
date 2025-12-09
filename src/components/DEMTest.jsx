// import React, { useEffect, useState } from 'react';
// import { loadDEM } from '../utils/loadDEM.js';

// /**
//  * Test component for loading and displaying DEM data
//  * Add this to your Experience component to test the loadDEM function
//  */
// const DEMTest = () => {
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState(null);

//   const testLoadDEM = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       // In Vite, files in public/ are served from root
//       // Make sure murray.tif is in public/geoData/ folder
//       // If not, copy it: mkdir -p public/geoData && cp geoData/murray.tif public/geoData/
//       const demResult = await loadDEM('/geoData/murray.tif', {
//         gridSize: 500,
//         targetSizeMeters: 10000,
//         noDataValue: -32768
//       });

//       setResult(demResult);
//       console.log('DEM loaded successfully!', demResult);
//     } catch (err) {
//       console.error('Error loading DEM:', err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     // Auto-load on mount (comment out if you want manual trigger)
//     // testLoadDEM();
//   }, []);

//   return (
//     <div style={{
//       position: 'absolute',
//       top: 10,
//       left: 10,
//       background: 'rgba(0, 0, 0, 0.7)',
//       color: 'white',
//       padding: '20px',
//       borderRadius: '8px',
//       fontFamily: 'monospace',
//       fontSize: '12px',
//       zIndex: 1000,
//       maxWidth: '400px'
//     }}>
//       <h3 style={{ marginTop: 0 }}>DEM Loader Test</h3>
//       <button
//         onClick={testLoadDEM}
//         disabled={loading}
//         style={{
//           padding: '10px 20px',
//           marginBottom: '10px',
//           cursor: loading ? 'not-allowed' : 'pointer'
//         }}
//       >
//         {loading ? 'Loading...' : 'Load DEM'}
//       </button>

//       {error && (
//         <div style={{ color: '#ff6b6b', marginTop: '10px' }}>
//           <strong>Error:</strong> {error}
//         </div>
//       )}

//       {result && (
//         <div style={{ marginTop: '10px' }}>
//           <div><strong>✓ Loaded successfully!</strong></div>
//           <div>Grid: {result.gridSize} × {result.gridSize}</div>
//           <div>Cell size: {result.cellSizeMeters.toFixed(2)}m</div>
//           <div>Target size: {result.targetSizeMeters}m</div>
//           <div style={{ marginTop: '10px' }}>
//             <strong>Bounds:</strong>
//             <div>Lon: {result.bounds.minLon.toFixed(6)} to {result.bounds.maxLon.toFixed(6)}</div>
//             <div>Lat: {result.bounds.minLat.toFixed(6)} to {result.bounds.maxLat.toFixed(6)}</div>
//           </div>
//           <div style={{ marginTop: '10px' }}>
//             <strong>Sample elevations:</strong>
//             <div>Center [250,250]: {result.elevationGrid[250][250]?.toFixed(2)}m</div>
//             <div>Corner [0,0]: {result.elevationGrid[0][0]?.toFixed(2)}m</div>
//             <div>Corner [499,499]: {result.elevationGrid[499][499]?.toFixed(2)}m</div>
//           </div>
//           <div style={{ marginTop: '10px', fontSize: '10px', color: '#aaa' }}>
//             Check console for full details
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DEMTest;

