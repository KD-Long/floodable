/**
 * Compute a bounding box in lat/lon for a square of given size in meters.
 *
 * @param {number} lat0 - Center latitude in degrees
 * @param {number} lon0 - Center longitude in degrees
 * @param {number} sideMeters - Desired side length of the square in meters
 * @returns {Object} Bounding box with { south, north, west, east }
 */
export function getBBLatLon(lat0, lon0, sideMeters) {
    const halfSide = sideMeters / 2; // Half of the square side

    // Approximate conversion from meters to degrees
    const metersPerDegLat = 111_320; // 1° latitude ≈ 111.32 km
    const dLat = halfSide / metersPerDegLat;

    // Longitude depends on latitude
    const metersPerDegLon = metersPerDegLat * Math.cos((lat0 * Math.PI) / 180);
    const dLon = halfSide / metersPerDegLon;

    return {
        south: lat0 - dLat,
        north: lat0 + dLat,
        west: lon0 - dLon,
        east: lon0 + dLon
    };
}
// trims the original array2D (might be rectangle)

export function trimToSquareArray(arr) {
    if (arr.length == arr[0].length) {
        console.log("Already square!")
        return
    }

    let minAxis = Math.min(arr.length, arr[0].length)
    let maxAxis = Math.max(arr.length, arr[0].length)
    let removalCount = Math.floor((maxAxis - minAxis) / 2);

    //check width
    if (arr[0].length == maxAxis) {
        // trim width by
        let start = 0 + removalCount
        let end = maxAxis - removalCount
        // foreach row reduce from both ends
        for (let i = 0; i < arr.length; i++) {
            arr[i] = arr[i].slice(start, end) //
        }
    } else { // height must be the maximum
        let start = 0 + removalCount
        let end = maxAxis - removalCount
        arr = arr.slice(start, end) // we are slicing off whole rows here
    }
}

// given a 1d array convert it to a 2d array of width and height
export function arrayOneDToTwoD(arr, width, height) {
    let elevation2D = [];
    for (let i = 0; i < height; i++) {
        elevation2D.push(new Array(width).fill(0));
    }
    // now we have 2d array filled with 0s
    let idx = 0;
    for (let i = 0; i < elevation2D.length; i++) {
        for (let j = 0; j < elevation2D[i].length; j++) {
            elevation2D[i][j] = arr[idx]
            idx++
        }
    }
    return elevation2D
}
// for 0 depth values it tries to make more negative when there are more 0 neighbours
export function applyWaterDepth(arr) {
    const height = arr.length;
    const width = arr[0].length;
    const result = arr.map(row => [...row]); // clone array

    const decay = -1; // amount to reduce per step
    const maxSteps = 5; // how far water spreads

    // iterate multiple times to propagate
    for (let step = 1; step <= maxSteps; step++) {
        const temp = result.map(row => [...row]); // copy of current state
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (result[i][j] === 0) {
                    // check neighbors
                    const neighbors = [
                        [i-1, j], [i+1, j],
                        [i, j-1], [i, j+1],
                    ];
                    for (const [ni, nj] of neighbors) {
                        if (ni >= 0 && ni < height && nj >= 0 && nj < width) {
                            if (result[ni][nj] > 0) continue; // don't overwrite land
                            temp[i][j] = Math.min(temp[i][j], result[ni][nj] + decay);
                        }
                    }
                }
            }
        }
        // update
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                result[i][j] = temp[i][j];
            }
        }
    }

    return result;
}


