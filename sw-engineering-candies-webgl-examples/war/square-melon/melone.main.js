/*******************************************************************************
 * Copyright (C) 2013, Markus Sprunck
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *  - Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *  - Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *  - The name of its contributor may be used to endorse or promote products
 * derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 ******************************************************************************/
/**
 * Global constants
 */
var BORDER_LEFT = 10;
var BORDER_TOP = 10;
var BORDER_RIGHT = 10;
var BORDER_BOTTOM = 40;

/**
 * Global variables for rendering
 */
var g_panelWidthWebGL;
var g_panelHeightWebGL;
var g_updateTimerImport;
var g_updateTimerSimulation;
var g_updateTimerWebGL;
var g_scene;
var g_cube_material_solid;
var g_cube_wireframe1;
var g_cube_wireframe2;
var g_cube_wireframe3;
var g_camera;
var g_renderer;
var g_control;
var g_light;
var g_container;
var g_gui;
var g_Message = '';
var g_imported_data = false;
var g_balloon;


/**
 * Initialize WebGL
 */
function initWebGL() {
    "use strict";
    // Container for WebGL rendering
    g_container = document.getElementById('graphic-container');
    g_container.style.background = "#000";

    // Size of drawing
    g_panelWidthWebGL = window.innerWidth - BORDER_RIGHT - BORDER_LEFT;
    g_panelHeightWebGL = window.innerHeight - BORDER_BOTTOM - BORDER_TOP;
	
    // Create g_camera
    g_camera = new THREE.PerspectiveCamera(40, g_panelWidthWebGL / g_panelHeightWebGL, 1, 40000);
    resetCamera();

    // Create g_scene
    g_scene = new THREE.Scene();
    g_scene.add(g_camera);

    // Create g_renderer
    if (Detector.webgl) {
        g_renderer = new THREE.WebGLRenderer({
            antialias: true
        });
    } else {
        g_renderer = new THREE.CanvasRenderer();        
    }
    g_renderer.setSize(g_panelWidthWebGL, g_panelHeightWebGL);
    g_container.appendChild(g_renderer.domElement);
    initDatGui(g_container);

    // Create g_light front
    g_light = new THREE.SpotLight(0xffffff, 1.25);
    g_light.position.set(MELONE_SimulationOptions.SPHERE_RADIUS * 2, MELONE_SimulationOptions.SPHERE_RADIUS * 2, 0);
    g_light.target.position.set(0, 0, 0);
    g_light.castShadow = true;
    g_scene.add(g_light);

    // Create light near the center
    var hemiLight = new THREE.HemisphereLight(0x000fff, 0xfff000, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 200, 0);
    g_scene.add(hemiLight);

    // Support window resize
    var resizeCallback = function () {
        g_panelWidthWebGL = window.innerWidth - BORDER_RIGHT - BORDER_LEFT;
        g_panelHeightWebGL = window.innerHeight - BORDER_BOTTOM - BORDER_TOP;
        var devicePixelRatio = window.devicePixelRatio || 1;
        g_renderer.setSize(g_panelWidthWebGL * devicePixelRatio, g_panelHeightWebGL * devicePixelRatio);
        g_renderer.domElement.style.width = g_panelWidthWebGL + 'px';
        g_renderer.domElement.style.height = g_panelHeightWebGL + 'px';
        resetCamera();
        g_camera.updateProjectionMatrix();
        g_gui.domElement.style.position = 'absolute';
        g_gui.domElement.style.left = '' + (BORDER_LEFT) + 'px';
        g_gui.domElement.style.top = '' + (BORDER_TOP) + 'px';
    };
    window.addEventListener('resize', resizeCallback, false);
    resizeCallback();

    g_control = new THREE.TrackballControls(g_camera, g_renderer.domElement);
    g_control.target.set(0, 0, 0);
    g_control.rotateSpeed = 1.0;
    g_control.zoomSpeed = 1.2;
    g_control.panSpeed = 0.8;
    g_control.noZoom = false;
    g_control.noPan = false;
    g_control.staticMoving = false;
    g_control.dynamicDampingFactor = 0.15;
    g_control.keys = [65, 83, 68];
    g_control.addEventListener('change', renderer);

    // create melone with texture
    var loader = new THREE.TextureLoader();
    loader.load('melone.jpg', function (texture) {
        var geometry = new THREE.SphereGeometry(600, 16, 16);
        var material = new THREE.MeshBasicMaterial({
            map: texture,
			depthTest : false,
            overdraw: true
        });
        g_balloon = new THREE.Mesh(geometry, material);
        g_balloon.geometry.dynamic = true;
        if (MELONE_SimulationOptions.SHOW_MELONE) {
            g_scene.add(g_balloon);
        }
        MELONE_NBodySimulator.createModelFromSphere(g_balloon);
    });

    // Start animation
    animate();
}

/**
 * Render WebGL with about 60 fames per second if possible
 */

function animate() {
    "use strict";
    requestAnimationFrame(animate);
    
	g_control.update();

    updateLightPosition();
    
	// simulate forces
	if (MELONE_SimulationOptions.RUN_SIMULATION) {      
		MELONE_NBodySimulator.simulateAllForces();
    }
	
	// update position of the melone
	if (null != g_balloon) {
		MELONE_NBodySimulator.updateBalloon(g_balloon);
	}
    
	// re-draw the box
	renderCubeWithDottedHiddenLines();
	
	// update wire frame
	var nodes = MELONE_NBodySimulator.node_list;
    for (var i = 0; i < nodes.length; i++) {
        renderNodeSphere(nodes[i]);
    }
	var links = MELONE_NBodySimulator.link_list;
    for (i = 0; i < links.length; i++) {
        renderLineElementForLink(links[i]);
    }
	
    renderer();
}

function renderer() {
    "use strict";
    g_renderer.render(g_scene, g_camera);
}

/**
 * Render a cube with hidden dotted lines. It is neccesary to render the cube
 * several times to make all hidden lines dotted and the visible lines solid.
 */
function renderCubeWithDottedHiddenLines() {
    "use strict";
    if (typeof (g_cube_material_solid) !== "undefined") {
		g_scene.remove(g_cube_material_solid);
		g_scene.remove(g_cube_wireframe1);
		g_scene.remove(g_cube_wireframe2);
		g_scene.remove(g_cube_wireframe3);
    }
    if (MELONE_SimulationOptions.DISPLAY_CUBE) {

	// Create geometries
	var a = (MELONE_SimulationOptions.SPHERE_RADIUS + MELONE_SimulationOptions.SPHERE_RADIUS_MINIMUM) * 2;
	var cube_geometry = new THREE.CubeGeometry(a, a, a);
	var cube_geometry_wire = convertCubeGeometry2LineGeometry(cube_geometry);

	// Create materials
	var material_solid = new THREE.MeshBasicMaterial({
	    color : 0x010101,
	    side : THREE.DoubleSide,
	    depthTest : true,
	    transparent : false,
	    opacity : 0.1,
	    polygonOffset : true,
	    polygonOffsetFactor : 1,
	    polygonOffsetUnits : 1
	});
	var material_dash_wireframe = new THREE.LineDashedMaterial({
	    color : 0x666666,
	    depthTest : false,
	    dashSize : 50,
	    gapSize : 100,
	    polygonOffset : true,
	    polygonOffsetFactor : 1,
	    polygonOffsetUnits : 1
	});
	var material_solid_wireframe = new THREE.MeshBasicMaterial({
	    color : 0x666666,
	    depthTest : true,
	    wireframe : true,
	    polygonOffset : true,
	    polygonOffsetFactor : 1,
	    polygonOffsetUnits : 1
	});

	// Render four cubes with same geometry
	g_cube_wireframe1 = new THREE.Line(cube_geometry_wire, material_dash_wireframe, THREE.LinePieces);
	g_scene.add(g_cube_wireframe1);
	g_cube_material_solid = new THREE.Mesh(cube_geometry, material_solid);
	g_scene.add(g_cube_material_solid);
	g_cube_wireframe2 = new THREE.Line(cube_geometry_wire, material_dash_wireframe, THREE.LinePieces);
	g_scene.add(g_cube_wireframe2);
	g_cube_wireframe3 = new THREE.Line(cube_geometry_wire, material_solid_wireframe, THREE.LinePieces);
	g_scene.add(g_cube_wireframe3);
    }
}

/**
 * Helper to create a line-geometry from a cube-geometry
 */

function convertCubeGeometry2LineGeometry(input) {
    "use strict";
    var geometry = new THREE.Geometry();
    var vertices = geometry.vertices;
    for (var i = 0; i < input.faces.length; i += 2) {
        var face1 = input.faces[i];
        var face2 = input.faces[i + 1];
        var c1 = input.vertices[face1.c].clone();
        var a1 = input.vertices[face1.a].clone();
        var a2 = input.vertices[face2.a].clone();
        var b2 = input.vertices[face2.b].clone();
        var c2 = input.vertices[face2.c].clone();
        vertices.push(c1, a1, a2, b2, b2, c2);
    }
    geometry.computeLineDistances();
    return geometry;
}

/**
 * Renders sphere for the node
 */

function renderNodeSphere(node) {
    "use strict";
    if (node.sphereCreated) {
        // Update position
        node.sphere.position.x = node.x;
        node.sphere.position.z = node.z;
        node.sphere.position.y = node.y;
        node.sphere.visible = !MELONE_SimulationOptions.SHOW_MELONE;
        node.sphere.material.color.setHex((node.masterNode == null) ? 0x00FF00 : 0x0000FF);
    } else {
        // Create sphere
        var material = new THREE.MeshLambertMaterial({
            reflectivity: 0.9,
            ambient: 0x3A3A3A,
            depthTest: false,
            transparent: true
        });
        node.sphere = new THREE.Mesh(new THREE.SphereGeometry(MELONE_SimulationOptions.SPHERE_RADIUS_MINIMUM), material);
        node.sphere.position.x = node.x;
        node.sphere.position.z = node.z;
        node.sphere.position.y = node.y;
		node.sphere.visible = false;
        g_scene.add(node.sphere);
        node.sphereCreated = true;
    }
}

/**
 * Renders a link - optional with arrow head
 */

function renderLineElementForLink(link) {
    "use strict";

    // Center position of the nodes
    var source_position = new THREE.Vector3(link.source.x, link.source.y, link.source.z);
    var target_position = new THREE.Vector3(link.target.x, link.target.y, link.target.z);

    if (link.linkWebGLCreated) {
        // Move existing line
        link.threeElement.geometry.vertices[0] = source_position;
        link.threeElement.geometry.vertices[1] = target_position;
        link.threeElement.geometry.verticesNeedUpdate = true;
        link.threeElement.visible = !MELONE_SimulationOptions.SHOW_MELONE;
    } else {
        // Create line
        var line_geometry = new THREE.Geometry();
        line_geometry.vertices.push(source_position);
        line_geometry.vertices.push(target_position);
        var line_material = new THREE.LineBasicMaterial({
            depthTest: false,
            transparent: true,
            opacity: 1.0
        });
        line_material.transparent = true;
        var line = new THREE.Line(line_geometry, line_material);
        line.visible = false;
        link.threeElement = line;
        link.linkWebGLCreated = true;
        g_scene.add(line);
    }
}

/**
 * Move light dependent on the position of the camera. The rotation of the
 * graphic is done by movement of the camera and not the rotation of the scene
 */

function updateLightPosition() {
    "use strict";
    g_light.position.x = g_control.object.position.x - 500;
    g_light.position.y = g_control.object.position.y - 500;
    g_light.position.z = g_control.object.position.z;
    g_light.target.position.set(0, 0, 0);
}

function resetCamera() {
    "use strict";
    g_camera.position.x = MELONE_SimulationOptions.SPHERE_RADIUS * 3;
    g_camera.position.y = MELONE_SimulationOptions.SPHERE_RADIUS * 3;
    g_camera.position.z = MELONE_SimulationOptions.SPHERE_RADIUS * 6;
    g_camera.lookAt(new THREE.Vector3(0, 0, 0));
}


/**
 * User interface to change parameters
 */
function initDatGui(container) {
    g_gui = new dat.GUI({
        autoPlace: false
    });

    f1 = g_gui.addFolder('Render Options');
    f1.add(MELONE_SimulationOptions, 'SHOW_MELONE')
        .name('Melone Texture')
        .onChange(
            function (value) {
                if (value) {
                    g_scene.add(g_balloon);
                } else {
                    g_scene.remove(g_balloon);
                }
            });
	f1.add(MELONE_SimulationOptions, 'DISPLAY_CUBE')
        .name('Show Box');		
	f1.open();		
  
    f3 = g_gui.addFolder('N-Body Simulation');
    f3.add(MELONE_SimulationOptions, 'RUN_SIMULATION')
        .name('Run');
    f3.add(MELONE_SimulationOptions, 'SPRING', 1.0, 20.0)
        .step(0.1)
        .name('Spring Link');
    f3.add(MELONE_SimulationOptions, 'CHARGE', 5, 80)
        .step(1.0)
        .name('Charge');
	f3.open();
 
    container.appendChild(g_gui.domElement);
}

/**
 * Call initialization
 */
initWebGL();