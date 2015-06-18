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

THREE.OculusRiftMousePointerHelper = function(scene, parameters) {

    console.log('THREE.OculusRiftMousePointerHelper 1');

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
    this.distance = (parameters.distance !== undefined) ? parameters.distance : 0.95;

    // Create mouse pointers
    this.sprite_default = this.loadMouseCursorSprite("textures/mouse_default.png");
    scene.add(this.sprite_default);

    this.sprite_resize = this.loadMouseCursorSprite("textures/mouse_resize.png");
    scene.add(this.sprite_resize);

    this.sprite_pointer = this.loadMouseCursorSprite("textures/mouse_pointer.png");
    scene.add(this.sprite_pointer);

    this.sprite_text = this.loadMouseCursorSprite("textures/mouse_text.png");
    scene.add(this.sprite_text);

    if (this.initSucceeded) {

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
};

THREE.OculusRiftMousePointerHelper.prototype.loadMouseCursorSprite = function(path) {
    var texture = THREE.ImageUtils.loadTexture(path);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: texture,
                color: 0xffffff
    }));
    return sprite;
}

THREE.OculusRiftMousePointerHelper.prototype.setMouse = function(style) {
    this.style = style;
}

THREE.OculusRiftMousePointerHelper.prototype.update = function() {

    if (this.initSucceeded) {

        var vector = new THREE.Vector3();
        vector.set(this.mouse.x, this.mouse.y, this.distance).unproject(this.camera);

        this.sprite_text.visible = (this.style === "text");
        this.sprite_resize.visible = (this.style === "w-resize");
        this.sprite_pointer.visible = (this.style === "pointer");
        this.sprite_default.visible = (this.style !== "text") && (this.style !== "pointer")
                    && (this.style !== "w-resize");

        var x_delta = 21 / window.innerWidth;
        var y_delta = 21 / window.innerHeight;
        this.sprite_text.position.set(vector.x + x_delta, vector.y + y_delta, vector.z);
        this.sprite_resize.position.set(vector.x + x_delta, vector.y + y_delta, vector.z);
        this.sprite_pointer.position.set(vector.x + x_delta, vector.y + y_delta, vector.z);
        this.sprite_default.position.set(vector.x + x_delta, vector.y + y_delta, vector.z);
    }

};