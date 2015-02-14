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

/**
 * CONSTRUCTOR - Simple rendering with pure WebGL based on three.js without any
 * other 3rd party library. The look & feel should be like in the Chrome
 * Experiment DAT.GUI with some minor improvements. This is an early development
 * stage, so some features are missing.
 */
THREE.SimpleDatGui = function(parameters) {
    "use strict";

    console.log('THREE.SimpleDatGui v0.61');

    // Mandatory parameters
    if ((typeof parameters === "undefined") || (typeof parameters.scene === "undefined")
                || (typeof parameters.camera === "undefined") || (typeof parameters.renderer === "undefined")) {
        console.err("THREE.SimpleDatGui - missing parameter");
    }
    this.scene = parameters.scene;
    this.camera = parameters.camera;
    this.renderer = parameters.renderer;

    // Optional parameters
    var width = (parameters.width !== undefined) ? parameters.width : 300;
    var position = (parameters.position !== undefined) ? parameters.position : new THREE.Vector3(-150, 100, 150);

    // For internal use only
    this._private = new THREE.SimpleDatGui.__internals(this);
    this._options = this._private.createOptions(position, width);

    // Close button is always part of user interface
    this.closeButton = new THREE.SimpleDatGuiControl(null, "Close Controls", 0, 0, this, true, false, this._options);
};

/**
 * Like in DAT.GUI
 */
THREE.SimpleDatGui.prototype.addFolder = function(name) {
    "use strict";
    var result = new THREE.SimpleDatGuiControl(null, name, 0, 0, this, false, false, this._options);
    this._private.children.push(result);
    return result;
}

/**
 * Like in DAT.GUI
 */
THREE.SimpleDatGui.prototype.add = function(object, property, minValue, maxValue) {
    "use strict";
    var result = new THREE.SimpleDatGuiControl(object, property, minValue, maxValue, this, false, true, this._options);
    this._private.children.push(result);
    return result;
}

/**
 * Like in DAT.GUI
 */
THREE.SimpleDatGui.prototype.close = function() {
    "use strict";
    this._private.closed = true;
    this._internal.updateCloseButtonText();
    return this;
}

/**
 * Difference to DAT.GUI - Because all the rendering is done in the scene this
 * method should be called before the rendering. In this function for each
 * element there happens the update of visibility, color and sensitivity to
 * mouse events.
 */
THREE.SimpleDatGui.prototype.update = function() {
    "use strict";

    // UPDATE RENDERING OF ALL CONTROLS
    var that = this;
    var indexOfVisibleControls = -1;
    this._private.children.forEach(function(child) {
        if (!child.isElementHidden) {
            indexOfVisibleControls++;
        }
        child.updateRendering(indexOfVisibleControls, that._private.closed);

        child._private.children.forEach(function(element) {
            if (!element.isElementHidden) {
                indexOfVisibleControls++;
            }
            element.updateRendering(indexOfVisibleControls, that._private.closed);
        });
    });
    this.closeButton.updateRendering((that._private.closed) ? 0 : (indexOfVisibleControls + 1), false);

    // JUST VISIBLE CONTROLS INTERACT WITH MOUSE
    var that = this;
    this._private.mouseBindings = [];
    if (!this._private.closed) {
        this._private.children.forEach(function(child) {
            // ALL VISIBLE FOLDER
            if (!child.isElementHidden) {
                if (!that.isElementFolder && child.isSliderControl()) {
                    that._private.mouseBindings.push(child.wValueSliderBar);
                    that._private.mouseBindings.push(child.wValueSliderField);
                } else {
                    that._private.mouseBindings.push(child.wArea);
                }
            }
            // ALL CONTROLS
            child._private.children.forEach(function(element) {
                if (!element.isElementHidden) {
                    if (!that.isElementFolder && element.isSliderControl()) {
                        that._private.mouseBindings.push(element.wValueSliderBar);
                        that._private.mouseBindings.push(element.wValueSliderField);
                    } else {
                        that._private.mouseBindings.push(element.wArea);
                    }
                }
            });
        });
    }
    that._private.mouseBindings.push(this.closeButton.wArea);
};

/**
 * Difference to DAT.GUI - the opacity makes the complete interface transparent.
 * This is just an optional feature which is helpful in some situations.
 */
THREE.SimpleDatGui.prototype.setOpacity = function(opacity) {
    "use strict";
    this._private.opacityGui = Math.max(20, Math.min(100, opacity));
    return this;
}

THREE.SimpleDatGui.__internals = function(gui) {
    this.gui = gui;

    // Status
    this.closed = false;
    this.opacityGui = 100;
    this.shiftPressed = false;

    // Active controls
    this.selected = null;
    this.focus = null;
    this.children = [];
    this.mouseBindings = [];

    // Needed to indicate mouse over changes of controls
    gui.renderer.domElement.addEventListener('mousemove', function(event) {
        gui._private.onMouseEvt(event);
    }.bind(gui));

    // Interact with controls
    gui.renderer.domElement.addEventListener('mousedown', function(event) {
        gui._private.onMouseEvt(event);
    }.bind(gui));

    // Get text input
    window.addEventListener('keypress', function(event) {
        gui._private.onKeyPressEvt(event);
    }.bind(gui));

    // Get state of SHIFT
    var that = this;
    window.addEventListener('keyup', function(event) {
        event = event || window.event;
        var charCode = (typeof event.which == "number") ? event.which : event.keyCode;
        if (charCode === 16 /* SHIFT */) {
            that.shiftPressed = false;
        }
    }.bind(gui));

    // Get state of SHIFT and special keys
    window.addEventListener('keydown', function(event) {
        event = event || window.event;
        var charCode = (typeof event.which == "number") ? event.which : event.keyCode;
        if (charCode === 16 /* SHIFT */) {
            that.shiftPressed = true;
        }
        gui._private.onKeyEvt(event);
    }.bind(gui));
};

/**
 * Get text input
 */
THREE.SimpleDatGui.__internals.prototype.onKeyPressEvt = function(event) {
    "use strict";

    // Get current control with focus and handle just text input
    var focus = this.gui._private.focus;
    if (focus !== null && focus.isTextControl()) {

        // Ensures compatibility between different browsers
        event = event || window.event;
        var charCode = (typeof event.which == "number") ? event.which : event.keyCode;

        // Insert new character
        var cursor = focus.textHelper.cursor;
        var oldText = focus.newText;
        var oldTextFirst = oldText.substring(0, cursor);
        var oldTextSecond = oldText.substring(cursor, oldText.length);
        var newCharacter = String.fromCharCode(charCode);
        focus.newText = oldTextFirst + newCharacter + oldTextSecond;

        // Truncate text if needed
        focus.textHelper.cursor = cursor + 1;
        focus.textHelper.calculateAlignTextLastCall(focus.newText);

        // Render new text
        focus._private.createTextValue(focus.textHelper.truncated);
    }
}

/**
 * 
 */
THREE.SimpleDatGui.__internals.prototype.createOptions = function(position, width) {

    var area_size = new THREE.Vector3(width, 20, 2.0);
    var delta_z_order = 0.1;
    var font_size = 7;
    var rightBorder = 4;
    var text_offset_x = 2;
    var text_field_size = new THREE.Vector3(0.6 * area_size.x - rightBorder, 14, delta_z_order);
    var valueFiledSize = new THREE.Vector3(0.2 * area_size.x, 14, delta_z_order);
    var labelTab1 = new THREE.Vector3(0.4 * area_size.x, 20, 2.0);
    var labelTab2 = new THREE.Vector3(area_size.x - rightBorder - valueFiledSize.x, 20, 2.0);
    var slider_field_size = new THREE.Vector3(labelTab2.x - labelTab1.x - rightBorder, 14, delta_z_order);
    var marker_size = new THREE.Vector3(3, area_size.y, area_size.z);
    var checkbox_filed_size = new THREE.Vector3(10, 10, delta_z_order);

    return {
                AREA: area_size,
                CHECKBOX: checkbox_filed_size,
                DELTA_Z: delta_z_order,
                FONT: font_size,
                MARKER: marker_size,
                NUMBER: valueFiledSize,
                OFFSET_X: text_offset_x,
                POSITION: position,
                RIGHT_BORDER: rightBorder,
                SLIDER: slider_field_size,
                TAB_1: labelTab1,
                TAB_2: labelTab2,
                TEXT: text_field_size,
                LABEL_OFFSET_Y: 4,
                COLOR_VALUE_FIELD: '0x303030'

    }
}

THREE.SimpleDatGui.__internals.prototype.updateCloseButtonText = function() {
    this.gui.closeButton._private.createLabel(this.gui._private.closed ? "Open Controls" : "Close Controls");
}

THREE.SimpleDatGui.__internals.prototype.onKeyEvt = function(event) {

    var blurDummyTextInputToHideKeyboard = function() {
        document.getElementById('simple_dat_gui_dummy_text_input').blur();
    }

    event = event || window.event;
    var charCode = (typeof event.which == "number") ? event.which : event.keyCode;

    "use strict";
    if (this.gui._private.focus !== null) {
        var value = this.gui._private.focus.newText;
        if (charCode === 9 /* TAB */|| charCode === 13 /* ENTER */) {

            this.gui._private.focus.lastValue = this.gui._private.focus.newText;
            this.gui._private.focus.object[this.gui._private.focus.property] = this.gui._private.focus.newText;
            this.gui._private.focus.executeCallback();

            this.gui._private.focus = null;

            // Workaround to deactivate keyboard on iOS
            blurDummyTextInputToHideKeyboard();

        } else if (charCode === 36 /* POS1 */) {
            this.gui._private.focus.textHelper.cursor = 0;
            this.gui._private.focus.textHelper.start = 0;
            this.gui._private.focus.textHelper.calculateAlignTextLastCall(value);
        } else if (charCode === 35 /* END */) {
            this.gui._private.focus.textHelper.cursor = value.length;
            this.gui._private.focus.textHelper.end = value.length - 1;
            this.gui._private.focus.textHelper.calculateAlignTextLastCall(value);
        } else if (charCode === 37 /* LEFT */) {
            console.log("LEFT -> Shift pressed=" + this.gui._private.shiftPressed + "  event=" + event.which);

            if (this.gui._private.focus.textHelper.cursor > 0) {
                this.gui._private.focus.textHelper.cursor -= 1;
            }
            if (this.gui._private.focus.textHelper.start > this.gui._private.focus.textHelper.cursor) {
                if (this.gui._private.focus.textHelper.start > 0) {
                    this.gui._private.focus.textHelper.start--;
                }
                this.gui._private.focus.textHelper.calculateAlignTextLastCall(value);
            }
        } else if (charCode === 39/* RIGHT */&& this.gui._private.focus.textHelper.cursor < value.length) {
            console.log("RIGHT -> Shift pressed=" + this.gui._private.shiftPressed + "  event=" + event.which);

            this.gui._private.focus.textHelper.cursor += 1;
            if (this.gui._private.focus.textHelper.cursor > this.gui._private.focus.textHelper.end) {
                this.gui._private.focus.textHelper.calculateAlignTextLastCall(value);
            }
        } else if (charCode === 46 /* ENTF */) {
            var value = this.gui._private.focus.newText;
            this.gui._private.focus.newText = value.substring(0, this.gui._private.focus.textHelper.cursor)
                        + value.substring(this.gui._private.focus.textHelper.cursor + 1, value.length);

            this.gui._private.focus.textHelper.calculateAlignTextLastCall(this.gui._private.focus.newText);

        } else if (charCode === 8 /* BACK_SPACE */) {

            event.preventDefault();

            var value = this.gui._private.focus.object[this.gui._private.focus.property];
            if (this.gui._private.focus.textHelper.cursor > 0) {
                var value = this.gui._private.focus.newText;
                this.gui._private.focus.newText = value.substring(0, this.gui._private.focus.textHelper.cursor - 1)
                            + value.substring(this.gui._private.focus.textHelper.cursor, value.length);

                this.gui._private.focus.textHelper.cursor -= 1;
                this.gui._private.focus.textHelper.calculateAlignTextLastCall(this.gui._private.focus.newText);
            }
        }
        if (this.gui._private.focus != null) {
            this.gui._private.focus._private.createTextValue(this.gui._private.focus.textHelper.truncated);
        }
    }
}

THREE.SimpleDatGui.__internals.prototype.onMouseEvt = function(event) {
    "use strict";

    var createDummyTextInputToShowKeyboard = function(positionY) {
        var element = document.getElementById('simple_dat_gui_dummy_text_input');
        if (element == null) {
            var _div = document.createElement("div");
            _div.setAttribute("id", "div_simple_dat_gui_dummy_text_input");

            var _form = document.createElement("form");
            _div.appendChild(_form);

            var _input = document.createElement("input");
            _input.setAttribute("type", "text");
            _input.setAttribute("id", "simple_dat_gui_dummy_text_input");
            _input.setAttribute("style", "opacity: 0; width: 1px; cursor: pointer");
            _form.appendChild(_input);
            document.body.appendChild(_div);
        }
        document.getElementById('div_simple_dat_gui_dummy_text_input').setAttribute("style",
                    "position: absolute; top: " + positionY + "px; right: 0px;");
        document.getElementById('simple_dat_gui_dummy_text_input').focus();
    }

    // DECODE MOUSE EVENTS
    var mouse = {};
    mouse.x = ((event.clientX) / (window.innerWidth - this.gui.renderer.domElement.offsetLeft)) * 2 - 1;
    mouse.y = -((event.clientY - this.gui.renderer.domElement.offsetTop) / (this.gui.renderer.domElement.clientHeight)) * 2 + 1;

    if (typeof (this.gui.camera) !== "undefined") {
        this.gui._private.selected = null;

        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(this.gui.camera);
        var raycaster = new THREE.Raycaster(this.gui.camera.position, vector.sub(this.gui.camera.position).normalize());
        var intersects = raycaster.intersectObjects(this.gui._private.mouseBindings);
        if (intersects.length > 0) {
            var _element = intersects[0].object.WebGLElement;
            if (event.type === "mousemove") {
                this.gui._private.selected = _element;
            } else if (event.type === "mousedown" && event.which == 1) {
                var _threeObject = intersects[0].object;
                this.gui._private.focus = _element;

                if (_element === this.gui.closeButton) {
                    this.gui._private.closed = !this.gui._private.closed;
                    this.gui._private.updateCloseButtonText();
                } else if (_element.isSliderControl()) {
                    var _sliderType = intersects[0].object.sliderType;
                    var _increment = (_element.step == null) ? 1 : _element.step;

                    var cursorMinimalX = _element.wValueSliderField.position.x - this.gui._options.SLIDER.x / 2;
                    var deltaX = intersects[0].point.x - cursorMinimalX - 3;
                    var newValue = _element.minValue + deltaX / this.gui._options.SLIDER.x
                                * (_element.maxValue - _element.minValue);

                    for (var value = _element.minValue; value <= _element.maxValue; value += _element.step) {
                        if (value >= newValue) {
                            _element.object[_element.property] = value;
                            value = _element.maxValue + 1;
                        }
                    }

                } else if (_element.isTextControl()) {
                    this.gui._private.selected = _element;
                    var value = this.gui._private.focus.newText;
                    this.gui._private.focus.intersectX = intersects[0].point.x;

                    // Workaround to activate keyboard on iOS
                    createDummyTextInputToShowKeyboard(event.clientY);

                    // FIND NEW CURSOR POSITION
                    var cursorMinimalX = _element.wValueTextField.position.x - this.gui._options.TEXT.x / 2;
                    var deltaX = intersects[0].point.x - cursorMinimalX;
                    if (deltaX > _element.textHelper.possibleCursorPositons[_element.textHelper.possibleCursorPositons.length - 1].x) {
                        _element.textHelper.end = value.length - 1;
                        _element.textHelper.cursor = value.length;
                        _element.textHelper.calculateAlignTextLastCall(value);
                    } else {
                        for (var i = 0; i < _element.textHelper.possibleCursorPositons.length - 1; i++) {
                            var minX = _element.textHelper.possibleCursorPositons[i].x;
                            var maxX = _element.textHelper.possibleCursorPositons[i + 1].x;
                            if (deltaX > minX && deltaX <= maxX) {
                                _element.textHelper.cursor = i + _element.textHelper.start;
                            }
                        }
                    }
                } else if (_element.isCheckBoxControl()) {
                    _element.object[_element.property] = !_element.object[this.gui._private.focus.property];
                }
                _element.executeCallback();
            }
            return false;
        }
    }
    return true;
}

// ////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////////////////

THREE.SimpleDatGuiControl = function(object, property, minValue, maxValue, parent, isCloseButton, isRootControl,
            options) {
    "use strict";

    // This is used for internal functions
    this._private = new THREE.SimpleDatGuiControl.__internals(this);

    var that = this;

    // ATTRIBUTES
    this._options = options;
    this.object = object;
    this.property = property;
    this.propertyType = (object != null) ? typeof object[property] : "folder";
    this.label = property;
    this.onChangeCallback = null;
    this.isCloseButton = isCloseButton;

    // MANAGE NUMBER INPUT
    this.minValue = 0.0;
    this.maxValue = 1000.0;

    // MANAGE TEXT INPUT
    this.textHelper = new THREE.SimpleDatGuiTextHelper(this._options);
    this.newText = "";

    // RELATIVES
    this.parent = parent;
    this._private.children = [];

    // STATE
    this.isRootControl = isRootControl;
    this.isFolderCollapsed = true;
    this.isElementFolder = this.propertyType === "folder";
    this.isElementHidden = (!this.isRootControl) ? !this.isElementFolder : false;
    this.isOnChangeExisting = false;
    this.scaling = 1.0;
    this.hasFocus = false;
    this.intersectX = 0;
    this.isClosed = false;

    // LISTEN WITH A TIMER
    this.updateTimer;
    this.lastValue;

    // CREATE NEEDED CONTROLS
    this._private.createArea();
    this._private.createMarker();
    this._private.createLabel(this.label);

    if (!this.isCloseButton) {
        this._private.createFrame();
    }
    if (this.isElementFolder && !this.isCloseButton) {
        this._private.createLabelMarker();
    } else if (this.isFunctionControl()) {
        this.onChangeCallback = object[property];
    } else if (this.isCheckBoxControl()) {
        this.object = object;
        this.property = property;
        this._private.createCheckBoxes();
    } else if (this.isSliderControl()) {
        this.object = object;
        this.property = property;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this._private.createNumberValue(object[property]);
        this._private.createValueField();
        this._private.createValueSliderField();
        this._private.createValueSliderBar();
    } else if (this.isTextControl()) {
        this.object = object;
        this.property = property;
        this.newText = object[property];
        this.textHelper.calculateLeftAlignText(this.newText);
        this._private.createTextValue(this.newText);
        this._private.createValueTextField();
        this._private.createCursor();
    }

    this.listenInternal();
}

// *****************************************************************************
// THREE.SimpleDatGuiControl INTERNALS

THREE.SimpleDatGuiControl.__internals = function(control) {
    this.control = control;
};

THREE.SimpleDatGuiControl.__internals.prototype.createValueSliderBar = function(scaling) {
    "use strict";
    var that = this.control;

    if (typeof that.wValueSliderBar !== "undefined") {
        that.parent.scene.remove(that.wValueSliderBar);
    }
    var _geometry = new THREE.BoxGeometry(that._options.SLIDER.x * scaling, that._options.SLIDER.y,
                that._options.SLIDER.z);
    var _material = new THREE.MeshBasicMaterial({
        transparent: true
    });
    that.wValueSliderBar = new THREE.Mesh(_geometry, _material);
    that.wValueSliderBar.sliderType = "bar";
    that.wValueSliderBar.WebGLElement = that;
    that.wValueSliderBar.updateRendering = function(index) {
        that.wValueSliderBar.position.x = that._options.POSITION.x + that._options.TAB_1.x + that._options.SLIDER.x / 2
                    - that._options.SLIDER.x * (1 - that.scaling) / 2;
        that.wValueSliderBar.position.y = that._options.POSITION.y + that._options.AREA.y * (-0.5 - index);
        that.wValueSliderBar.position.z = that._options.POSITION.z + that._options.AREA.z + that._options.DELTA_Z * 2;
        that.wValueSliderBar.material.opacity = that.parent._private.opacityGui * 0.01;
        that.wValueSliderBar.visible = that.isSliderControl() && that.isVisible()
                    && (that.object[that.property] > that.minValue) && !that.isClosed;
    };
    that.parent.scene.add(that.wValueSliderBar);
}

THREE.SimpleDatGuiControl.__internals.prototype.createTextValue = function(value) {
    "use strict";
    var that = this.control;

    if (typeof that.wTextValue !== "undefined") {
        that.parent.scene.remove(that.wTextValue);
    }

    var fontshapes = THREE.FontUtils.generateShapes(that.textHelper.truncated, {
        size: that._options.FONT
    });
    var _geometry = new THREE.ShapeGeometry(fontshapes, {
        curveSegments: 2
    });
    that.wTextValue = new THREE.Mesh(_geometry, new THREE.MeshBasicMaterial({
                color: 0x1ed36f,
                transparent: true,
    }));
    that.wTextValue.updateRendering = function(index) {
        that.wTextValue.position.x = that._options.POSITION.x + that._options.TAB_1.x + that.textHelper.residiumX;
        that.wTextValue.position.y = that._options.POSITION.y + that._options.AREA.y * (-0.5 - index)
                    - that._options.LABEL_OFFSET_Y;
        that.wTextValue.position.z = that._options.POSITION.z + that._options.AREA.z + that._options.DELTA_Z * 2;
        that.wTextValue.material.opacity = that.parent._private.opacityGui * 0.01;
        that.wTextValue.visible = that.isVisible() && that.isTextControl() && !that.isClosed;
    };
    that.parent.scene.add(that.wTextValue);
}

THREE.SimpleDatGuiControl.__internals.prototype.createValueTextField = function(event) {
    "use strict";
    var that = this.control;
    var _geometry = new THREE.BoxGeometry(that._options.TEXT.x, that._options.TEXT.y, that._options.TEXT.z);
    var _material = new THREE.MeshBasicMaterial({
        transparent: true
    });
    _material.color.setHex(that._options.COLOR_VALUE_FIELD);
    that.wValueTextField = new THREE.Mesh(_geometry, _material);
    that.wValueTextField.visible = false;
    that.wValueTextField.WebGLElement = that;
    that.wValueTextField.updateRendering = function(index) {
        that.wValueTextField.position.x = that._options.POSITION.x + that._options.TAB_1.x + that._options.TEXT.x / 2;
        that.wValueTextField.position.y = that._options.POSITION.y + that._options.AREA.y * (-0.5 - index);
        that.wValueTextField.position.z = that._options.POSITION.z + that._options.AREA.z + that._options.DELTA_Z;
        that.wValueTextField.material.opacity = that.parent._private.opacityGui * 0.01;
        that.wValueTextField.visible = that.isVisible() && that.isTextControl() && !that.isClosed;
    };
    that.parent.scene.add(that.wValueTextField);
}

THREE.SimpleDatGuiControl.__internals.prototype.createValueSliderField = function(event) {
    "use strict";

    var that = this.control;
    var _geometry = new THREE.BoxGeometry(that._options.SLIDER.x, that._options.SLIDER.y, that._options.SLIDER.z);
    var _material = new THREE.MeshBasicMaterial({
        transparent: true
    });
    _material.color.setHex(that._options.COLOR_VALUE_FIELD);
    that.wValueSliderField = new THREE.Mesh(_geometry, _material);
    that.wValueSliderField.sliderType = "field";
    that.wValueSliderField.WebGLElement = that;
    that.wValueSliderField.updateRendering = function(index) {
        that.wValueSliderField.position.x = that._options.POSITION.x + that._options.TAB_1.x + that._options.SLIDER.x
                    / 2;
        that.wValueSliderField.position.y = that._options.POSITION.y + that._options.AREA.y * (-0.5 - index);
        that.wValueSliderField.position.z = that._options.POSITION.z + that._options.AREA.z + that._options.DELTA_Z;
        that.wValueSliderField.material.opacity = that.parent._private.opacityGui * 0.01;
        that.wValueSliderField.visible = that.isSliderControl() && that.isVisible() && !that.isClosed;
    };
    that.parent.scene.add(that.wValueSliderField);
}

THREE.SimpleDatGuiControl.__internals.prototype.createValueField = function(event) {
    "use strict";

    var that = this.control;
    var _geometry = new THREE.BoxGeometry(that._options.NUMBER.x, that._options.NUMBER.y, that._options.NUMBER.z);
    var _material = new THREE.MeshBasicMaterial({
        transparent: true
    });
    _material.color.setHex(that._options.COLOR_VALUE_FIELD);
    that.wValueField = new THREE.Mesh(_geometry, _material);
    that.wValueField.updateRendering = function(index) {
        that.wValueField.position.x = that._options.POSITION.x + that._options.TAB_2.x + that._options.NUMBER.x / 2;
        that.wValueField.position.y = that._options.POSITION.y + that._options.AREA.y * (-0.5 - index);
        that.wValueField.position.z = that._options.POSITION.z + that._options.AREA.z + that._options.DELTA_Z;
        that.wValueField.material.opacity = that.parent._private.opacityGui * 0.01;
        that.wValueField.visible = that.isSliderControl() && that.isVisible() && !that.isClosed;
    };
    that.parent.scene.add(that.wValueField);
}

THREE.SimpleDatGuiControl.__internals.prototype.createNumberValue = function(value) {
    "use strict";

    var that = this.control;
    if (typeof that.wValue !== "undefined") {
        that.parent.scene.remove(that.wValue);
    }
    var newValue = (typeof value === "number") ? value : 0;
    var digits = (parseInt(newValue) == newValue) ? 0 : 1;
    var fontshapes = THREE.FontUtils.generateShapes(newValue.toFixed(digits), {
        size: that._options.FONT
    });
    var _geometry = new THREE.ShapeGeometry(fontshapes, {
        curveSegments: 2
    });
    that.wValue = new THREE.Mesh(_geometry, new THREE.MeshBasicMaterial({
        transparent: true
    }));
    that.wValue.updateRendering = function(index) {
        that.wValue.position.x = that._options.POSITION.x + that._options.TAB_2.x + that._options.OFFSET_X;
        that.wValue.position.y = that._options.POSITION.y + that._options.AREA.y * (-0.5 - index)
                    - that._options.LABEL_OFFSET_Y;
        that.wValue.position.z = that._options.POSITION.z + that._options.AREA.z + that._options.DELTA_Z * 2;
        that.wValue.material.opacity = that.parent._private.opacityGui * 0.01;
        that.wValue.visible = that.isSliderControl() && that.isVisible() && !that.isClosed;
    };
    that.parent.scene.add(that.wValue);
}

THREE.SimpleDatGuiControl.__internals.prototype.createCheckBoxes = function(event) {
    "use strict";

    var that = this.control;
    // CREATE CHECKBOX AREA
    var _geometry = new THREE.BoxGeometry(that._options.CHECKBOX.x, that._options.CHECKBOX.y, that._options.CHECKBOX.z);
    var _material = new THREE.MeshBasicMaterial({
        transparent: true
    });
    that.wBoxUnChecked = new THREE.Mesh(_geometry, _material);
    that.wBoxUnChecked.visible = false;
    that.wBoxUnChecked.updateRendering = function(index) {
        that.wBoxUnChecked.position.x = that._options.POSITION.x + that._options.TAB_1.x + that._options.CHECKBOX.x / 2;
        that.wBoxUnChecked.position.y = that._options.POSITION.y + that._options.AREA.y * (-0.5 - index);
        that.wBoxUnChecked.position.z = that._options.POSITION.z + that._options.AREA.z + that._options.DELTA_Z;
        that.wBoxUnChecked.material.opacity = that.parent._private.opacityGui * 0.01;
    };
    that.parent.scene.add(that.wBoxUnChecked);

    // CREATE CHECKBOX MARKER
    var fontshapes = THREE.FontUtils.generateShapes("X", {
        size: 7
    });
    var _geometry = new THREE.ShapeGeometry(fontshapes, {
        curveSegments: 2
    });
    var _material = new THREE.MeshLambertMaterial({
                color: 0x000000,
                depthTest: true,
                transparent: true
    });
    that.wBoxChecked = new THREE.Mesh(_geometry, _material);
    that.wBoxChecked.visible = false;
    that.wBoxChecked.updateRendering = function(index) {
        that.wBoxChecked.position.x = that._options.POSITION.x + that._options.TAB_1.x + that._options.CHECKBOX.x / 2
                    - 3;
        that.wBoxChecked.position.y = that._options.POSITION.y + that._options.AREA.y * (-0.5 - index) - 3.5;
        that.wBoxChecked.position.z = that._options.POSITION.z + that._options.AREA.z + that._options.DELTA_Z * 2;
        that.wBoxChecked.material.opacity = that.parent._private.opacityGui * 0.01;
    };
    that.parent.scene.add(that.wBoxChecked);
}

THREE.SimpleDatGuiControl.__internals.prototype.createLabel = function(name) {
    "use strict";

    var that = this.control;
    if (typeof that.wLabel !== "undefined") {
        that.parent.scene.remove(that.wLabel);
    }
    var fontshapes = THREE.FontUtils.generateShapes(name, {
        size: that._options.FONT
    });
    var _geometry = new THREE.ShapeGeometry(fontshapes, {
        curveSegments: 2
    });
    that.wLabel = new THREE.Mesh(_geometry, new THREE.MeshBasicMaterial({
        transparent: true
    }));
    that.wLabel.updateRendering = function(index) {
        var WEBGL_CLOSE_LABEL_OFFSET_X = 30;
        var LABEL_OFFSET_X = 10;
        var folderOffset = (that.isElementFolder) ? 8 : 0;
        that.wLabel.position.x = that._options.POSITION.x
                    + ((that.isCloseButton) ? (that._options.AREA.x / 2 - WEBGL_CLOSE_LABEL_OFFSET_X)
                                : (LABEL_OFFSET_X + folderOffset));
        that.wLabel.position.y = that._options.POSITION.y + that._options.AREA.y * (-0.5 - index)
                    - that._options.LABEL_OFFSET_Y;
        that.wLabel.position.z = that._options.POSITION.z + that._options.AREA.z + that._options.DELTA_Z;
        that.wLabel.material.opacity = that.parent._private.opacityGui * 0.01;
        that.wLabel.material.visible = that.isVisible() && !that.isClosed;
    };
    that.parent.scene.add(that.wLabel);
}

THREE.SimpleDatGuiControl.__internals.prototype.createLabelMarker = function() {
    "use strict";

    var that = this.control;
    var _geometry = new THREE.Geometry();
    var v1 = new THREE.Vector3(-2, 2, that._options.MARKER.z);
    var v3 = new THREE.Vector3(2, 2, that._options.MARKER.z);
    var v2 = new THREE.Vector3(2, -2, that._options.MARKER.z);
    _geometry.vertices.push(v1);
    _geometry.vertices.push(v2);
    _geometry.vertices.push(v3);
    _geometry.faces.push(new THREE.Face3(0, 1, 2));
    _geometry.computeFaceNormals();
    var _material = new THREE.MeshBasicMaterial({
                transparent: true,
                color: 0xFFFFFF
    });
    that.wLabelMarker = new THREE.Mesh(_geometry, _material);
    that.wLabelMarker.updateRendering = function(index) {
        that.wLabelMarker.position.x = that._options.POSITION.x + 10;
        that.wLabelMarker.position.y = that._options.POSITION.y - that._options.AREA.y / 2 - that._options.AREA.y
                    * index;
        that.wLabelMarker.position.z = that._options.POSITION.z + that._options.AREA.z / 2 + that._options.DELTA_Z;
        that.wLabelMarker.material.opacity = that.parent._private.opacityGui * 0.01;
        that.wLabelMarker.material.visible = that.isVisible() && !that.isClosed;

        if (that.folderIsHidden) {
            that.wLabelMarker.rotation.z = -Math.PI / 4 * 3;
        } else {
            that.wLabelMarker.rotation.z = -0.7853981;
        }
    };
    that.parent.scene.add(that.wLabelMarker);
}
THREE.SimpleDatGuiControl.__internals.prototype.createMarker = function() {
    "use strict";

    var that = this.control;
    var _geometry = new THREE.BoxGeometry(that._options.MARKER.x, that._options.MARKER.y, that._options.MARKER.z);
    var _material = new THREE.MeshBasicMaterial({
        transparent: true
    });
    that.wMarker = new THREE.Mesh(_geometry, _material);
    that.wMarker.updateRendering = function(index) {
        that.wMarker.position.x = that._options.POSITION.x + that._options.MARKER.x / 2 - 0.1;
        that.wMarker.position.y = that._options.POSITION.y - that._options.AREA.y / 2 - that._options.AREA.y * index;
        that.wMarker.position.z = that._options.POSITION.z + that._options.AREA.z / 2 + that._options.DELTA_Z;
        that.wMarker.material.opacity = that.parent._private.opacityGui * 0.01;
        that.wMarker.material.visible = that.isVisible() && !that.isClosed;
    };
    that.parent.scene.add(that.wMarker);
}

THREE.SimpleDatGuiControl.__internals.prototype.createFrame = function() {
    "use strict";

    var COLOR_BODER = '0x2c2c2c';
    var cubeGeometry2LineGeometry = function(input) {
        "use strict";
        var _geometry = new THREE.Geometry();
        var vertices = _geometry.vertices;
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
        _geometry.computeLineDistances();
        return _geometry;
    }

    var that = this.control;
    var _geometryBox = new THREE.BoxGeometry(that._options.AREA.x, that._options.AREA.y, 0.1);
    var _geometry = cubeGeometry2LineGeometry(_geometryBox);
    that.wFrame = new THREE.Line(_geometry, new THREE.LineBasicMaterial({
                color: 0x161616,
                transparent: true
    }));
    that.wFrame.material.color.setHex(COLOR_BODER);
    that.wFrame.updateRendering = function(index) {
        that.wFrame.position.x = that._options.POSITION.x + that._options.AREA.x / 2 - 0.1;
        that.wFrame.position.y = that._options.POSITION.y - that._options.AREA.y / 2 - that._options.AREA.y * index;
        that.wFrame.position.z = that._options.POSITION.z + that._options.AREA.z + that._options.DELTA_Z;
        that.wFrame.material.opacity = that.parent._private.opacityGui * 0.01;
        that.wFrame.material.visible = that.isVisible() && !that.isClosed;
    };
    that.parent.scene.add(that.wFrame);
}

THREE.SimpleDatGuiControl.__internals.prototype.createArea = function() {
    "use strict";

    var that = this.control;
    var _geometry = new THREE.BoxGeometry(that._options.AREA.x, that._options.AREA.y, that._options.AREA.z);
    var _material = new THREE.MeshBasicMaterial({
        transparent: true
    });
    that.wArea = new THREE.Mesh(_geometry, _material);
    that.wArea.WebGLElement = that;
    that.wArea.updateRendering = function(index) {
        that.wArea.position.x = that._options.POSITION.x + that._options.AREA.x / 2;
        that.wArea.position.y = that._options.POSITION.y - that._options.AREA.y / 2 - that._options.AREA.y * index;
        that.wArea.position.z = that._options.POSITION.z + that._options.AREA.z / 2;
        that.wArea.material.opacity = that.parent._private.opacityGui * 0.01;
        that.wArea.material.visible = that.isVisible() && !that.isClosed;
    };
    that.parent.scene.add(that.wArea);
}

THREE.SimpleDatGuiControl.__internals.prototype.createCursor = function() {
    "use strict";

    var that = this.control;
    var _geometry = new THREE.BoxGeometry(0.5, that._options.TEXT.y * 0.8, 0.1);
    var _material = new THREE.MeshBasicMaterial({
        transparent: true
    });
    this.control.wCursor = new THREE.Mesh(_geometry, _material);
    this.control.wCursor.updateRendering = function(index) {
        var possiblePositon = that.textHelper.possibleCursorPositons[that.textHelper.cursor - that.textHelper.start];
        if (typeof possiblePositon !== "undefined") {
            that.wCursor.position.x = that._options.POSITION.x + that._options.TAB_1.x + that.textHelper.residiumX
                        + possiblePositon.x + 0.25;
            that.wCursor.position.y = that._options.POSITION.y + that._options.AREA.y * (-0.5 - index);
            that.wCursor.position.z = that._options.POSITION.z + that._options.AREA.z + that._options.DELTA_Z * 2;
            that.wCursor.material.opacity = that.parent._private.opacityGui * 0.01;
            that.wCursor.material.visible = that.isVisible() && that.isTextControl()
                        && (that.parent._private.focus === that) && !that.isClosed;
        } else {
            that.wCursor.material.visible = false;
        }
    };
    this.control.parent.scene.add(this.control.wCursor);
}

THREE.SimpleDatGuiControl.prototype.updateRendering = function(index, isClosed) {
    "use strict";

    this.isClosed = isClosed;
    this.wArea.updateRendering(index);
    this.wLabel.updateRendering(index);
    this.wMarker.updateRendering(index);

    if (!this.isCloseButton) {
        this.wFrame.updateRendering(index);
    }

    if (this.isElementFolder && !this.isCloseButton) {
        this.wLabelMarker.updateRendering(index);
    } else if (this.isCheckBoxControl()) {
        this.wBoxChecked.updateRendering(index);
        this.wBoxUnChecked.updateRendering(index);
    } else if (this.isSliderControl()) {
        this.wValue.updateRendering(index);
        this.wValueField.updateRendering(index);
        this.wValueSliderField.updateRendering(index);
        this.wValueSliderBar.updateRendering(index);
    } else if (this.isTextControl()) {
        this.wValueTextField.updateRendering(index);
        this.wTextValue.updateRendering(index);
        this.wCursor.updateRendering(index);
    }

    if (!this.isElementFolder && this.isCheckBoxControl()) {
        var checked = this.object[this.property];
        this.wBoxChecked.visible = this.isVisible() && checked && !this.isClosed;
        this.wBoxUnChecked.visible = this.isVisible() && !this.isClosed;
    }

    this.updateColor();

    return this;
}

THREE.SimpleDatGuiControl.prototype.onChange = function(value) {
    "use strict";
    this.isOnChangeExisting = true;
    this.onChangeCallback = value;
    return this;
}

THREE.SimpleDatGuiControl.prototype.add = function(object, property, minValue, maxValue) {
    "use strict";
    var _element = new THREE.SimpleDatGuiControl(object, property, minValue, maxValue, this.parent, false, false,
                this._options);
    this._private.children.push(_element);
    return _element;
}

THREE.SimpleDatGuiControl.prototype.name = function(value) {
    "use strict";
    this.label = value;
    this._private.createLabel(this.label);
    return this;
}

THREE.SimpleDatGuiControl.prototype.executeCallback = function(event) {
    "use strict";
    if (this.isFunctionControl()) {
        this.onChangeCallback(null);
        return;
    }
    if (this.isOnChangeExisting) {
        if (this.isCheckBoxControl()) {
            this.onChangeCallback(this.object[this.property]);
            return;
        } else if (this.isTextControl()) {
            this.onChangeCallback(this.object[this.property]);
            return;
        } else if (this.isSliderControl()) {
            this.onChangeCallback(this.object[this.property]);
            return;
        }
    }
    if (this.isElementFolder) {
        this.open();
    }
}

THREE.SimpleDatGuiControl.prototype.updateColor = function() {
    "use strict";
    var COLOR_SELECTED = '0x010101';

    var COLOR_SELECTED_TEXT = '0xFFFFFF';
    var COLOR_FOLDER = '0x010101';
    var COLOR_FOLDER_TEXT = '0xFFFFFF';
    var COLOR_BASE = '0x1a1a1a';
    var COLOR_BASE_CLOSE_BUTTON = '0x121212';
    var COLOR_BASE_TEXT = '0xFFFFFF';

    var COLOR_MARKER_BUTTON = '0xe61d5f';
    var COLOR_MARKER_CHECKBOX = '0x806787';
    var COLOR_MARKER_TEXT = '0x1ed36f';
    var COLOR_MARKER_NUMBER = '0x2fa1d6';

    if (this.parent._private.selected === this && ((this.isCheckBoxControl()) || (this.isFunctionControl()))) {
        this.wArea.material.color.setHex(COLOR_SELECTED);
        this.wLabel.material.color.setHex(COLOR_SELECTED_TEXT);
    } else {
        if (this.isElementFolder) {
            this.wArea.material.color.setHex(COLOR_FOLDER);
            this.wLabel.material.color.setHex(COLOR_FOLDER_TEXT);
        } else {
            this.wArea.material.color.setHex(COLOR_BASE);
            this.wLabel.material.color.setHex(COLOR_BASE_TEXT);
        }
    }

    if (!this.isElementFolder && this.isCheckBoxControl()) {
        this.wMarker.material.color.setHex(COLOR_MARKER_CHECKBOX);
    }

    if (!this.isElementFolder && this.isTextControl()) {
        this.wMarker.material.color.setHex(COLOR_MARKER_TEXT);
    }

    if (!this.isElementFolder && this.isSliderControl()) {
        this.wMarker.material.color.setHex(COLOR_MARKER_NUMBER);
        this.wValue.material.color.setHex(0x2fa1d6);
        this.wValueSliderBar.material.color.setHex(0x2fa1d6);
    }

    if (!this.isElementFolder && this.isFunctionControl()) {
        this.wMarker.material.color.setHex(COLOR_MARKER_BUTTON);
    }

    if (this.isElementFolder && this.isCloseButton) {
        if (this.parent._private.selected === this) {
            this.wMarker.material.color.setHex(COLOR_BASE_CLOSE_BUTTON);
            this.wArea.material.color.setHex(COLOR_BASE_CLOSE_BUTTON);
        } else {
            this.wMarker.material.color.setHex(COLOR_SELECTED);
            this.wArea.material.color.setHex(COLOR_SELECTED);
        }
    }

    if (this.isTextControl()) {
        this.wCursor.material.color.setHex(0xFFFF11);
        this.wTextValue.material.color.setHex(this.parent._private.focus === this ? 0xFFFFFF : 0x1ed36f);
    }

}

THREE.SimpleDatGuiControl.prototype.listen = function() {
    console.warn('The listen method is depricated.');
    return this;
}

THREE.SimpleDatGuiControl.prototype.listenInternal = function() {
    "use strict";
    var that = this;
    this.updateTimer = setInterval(function() {
        if (that.isSliderControl()) {
            if (that.lastValue !== that.object[that.property]) {
                var newValue = that.object[that.property];
                newValue = Math.min(Math.max(newValue, that.minValue), that.maxValue);
                that._private.createNumberValue(newValue);
                that.scaling = (newValue - that.minValue) / (that.maxValue - that.minValue);
                that._private.createValueSliderBar(that.scaling);
            }
            that.lastValue = that.object[that.property];
        }
        if (that.isTextControl()) {

            if (that.lastValue !== that.object[that.property]) {
                var newValue = that.object[that.property];
                that.textHelper.calculateAlignTextLastCall(newValue);
                that._private.createTextValue(that.textHelper.truncated);
            }
            that.lastValue = that.object[that.property];
        }
    }, 500);
    return this;
}

THREE.SimpleDatGuiControl.prototype.step = function(value) {
    "use strict";
    this.step = value;
    return this;
}

THREE.SimpleDatGuiControl.prototype.open = function() {
    "use strict";
    if (this.isElementFolder) {
        this.folderIsHidden = !this.folderIsHidden;
        this.updateChildrenHidden();
    }
    return this;
}

THREE.SimpleDatGuiControl.prototype.updateChildrenHidden = function() {
    "use strict";
    this._private.children.forEach(function(entry) {
        entry.isElementHidden = !entry.isElementHidden;
    });
}

THREE.SimpleDatGuiControl.prototype.isCheckBoxControl = function() {
    "use strict";
    return this.propertyType === 'boolean';
}

THREE.SimpleDatGuiControl.prototype.isTextControl = function() {
    "use strict";
    return this.propertyType === 'string';
}

THREE.SimpleDatGuiControl.prototype.isSliderControl = function() {
    "use strict";
    return this.propertyType === 'number';
}

THREE.SimpleDatGuiControl.prototype.isFunctionControl = function() {
    "use strict";
    return this.propertyType === 'function';
}

THREE.SimpleDatGuiControl.prototype.isVisible = function() {
    "use strict";
    return !this.isElementHidden;
}

// ////////////////////////////////////////////////////////////////////////////////////

THREE.SimpleDatGuiTextHelper = function(options) {
    "use strict";

    this._options = options;
    this.start = 0;
    this.end = 0;
    this.cursor = 0;
    this.truncated = false;
    this.residiumX = 0.0;
    this.isLastCallLeft = false;
    this.isTruncated = false;
    this.possibleCursorPositons = [];
}

/**
 * This is a workaround for the not always correct size of characters in the
 * font shapes. Replace all not working characters with similar size characters.
 */
THREE.SimpleDatGuiTextHelper.prototype.createFontShapes = function(value) {
    var valueNew = value
    valueNew = valueNew.split(" ").join("]");
    valueNew = valueNew.split('"').join("°");
    valueNew = valueNew.split("%").join("W");
    valueNew = valueNew.split("!").join(",");
    valueNew = valueNew.split(":").join(",");
    valueNew = valueNew.split("|").join("2");
    valueNew = valueNew.split(";").join(",");
    valueNew = valueNew.split("?").join("s");
    valueNew = valueNew.split("ö").join("s");
    valueNew = valueNew.split("ä").join("s");
    valueNew = valueNew.split("ü").join("s");
    valueNew = valueNew.split("ß").join("s");
    valueNew = valueNew.split("i").join("I");
    valueNew = valueNew.split("j").join("l");
    valueNew = valueNew.split("k").join("h");
    return THREE.FontUtils.generateShapes(valueNew, {
        size: this._options.FONT
    });
}

THREE.SimpleDatGuiTextHelper.prototype.calculateRightAlignText = function(value) {
    "use strict";

    // Start with the complete string
    this.isTruncated = false;
    this.truncated = value;
    this.residiumX = 0;
    this.end = value.length - 1;

    var fontshapesAll = this.createFontShapes(value);
    var size = this._options.TEXT.x;
    for (var i = fontshapesAll.length - 1; i > 1; i--) {
        var boundingBox2 = fontshapesAll[i].getBoundingBox();
        var boundingBox1 = fontshapesAll[i - 1].getBoundingBox();
        var charWidth = boundingBox2.maxX - boundingBox1.maxX;
        size -= charWidth;
        if (size < 20 && !this.isTruncated) {
            this.isTruncated = true;
            this.start = i - 2;
            this.truncated = value.substring(this.start, this.end + 1);
        }
    }

    var fontshapesTruncated = this.createFontShapes(this.truncated);
    if (fontshapesTruncated.length > 0) {
        this.residiumX = this._options.TEXT.x
                    - fontshapesTruncated[fontshapesTruncated.length - 1].getBoundingBox().maxX;
    } else {
        this.residiumX = 0;
    }

    // ALL CURSOR POSITIONS
    this.possibleCursorPositons = [];
    this.possibleCursorPositons.push({
        x: 0
    });
    for (var i = 0; i < fontshapesTruncated.length; i++) {
        this.possibleCursorPositons.push({
            x: fontshapesTruncated[i].getBoundingBox().maxX
        });
    }

    this.isLastCallLeft = false;

    return this;
}

THREE.SimpleDatGuiTextHelper.prototype.calculateLeftAlignText = function(value) {
    "use strict";

    // Start with the complete string
    this.isTruncated = false;
    this.truncated = value;
    this.residiumX = 2;
    this.end = 0;

    var fontshapesAll = this.createFontShapes(value);
    for (var i = 0; i < fontshapesAll.length - 1; i++) {
        var boundingBox1 = fontshapesAll[i].getBoundingBox();
        if ((this._options.TEXT.x - boundingBox1.maxX) <= this.residiumX && !this.isTruncated) {
            this.isTruncated = true;
            this.end = i;
            this.truncated = value.substring(this.start, this.end);
        }
    }

    // ALL CURSOR POSITIONS
    var fontshapesTruncated = this.createFontShapes(this.truncated);
    this.possibleCursorPositons = [];
    this.possibleCursorPositons.push({
        x: 0
    });
    for (var i = 0; i < fontshapesTruncated.length; i++) {
        this.possibleCursorPositons.push({
            x: fontshapesTruncated[i].getBoundingBox().maxX
        });
    }

    this.isLastCallLeft = true;

    return this;
}

THREE.SimpleDatGuiTextHelper.prototype.calculateAlignTextLastCall = function(value) {

    if (!this.isTruncated) { return this.calculateLeftAlignText(value); }

    if (this.cursor <= this.start) {
        this.isLastCallLeft = true;
    }

    if (this.cursor > this.end) {
        this.isLastCallLeft = false;
    }

    if (this.isLastCallLeft) {
        return this.calculateLeftAlignText(value);
    } else {
        return this.calculateRightAlignText(value);
    }
}
