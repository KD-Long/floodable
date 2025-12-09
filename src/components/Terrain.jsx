import React, { useEffect, useMemo, useRef, useState } from 'react'
import CustomShaderMaterial from 'three-custom-shader-material'
import { extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three'

import vertexShader from '../shaders/terrain/vertex.glsl'
import fragmentShader from '../shaders/terrain/fragment.glsl'

// import { loadDEM } from '../utils/loadDEM.js';
import simpleDem from '../utils/simpleDem.js';
import { fromUrl } from "geotiff";



const Terrain = ({
    uPositionFrequency,
    uStrength,
    uWarpFrequency,
    uWarpStrength,
    uElevationScale,
    waterLevel,
    colorWaterDeep,
    colorWaterSurface,
    colorSand,
    colorGrass,
    colorSnow,
    colorRock,
    uSideLength

}) => {
    const csmRef = useRef();
    const csmDepthRef = useRef();

    // const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [terrainBounds, setTerrainBounds] = useState(null);

    const [dem, setDem] = useState(null); //object: {elevation,width,height}





    // defining here so we dont need to duplicate for material + depth material
    // note when leva changes this updates the props which causes the component to remount
    // hence updating the shader (unlike uTime)
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uPositionFrequency: { value: uPositionFrequency },
        uStrength: { value: uStrength },
        uWarpFrequency: { value: uWarpFrequency },
        uWarpStrength: { value: uWarpStrength },
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
        uElevationMin: { value: 0.0 },      // Minimum elevation (for offset)
        uElevationScale: { value: uElevationScale },
        uSideLength: { value: uSideLength },
        uWaterLevel: { value: typeof waterLevel === 'number' ? waterLevel : 0.0 }  // Water level in world units (relative to terrain)
    }), [uPositionFrequency, uStrength, uWarpFrequency, uWarpStrength, colorWaterDeep, colorWaterSurface, colorSand, colorGrass, colorSnow, colorRock])


    // Note we create the geo this way to preserve the mesh rotation
    // if we apply the rotation to the mesh that would change our shader axis
    const terrainGeometry = useMemo(() => {
        let geo = new THREE.PlaneGeometry(10, 10, 500, 500);
        // geo.deleteAttribute('uv'); // note we do this since we are maunally updating the csm_normal /uv in the shader
        geo.deleteAttribute('normal')
        geo.rotateX(-Math.PI / 2); // 90 degree rotation

        return geo
    }, [])

    // creates rotated water plane geometry
    const water = useMemo(() => {
        let geo = new THREE.PlaneGeometry(10, 10, 500, 500);
        geo.rotateX(-Math.PI / 2); // 90 degree rotation

        return geo
    }, [])


    const loadSimpleDEM = async () => {
        // setLoading(true);
        // setError(null);
        try {
            // const demResult = await simpleDem('/geoData/murray.tif') // 10km
            // const demResult = await simpleDem('/geoData/murray_3km.tif') //3km
            // const demResult = await simpleDem('/geoData/murray_1km.tif') // 1km
            // const demResult = await simpleDem('/geoData/waverton_1km.tif') // 1km
            // const demResult = await simpleDem('/geoData/neara_5km.tif') // 5km
            const tiffSource = "/geoData/neara_20km.tif"
            const tiff = await fromUrl(tiffSource);


            const demResult = await simpleDem(tiff) // 5km

            setDem(demResult);

        } catch (err) {
            console.error('Error loading DEM:', err);
            // setError(err.message);
        } finally {
            // setLoading(false);
        }
    };
    // calls dem to load on first render
    useEffect(() => {
        loadSimpleDEM()
    }, []);

    //on successful load of the dem this useffect is triggered
    useEffect(() => {
        if (dem) {
            console.log("dem exists Yay", dem)
            let width = dem.width
            let height = dem.height
            let elevations = new Float32Array(dem.elevations)
            // console.log("elevations: ", elevations)

            // at this point we know dem has loaded successfully and we can start setting our uElevationTexture

            // Create DataTexture
            const texture = new THREE.DataTexture(
                elevations,
                width,
                height,
                THREE.RedFormat,
                THREE.FloatType
            );

            // Enable texture filtering for smooth interpolation
            // interpolates between 4 neighbouring pixels (smooth)
            // texture at a larger size than its native resolution (without this we see grid lines)
            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;

            // Update uniform for both materials
            if (csmRef.current) {
                csmRef.current.uniforms.uElevationTexture.value = texture;
                // csmRef.current.uniforms.uElevationMin.value = minElevation;
                // csmRef.current.uniforms.uElevationScale.value = autoScale;
            }
            if (csmDepthRef.current) {
                csmDepthRef.current.uniforms.uElevationTexture.value = texture;
                // csmDepthRef.current.uniforms.uElevationMin.value = minElevation;
                // csmDepthRef.current.uniforms.uElevationScale.value = autoScale;
            }
        }
    }, [dem])

    // // This is trigged when result has successfully loaded
    // // it converts 2d array -> 1D Float32Array -> data texture
    // // then updates uniforms
    // useEffect(() => {
    //     if (result && result.elevationGrid) {
    //         // Calculate elevation statistics for scaling
    //         let minElevation = Infinity;
    //         let maxElevation = -Infinity;

    //         for (let row = 0; row < result.gridSize; row++) {
    //             for (let col = 0; col < result.gridSize; col++) {
    //                 const val = result.elevationGrid[row][col];
    //                 if (val != null && !isNaN(val)) {
    //                     minElevation = Math.min(minElevation, val);
    //                     maxElevation = Math.max(maxElevation, val);
    //                 }
    //             }
    //         }

    //         const elevationRange = maxElevation - minElevation;

    //         // Calculate automatic scale factor
    //         // Makes elevation range visually proportional to terrain size (10% of width)
    //         const terrainSizeUnits = 10;
    //         const desiredHeightUnits = terrainSizeUnits * 0.1;
    //         const autoScale = desiredHeightUnits / elevationRange;

    //         // Convert 2D array to 1D Float32Array
    //         const width = result.gridSize;
    //         const height = result.gridSize;
    //         const data = new Float32Array(width * height);

    //         for (let row = 0; row < height; row++) {
    //             for (let col = 0; col < width; col++) {
    //                 const index = row * width + col;
    //                 data[index] = result.elevationGrid[row][col];
    //             }
    //         }

    //         // Create DataTexture
    //         const texture = new THREE.DataTexture(
    //             data,
    //             width,
    //             height,
    //             THREE.RedFormat,
    //             THREE.FloatType
    //         );

    //         // Enable texture filtering for smooth interpolation
    //         // interpolates between 4 neighbouring pixels (smooth)
    //         // texture at a larger size than its native resolution (without this we see grid lines)
    //         texture.magFilter = THREE.LinearFilter;
    //         texture.needsUpdate = true;

    //         // Update uniform for both materials
    //         if (csmRef.current) {
    //             csmRef.current.uniforms.uElevationTexture.value = texture;
    //             csmRef.current.uniforms.uElevationMin.value = minElevation;
    //             csmRef.current.uniforms.uElevationScale.value = autoScale;
    //         }
    //         if (csmDepthRef.current) {
    //             csmDepthRef.current.uniforms.uElevationTexture.value = texture;
    //             csmDepthRef.current.uniforms.uElevationMin.value = minElevation;
    //             csmDepthRef.current.uniforms.uElevationScale.value = autoScale;
    //         }
    //     }
    // }, [result]);

    // Update water level when it changes (update uniform value directly, don't recreate)
    useEffect(() => {

        // update water level
        const waterLevelValue = waterLevel ? waterLevel : 0.0;
        if (csmRef.current?.uniforms?.uWaterLevel) {
            csmRef.current.uniforms.uWaterLevel.value = waterLevelValue;
        }

        if (csmDepthRef.current?.uniforms?.uWaterLevel) {
            csmDepthRef.current.uniforms.uWaterLevel.value = waterLevelValue;
        }

        // update uElevationScale
        if (csmRef.current?.uniforms?.uElevationScale) {
            csmRef.current.uniforms.uWaterLevel.value = uElevationScale;
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

    }, [waterLevel, uElevationScale, uSideLength]);

    useFrame((state, delta) => {

        const elapsedTime = state.clock.elapsedTime

        // uPositionFrequency

        // update uTime on each tick to animate for both the material and depth material (for shadows)
        // csmRef.current.uniforms.uTime.value = elapsedTime * 0.2
        // csmDepthRef.current.uniforms.uTime.value = elapsedTime * 0.2


    })

    // when displacing vertices in a shader, shadows won't match unless the shadow pass uses the same displacement. 
    // Three.js renders shadows from the light's perspective using the original geometry, not the displaced one.

    return (
        <>
            {/* Water */}
            <mesh position={[0, -0.1, 0]}>
                <primitive object={water} />
                <meshPhysicalMaterial transmission={1} roughness={0.1} />
            </mesh>

            {/* Terrain + shader */}
            {/* positioned at 0,0 */}
            {/* box is height 2 range from y = -1 -> 1 */}
            <mesh receiveShadow castShadow >
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
