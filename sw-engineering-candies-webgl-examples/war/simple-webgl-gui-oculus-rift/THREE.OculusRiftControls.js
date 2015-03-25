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

var g_oculusRiftSensorData = [0, 0, 0, 0, 0, 0, 0, 0];

function oculus_rift_callback(input_model) {
    "use strict";
    g_oculusRiftSensorData = input_model.values;
}

THREE.OculusRiftRotationControls = function(camera, scale, position) {
    
    console.log('THREE.OculusRiftRotationControls 1');

    var that = this;
    this.camera = camera;
    this.lastId = -1;
    this.scale = scale;
    this.position = position;
    this.url = "http:\\\\localhost:8444";
    this.isConnected = false;
    this.lastUpdate = new Date().getTime();
    this.tryConnection = false;

    this.controller = new THREE.Object3D();
    this.headPos = new THREE.Vector3();
    this.headQuat = new THREE.Quaternion();

    this.update = function() {

        // update within the last 100 milliseconds
        this.isConnected = (new Date().getTime() < this.lastUpdate + 250);

        if (g_oculusRiftSensorData) {

            // UPDATE IF NEW DATA ARE AVAILABLE
            var id = g_oculusRiftSensorData[0];
            if (id > this.lastId) {

                this.headPos.set(g_oculusRiftSensorData[1] * this.scale + this.position.x, g_oculusRiftSensorData[2]
                            * this.scale + this.position.y, g_oculusRiftSensorData[3] * this.scale + this.position.z);
                this.headQuat.set(g_oculusRiftSensorData[4], g_oculusRiftSensorData[5], g_oculusRiftSensorData[6],
                            g_oculusRiftSensorData[7]);

                this.camera.setRotationFromQuaternion(this.headQuat);
                this.controller.setRotationFromMatrix(this.camera.matrix);
                this.camera.position.addVectors(this.controller.position, this.headPos);

                this.lastUpdate = new Date().getTime();
            }
            this.lastId = id;

            // Request new data
            if (this.tryConnection) {
                this.importData();
            }
        }

    };

    var g_lastUpdateRequest = new Date().getTime();

    this.importData = function() {
        "use strict";

        g_lastUpdateRequest = new Date().getTime();
        var script = document.createElement("script");
        script.setAttribute("type", "application/javascript");
        script.id = 'JSONP';
        var url = this.url;
        url += "?" + g_lastUpdateRequest;
        script.setAttribute("src", url);
        document.body.appendChild(script);
        setTimeout(function() {
            var script;
            while (script = document.getElementById('JSONP')) {
                script.parentNode.removeChild(script);
                for ( var prop in script) {
                    delete script[prop];
                }
            }
        }, 20);

    }

    this.getUrl = function() {
        "use strict";

        return this.url;
    }

    this.setUrl = function(url) {
        "use strict";

        this.url = url;
    }
    
    this.setActive = function(tryConnection) {
        "use strict";

        this.tryConnection = tryConnection;
    }

    this.isOculusRiftConnected = function() {
        "use strict";

        return this.isConnected;
    }

};
