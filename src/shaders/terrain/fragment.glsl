#include ../includes/simplexNoise2d.glsl // returns a random number from -1 -> 1 (based on noise not random ---> randiness looks nicer -> cow pattern instead of static)

uniform vec3 uColorWaterDeep;
uniform vec3 uColorWaterSurface;
uniform vec3 uColorSand;
uniform vec3 uColorGrass;
uniform vec3 uColorSnow;
uniform vec3 uColorRock;

uniform float uTime;

varying vec3 vPosition; // csm_position passed from vertex [x,y,z] y-> elevation
varying float vDot;

void main() {
    // vec2 uv = gl_PointCoord;
    // Final color
    // gl_FragColor = vec4(0.2, 0.2, 0.1, 1.0);
    // note we are overriding the shader with customer shader rather than writing from scratch 
    // so we use csm_
    // csm_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

    vec3 color = vec3(uColorWaterSurface);

    //water (water surface < -0.1) (water deep > -1.0)
    // values close to -1 -> 0 numbers close to -0.1 -> 1 (the mixing of the color)
    // also clamped so vals under -1 get scaled the same to 0
    // float surfaceWaterMix = smoothstep(-1.0, -0.1, vPosition.y); // any value of -1.0 or greater -> 1
    // this maps the 0 values to uColorWaterDeep and the 1 values uColorWaterSurface and mixes between the two
    // color = mix(uColorWaterDeep, uColorWaterSurface, surfaceWaterMix);

    // sand (-.1 -> 0.0)
    // float sandMix = step(-0.1, vPosition.y); // any value -0.1 or greater -> 1
    float sandMix = smoothstep(0.0001,0.002, vPosition.y); // any value -0.1 or greater -> 1
    color = mix(color, uColorSand, sandMix);

    //grass (-0.06 >)
    float grassMix = step(0.002, vPosition.y); // any value -0.1 or greater -> 1
    color = mix(color, uColorGrass, grassMix);

    // [Rock] -> when terrain is very steep make it rock
    // if we dot product a vertical vector with the normal of a frag we can identify how steep the section of the rock is
    // dot(vert, normal): 
    //     parallel -> 1
    //     perpendicular -> 0
    //     parallel (opposite) ->-1
    // in our case if our normal is close to perpendicular the frag is close to vertical (steep wall)

    float rockMix = vDot; // 1 at flat terrian 0 at vertical
    rockMix = 1.0 - step(0.8,rockMix); // the 1.0 - step inverts the result making it 1 on steep and 0 on flat
    // rockMix *= step(-0.06, vPosition.y); // everything below (-0.06) gets x 0 resulting in nothing under -0.06 being able to be rock
    rockMix *= step(0.002, vPosition.y); // everything below (-0.06) gets x 0 resulting in nothing under -0.06 being able to be rock
    color = mix(color, uColorRock, rockMix);// hence when we mix only the higher gradient values get the rock color

    //snow
    float snowThreshold = 0.45;
    float snowFrequency = 15.0; // this changes the pattern of the noise imagine zooming out 
    snowThreshold += simplexNoise2d((vPosition.xz) * snowFrequency) * 0.1;
    float snowMix = step(snowThreshold, vPosition.y); // the 1
    color = mix(color, uColorSnow, snowMix);

    // diffuse pushes the color through the materials lighting pipeline
    // FragColor just overrides like mesh basic material
    csm_DiffuseColor = vec4(color, 1.0);

    // csm_DiffuseColor = vec4(vec3(vDot), 1.0);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}