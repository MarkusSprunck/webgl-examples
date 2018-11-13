/*******************************************************************************
 * Copyright (C) 2013-2018, Markus Sprunck
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
var BORDER_BOTTOM = 10;

/**
 * Global variables for rendering
 */
var g_panelWidthWebGL;
var g_panelHeightWebGL;
var g_scene;
var g_camera;
var g_renderer;
var g_control;
var g_gui;
var g_melon;

/**
 * Initialize WebGL
 */
function initWebGL() {
	"use strict";
	// Container for WebGL rendering
	var container = document.getElementById('graphic-container');
	container.style.background = "#444444";
	initDatGui(container);
	
	// Size of drawing
	g_panelWidthWebGL = window.innerWidth - BORDER_RIGHT - BORDER_LEFT;
	g_panelHeightWebGL = window.innerHeight - BORDER_BOTTOM - BORDER_TOP;

	// Create g_camera
	g_camera = new THREE.PerspectiveCamera(40, g_panelWidthWebGL
			/ g_panelHeightWebGL, 1, 40000);
	resetCamera();

	// Create g_scene
	g_scene = new THREE.Scene();
	g_scene.add(g_camera);

	// Create g_renderer
	if (Detector.webgl) {
		g_renderer = new THREE.WebGLRenderer({
			antialias : true
		});
	} else {
		container.appendChild(Detector.getWebGLErrorMessage());
		return;
	}
	g_renderer.setSize(g_panelWidthWebGL, g_panelHeightWebGL);
	g_renderer.setClearColor(0x444444);
	container.appendChild(g_renderer.domElement);


	// LIGHTS
	var light = new THREE.DirectionalLight( 0xffffff, 1.475 );
	light.position.set( -1000, 1000, 1000 );
	g_scene.add( light );

	var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3 );
	hemiLight.position.set( 0, 5000, 0 );
	g_scene.add( hemiLight );

	// Support window resize
	var resizeCallback = function() {
		g_panelWidthWebGL = window.innerWidth - BORDER_RIGHT - BORDER_LEFT;
		g_panelHeightWebGL = window.innerHeight - BORDER_BOTTOM - BORDER_TOP;
		var devicePixelRatio = window.devicePixelRatio || 1;
		g_renderer.setSize(g_panelWidthWebGL * devicePixelRatio,
				g_panelHeightWebGL * devicePixelRatio);
		g_renderer.domElement.style.width = g_panelWidthWebGL + 'px';
		g_renderer.domElement.style.height = g_panelHeightWebGL + 'px';
		resetCamera();
		g_camera.updateProjectionMatrix();
		g_gui.domElement.style.position = 'absolute';
		g_gui.domElement.style.right = '' + (BORDER_RIGHT) + 'px';
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
	g_control.keys = [ 65, 83, 68 ];
	g_control.addEventListener('change', renderer);

	// create melone with texture
	var loader = new THREE.TextureLoader();
	loader.load('melon.jpg', function(texture) {
		var geometry = new THREE.SphereGeometry(800, 16, 20);
		var material = new THREE.MeshLambertMaterial({
			map : texture,
			depthTest : true
		});
		g_melon = new THREE.Mesh(geometry, material);
		g_melon.geometry.dynamic = true;
		if (MELONE_SimulationOptions.SHOW_MELON_TEXTURE) {
			g_scene.add(g_melon);
		}
		MELONE_NBodySimulator.createModelFromSphere(g_melon);
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
	
	// simulate forces
	if (MELONE_SimulationOptions.RUN_SIMULATION) {
		for (var i = 0; i < 3; i++) {
			MELONE_NBodySimulator.simulateAllForces();
		}
	}

	// update position of the melone
	if (null != g_melon) {
		MELONE_NBodySimulator.updateMelon(g_melon);
	}

	// update wire frame
	var nodes = MELONE_NBodySimulator.node_list;
	for ( var i = 0; i < nodes.length; i++) {
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
 * Renders sphere for the node
 */

function renderNodeSphere(node) {
	"use strict";
	if (node.sphereCreated) {
		// Update position
		node.sphere.position.x = node.x;
		node.sphere.position.z = node.z;
		node.sphere.position.y = node.y;
		node.sphere.visible = !MELONE_SimulationOptions.SHOW_MELON_TEXTURE;
	} else {
		// Create sphere
		var material = new THREE.MeshLambertMaterial({
			reflectivity : 0.9,
			depthTest : true,
			transparent : true,
			color : 0x444444
		});
		node.sphere = new THREE.Mesh(new THREE.SphereGeometry(
				MELONE_SimulationOptions.SPHERE_RADIUS_MINIMUM), material);
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
	var source_position = new THREE.Vector3(link.source.x, link.source.y,
			link.source.z);
	var target_position = new THREE.Vector3(link.target.x, link.target.y,
			link.target.z);

	if (link.linkWebGLCreated) {
		// Move existing line
		link.threeElement.geometry.vertices[0] = source_position;
		link.threeElement.geometry.vertices[1] = target_position;
		link.threeElement.geometry.verticesNeedUpdate = true;
		link.threeElement.visible = !MELONE_SimulationOptions.SHOW_MELON_TEXTURE;
	} else {
		// Create line
		var line_geometry = new THREE.Geometry();
		line_geometry.vertices.push(source_position);
		line_geometry.vertices.push(target_position);
		var line_material = new THREE.LineBasicMaterial({
			depthTest : true,
			transparent : true,
			opacity : 1.0,
			color: 0xAAAAAA
		});
		line_material.transparent = true;
		var line = new THREE.Line(line_geometry, line_material);
		line.visible = false;
		link.threeElement = line;
		link.linkWebGLCreated = true;
		g_scene.add(line);
	}
}

function resetCamera() {
	"use strict";
	g_camera.position.x = MELONE_SimulationOptions.SPHERE_RADIUS * 2.5;
	g_camera.position.y = MELONE_SimulationOptions.SPHERE_RADIUS * 2.5;
	g_camera.position.z = MELONE_SimulationOptions.SPHERE_RADIUS * 4;
	g_camera.lookAt(new THREE.Vector3(0, 0, 0));
}

/**
 * User interface to change parameters
 */
function initDatGui(container) {
	g_gui = new dat.GUI({
		autoPlace : false
	});

	f1 = g_gui.addFolder('Render Options');
	f1.add(MELONE_SimulationOptions, 'SHOW_MELON_TEXTURE').name('Show Texture')
			.onChange(function(value) {
				if (value) {
					g_scene.add(g_melon);
				} else {
					g_scene.remove(g_melon);
				}
			});
	f1.open();
	
	f3 = g_gui.addFolder('N-Body Simulation');
	f3.add(MELONE_SimulationOptions, 'RUN_SIMULATION').name('Run');
	f3.add(MELONE_SimulationOptions, 'SPRING', 5.0, 20.0).step(1.0).name(
			'Spring Link');
	f3.add(MELONE_SimulationOptions, 'CHARGE', 5, 40).step(1.0).name('Charge');
	f3.open();
	
	container.appendChild(g_gui.domElement);
}

/**
 * Call initialization
 */
initWebGL();