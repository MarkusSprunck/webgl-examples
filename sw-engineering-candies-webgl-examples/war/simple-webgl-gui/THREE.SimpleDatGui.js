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
 * Simple rendering with pure WebGL based on three.js without any other 3rd
 * party library. The look & feel should be like in the Chrome Experiment
 * DAT.GUI with some minor improvements. This is an early development stage, so
 * some features are missing.
 */
THREE.SimpleDatGui = function(parameters) {
    "use strict";

    console.log('THREE.SimpleDatGui v0.64');

    // Mandatory parameters
    if ((typeof parameters === "undefined") || (typeof parameters.scene === "undefined")
                || (typeof parameters.camera === "undefined") || (typeof parameters.renderer === "undefined")) {
        console.err("THREE.SimpleDatGui - missing parameter");
    }
    this.scene = parameters.scene;
    this.camera = parameters.camera;
    this.renderer = parameters.renderer;

    // Optional parameters
    this.width = (parameters.width !== undefined) ? parameters.width : 300;
    this.position = (parameters.position !== undefined) ? parameters.position : new THREE.Vector3(-150, 100, 150);

    // For internal use only
    this._options = this.getOptions();
    this._private = new THREE.SimpleDatGui.__internals(this);
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
        child.updateRendering(indexOfVisibleControls, that._private.isClosed());

        child._private.children.forEach(function(element) {
            if (!element.isElementHidden) {
                indexOfVisibleControls++;
            }
            element.updateRendering(indexOfVisibleControls, that._private.isClosed());
        });
    });
    this._private.closeButton.updateRendering((this._private.isClosed()) ? 0 : (indexOfVisibleControls + 1), false);

    // JUST VISIBLE CONTROLS INTERACT WITH MOUSE
    var that = this;
    this._private.mouseBindings = [];
    if (!this._private.isClosed()) {
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
    that._private.mouseBindings.push(that._private.closeButton.wArea);
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

/**
 * Internal implementation may change - please don't access directly
 */
THREE.SimpleDatGui.__internals = function(gui) {
    "use strict";

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

    // Close button is always part of user interface
    this.closeButton = new THREE.SimpleDatGuiControl(null, "Close Controls", 0, 0, gui, true, false, gui._options);

    // Create all event listeners
    gui.renderer.domElement.addEventListener('mousemove', function(event) {
        gui._private.onMouseMoveEvt(event);
    }.bind(gui));

    gui.renderer.domElement.addEventListener('mousedown', function(event) {
        gui._private.onMouseDownEvt(event);
    }.bind(gui));

    window.addEventListener('keypress', function(event) {
        gui._private.onKeyPressEvt(event);
    }.bind(gui));

    var that = this;
    window.addEventListener('keyup', function(event) {
        if (this._private.isKeyShift(that.getCharacterCode(event))) {
            that.shiftPressed = false;
        }
    }.bind(gui));

    window.addEventListener('keydown', function(event) {
        if (this._private.isKeyShift(that.getCharacterCode(event))) {
            that.shiftPressed = true;
        }
        gui._private.onKeyDownEvt(event);
    }.bind(gui));
};

/**
 * Insert new character at cursor position
 */
THREE.SimpleDatGui.__internals.prototype.onKeyPressEvt = function(event) {
    "use strict";

    var focus = this.gui._private.focus;
    if (focus !== null && focus.isTextControl()) {
        // Insert new character
        var cursor = focus.textHelper.cursor;
        var oldText = focus.newText;
        var oldTextFirst = oldText.substring(0, cursor);
        var oldTextSecond = oldText.substring(cursor, oldText.length);
        var newCharacter = String.fromCharCode(this.getCharacterCode(event));
        focus.newText = oldTextFirst + newCharacter + oldTextSecond;

        // Truncate text if needed
        focus.textHelper.cursor = cursor + 1;
        focus.textHelper.calculateAlignTextLastCall(focus.newText);

        // Render new text
        focus._private.createTextValue(focus.textHelper.truncated);
    }
}

/**
 * Get and handle state of special keys
 */
THREE.SimpleDatGui.__internals.prototype.onKeyDownEvt = function(event) {
    "use strict";

    var focus = this.gui._private.focus;
    if (focus !== null && focus.isTextControl()) {
        var charCode = this.getCharacterCode(event);
        if (this.isKeyTab(charCode) || this.isKeyEnter(charCode)) {
            this.acknowledgeInput();
        } else if (this.isKeyPos1(charCode)) {
            this.moveCursorToFirstCharacter();
        } else if (this.isKeyEnd(charCode)) {
            this.moveCursorToLastCharacter();
        } else if (this.isKeyLeft(charCode)) {
            this.moveCursorToPreviousCharacter(event);
        } else if (this.isKeyRight(charCode)) {
            this.moveCursorToNextCharacter(event);
        } else if (this.isKeyEnf(charCode)) {
            this.deleteNextCharacter();
        } else if (this.isKeyBackspace(charCode)) {
            this.deletePreviousCharacter();
            event.preventDefault();
        }
    }
}

THREE.SimpleDatGui.__internals.prototype.isKeyTab = function(code) {
    "use strict";

    return code === 9;
}

THREE.SimpleDatGui.__internals.prototype.isKeyEnter = function(code) {
    "use strict";

    return code === 13;
}

THREE.SimpleDatGui.__internals.prototype.isKeyPos1 = function(code) {
    "use strict";

    return code === 36;
}

THREE.SimpleDatGui.__internals.prototype.isKeyEnd = function(code) {
    "use strict";

    return code === 35;
}

THREE.SimpleDatGui.__internals.prototype.isKeyLeft = function(code) {
    "use strict";

    return code === 37;
}

THREE.SimpleDatGui.__internals.prototype.isKeyRight = function(code) {
    "use strict";

    return code === 39;
}

THREE.SimpleDatGui.__internals.prototype.isKeyEnf = function(code) {
    "use strict";

    return code === 46;
}

THREE.SimpleDatGui.__internals.prototype.isKeyBackspace = function(code) {
    "use strict";

    return code === 8;
}

THREE.SimpleDatGui.__internals.prototype.isKeyShift = function(code) {
    "use strict";

    return code === 16;
}

THREE.SimpleDatGui.__internals.prototype.onMouseDownEvt = function(event) {
    "use strict";

    var intersects = this.getIntersectingObjects(this.getMousePositon(event));
    if (intersects.length > 0) {
        var element = intersects[0].object.WebGLElement;
        if (event.which == 1 /* Left mouse button */) {

            // Set focus on this control
            this.gui._private.focus = element;
            if (element.isSliderControl()) {
                this.setNewSliderValueFromMouseDownEvt(intersects);
            } else if (element.isTextControl()) {
                this.setNewCursorFromMouseDownEvt(intersects);
                this.createDummyTextInputToShowKeyboard(event.clientY);
            } else if (element.isCheckBoxControl()) {
                element.object[element.property] = !element.object[this.gui._private.focus.property];
            } else if (element === this.gui._private.closeButton) {
                this.gui._private.toggleClosed();
            }
            element.executeCallback();
        }
    }
}

/**
 * Ensures compatibility between different browsers, i.e. Chrome, Firefox, IE
 */
THREE.SimpleDatGui.__internals.prototype.getCharacterCode = function(event) {
    "use strict";

    event = event || window.event;
    var charCode = (typeof event.which == "number") ? event.which : event.keyCode;
    return charCode;
}

THREE.SimpleDatGui.prototype.getOptions = function() {
    "use strict";

    var area_size = new THREE.Vector3(this.width, 20, 2.0);
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
                POSITION: this.position,
                RIGHT_BORDER: rightBorder,
                SLIDER: slider_field_size,
                TAB_1: labelTab1,
                TAB_2: labelTab2,
                TEXT: text_field_size,
                LABEL_OFFSET_Y: 4,
                COLOR_VALUE_FIELD: '0x303030',
                MATERIAL: {
                    transparent: true
                },
                FONT_PARAM: {
                    size: font_size
                }
    }
}

THREE.SimpleDatGui.__internals.prototype.isClosed = function() {
    "use strict";

    return this.gui._private.closed;
}

THREE.SimpleDatGui.__internals.prototype.toggleClosed = function() {
    "use strict";

    this.gui._private.closed = !this.gui._private.closed;
    this.gui._private.closeButton._private.createLabel(this.gui._private.closed ? "Open Controls" : "Close Controls");
}

THREE.SimpleDatGui.__internals.prototype.acknowledgeInput = function() {
    "use strict";

    var focus = this.gui._private.focus;
    focus.lastValue = focus.newText;
    focus.object[focus.property] = focus.newText;
    focus.executeCallback();

    // Deactivate focus
    this.gui._private.focus = null;

    // Deactivate focus - workaround to hide keyboard on iOS
    document.getElementById('simple_dat_gui_dummy_text_input').blur();
}

THREE.SimpleDatGui.__internals.prototype.moveCursorToFirstCharacter = function() {
    "use strict";

    var focus = this.gui._private.focus;
    var textHelper = focus.textHelper;
    textHelper.cursor = 0;
    textHelper.start = 0;
    textHelper.calculateAlignTextLastCall(focus.newText);
}

THREE.SimpleDatGui.__internals.prototype.moveCursorToLastCharacter = function() {
    "use strict";

    var focus = this.gui._private.focus;
    var textHelper = focus.textHelper;
    var value = focus.newText;
    textHelper.cursor = value.length;
    textHelper.end = value.length - 1;
    textHelper.calculateAlignTextLastCall(focus.newText);
}

THREE.SimpleDatGui.__internals.prototype.moveCursorToNextCharacter = function(event) {
    "use strict";

    var focus = this.gui._private.focus;
    var textHelper = focus.textHelper;
    var value = focus.newText;
    if (textHelper.cursor < value.length) {
        textHelper.cursor += 1;
        if (textHelper.cursor > focus.textHelper.end) {
            textHelper.calculateAlignTextLastCall(focus.newText);
        }
    }
}

THREE.SimpleDatGui.__internals.prototype.moveCursorToPreviousCharacter = function(event) {
    "use strict";

    var focus = this.gui._private.focus;
    var textHelper = this.gui._private.focus.textHelper;
    if (textHelper.cursor > 0) {
        textHelper.cursor -= 1;
    }
    if (textHelper.start > textHelper.cursor) {
        if (textHelper.start > 0) {
            textHelper.start--;
        }
        textHelper.calculateAlignTextLastCall(focus.newText);
    }
}

THREE.SimpleDatGui.__internals.prototype.deletePreviousCharacter = function() {
    "use strict";

    var focus = this.gui._private.focus;
    var textHelper = focus.textHelper;
    var value = focus.object[focus.property];
    if (textHelper.cursor > 0) {
        var value = focus.newText;
        focus.newText = value.substring(0, textHelper.cursor - 1) + value.substring(textHelper.cursor, value.length);
        textHelper.cursor -= 1;
        textHelper.calculateAlignTextLastCall(focus.newText);
        focus._private.createTextValue(textHelper.truncated);
    }
}

THREE.SimpleDatGui.__internals.prototype.deleteNextCharacter = function() {
    "use strict";

    var focus = this.gui._private.focus;
    var textHelper = focus.textHelper;
    var value = focus.newText;
    focus.newText = value.substring(0, textHelper.cursor) + value.substring(textHelper.cursor + 1, value.length);
    textHelper.calculateAlignTextLastCall(focus.newText);
    focus._private.createTextValue(focus.textHelper.truncated);
}

/**
 * Workaround to activate keyboard on iOS
 */
THREE.SimpleDatGui.__internals.prototype.createDummyTextInputToShowKeyboard = function(positionY) {
    "use strict";

    var element = document.getElementById('simple_dat_gui_dummy_text_input');
    if (element == null) {
        var _div = document.createElement("div");
        _div.setAttribute("id", "div_simple_dat_gui_dummy_text_input");
        var _form = document.createElement("form");
        _div.appendChild(_form);
        var _input = document.createElement("input");
        _input.setAttribute("type", "text");
        _input.setAttribute("id", "simple_dat_gui_dummy_text_input");
        _input.setAttribute("style", "opacity: 0; width: 1px; font-size: 0px;");
        _form.appendChild(_input);
        document.body.appendChild(_div);
    }
    document.getElementById('div_simple_dat_gui_dummy_text_input').setAttribute("style",
                "position: absolute; top: " + positionY + "px; right: 0px;");
    document.getElementById('simple_dat_gui_dummy_text_input').focus();
}

THREE.SimpleDatGui.__internals.prototype.getMousePositon = function(event) {
    "use strict";

    var domElement = this.gui.renderer.domElement;
    var mouse = {};
    mouse.x = ((event.clientX) / (window.innerWidth - domElement.offsetLeft)) * 2 - 1;
    mouse.y = -((event.clientY - domElement.offsetTop) / (domElement.clientHeight)) * 2 + 1;
    return mouse;
}

THREE.SimpleDatGui.__internals.prototype.getIntersectingObjects = function(mouse) {
    "use strict";

    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(this.gui.camera);
    var raycaster = new THREE.Raycaster(this.gui.camera.position, vector.sub(this.gui.camera.position).normalize());
    return raycaster.intersectObjects(this.gui._private.mouseBindings);
}

THREE.SimpleDatGui.__internals.prototype.onMouseMoveEvt = function(event) {
    "use strict";

    var intersects = this.getIntersectingObjects(this.getMousePositon(event));
    if (intersects.length > 0) {
        this.gui._private.selected = intersects[0].object.WebGLElement;
    } else {
        this.gui._private.selected = null;
    }
}

THREE.SimpleDatGui.__internals.prototype.setNewSliderValueFromMouseDownEvt = function(intersects) {
    "use strict";

    var element = intersects[0].object.WebGLElement;
    var cursorMinimalX = element.wValueSliderField.position.x - this.gui._options.SLIDER.x / 2;
    var deltaX = intersects[0].point.x - cursorMinimalX - 3;
    var newValue = element.minValue + deltaX / this.gui._options.SLIDER.x * (element.maxValue - element.minValue);

    for (var value = element.minValue; value <= element.maxValue; value += element.step) {
        if (value >= newValue) {
            element.object[element.property] = value;
            break;
        }
    }
}

THREE.SimpleDatGui.__internals.prototype.setNewCursorFromMouseDownEvt = function(intersects) {
    "use strict";

    var element = intersects[0].object.WebGLElement;
    var focus = this.gui._private.focus;
    var textHelper = element.textHelper;
    var value = focus.newText;

    this.gui._private.selected = element;

    var cursorMinimalX = element.wValueTextField.position.x - this.gui._options.TEXT.x / 2;
    var deltaX = intersects[0].point.x - cursorMinimalX;
    if (deltaX > textHelper.possibleCursorPositons[textHelper.possibleCursorPositons.length - 1].x) {
        textHelper.end = value.length - 1;
        textHelper.cursor = value.length;
        textHelper.calculateAlignTextLastCall(value);
    } else {
        for (var i = 0; i < textHelper.possibleCursorPositons.length - 1; i++) {
            var minX = textHelper.possibleCursorPositons[i].x;
            var maxX = textHelper.possibleCursorPositons[i + 1].x;
            if (deltaX > minX && deltaX <= maxX) {
                textHelper.cursor = i + textHelper.start;
            }
        }
    }
}

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

THREE.SimpleDatGuiControl.__internals = function(control) {
    "use strict";

    this.control = control;
};

THREE.SimpleDatGuiControl.__internals.prototype.createArea = function() {
    "use strict";

    var that = this.control;
    var _geometry = new THREE.BoxGeometry(that._options.AREA.x, that._options.AREA.y, that._options.AREA.z);
    var _material = new THREE.MeshBasicMaterial(that._options.MATERIAL);
    that.wArea = new THREE.Mesh(_geometry, _material);
    that.wArea.WebGLElement = that;
    that.wArea.updateRendering = function(index) {
        var $ = that._options;
        this.position.x = $.POSITION.x + $.AREA.x / 2;
        this.position.y = $.POSITION.y - $.AREA.y / 2 - $.AREA.y * index;
        this.position.z = $.POSITION.z + $.AREA.z / 2;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
        this.material.visible = that.isVisible() && !that.isClosed;
    };
    that.parent.scene.add(that.wArea);
}

THREE.SimpleDatGuiControl.__internals.prototype.createValueSliderBar = function(scaling) {
    "use strict";

    var that = this.control;

    if (typeof that.wValueSliderBar !== "undefined") {
        that.parent.scene.remove(that.wValueSliderBar);
    }

    var _geometry = new THREE.BoxGeometry(that._options.SLIDER.x * scaling, that._options.SLIDER.y,
                that._options.SLIDER.z);
    var _material = new THREE.MeshBasicMaterial(that._options.MATERIAL);
    that.wValueSliderBar = new THREE.Mesh(_geometry, _material);
    that.wValueSliderBar.sliderType = "bar";
    that.wValueSliderBar.WebGLElement = that;
    that.wValueSliderBar.updateRendering = function(index) {
        var $ = that._options;
        this.position.x = $.POSITION.x + $.TAB_1.x + $.SLIDER.x / 2 - $.SLIDER.x * (1 - that.scaling) / 2;
        this.position.y = $.POSITION.y + $.AREA.y * (-0.5 - index);
        this.position.z = $.POSITION.z + $.AREA.z + $.DELTA_Z * 2;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
        this.visible = that.isSliderControl() && that.isVisible() && (that.object[that.property] > that.minValue)
                    && !that.isClosed;
    };
    that.parent.scene.add(that.wValueSliderBar);
}

THREE.SimpleDatGuiControl.__internals.prototype.createTextValue = function(value) {
    "use strict";

    var that = this.control;

    if (typeof that.wTextValue !== "undefined") {
        that.parent.scene.remove(that.wTextValue);
    }

    var _fontshapes = THREE.FontUtils.generateShapes(that.textHelper.truncated, that._options.FONT_PARAM);
    var _geometry = new THREE.ShapeGeometry(_fontshapes);
    that.wTextValue = new THREE.Mesh(_geometry, new THREE.MeshBasicMaterial(that._options.MATERIAL));
    that.wTextValue.updateRendering = function(index) {
        var $ = that._options;
        this.position.x = $.POSITION.x + $.TAB_1.x + that.textHelper.residiumX;
        this.position.y = $.POSITION.y + $.AREA.y * (-0.5 - index) - $.LABEL_OFFSET_Y;
        this.position.z = $.POSITION.z + $.AREA.z + $.DELTA_Z * 2;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
        this.visible = that.isVisible() && that.isTextControl() && !that.isClosed;
    };
    that.parent.scene.add(that.wTextValue);
}

THREE.SimpleDatGuiControl.__internals.prototype.createValueTextField = function(event) {
    "use strict";

    var that = this.control;
    var _geometry = new THREE.BoxGeometry(that._options.TEXT.x, that._options.TEXT.y, that._options.TEXT.z);
    var _material = new THREE.MeshBasicMaterial(that._options.MATERIAL);
    _material.color.setHex(that._options.COLOR_VALUE_FIELD);
    that.wValueTextField = new THREE.Mesh(_geometry, _material);
    that.wValueTextField.visible = false;
    that.wValueTextField.WebGLElement = that;
    that.wValueTextField.updateRendering = function(index) {
        var $ = that._options;
        this.position.x = $.POSITION.x + $.TAB_1.x + $.TEXT.x / 2;
        this.position.y = $.POSITION.y + $.AREA.y * (-0.5 - index);
        this.position.z = $.POSITION.z + $.AREA.z + $.DELTA_Z;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
        this.visible = that.isVisible() && that.isTextControl() && !that.isClosed;
    };
    that.parent.scene.add(that.wValueTextField);
}

THREE.SimpleDatGuiControl.__internals.prototype.createValueSliderField = function(event) {
    "use strict";

    var that = this.control;
    var _geometry = new THREE.BoxGeometry(that._options.SLIDER.x, that._options.SLIDER.y, that._options.SLIDER.z);
    var _material = new THREE.MeshBasicMaterial(that._options.MATERIAL);
    _material.color.setHex(that._options.COLOR_VALUE_FIELD);
    that.wValueSliderField = new THREE.Mesh(_geometry, _material);
    that.wValueSliderField.sliderType = "field";
    that.wValueSliderField.WebGLElement = that;
    that.wValueSliderField.updateRendering = function(index) {
        var $ = that._options;
        this.position.x = $.POSITION.x + $.TAB_1.x + $.SLIDER.x / 2;
        this.position.y = $.POSITION.y + $.AREA.y * (-0.5 - index);
        this.position.z = $.POSITION.z + $.AREA.z + $.DELTA_Z;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
        this.visible = that.isSliderControl() && that.isVisible() && !that.isClosed;
    };
    that.parent.scene.add(that.wValueSliderField);
}

THREE.SimpleDatGuiControl.__internals.prototype.createValueField = function(event) {
    "use strict";

    var that = this.control;
    var _geometry = new THREE.BoxGeometry(that._options.NUMBER.x, that._options.NUMBER.y, that._options.NUMBER.z);
    var _material = new THREE.MeshBasicMaterial(that._options.MATERIAL);
    _material.color.setHex(that._options.COLOR_VALUE_FIELD);
    that.wValueField = new THREE.Mesh(_geometry, _material);
    that.wValueField.updateRendering = function(index) {
        var $ = that._options;
        this.position.x = $.POSITION.x + $.TAB_2.x + $.NUMBER.x / 2;
        this.position.y = $.POSITION.y + $.AREA.y * (-0.5 - index);
        this.position.z = $.POSITION.z + $.AREA.z + $.DELTA_Z;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
        this.visible = that.isSliderControl() && that.isVisible() && !that.isClosed;
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
    var fontshapes = THREE.FontUtils.generateShapes(newValue.toFixed(digits), that._options.FONT_PARAM);
    var _geometry = new THREE.ShapeGeometry(fontshapes);
    that.wValue = new THREE.Mesh(_geometry, new THREE.MeshBasicMaterial(that._options.MATERIAL));
    that.wValue.updateRendering = function(index) {
        var $ = that._options;
        this.position.x = $.POSITION.x + $.TAB_2.x + $.OFFSET_X;
        this.position.y = $.POSITION.y + $.AREA.y * (-0.5 - index) - $.LABEL_OFFSET_Y;
        this.position.z = $.POSITION.z + $.AREA.z + $.DELTA_Z * 2;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
        this.visible = that.isSliderControl() && that.isVisible() && !that.isClosed;
    };
    that.parent.scene.add(that.wValue);
}

THREE.SimpleDatGuiControl.__internals.prototype.createCheckBoxes = function(event) {
    "use strict";

    var that = this.control;
    // CREATE CHECKBOX AREA
    var _geometry = new THREE.BoxGeometry(that._options.CHECKBOX.x, that._options.CHECKBOX.y, that._options.CHECKBOX.z);
    var _material = new THREE.MeshBasicMaterial(that._options.MATERIAL);
    that.wBoxUnChecked = new THREE.Mesh(_geometry, _material);
    that.wBoxUnChecked.visible = false;
    that.wBoxUnChecked.updateRendering = function(index) {
        var $ = that._options;
        this.position.x = $.POSITION.x + $.TAB_1.x + $.CHECKBOX.x / 2;
        this.position.y = $.POSITION.y + $.AREA.y * (-0.5 - index);
        this.position.z = $.POSITION.z + $.AREA.z + $.DELTA_Z;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
    };
    that.parent.scene.add(that.wBoxUnChecked);

    // CREATE CHECKBOX MARKER
    var fontshapes = THREE.FontUtils.generateShapes("X", {
        size: 7
    });
    var _geometry = new THREE.ShapeGeometry(fontshapes);
    var _material = new THREE.MeshLambertMaterial({
                color: 0x000000,
                depthTest: true,
                transparent: true
    });
    that.wBoxChecked = new THREE.Mesh(_geometry, _material);
    that.wBoxChecked.visible = false;
    that.wBoxChecked.updateRendering = function(index) {
        var $ = that._options;
        this.position.x = $.POSITION.x + $.TAB_1.x + $.CHECKBOX.x / 2 - 3;
        this.position.y = $.POSITION.y + $.AREA.y * (-0.5 - index) - 3.5;
        this.position.z = $.POSITION.z + $.AREA.z + $.DELTA_Z * 2;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
    };
    that.parent.scene.add(that.wBoxChecked);
}

THREE.SimpleDatGuiControl.__internals.prototype.createLabel = function(name) {
    "use strict";

    var that = this.control;
    if (typeof that.wLabel !== "undefined") {
        that.parent.scene.remove(that.wLabel);
    }
    var fontshapes = THREE.FontUtils.generateShapes(name, that._options.FONT_PARAM);
    var _geometry = new THREE.ShapeGeometry(fontshapes);
    that.wLabel = new THREE.Mesh(_geometry, new THREE.MeshBasicMaterial(that._options.MATERIAL));
    that.wLabel.updateRendering = function(index) {
        var $ = that._options;
        var WEBGL_CLOSE_LABEL_OFFSET_X = 30;
        var LABEL_OFFSET_X = 10;
        var folderOffset = (that.isElementFolder) ? 8 : 0;
        this.position.x = $.POSITION.x
                    + ((that.isCloseButton) ? ($.AREA.x / 2 - WEBGL_CLOSE_LABEL_OFFSET_X)
                                : (LABEL_OFFSET_X + folderOffset));
        this.position.y = $.POSITION.y + $.AREA.y * (-0.5 - index) - $.LABEL_OFFSET_Y;
        this.position.z = $.POSITION.z + $.AREA.z + $.DELTA_Z;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
        this.material.visible = that.isVisible() && !that.isClosed;
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
        var $ = that._options;
        this.position.x = $.POSITION.x + 10;
        this.position.y = $.POSITION.y - $.AREA.y / 2 - $.AREA.y * index;
        this.position.z = $.POSITION.z + $.AREA.z / 2 + $.DELTA_Z;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
        this.material.visible = that.isVisible() && !that.isClosed;
        this.rotation.z = (that.folderIsHidden) ? -Math.PI / 4 * 3 : -Math.PI / 4;
    };
    that.parent.scene.add(that.wLabelMarker);
}

THREE.SimpleDatGuiControl.__internals.prototype.createMarker = function() {
    "use strict";

    var that = this.control;
    var _geometry = new THREE.BoxGeometry(that._options.MARKER.x, that._options.MARKER.y, that._options.MARKER.z);
    var _material = new THREE.MeshBasicMaterial(that._options.MATERIAL);
    that.wMarker = new THREE.Mesh(_geometry, _material);
    that.wMarker.updateRendering = function(index) {
        var $ = that._options;
        this.position.x = $.POSITION.x + $.MARKER.x / 2 - 0.1;
        this.position.y = $.POSITION.y - $.AREA.y / 2 - $.AREA.y * index;
        this.position.z = $.POSITION.z + $.AREA.z / 2 + $.DELTA_Z;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
        this.material.visible = that.isVisible() && !that.isClosed;
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
    that.wFrame = new THREE.Line(_geometry, new THREE.LineBasicMaterial(that._options.MATERIAL));
    that.wFrame.material.color.setHex(COLOR_BODER);
    that.wFrame.updateRendering = function(index) {
        var $ = that._options;
        this.position.x = $.POSITION.x + $.AREA.x / 2 - 0.1;
        this.position.y = $.POSITION.y - $.AREA.y / 2 - $.AREA.y * index;
        this.position.z = $.POSITION.z + $.AREA.z + $.DELTA_Z;
        this.material.opacity = that.parent._private.opacityGui * 0.01;
        this.material.visible = that.isVisible() && !that.isClosed;
    };
    that.parent.scene.add(that.wFrame);
}

THREE.SimpleDatGuiControl.__internals.prototype.createCursor = function() {
    "use strict";

    var that = this.control;
    var _geometry = new THREE.BoxGeometry(0.5, that._options.TEXT.y * 0.8, 0.1);
    var _material = new THREE.MeshBasicMaterial(that._options.MATERIAL);
    this.control.wCursor = new THREE.Mesh(_geometry, _material);
    this.control.wCursor.updateRendering = function(index) {
        var $ = that._options;
        var possiblePositon = that.textHelper.possibleCursorPositons[that.textHelper.cursor - that.textHelper.start];
        if (typeof possiblePositon !== "undefined") {
            this.position.x = $.POSITION.x + $.TAB_1.x + that.textHelper.residiumX + possiblePositon.x + 0.25;
            this.position.y = $.POSITION.y + $.AREA.y * (-0.5 - index);
            this.position.z = $.POSITION.z + $.AREA.z + $.DELTA_Z * 2;
            this.material.opacity = that.parent._private.opacityGui * 0.01;
            this.material.visible = that.isVisible() && that.isTextControl() && (that.parent._private.focus === that)
                        && !that.isClosed;
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

    var element = new THREE.SimpleDatGuiControl(object, property, minValue, maxValue, this.parent, false, false,
                this._options);
    this._private.children.push(element);
    return element;
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
    "use strict";

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
 * This is a dirty workaround for the not always correct size of characters in
 * the font shapes. Replace all not working characters with similar size
 * characters.
 */
THREE.SimpleDatGuiTextHelper.prototype.createFontShapes = function(value) {
    "use strict";

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
    "use strict";

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
