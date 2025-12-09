
import './App.css'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Experience from './components/Experience'
// import DEMTest from './components/DEMTest'


function App() {


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
          position: [-10, 6, -2]
        }}
      >
        <Experience />


      </Canvas>
    </>
  )
}

export default App
