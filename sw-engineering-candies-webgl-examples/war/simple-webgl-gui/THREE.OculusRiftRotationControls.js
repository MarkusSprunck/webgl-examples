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

var g_oculusRiftSensor = [0, 0, 0, 0, 0, 0, 0, 0];

function oculus_rift_callback(input_model) {
    "use strict";
    g_oculusRiftSensor = input_model.values;
}

THREE.OculusRiftRotationControls = function(camera) {

    var that = this;
    this.camera = camera;
    this.lastId = -1;

    this.update = function() {

        // console.log(g_oculusRiftSensor);

        if (g_oculusRiftSensor) {

            // UPDATE IF NEW DATA ARE AVAILABLE
            var id = g_oculusRiftSensor[0];
            if (id > this.lastId) {

                // GET ROTATION OF OCULUS RIFT
                var x = g_oculusRiftSensor[4];
                var y = g_oculusRiftSensor[5];
                var z = g_oculusRiftSensor[6];
                var w = g_oculusRiftSensor[7];
                var quaternion = new THREE.Quaternion(x, y, z, w);

                // APPLY ROTATION TO CAMERA
                this.camera.quaternion.multiply(quaternion);
            }
            this.lastId = id;

            // REQUEST NEW DATA
            var currentTime = new Date().getTime();
            var deltaTime = currentTime - g_lastUpdateRequest;
            // console.log("time=" + deltaTime);

            importAgentData();
        }

    };

    var g_lastUpdateRequest = new Date().getTime();

    function importAgentData() {
        "use strict";

        g_lastUpdateRequest = new Date().getTime();
        var url = "http://localhost:8444";
        var script = document.createElement("script");
        script.setAttribute("type", "application/javascript");
        script.id = 'JSONP';
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
        }, 50);

    }

};
