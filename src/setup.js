
if (!Detector.webgl) {

    Detector.addGetWebGLMessage();
    document.getElementById('container').innerHTML = "";

}

var container, stats;

var camera, controls, scene, renderer;

var terrainMesh;

var composer;
var heightMapWidth = 512, heightMapDepth = 512;

var worldMapWidth = 100 * heightMapWidth;
var worldMapDepth = 100 * heightMapDepth;
var worldMapMaxHeight = 3500;

var clock = new THREE.Clock();

window.onload = function () {
    "use strict";
    init();
    animate();
};

function init() {
    "use strict";

    container = document.getElementById('container');


    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
    camera.name = 'camera';

    scene = new THREE.Scene();

    // Tåke som brukes av three.js sin egen fragmentshader
    // For selve terrenget må vi inn i den egenlagde fragmentshaderen for å legge til samme tåke
    scene.fog = new THREE.Fog(0xe6ece9, 0.125, 20000);

    controls = new THREE.FirstPersonControls(camera);
    controls.movementSpeed = 1000;
    controls.lookSpeed = 0.1;

    //
    // Lights
    //

    // Needed for materials using phong shading
    var ambientLight = new THREE.AmbientLight(new THREE.Color(0.3, 0.3, 0.3));
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(new THREE.Color(1.0, 1.0, 1.0));
    directionalLight.name = 'sun';
    directionalLight.position.set(1, 10000, 0);
    //directionalLight.rotateZ(45 *Math.PI/180);
    scene.add(directionalLight);

    scene.add(new THREE.DirectionalLightHelper(directionalLight, 10));

    //
    // Height map generation/extraction
    //

    // TODO
    terrainMesh = setupTerrain();

    //
    // Some other updates
    //

    //camera.position.y = terrainMesh.getHeightAtPoint(camera.position) + 500;
    camera.position.set(-worldMapWidth/5, 2*worldMapMaxHeight, 0);

    //camera.lookAt(new THREE.Vector3(0,0,0));



    //
    // Model loading
    // Examples: all loader/* examples on threejs.org/examples
    //

    // There are several other model loaders for other types, just look in Three.js' example folder.
    var objectMaterialLoader = new THREE.OBJMTLLoader();
    // setupInstancedRocks(terrainMesh, objectMaterialLoader);
    setupTrees(terrainMesh, objectMaterialLoader);

    // Funker når ROCKS- er kommentert bort
    setupWater(terrainMesh);

    // Funker når ROCKS- er kommentert bort
    setupGrass(terrainMesh);

    loadSkyBox();

    //
    // Generate random positions for some number of boxes
    // Used in instancing. Better examples:
    //  * http://threejs.org/examples/#webgl_buffergeometry_instancing_dynamic
    //  * http://threejs.org/examples/#webgl_buffergeometry_instancing_billboards
    //

    //
    // Set up renderer and postprocessing
    //

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xe6ece9);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    composer = new THREE.EffectComposer(renderer);

    var renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    var bloomPassDefault = new THREE.BloomPass();
    //var bloomPass = new THREE.BloomPass(0.5, 16, 0.5, 512);
    //composer.addPass(bloomPassDefault);

    // Fill/replace with more postprocess passes
    var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
    effectCopy.renderToScreen = true;
    composer.addPass(effectCopy);


    //
    // Make the renderer visible py associating it with the document.
    //

    container.innerHTML = "";

    container.appendChild(renderer.domElement);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild(stats.domElement);

    //


    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {
    "use strict";
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    controls.handleResize();
}



//

function animate() {
    "use strict";
    requestAnimationFrame(animate);

    // Perform state updates here

    // Call render
    render();
    stats.update();
}

function render() {
    "use strict";
    controls.update(clock.getDelta());
    renderer.clear();
    //renderer.render(scene, camera);
    composer.render();
}

function setupTerrain() {
    "use strict";
    var useRandomHeightMap = false;

    var terrainData;
    var heightMapTexture;

    if (useRandomHeightMap) {
        terrainData = generateHeight(heightMapWidth, heightMapDepth);

        heightMapTexture = THREE.ImageUtils.generateDataTexture(heightMapWidth, heightMapDepth, new THREE.Color(0,0,0));

        for (var i = 0; i < terrainData.length; ++i) {
            heightMapTexture.image.data[i*3 + 0] = terrainData[i];
            heightMapTexture.image.data[i*3 + 1] = terrainData[i];
            heightMapTexture.image.data[i*3 + 2] = terrainData[i];
        }

        heightMapTexture.needsUpdate = true;
    } else {
        var heightMapImage = document.getElementById('heightmap');
        terrainData = getPixelValues(heightMapImage, 'r');
        heightMapWidth = heightMapImage.width;
        heightMapDepth = heightMapImage.height;

        heightMapTexture = THREE.ImageUtils.loadTexture(heightMapImage.src);
    }

    console.log(heightMapWidth, heightMapDepth);

    //
    // Generate terrain geometry and mesh
    //

    var heightMapGeometry = new HeightMapBufferGeometry(terrainData, heightMapWidth, heightMapDepth);
    // We scale the geometry to avoid scaling the node, since scales propagate.
    heightMapGeometry.scale(worldMapWidth, worldMapMaxHeight, worldMapDepth);

    var sandTexture = THREE.ImageUtils.loadTexture('textures/sand/diffuse.jpg');
    sandTexture.wrapS = THREE.RepeatWrapping;
    sandTexture.wrapT = THREE.RepeatWrapping;
    //sandTexture.repeat.set(2, 2);

    var grassTexture = THREE.ImageUtils.loadTexture('textures/grass/diffuse.png');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    //grassTexture.repeat.set(Math.floor(worldMapWidth/5), Math.floor(worldMapWidth/5));

    var rockTexture = THREE.ImageUtils.loadTexture('textures/rock/diffuse.jpg');
    rockTexture.wrapS = THREE.RepeatWrapping;
    rockTexture.wrapT = THREE.RepeatWrapping;
    //rockTexture.repeat.set(Math.floor(worldMapWidth/5), Math.floor(worldMapWidth/5));

    var snowTexture = THREE.ImageUtils.loadTexture('textures/snow/diffuse.jpg');
    snowTexture.wrapS = THREE.RepeatWrapping;
    snowTexture.wrapT = THREE.RepeatWrapping;
    //snowTexture.repeat.set(Math.floor(worldMapWidth/5), Math.floor(worldMapWidth/5));

    var terrainMaterialImproved = new THREE.ShaderMaterial({
        // We are reusing vertex shader from MeshBasicMaterial

        defines: {
            'USE_MAP': true
        },

        uniforms: {
            'heightMap': { type: 't', value: heightMapTexture },

            'seabed': { type: 't', value: sandTexture },
            'grass': { type: 't', value: grassTexture },
            'rock': { type: 't', value: rockTexture },
            'snow': { type: 't', value: snowTexture },

            'grassLevel': { type: 'f', value: 0.1 },
            'rockLevel': { type: 'f', value: 0.6 },
            'snowLevel': { type: 'f', value: 0.8 },

            // Scale the texture coordinates when coloring the terrain
            'terrainTextureScale': { type: 'v2', value: new THREE.Vector2(200, 200) },

            // This is a default offset (first two numbers), and repeat (last two values)
            // Just use the default values to avoid fiddling with the uv-numbers from the vertex-shader
            'offsetRepeat': { type: 'v4', value: new THREE.Vector4(0, 0, 1, 1) }
        },

        vertexShader: THREE.ShaderLib['basic'].vertexShader,
        fragmentShader: document.getElementById('terrain-fshader').textContent

    });

    var terrainMesh = new HeightMapMesh(heightMapGeometry, terrainMaterialImproved);
    terrainMesh.name = "terrain";
    scene.add(terrainMesh);

    return terrainMesh;
}

function setupInstancedRocks(terrain, objectMaterialLoader) {
    "use strict";
    var maxNumObjects = 2000;
    var spreadCenter = new THREE.Vector3(0.1*worldMapWidth, 0, 0.2*worldMapDepth);
    var spreadRadius = 0.2*worldMapWidth;
    //var geometryScale = 30;

    var minHeight = 0.2*worldMapMaxHeight;
    var maxHeight = 0.6*worldMapMaxHeight;
    var maxAngle = 30 * Math.PI / 180;

    var scaleMean = 50;
    var scaleSpread = 20;
    var scaleMinimum = 1;

    var generatedAndValidPositions = generateRandomData(maxNumObjects,
        //generateGaussPositionAndCorrectHeight.bind(null, terrain, spreadCenter, spreadRadius),
        // The previous is functionally the same as
        function() {
            return generateGaussPositionAndCorrectHeight(terrain, spreadCenter, spreadRadius)
        },

        // If you want to accept every position just make function that returns true
        positionValidator.bind(null, terrain, minHeight, maxHeight, maxAngle)
    );
    var translationArray = makeFloat32Array(generatedAndValidPositions);

    var generatedAndValidScales = generateRandomData(generatedAndValidPositions.length,

        // Generator function
        function() { return Math.abs(scaleMean + randomGauss()*scaleSpread); },

        // Validator function
        function(scale) { return scale > scaleMinimum; }
    );
    var scaleArray = makeFloat32Array(generatedAndValidScales);

    // Lots of other possibilities, eg: custom color per object, objects changing (requires dynamic
    // InstancedBufferAttribute, see its setDynamic), but require more shader magic.
    var translationAttribute = new THREE.InstancedBufferAttribute(translationArray, 3, 1);
    var scaleAttribute = new THREE.InstancedBufferAttribute(scaleArray, 1, 1);

    var instancedMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge(
            //THREE.UniformsLib['lights'],
            {
                color: {type: "c", value: new THREE.Color(0.8, 0.8, 0.8)}
            }
        ),
        vertexShader: document.getElementById("instanced-vshader").textContent,
        // fragmentShader: document.getElementById("instanced-fshader").textContent,
        fragmentShader: THREE.ShaderLib['basic'].fragmentShader

        // lights: true
    });

    objectMaterialLoader.load(
        'models/rocks/rock1/Rock1.obj',
        'models/rocks/rock1/Rock1.mtl',
        function (loadedObject) {
            "use strict";
            // Custom function to handle what's supposed to happen once we've loaded the model

            // Extract interesting object (or modify the model in a 3d program)
            var object = loadedObject.children[1].clone();

            // Traverse the model objects and replace their geometry with an instanced copy
            // Each child in the geometry with a custom color(, and so forth) will be drawn with a
            object.traverse(function(node) {
                if (node instanceof THREE.Mesh) {
                    console.log('mesh', node);

                    var oldGeometry = node.geometry;

                    node.geometry = new THREE.InstancedBufferGeometry();

                    // Copy the the prevoius geometry
                    node.geometry.fromGeometry(oldGeometry);

                    // Associate our generated values with named attributes.
                    node.geometry.addAttribute("translate", translationAttribute);
                    node.geometry.addAttribute("scale", scaleAttribute);

                    //node.geometry.scale(geometryScale, geometryScale, geometryScale);

                    // A hack to avoid custom making a boundary box
                    node.frustumCulled = false;

                    // Set up correct material. We must replace whatever has been set with a fitting material
                    // that can be used for instancing.
                    var oldMaterial = node.material;
                    console.log('material', oldMaterial);

                    node.material = instancedMaterial.clone();
                    if ("color" in oldMaterial) {
                        node.material.uniforms['diffuse'] = {
                            type: 'c',
                            value: oldMaterial.color
                        };
                    }
                }
            });

            var bbox = new THREE.Box3().setFromObject(object);

            // We should know where the bottom of our object is
            object.position.y -= bbox.min.y;

            object.name = "RockInstanced";

            terrain.add(object);
        }, onProgress, onError);
}

/**
 * Load and insert multiple copies of a tree, that is not instanced
 * @param terrain
 * @param objectMaterialLoader
 */
function setupTrees(terrain, objectMaterialLoader) {
    "use strict";
    var maxNumObjects = 200;
    var spreadCenter = new THREE.Vector3(-0.2*worldMapWidth, 0, -0.2*worldMapDepth);
    var spreadRadius = 0.1*worldMapWidth;
    //var geometryScale = 30;

    var minHeight = 0.05*worldMapMaxHeight;
    var maxHeight = 0.3*worldMapMaxHeight;
    var maxAngle = 30 * Math.PI / 180;

    var scaleMean = 100;
    var scaleSpread = 40;
    var scaleMinimum = 10;

    var generatedAndValidPositions = generateRandomData(maxNumObjects,
        generateGaussPositionAndCorrectHeight.bind(null, terrain, spreadCenter, spreadRadius),
        // The previous is functionally the same as
        // function() {
        //      return generateGaussPositionAndCorrectHeight(terrain, spreadCenter, spreadRadius)
        // }

        // If you want to accept every position just make function that returns true
        positionValidator.bind(null, terrain, minHeight, maxHeight, maxAngle),

        // How many tries to generate positions before skipping it?
        5
    );

    var generatedAndValidScales = generateRandomData(generatedAndValidPositions.length,

        // Generator function
        function() { return Math.abs(scaleMean + randomGauss()*scaleSpread); },

        // Validator function
        function(scale) { return scale > scaleMinimum; }
    );

    var numObjects = generatedAndValidPositions.length;

    objectMaterialLoader.load(
        'models/lowPolyTree/lowpolytree.obj',
        'models/lowPolyTree/lowpolytree.mtl',
        function (loadedObject) {
            "use strict";
            // Custom function to handle what's supposed to happen once we've loaded the model

            var bbox = new THREE.Box3().setFromObject(loadedObject);
            console.log(bbox);

            for (var i = 0; i < numObjects; ++i) {
                var object = loadedObject.clone();

                // We should know where the bottom of our object is
                object.position.copy(generatedAndValidPositions[i]);
                object.position.y -= bbox.min.y*generatedAndValidScales[i];

                object.scale.set(
                    generatedAndValidScales[i],
                    generatedAndValidScales[i],
                    generatedAndValidScales[i]
                );

                object.name = "LowPolyTree";

                terrain.add(object);
            }
        }, onProgress, onError);
}

// TODO - VAR or LET
function setupWater(terrain) {
    "use strict";

    // worldMapMaxHeight ==3500;

    // TODO: Change water level
    // Opt 1. optimal
    var height = worldMapMaxHeight-3150;

    // Opt 2. dry
    // var height = worldMapMaxHeight - 3350;

    // Opt 3. flooded
    // var height = worldMapMaxHeight-1600;

    // Opt 4. having a quick look at the texture
    // var height = worldMapMaxHeight + 3450;

    // TODO: TEXTURE controll
    var docTexture= document.getElementById('watertexture');
    var waterTexture = THREE.ImageUtils.loadTexture(docTexture.src);
    // var waterTexture = THREE.ImageUtils.loadTexture(docTexture.src, {}, function() {
    //    renderer.render(scene);});
    // TODO -- Is renderer defined yet?


    waterTexture.wrapS = THREE.RepeatWrapping;
    waterTexture.wrapT = waterTexture.wrapS;
    waterTexture.repeat.x = worldMapWidth / 100;
    waterTexture.repeat.y = worldMapDepth / 100;

    var waterColor = 0x323F6B; // dark-grey-blue
    var waterGeometry = new THREE.PlaneGeometry(worldMapWidth, worldMapDepth, 1, 1);

    var material = new THREE.MeshLambertMaterial({
        //map: waterTexture,
        map: waterTexture,
        color: waterColor,
        opacity: 0.8,
        transparent: true
    });

    var waterMesh;
    waterMesh = new THREE.Mesh(waterGeometry, material);
    waterMesh.rotateX(-Math.PI / 2);
    waterMesh.position.y = height;

    waterMesh.name = "water";

    scene.add(waterMesh);

}


function loadSkyBox() {
    console.log("SKY-start");

    var urls = [
        "textures/skybox/SunFront.png", "textures/skybox/SunBack.png",
        "textures/skybox/SunUp.png",    "textures/skybox/SunDown.png",
        "textures/skybox/SunRight.png", "textures/skybox/SunLeft.png" ];

    var textureCube = THREE.ImageUtils.loadTextureCube( urls );

    var shader = THREE.ShaderLib["cube"];
    shader.uniforms[ "tCube" ].value = textureCube;
    shader.uniforms.fogNear = scene.fog.near;
    shader.uniforms.fogFar = scene.fog.far;
    shader.uniforms.fogColor = scene.fog.color;
    var material = new THREE.ShaderMaterial({
        fragmentShader    : shader.fragmentShader,
        vertexShader  : shader.vertexShader,
        uniforms  : shader.uniforms,
        side: THREE.BackSide,
        fog: true
    });

    scene.add(new THREE.Mesh( new THREE.BoxGeometry( 6000, 6000, 6000), material ));
    console.log("SKY-stop");
}

// TODO -- Slett alle på fjell
function setupGrass(terrain){

    "use strict";
    var maxNumObjects = 500;
    var minHeight = 0.25*worldMapMaxHeight;
    var maxHeight = 0.5*worldMapMaxHeight;
    var spreadCenter = new THREE.Vector3(0, 0, 0);
    var spreadRadius = 0.2*worldMapWidth;
    var maxAngle = 30 * Math.PI / 180;

    console.log("LOG :: ");

    var generatedAndValidPositions = generateRandomData(maxNumObjects,
        function() {
            return generateGaussPositionAndCorrectHeight(terrain, spreadCenter, spreadRadius)
        },

        // If you want to accept every position just make function that returns true
        positionValidator.bind(null, terrain, minHeight, maxHeight, maxAngle)
    );


    var pos = generatedAndValidPositions;

    var positions = new Array();

    // TODO: Console
    console.log("Translation Length :: " + pos.length);
    for(var i = 0; i < pos.length; i++){
        var posObj = pos[i];
        console.log("X :: " + posObj.x);
        console.log("Y :: " + posObj.y);
        console.log("Z :: " + posObj.z);

        var numberInClump = Math.floor(Math.random()*4);
         for(var j = 0; j < numberInClump; j++){
             posObj.x += ((Math.random()* 50) - 25 );
             posObj.z += ((Math.random()* 50) - 25 );
             positions.push(new THREE.Vector3(posObj.x,posObj.y,posObj.z));
         }
    }
    var mesh = THREEx.createGrassTufts(positions);
    terrain.add(mesh);

}

function generateGaussPositionAndCorrectHeight(terrain, center, radius) {
    "use strict";
    var pos = randomGaussPositionMaker(center, radius);
    //var pos = randomUniformPositionMaker(center, radius);
    return terrain.computePositionAtPoint(pos);
}

function positionValidator(terrain, minHeight, maxHeight, maxAngle, candidatePos) {
    "use strict";

    var normal = terrain.computeNormalAtPoint(candidatePos);
    var notTooSteep = true;

    var angle = normal.angleTo(new THREE.Vector3(0, 1, 0));
    //var maxAngle = 30 * Math.PI/180;

    if (angle > maxAngle) {
        notTooSteep = false;
    }

    var withinTerrainBoundaries = terrain.withinBoundaries(candidatePos);
    var withinHeight = (candidatePos.y >= minHeight) && (candidatePos.y <= maxHeight);

    return withinTerrainBoundaries && withinHeight && notTooSteep;
}

function onProgress(xhr) {
    "use strict";
    if (xhr.lengthComputable) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log(Math.round(percentComplete, 2) + '% downloaded');
    }
}

function onError(xhr) {
    "use strict";
}
