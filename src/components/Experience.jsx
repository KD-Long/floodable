import React, { useRef } from 'react'
import { extend, useFrame } from '@react-three/fiber';
import { Perf } from 'r3f-perf'

import { shaderMaterial, useTexture, OrbitControls, Environment, Icosahedron } from '@react-three/drei';

import { useControls } from 'leva'
import * as THREE from 'three'

import vertexShader from '../shaders/earth/vertex.glsl'
import fragmentShader from '../shaders/earth/fragment.glsl'

const Experience = () => {

    const sphereRef = useRef()

    const MyShaderMaterial = shaderMaterial({
        uTime: 0,
    },
        vertexShader,
        fragmentShader
    )
    //this exent allows it to be used a a component below
    // Note: When using "extend" which register custom components with the JSX reconciler, 
    // use lowercase names for those components, regardless of how they are initially defined.
    extend({ MyShaderMaterial: MyShaderMaterial })

    useFrame((state, delta) => {

        const elapsedTime = state.clock.elapsedTime

        // sphereRef.current.rotation.x = - elapsedTime * 0.1
        sphereRef.current.rotation.y = elapsedTime * 0.5

        // update utime
        // sphereRef.current.material.uniforms.uTime.value = elapsedTime

        // update color shader with color picker from useControls
        // sphereRef.current.material.uniforms.uColor.value= new THREE.Color(holoColor)

        // state.camera.lookAt(0, 0, 0);
    })

    return (<>
        <OrbitControls makeDefault enableDamping />
        {/* Sets background */}
        {/* <color args={['#1d1f2a']} attach='background' /> */}
        <Environment
            // background lighting env map
            // preset="city"
            background={true} // this uses the HDR as background as well as env map for lighting
            backgroundBlurriness={0.5}
            files="spruit_sunrise.hdr"
        />

        {/* Directional Light */}
        <directionalLight
            color="#ffffff"
            intensity={2}
            position={[6.25, 3, 4]}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.1}
            shadow-camera-far={30}
            shadow-camera-top={8}
            shadow-camera-right={8}
            shadow-camera-bottom={-8}
            shadow-camera-left={-8}
        />


        {/* place holder for mesh with shader material */}
        <mesh
            ref={sphereRef}
            position={[0, 0, 0]}
        >
            {/* <sphereGeometry args={[2, 64, 64]} /> */}
            {/* <meshBasicMaterial color={'#1ffff0'} args={[{ wireframe: false }]} /> */}
            {/* <myShaderMaterial transparent side={THREE.DoubleSide} /> */}
        </mesh>

        <mesh
            position={[0, 0, 0]}
        >
            <icosahedronGeometry args={[2, 5]} />
            <meshPhysicalMaterial />
            {/* <meshStandardMaterial color={'red'} /> */}

        </mesh>

    </>
    )
}

export default Experience