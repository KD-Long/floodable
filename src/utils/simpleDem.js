import { fromUrl } from "geotiff";
import { getBBLatLon,trimToSquareArray,arrayOneDToTwoD,applyWaterDepth } from "./geoUtils";


export default async function simpleDem(tiffSource) {

    const tiff = await fromUrl(tiffSource);
    const image = await tiff.getImage();

    // array including dimensions + 2D array elevations
    // e.g
    // Int16Array(1248) [69, 71, 72, 71,…]
    // height: 32
    // width: 39
    const raster = await image.readRasters({ interleave: false });

    const elevationArray = raster[0];  // typed array of elevations 1d
    const width = image.getWidth();
    const height = image.getHeight();

    // now the bounding box we get back from our dem is not always square this is because of how lon/lat bounding box are returned from api


    let elevation2D = arrayOneDToTwoD(elevationArray, width, height)

    // trim the potentially rectangle 2d array back to square
    trimToSquareArray(elevation2D);
    console.log("square elevation: ", elevation2D)



    // elevation2D = applyWaterDepth(elevation2D)
    // convert 2d array back to 1d such that we can feed it into our texture as a uniform as in the shader
    let elevation1D = elevation2D.reduce((acc,cur )=> acc.concat(cur))
    // console.log("flat elevation: ", elevation2D)

    // console.log("applyWaterDepth: ",applyWaterDepth(elevation2D))





    // How we map our DEM to our plane
    // 1 - We want to input our 2DArray of elevations into a texture
    // 2 - stretch the texture over our plane (this is magic it now can use the vertex coordinates of plane to map to the uv coordinates of our texture - interpolates between)
    //      - Now we dont need to worrie about scaling and sizing on the zx coordinates
    // console.log(raster)
    // console.log(width)
    // console.log(height)


    // console.log(getBBLatLon(151.173833,-33.808702,1000)) // LC
    // console.log(getBBLatLon(-33.843413,151.197412,1000)) // waverton
    // console.log(getBBLatLon(-33.889582,151.199479,5000)) // neara
    // console.log(getBBLatLon(-33.889582,151.199479,50000)) // neara 50 km
    console.log("neara: ",getBBLatLon(-33.889468,151.199508,20000)) // neara 20 km
 

    // returns an object
    return {elevations: elevation1D,width: elevation2D.length, height: elevation2D.length}
}

// const tex = new THREE.DataTexture(
//     elevations,
//     width,
//     height,
//     THREE.RedFormat,
//     THREE.FloatType
//   );
  
//   tex.needsUpdate = true;
