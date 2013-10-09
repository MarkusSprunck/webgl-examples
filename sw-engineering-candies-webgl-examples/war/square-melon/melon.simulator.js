/**
 * Copyright (C) 2013, Markus Sprunck
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: -
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer. - Redistributions in binary
 * form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided
 * with the distribution. - The name of its contributor may be used to endorse
 * or promote products derived from this software without specific prior written
 * permission.
 *
 * this SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF this SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
/* jshint undef: true, unused: true, strict: true */
/**
 * Options for n-body simulation and rendering
 */

function SimulationOptions() {
    "use strict";
    return {
		RUN_SIMULATION: true,
        SPHERE_RADIUS: 1200.0,
        SPHERE_RADIUS_MINIMUM: 25.0,
        CHARGE: 30.0,
		THETA: 0.6,
        SPRING: 5.0,

        // Parameters for rendering
        SHOW_MELONE: true,       
		DISPLAY_CUBE : true
    };
}

/**
 * Node element with information for simulation and rendering
 */

function NNode(node) {
    "use strict";
    this.id = node.id;
    this.masterNode = null;

    this.x = node.x;
    this.y = node.y;
    this.z = node.z;

    this.force_x = 0.0;
    this.force_y = 0.0;
    this.force_z = 0.0;

    // Rendering elements
    this.sphere = {};
    this.sphereCreated = false;
    this.text = {};
    this.textCreated = false;
}

NNode.prototype.getRadius = function () {
    "use strict";
    return MELONE_SimulationOptions.SPHERE_RADIUS_MINIMUM;
};

function NLink(source, target) {
    "use strict";
    this.source = (source.masterNode == null) ? source : source.masterNode;
    this.target = (target.masterNode == null) ? target : target.masterNode;
    this.default_distance = this.getDistance();

    // Rendering elements
    this.threeElement = {};
    this.linkWebGLCreated = false;
    this.arrow = {};
    this.arrowCreated = false;
}

NLink.prototype.isVisible = function () {
    "use strict";
    return this.source.isVisible() && this.target.isVisible() || this.target.clusterIsVisible && this.source.isVisible();
};

NLink.prototype.getDistance = function () {
    "use strict";
    var deltaX = (this.source.x - this.target.x);
    var deltaY = (this.source.y - this.target.y);
    var deltaZ = (this.source.z - this.target.z);
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
}

function initRandomPosition(node) {
    var gamma = 2 * Math.PI * Math.random();
    var delta = Math.PI * Math.random();
    var radius = MELONE_SimulationOptions.SPHERE_RADIUS * 0.95;
    node.x = radius * Math.sin(delta) * Math.cos(gamma);
    node.y = radius * Math.sin(delta) * Math.sin(gamma);
    node.z = radius * Math.cos(delta);
};

/**
 * Implementation of Barnes-Hut algorithm for a three-dimensional simulation of
 * charge 
 */
BarnesHutAlgorithmOctTree = function (options) {
    "use strict";
    // Parameter needed for the simulation
    if (typeof (options) !== "undefined") {
        if (typeof (options.SPHERE_RADIUS) !== "undefined") {
            MELONE_SimulationOptions.SPHERE_RADIUS = options.SPHERE_RADIUS;
        }
        if (typeof (options.SPHERE_RADIUS_MINIMUM) !== "undefined") {
            MELONE_SimulationOptions.SPHERE_RADIUS_MINIMUM = options.SPHERE_RADIUS_MINIMUM;
        }
        if (typeof (options.CHARGE) !== "undefined") {
            MELONE_SimulationOptions.CHARGE = options.CHARGE;
        }
        if (typeof (options.THETA) !== "undefined") {
            MELONE_SimulationOptions.THETA = options.THETA;
        }       
    }

      BarnesHutAlgorithmOctTree.prototype.run = function (nodes) {
        var size = MELONE_SimulationOptions.SPHERE_RADIUS;
        MELONE_OctTreeRoot = new BarnesHutAlgorithmOctNode(-size, size, -size, size, -size, size);
        var node;
        if (nodes.length > 1) {
            for (var i = 0; i < nodes.length; i++) {
                node = nodes[i];
                MELONE_OctTreeRoot.addNode(node);
            }
            MELONE_OctTreeRoot.calculateAveragesAndSumOfMass();
            for (i = 0; i < nodes.length; i++) {
                node = nodes[i];
                MELONE_OctTreeRoot.calculateForces(node);
            }
        }
    };
};

BarnesHutAlgorithmOctNode = function (xMin, xMax, yMin, yMax, zMin, zMax) {
    "use strict";
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
    this.zMin = zMin;
    this.zMax = zMax;
    this.sum_mass = 0;
    this.sum_x = 0;
    this.sum_y = 0;
    this.sum_z = 0;
    this.node = null;
    this.children = null;
    this.diameter = (((xMax - xMin) + (yMax - yMin) + (zMax - zMin)) / 3);
};

BarnesHutAlgorithmOctNode.prototype.isFilled = function () {
    "use strict";
    return (this.node != null);
};

BarnesHutAlgorithmOctNode.prototype.isParent = function () {
    "use strict";
    return (this.children != null);
};

BarnesHutAlgorithmOctNode.prototype.isFitting = function (node) {
    "use strict";
    return ((node.x >= this.xMin) && (node.x <= this.xMax) && (node.y >= this.yMin) && (node.y <= this.yMax) && (node.z >=
        this.zMin) && (node.z <= this.zMax));
};

BarnesHutAlgorithmOctNode.prototype.addNode = function (new_node) {
    "use strict";
    if (this.isFilled() || this.isParent()) {
        var relocated_node;
        if (MELONE_SimulationOptions.SPHERE_RADIUS_MINIMUM > this.diameter) {
            var radius = Math.sqrt(new_node.x * new_node.x + new_node.y * new_node.y + new_node.z * new_node.z);
            var factor = (radius - MELONE_SimulationOptions.SPHERE_RADIUS_MINIMUM) / radius;
            new_node.x *= factor;
            new_node.y *= factor;
            new_node.z *= factor;
            relocated_node = this.node;
            this.node = null;
            this.sum_mass = 0;
            this.sum_x = 0;
            this.sum_y = 0;
            this.sum_z = 0;
            MELONE_OctTreeRoot.addNode(relocated_node);
            return;
        }

        if (!this.isParent()) {
            var xMiddle = (this.xMin + this.xMax) / 2;
            var yMiddle = (this.yMin + this.yMax) / 2;
            var zMiddle = (this.zMin + this.zMax) / 2;

            // create children
            this.children = [];
            this.children
                .push(new BarnesHutAlgorithmOctNode(xMiddle, this.xMax, yMiddle, this.yMax, zMiddle, this.zMax));
            this.children
                .push(new BarnesHutAlgorithmOctNode(this.xMin, xMiddle, yMiddle, this.yMax, zMiddle, this.zMax));
            this.children
                .push(new BarnesHutAlgorithmOctNode(this.xMin, xMiddle, this.yMin, yMiddle, zMiddle, this.zMax));
            this.children
                .push(new BarnesHutAlgorithmOctNode(xMiddle, this.xMax, this.yMin, yMiddle, zMiddle, this.zMax));
            this.children
                .push(new BarnesHutAlgorithmOctNode(xMiddle, this.xMax, yMiddle, this.yMax, this.zMin, zMiddle));
            this.children
                .push(new BarnesHutAlgorithmOctNode(this.xMin, xMiddle, yMiddle, this.yMax, this.zMin, zMiddle));
            this.children
                .push(new BarnesHutAlgorithmOctNode(this.xMin, xMiddle, this.yMin, yMiddle, this.zMin, zMiddle));
            this.children
                .push(new BarnesHutAlgorithmOctNode(xMiddle, this.xMax, this.yMin, yMiddle, this.zMin, zMiddle));

            // re-locate old node (add into children)
            relocated_node = this.node;
            this.node = null;
            this.sum_mass = 0;
            this.sum_x = 0;
            this.sum_y = 0;
            this.sum_z = 0;

            this.addChildNode(relocated_node);
        }

        // now add new node into children
        if (this.isParent()) {
            this.addChildNode(new_node);
        }

    } else {
        this.node = new_node;
        this.sum_mass = 1.0;
        this.sum_x = this.node.x;
        this.sum_y = this.node.y;
        this.sum_z = this.node.z;
        this.node.force_x = 0.0;
        this.node.force_y = 0.0;
        this.node.force_z = 0.0;
    }
};

BarnesHutAlgorithmOctNode.prototype.addChildNode = function (node) {
    "use strict";
    if (this.isParent()) {
        for (var index = 0; index < 8; index++) {
            var child = this.children[index];
            if (child.isFitting(node)) {
                child.addNode(node);
                return;
            }
        }
    }
    // Unable to add node -> has to be relocated
    initRandomPosition(node);
    MELONE_OctTreeRoot.addNode(node);
};

BarnesHutAlgorithmOctNode.prototype.calculateForces = function (new_node) {
    "use strict";
    if (this.sum_mass > 0.01 || this.isFilled()) {
        var deltaX, deltaY, deltaZ;
        if (this.isFilled()) {
            deltaX = (this.node.x - new_node.x);
            deltaY = (this.node.y - new_node.y);
            deltaZ = (this.node.z - new_node.z);
        } else {
            deltaX = (this.sum_x / this.sum_mass - new_node.x) * new_node.mass;
            deltaY = (this.sum_y / this.sum_mass - new_node.y) * new_node.mass;
            deltaZ = (this.sum_z / this.sum_mass - new_node.z) * new_node.mass;
        }

        var radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        var radius_squared = Math.pow((radius > 1e-6) ? radius : 1e-6, 2);
        var treatInternalNodeAsSingleBody = this.diameter / radius < MELONE_SimulationOptions.THETA;
        if (this.isFilled() || treatInternalNodeAsSingleBody) {
            new_node.force_x -= (deltaX * MELONE_SimulationOptions.CHARGE) / radius_squared;
            new_node.force_y -= (deltaY * MELONE_SimulationOptions.CHARGE) / radius_squared;
            new_node.force_z -= (deltaZ * MELONE_SimulationOptions.CHARGE) / radius_squared;
        } else if (this.isParent()) {
            for (var index = 0; index < 8; index++) {
                var child = this.children[index];
                if (child.isFilled() || this.isParent()) {
                    child.calculateForces(new_node);
                }
            }
        }
    }
};

BarnesHutAlgorithmOctNode.prototype.calculateAveragesAndSumOfMass = function () {
    "use strict";
    if (this.isParent()) {
        var child;
        for (var index = 0; index < 8; index++) {
            child = this.children[index];
            child.calculateAveragesAndSumOfMass();
        }

        this.sum_mass = 0;
        this.sum_x = 0;
        this.sum_y = 0;
        this.sum_z = 0;
        for (index = 0; index < 8; index++) {
            child = this.children[index];
            if (child.isFilled() || this.isParent()) {
                this.sum_mass += child.sum_mass;
                this.sum_x += child.sum_x;
                this.sum_y += child.sum_y;
                this.sum_z += child.sum_z;
            }
        }
    }
};

/**
 * n-body simulator makes the Branes-Hut simulation and adds the link forces.
 */
var NBodySimulator = function () {
    "use strict";

    // all existing nodes and links
    this.node_list = [];
    this.link_list = [];

    this.octTree = new BarnesHutAlgorithmOctTree();

    // all nodes and links that are in the current filter
    this.node_list_visible = [];
    this.link_list_visible = [];

    this.node_list_simulate = [];

    this.node_list_visible_last = [];
    this.link_list_visible_last = [];

    this.maxNodeCalls = 0;

    NBodySimulator.prototype.simulateAllForces = function () {
        var me = this;

        this.node_list_simulate = [];
        this.node_list.forEach(function (node) {
            if (node.masterNode == null) {
                me.node_list_simulate.push(node);
            }
        });

        // Execute Barnes-Hut simulation
        this.octTree = new BarnesHutAlgorithmOctTree();
        this.octTree.run(this.node_list_simulate);

        // Calculate link forces

        this.link_list.forEach(function (link) {
            me.calcLinkForce(link);
        });

        this.node_list_simulate.forEach(function (node) {
            me.applyForces(node);
            me.scaleToBeInSphere(node);
            me.resetForces(node);
        });

        // Scale and apply all forces
        this.node_list.forEach(function (node) {
            if (node.masterNode != null) {
                node.x = node.masterNode.x;
                node.y = node.masterNode.y;
                node.z = node.masterNode.z;
            }
        });

    };

	
	NBodySimulator.prototype.updateBalloon = function (sphere) {
		"use strict";
		var vertices = sphere.geometry.vertices;
		for (var i = 0; i < vertices.length; i++) {
			vertices[i].x = this.node_list[i].x;
			vertices[i].y = this.node_list[i].y;
			vertices[i].z = this.node_list[i].z;
		}
		sphere.geometry.verticesNeedUpdate = true;
	}

	
	NBodySimulator.prototype.createModelFromSphere = function (sphere) {
		"use strict";
		var vertices = sphere.geometry.vertices;
		for (var i = 0; i < vertices.length; i++) {
			var newNode = {
				"id": i,
				"alias": ('id' + i),
				"x": vertices[i].x,
				"y": vertices[i].y,
				"z": vertices[i].z
			};
			this.node_list.push(new NNode(newNode));
		}

		// Merge double nodes
		for (var k = 1; k <= sphere.geometry.widthSegments; k++) {
			this.node_list[k].masterNode = this.node_list[0];
		}

		for (var k = 1; k < sphere.geometry.heightSegments; k++) {
			var indexNode1 = (sphere.geometry.widthSegments) + k * (sphere.geometry.widthSegments + 1);
			var indexNode2 = (sphere.geometry.widthSegments + 1) + (k - 1) * (sphere.geometry.widthSegments + 1);
			this.node_list[indexNode1].masterNode = this.node_list[indexNode2];
		}

		for (var k = 1; k <= sphere.geometry.widthSegments; k++) {
			var indexNode1 = vertices.length - 1 - k;
			var indexNode2 = vertices.length - 1;
			this.node_list[indexNode1].masterNode = this.node_list[indexNode2];
		}

		var faces = sphere.geometry.faces;
		for (var k = 0; k < faces.length; k++) {
			// Create links
			var sourceNode = this.node_list[faces[k].a];
			var targetNode = this.node_list[faces[k].b];
			this.link_list.push(new NLink(sourceNode, targetNode));

			// Create last row of links
			if (k >= faces.length - sphere.geometry.widthSegments) {
				sourceNode = this.node_list[faces[k].b];
				targetNode = this.node_list[faces[k].c];
				this.link_list.push(new NLink(sourceNode, targetNode));
			}
		}
	};

	
    /**
     * Each link acts as simple spring. There are two types of nodes and links.
     */
    NBodySimulator.prototype.calcLinkForce = function (link) {
        var deltaX = (link.source.x - link.target.x);
        var deltaY = (link.source.y - link.target.y);
        var deltaZ = (link.source.z - link.target.z);
        var radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        if (radius > 1e-6) {
            var factor = (radius - link.default_distance) / radius / radius * MELONE_SimulationOptions.SPRING;
            link.source.force_x -= (deltaX) * factor;
            link.source.force_y -= (deltaY) * factor;
            link.source.force_z -= (deltaZ) * factor;
            link.target.force_x += (deltaX) * factor;
            link.target.force_y += (deltaY) * factor;
            link.target.force_z += (deltaZ) * factor;
        }
    };

    /**
     * Ensure that the new position is in the sphere. Nodes which leave the
     * sphere would be ignored by OctTree (Barnes-Hut-Algorithm).
     */
    NBodySimulator.prototype.scaleToBeInSphere = function (node) {
        node.x = Math.min(Math.max(1 - MELONE_SimulationOptions.SPHERE_RADIUS, node.x),
            MELONE_SimulationOptions.SPHERE_RADIUS - 1);
        node.y = Math.min(Math.max(1 - MELONE_SimulationOptions.SPHERE_RADIUS, node.y),
            MELONE_SimulationOptions.SPHERE_RADIUS - 1);
        node.z = Math.min(Math.max(1 - MELONE_SimulationOptions.SPHERE_RADIUS, node.z),
            MELONE_SimulationOptions.SPHERE_RADIUS - 1);
    };

    /**
     * Move the nodes depending of the forces
     */
    NBodySimulator.prototype.applyForces = function (node) {
        node.x += node.force_x;
        node.y += node.force_y;
        node.z += node.force_z;
    };

    /**
     * Reset all forces of the node to zero
     */
    NBodySimulator.prototype.resetForces = function (node) {
        node.force_x = 0;
        node.force_y = 0;
        node.force_z = 0;
    };
};

/**
 * global variables
 */
var MELONE_SimulationOptions = new SimulationOptions();
var MELONE_OctTreeRoot = {};
var MELONE_NBodySimulator = new NBodySimulator();