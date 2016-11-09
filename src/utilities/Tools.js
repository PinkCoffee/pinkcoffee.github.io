/**
 * Created by endre on 06.11.15.
 */

/**
 * Generates a single Float32Array based on a list of vectors
 * @param vectorList containing THREE.Vector{2,3,4}
 */
function makeFloat32Array(vectorList) {
    "use strict";
    var totalSize = 0;

    for (var i = 0; i < vectorList.length; ++i) {
        var v = vectorList[i];

        if (v instanceof Number || typeof(v) == "number") {
            totalSize += 1;
        } else if (v instanceof THREE.Vector2) {
            totalSize += 2;
        } else if (v instanceof THREE.Vector3) {
            totalSize += 3;
        } else if (v instanceof THREE.Vector4) {
            totalSize += 4;
        } /*else if (vectorList[i] instanceof THREE.Color) {
            totalSize += 3;
        }*/
    }

    var array = new Float32Array(totalSize);

    var offset = 0;

    for (var i = 0; i < vectorList.length; ++i) {
        var v = vectorList[i];

        if (v instanceof Number || typeof(v) == "number") {
            array[offset] = v;
            offset += 1;
        } else {
            v.toArray(array, offset);

            if (v instanceof THREE.Vector2) {
                offset += 2;
            } else if (v instanceof THREE.Vector3) {
                offset += 3;
            } else if (v instanceof THREE.Vector4) {
                offset += 4;
            } /*else if (v instanceof THREE.Color) {
             offset += 3;
             }*/
        }
    }

    return array;
}