#include ../includes/simplexNoise2d.glsl

uniform float uTime;
uniform float uPositionFrequency;
uniform float uStrength;
uniform float uWarpFrequency;
uniform float uWarpStrength;

uniform sampler2D uElevationTexture;
uniform float uElevationMin;    // Minimum elevation (meters)
uniform float uElevationMax;    // Maximum elevation (meters)
uniform float uElevationScale;  // Scale factor 
uniform float uSideLength;  // length of the x and y

// varying vec2 vUv;
// varying vec3 vNormal;
varying vec3 vPosition;
varying float vDot; // calc dot product in vertex shader and pass to frag shdaer

// picks a random value based on x/y coords 
float getElevation(vec2 position) {
    // Calculate UV from position parameter (which is csm_Position.xz)
    // Plane is 10x10 units, centered at origin (-5 to +5)
    // Map position to UV coordinates (0 to 1)
    vec2 uv = vec2((position.x + 5.0) / 10.0,  // X: -5→5 becomes 0→1
    (position.y + 5.0) / 10.0   // Z: -5→5 becomes 0→1 (position.y is Z in xz plane)
    );
    // this is how we map the texture to any size grid

    // Sample elevation from texture (in meters)
    float rawElevation = texture2D(uElevationTexture, uv).r;
    float planeLength = 10.0; // 10x10 grid
    float meterPerUnit = (uSideLength * 1000.0) / planeLength; // kms to ms



    float elevation = (rawElevation - uElevationMin) / meterPerUnit * uElevationScale;
    // float elevation = (rawElevation - uElevationMin) * uElevationScale * 1.0 / uSideLength;

    // Option 2: Normalize then scale (uncomment to use)
    // Normalizes to 0-1 range, then scales
    // float normalizedElevation = (rawElevation - uElevationMin) / (uElevationMax - uElevationMin);
    // float elevation = normalizedElevation * uElevationScale * (uElevationMax - uElevationMin);

    return elevation;
}
// float getElevationOG(vec2 position) {
//     float elevation = 0.0;

//     // how frequent there are peaks and troughs (imagine zooming in on the noise)
//     // float uPositionFrequency = 0.2;

//     // multiplier of peak hight after randomness/plateaus
//     // float uStrength = 2.0;

//     // A modifier of randomness on the peaks themselves (randomness inside randomness)
//     // float uWarpFrequency = 5.0;
//     // float uWarpStrength = 0.5;

//     vec2 warpedPosition = position;
//     warpedPosition += uTime;
//     //essentially we are saying that for close vertex neighbours we want even more randomness relative to each other
//     warpedPosition += simplexNoise2d(warpedPosition * uPositionFrequency * uWarpFrequency) * uWarpStrength;

//     // adds more randomness at different frequencies maintaining a max height<1
//     elevation += simplexNoise2d(warpedPosition * uPositionFrequency) / 2.0;
//     elevation += simplexNoise2d(warpedPosition * uPositionFrequency * 2.0) / 4.0;
//     elevation += simplexNoise2d(warpedPosition * uPositionFrequency * 4.0) / 8.0;

//     // power gives us plateaus, when the value is low the pow keeps it low
//     // then as it approaches 1 it catches up very quickly, thing RHS of parabola
//     // not we also need to restore the negatives after the power otherwise everything would be positive
//     float elevationSign = sign(elevation);
//     elevation = elevationSign * pow(abs(elevation), 2.0);

//     elevation = elevation * uStrength;
//     return elevation;
// }

void main() {
    // important to remember we are not replacing the shader with our own from scratch
    // we are adding functionality on top of the existing with csm_
    // hence we don't need to do model world position transformations

    // elevate vertices
    float elevation = getElevation(csm_Position.xz);
    csm_Position.y += elevation;

    // Note since this is a physical material and we have updated the position of the vertex we need to udpate the normal
    // We can do this by calculating a theoretical neighbour A B and doing a cross product of the vector v->a and v->b

    // compute normal
    float shift = 0.02;
    vec3 positionA = position + vec3(shift, 0.0, 0.0);
    vec3 positionB = position + vec3(0.0, 0.0, -shift);
    positionA.y += getElevation(positionA.xz);
    positionB.y += getElevation(positionB.xz);

    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);
    csm_Normal = cross(toA, toB);

    // dot product calc
    float slope = dot(csm_Normal, vec3(0.0, 1.0, 0.0));
    // as slope approaches 1 when the terain is flat
    // as slope approaches 0 the terrain is very steep
    // as slop approaches -1 its steep again the other way

    // Varyings

    vPosition = csm_Position;
    // note we are adding the uTime to the vPosition such that the frag shader has the same postion as updated by our warp
    // utime makes the snow noise stay with the original position other wise it looks animated
    vPosition.xz = vPosition.xz + uTime;
    // if we adjust he .y we can get some pretty cool effects on water level
    vDot = slope;

}