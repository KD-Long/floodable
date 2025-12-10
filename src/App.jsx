
import './App.css'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useState } from 'react'; // Add this import

import Experience from './components/Experience'
import DEMLoader from './components/DEMLoader'


function App() {
  const [terrainDem, setTerrainDem] = useState(null) // state down to terrain.jsx setter up to DEMLoader.jsx
  const [sideMeters, setSideMeters] = useState(20000)


  return (
    <>

      <Canvas
        // not this fixes the tone mapping (colors look better)
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping
          gl.outputEncoding = THREE.sRGBEncoding
        }}
        shadows={true}
        camera={{
          fov: 35,
          near: 0.1,
          far: 100,
          position: [-14, 12, 0]
        }}
      >
        <Experience terrainDem={terrainDem} sideMeters={sideMeters} />


      </Canvas>
      <DEMLoader onDemLoaded={setTerrainDem} onSideMetersLoad={setSideMeters} />
    </>
  )
}

export default App
