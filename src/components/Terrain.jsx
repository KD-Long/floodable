import React, { useEffect, useMemo, useRef, useState } from 'react'
import CustomShaderMaterial from 'three-custom-shader-material'
import { extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three'

import vertexShader from '../shaders/terrain/vertex.glsl'
import fragmentShader from '../shaders/terrain/fragment.glsl'


// Note dem load logic handled in DEMLoader 
// geo logic from utils

const Terrain = ({

    uElevationScale,
    waterLevel,
    uSideLength,
    uFloodSpeed,

    isFlooding,
    resetFlooding,

    colorWaterDeep,
    colorWaterSurface,
    colorSand,
    colorGrass,
    colorSnow,
    colorRock,

    externalDem // this is a prop dem value that may be passed on button load

}) => {
    const csmRef = useRef();
    const csmDepthRef = useRef();
    const waterMeshRef = useRef();

    // this state gets updated by DemLoader.jsx (setter passed up)
    const [dem, setDem] = useState(null); //object: {elevation,width,height}



    // defining here so we dont need to duplicate for material + depth material
    // note when leva changes this updates the props which causes the component to remount
    // hence updating the shader (unlike uTime)
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uFloodTime: { value: 0 },
        // uPositionFrequency: { value: uPositionFrequency },
        // uStrength: { value: uStrength },
        // uWarpFrequency: { value: uWarpFrequency },
        // uWarpStrength: { value: uWarpStrength },
        uColorWaterDeep: { value: new THREE.Color(colorWaterDeep) },
        uColorWaterSurface: { value: new THREE.Color(colorWaterSurface) },
        uColorSand: { value: new THREE.Color(colorSand) },
        uColorGrass: { value: new THREE.Color(colorGrass) },
        uColorSnow: { value: new THREE.Color(colorSnow) },
        uColorRock: { value: new THREE.Color(colorRock) },
        uElevationTexture: { // placeholder while tiff data being loaded in
            value: new THREE.DataTexture(
                new Float32Array([0]), // Single pixel with value 0
                1, 1, // 1x1 texture
                THREE.RedFormat,
                THREE.FloatType
            )
        },
        // uElevationMin: { value: 0.0 },      // Minimum elevation (for offset)
        uElevationScale: { value: uElevationScale },
        uSideLength: { value: uSideLength },
        uFloodSpeed: { value: uFloodSpeed },
    }), [colorWaterDeep, colorWaterSurface, colorSand, colorGrass, colorSnow, colorRock])


    // Note we create the geo this way to preserve the mesh rotation
    // if we apply the rotation to the mesh that would change our shader axis
    const terrainGeometry = useMemo(() => {
        let geo = new THREE.PlaneGeometry(10, 10, 500, 500);
        // geo.deleteAttribute('uv'); // note we do this since we are maunally updating the csm_normal /uv in the shader
        geo.deleteAttribute('normal')
        geo.rotateX(-Math.PI / 2); // 90 degree rotation makes it flat


        return geo
    }, [])

    // creates rotated water plane geometry
    const water = useMemo(() => {
        let geo = new THREE.PlaneGeometry(10, 10, 500, 500);
        geo.rotateX(-Math.PI / 2); // 90 degree rotation

        return geo
    }, [])


    //update dem when external dem changes (load success)
    useEffect(() => {
        if (externalDem) {
            setDem(externalDem)
        }
    }, [externalDem])

    //on successful load of the dem this useffect is triggered
    useEffect(() => {
        if (dem) {
            console.log("dem exists Yay", dem);
            let width = dem.width;
            let height = dem.height;

            // Check texture size limits
            const maxTextureSize = 8192;
            if (width > maxTextureSize || height > maxTextureSize) {
                console.error(`Texture size ${width}×${height} exceeds WebGL limit of ${maxTextureSize}`);
                // You might want to downsample here or show an error
                return;
            }

            console.log(`Creating texture: ${width} × ${height}`);

            // Ensure elevations is a Float32Array
            let elevations;
            if (dem.elevations instanceof Float32Array) {
                elevations = dem.elevations;
            } else if (Array.isArray(dem.elevations)) {
                elevations = new Float32Array(dem.elevations);
            } else {
                console.error('Invalid elevations data type:', typeof dem.elevations);
                return;
            }

            // Verify array length matches expected size
            const expectedLength = width * height;
            if (elevations.length !== expectedLength) {
                console.error(`Array length mismatch: got ${elevations.length}, expected ${expectedLength}`);
                return;
            }

            // Create DataTexture
            const texture = new THREE.DataTexture(
                elevations,
                width,
                height,
                THREE.RedFormat,
                THREE.FloatType
            );

            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;

            // Update uniforms
            if (csmRef.current) {
                csmRef.current.uniforms.uElevationTexture.value = texture;
            }
            if (csmDepthRef.current) {
                csmDepthRef.current.uniforms.uElevationTexture.value = texture;
            }
        }
    }, [dem]);



    // Update water level when it changes (update uniform value directly, don't recreate)

    // uniform update when leva controls change (if we dont do this shader will disappear eon change)
    useEffect(() => {



        // update uElevationScale
        if (csmRef.current?.uniforms?.uElevationScale) {
            csmRef.current.uniforms.uElevationScale.value = uElevationScale;
        }
        if (csmDepthRef.current?.uniforms?.uElevationScale) {
            csmDepthRef.current.uniforms.uElevationScale.value = uElevationScale;
        }

        // update uSideLength
        if (csmRef.current?.uniforms?.uSideLength) {
            csmRef.current.uniforms.uSideLength.value = uSideLength;
        }
        if (csmDepthRef.current?.uniforms?.uSideLength) {
            csmDepthRef.current.uniforms.uSideLength.value = uSideLength;
        }
        // update uFloodSpeed
        if (csmRef.current?.uniforms?.uFloodSpeed) {
            csmRef.current.uniforms.uFloodSpeed.value = uFloodSpeed;
        }
        if (csmDepthRef.current?.uniforms?.uFloodSpeed) {
            csmDepthRef.current.uniforms.uFloodSpeed.value = uFloodSpeed;
        }

    }, [uElevationScale, waterLevel, uSideLength, uFloodSpeed,]);


    // on statenbeing toggled on and off we want to reset the flooding time uniform!
    useEffect(() => {
        csmDepthRef.current.uniforms.uFloodTime.value = 0
        waterMeshRef.current.position.y = 0.001// max height 1

    }, [resetFlooding])

    useFrame((state, delta) => {

        const elapsedTime = state.clock.elapsedTime

        // uPositionFrequency

        // update uTime on each tick to animate for both the material and depth material (for shadows)
        csmRef.current.uniforms.uTime.value = elapsedTime * 0.2
        csmDepthRef.current.uniforms.uTime.value = elapsedTime * 0.2


        if (isFlooding) {
            csmDepthRef.current.uniforms.uFloodTime.value += delta * 0.2
            waterMeshRef.current.position.y = Math.min(waterMeshRef.current.position.y + delta * 0.2 * uFloodSpeed, 1.0)// max height 1
        }



    })

    // when displacing vertices in a shader, shadows won't match unless the shadow pass uses the same displacement. 
    // Three.js renders shadows from the light's perspective using the original geometry, not the displaced one.

    return (
        <>
            {/* Water */}
            <mesh position={[0, 0.001, 0]}
                ref={waterMeshRef}
            >
                <primitive object={water} />
                <meshPhysicalMaterial transmission={1} roughness={0.1} />
            </mesh>

            {/* Terrain + shader */}
            {/* positioned at 0,0 */}
            {/* box is height 2 range from y = -1 -> 1 */}
            <mesh receiveShadow castShadow rotation={[0, -Math.PI / 2, 0]}>
                {/* <meshBasicMaterial /> */}
                <CustomShaderMaterial
                    ref={csmRef}
                    baseMaterial={THREE.MeshPhysicalMaterial}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    // Your Uniforms
                    uniforms={uniforms}
                    // Base material properties
                    // flatShading
                    metalness={0}
                    roughness={0.5}
                // flatShading={false} // Explicitly enable smooth shading

                // color={'#85d834'}

                />

                {/* Custom depth material for shadows */}
                <CustomShaderMaterial
                    ref={csmDepthRef}
                    baseMaterial={THREE.MeshDepthMaterial}
                    vertexShader={vertexShader} // Same vertex shader with displacement
                    uniforms={uniforms}
                    attach="customDepthMaterial"
                    depthPacking={THREE.RGBADepthPacking}

                />

                <primitive object={terrainGeometry} attach="geometry" />
            </mesh>

            {/* Center marker point */}

            <mesh>
                <cylinderGeometry args={[0.01, 0.01, 4]} />
                <meshBasicMaterial color={"red"} />
            </mesh>


        </>
    )
}

export default Terrain
