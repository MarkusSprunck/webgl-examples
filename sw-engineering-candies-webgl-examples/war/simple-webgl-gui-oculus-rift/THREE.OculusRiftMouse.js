/*******************************************************************************
 * Copyright (C) 2015, Markus Sprunck All rights reserved. Redistribution and
 * use in source and binary forms, with or without modification, are permitted
 * provided that the following conditions are met: - Redistributions of source
 * code must retain the above copyright notice, this list of conditions and the
 * following disclaimer. - Redistributions in binary form must reproduce the
 * above copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the distribution. -
 * The name of its contributor may be used to endorse or promote products
 * derived from this software without specific prior written permission. THIS
 * SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 ******************************************************************************/

THREE.OculusRiftMousePointerHelper = function(parameters) {

    console.log('THREE.OculusRiftMousePointerHelper v0.2');

    var that = this;
    this.style = "default";

    parameters = parameters || {};

    // MANDATORY PARAMETERS
    this.initSucceeded = true;
    this.camera = (parameters.camera !== undefined) ? parameters.camera : null;
    if (null === this.camera) {
        console.warn('THREE.OculusRiftMousePointerHelper missing parameter \'camera\'');
        this.initSucceeded = false;
    }
    var domElement = (parameters.domElement !== undefined) ? parameters.domElement : null;
    if (null === this.domElement) {
        console.warn('THREE.OculusRiftMousePointerHelper missing parameter \'domElement\'');
        this.initSucceeded = false;
    }

    // OPTIONAL PARAMETERS
    this.size = (parameters.size !== undefined) ? parameters.size : 0.012;
    this.distance = (parameters.distance !== undefined) ? parameters.distance : 0.9;

    // CREATE MOUSE LINES
    this.pointMapBorders = {};
    var geometryBorders = new THREE.Geometry();
    addLine("n0", "n1");
    addLine("n5", "n2");
    addLine("n6", "n0");
    addLine("n3", "n4");

    function addLine(a, b) {
        addPoint(a);
        addPoint(b);
    }

    function addPoint(id) {
        geometryBorders.vertices.push(new THREE.Vector3());
        geometryBorders.colors.push(new THREE.Color(0xFF0000));
        if (that.pointMapBorders[id] === undefined) {
            that.pointMapBorders[id] = [];
        }
        that.pointMapBorders[id].push(geometryBorders.vertices.length - 1);
    }

    var materialBorders = new THREE.LineBasicMaterial({
                color: 0xffffff,
                vertexColors: THREE.FaceColors
    });
    THREE.Line.call(this, geometryBorders, materialBorders, THREE.Mesh);

    if (this.initSucceeded) {

        this.matrix = this.camera.matrixWorld;
        this.matrixAutoUpdate = false;

        // HIDE STANDARD CURSOR OF BROWSER
        domElement.style.cursor = "none";

        // TRACK MOUSE MOVEMENT
        this.mouse = new THREE.Vector2();

        function mousemove(event) {
            that.mouse.x = +(event.clientX / window.innerWidth) * 2 - 1;
            that.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }

        domElement.addEventListener('mousemove', mousemove.bind(this), false);
    }
    this.update();
};

THREE.OculusRiftMousePointerHelper.prototype = Object.create(THREE.Line.prototype);

THREE.OculusRiftMousePointerHelper.prototype.setMouse = function(style) {
    this.style = style;
}

THREE.OculusRiftMousePointerHelper.prototype.update = function() {

    var _geometry;
    var _pointMap;
    var _vector = new THREE.Vector3();
    var _camera = new THREE.Camera();

    var setPoint = function(point, x, y, z) {
        _vector.set(x, y, z).unproject(_camera);
        var points = _pointMap[point];
        if (points !== undefined) {
            for (var i = 0, il = points.length; i < il; i++) {
                _geometry.vertices[points[i]].copy(_vector);
            }
        }
    };

    // UPDATE MOUSE POINTER POSITION
    return function() {
        if (this.initSucceeded) {
            _geometry = this.geometry;
            _pointMap = this.pointMapBorders;
            _camera.projectionMatrix.copy(this.camera.projectionMatrix);
            _geometry.verticesNeedUpdate = true;

            var aspect = window.innerWidth / window.innerHeight;
            var delta_w = this.size;
            var delta_h = this.size * aspect;

            if (this.style === "text") {
                setPoint("n0", this.mouse.x - delta_w / 4 * 3, this.mouse.y - delta_h, this.distance);
                setPoint("n1", this.mouse.x - delta_w / 4, this.mouse.y - delta_h, this.distance);
                setPoint("n6", this.mouse.x - delta_w / 4, this.mouse.y - delta_h, this.distance);
                setPoint("n3", this.mouse.x - delta_w / 4 * 3, this.mouse.y + delta_h, this.distance);
                setPoint("n4", this.mouse.x - delta_w / 4, this.mouse.y + delta_h, this.distance);
                setPoint("n5", this.mouse.x - delta_w / 2, this.mouse.y - delta_h, this.distance);
                setPoint("n2", this.mouse.x - delta_w / 2, this.mouse.y + delta_h, this.distance);
            } else if (this.style === "w-resize") {
                setPoint("n0", this.mouse.x - delta_w, this.mouse.y - delta_h / 4 * 3, this.distance);
                setPoint("n1", this.mouse.x - delta_w, this.mouse.y - delta_h / 4, this.distance);
                setPoint("n6", this.mouse.x - delta_w, this.mouse.y - delta_h / 4, this.distance);
                setPoint("n3", this.mouse.x + delta_w, this.mouse.y - delta_h / 4 * 3, this.distance);
                setPoint("n4", this.mouse.x + delta_w, this.mouse.y - delta_h / 4, this.distance);
                setPoint("n5", this.mouse.x - delta_w, this.mouse.y - delta_h / 2, this.distance);
                setPoint("n2", this.mouse.x + delta_w, this.mouse.y - delta_h / 2, this.distance);
            } else if (this.style === "pointer") {
                setPoint("n0", this.mouse.x - delta_w, this.mouse.y, this.distance);
                setPoint("n1", this.mouse.x + delta_w, this.mouse.y, this.distance);
                setPoint("n6", this.mouse.x - delta_w, this.mouse.y, this.distance);
                setPoint("n0", this.mouse.x + delta_w, this.mouse.y, this.distance);
                setPoint("n5", this.mouse.x, this.mouse.y - delta_h, this.distance);
                setPoint("n2", this.mouse.x, this.mouse.y + delta_h, this.distance);
                setPoint("n3", this.mouse.x, this.mouse.y - delta_h, this.distance);
                setPoint("n4", this.mouse.x, this.mouse.y + delta_h, this.distance);
            } else {
                setPoint("n0", this.mouse.x, this.mouse.y, this.distance);
                setPoint("n1", this.mouse.x + 2 * delta_w, this.mouse.y - delta_h, this.distance);
                setPoint("n2", this.mouse.x + delta_w, this.mouse.y - 2 * delta_h, this.distance);
                setPoint("n3", this.mouse.x + 1.5 * delta_w, this.mouse.y - 1.5 * delta_h, this.distance);
                setPoint("n4", this.mouse.x + 3 * delta_w, this.mouse.y - 3 * delta_h, this.distance);
                setPoint("n5", this.mouse.x + 2 * delta_w, this.mouse.y - delta_h, this.distance);
                setPoint("n6", this.mouse.x + delta_w, this.mouse.y - 2 * delta_h, this.distance);
            }
        }
    };

}();
