/*
 =====================================================================
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions
 are met:

 1. Redistributions of source code must retain the above
 copyright notice, this list of conditions and the following
 disclaimer.

 2. Redistributions in binary form must reproduce the above
 copyright notice, this list of conditions and the following
 disclaimer in the documentation and/or other materials provided
 with the distribution.

 3. The name of the author may not be used to endorse or promote
 products derived from this software without specific prior
 written permission.

 THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS
 OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 @author Daniel Kwiecinski <daniel.kwiecinski@lambder.com>
 @copyright 2009 Daniel Kwiecinski.
 @end
 =====================================================================
 */
var HashMap = function() {
    this.initialize();
}

HashMap.prototype = {
    hashkey_prefix : "<#HashMapHashkeyPerfix>",
    hashcode_field : "<#HashMapHashcodeField>",
    hashmap_instance_id : 0,

    initialize : function() {
	this.backing_hash = {};
	this.code = 0;
	this.hashmap_instance_id += 1;
	this.instance_id = this.hashmap_instance_id;
    },

    hashcodeField : function() {
	return this.hashcode_field + this.instance_id;
    },
    /*
     * maps value to key returning previous assocciation
     */
    put : function(key, value) {
	var prev;

	if (key && value) {
	    var hashCode;
	    if (typeof (key) === "number" || typeof (key) === "string") {
		hashCode = key;
	    } else {
		hashCode = key[this.hashcodeField()];
	    }
	    if (hashCode) {
		prev = this.backing_hash[hashCode];
	    } else {
		this.code += 1;
		hashCode = this.hashkey_prefix + this.code;
		key[this.hashcodeField()] = hashCode;
	    }
	    this.backing_hash[hashCode] = [ key, value ];
	}
	return prev === undefined ? undefined : prev[1];
    },
    /*
     * returns value associated with given key
     */
    get : function(key) {
	var value;
	if (key) {
	    var hashCode;
	    if (typeof (key) === "number" || typeof (key) === "string") {
		hashCode = key;
	    } else {
		hashCode = key[this.hashcodeField()];
	    }
	    if (hashCode) {
		value = this.backing_hash[hashCode];
	    }
	}
	return value === undefined ? undefined : value[1];
    },
    /*
     * deletes association by given key. Returns true if the assocciation
     * existed, false otherwise
     */
    del : function(key) {
	var success = false;
	if (key) {
	    var hashCode;
	    if (typeof (key) === "number" || typeof (key) === "string") {
		hashCode = key;
	    } else {
		hashCode = key[this.hashcodeField()];
	    }
	    if (hashCode) {
		var prev = this.backing_hash[hashCode];
		this.backing_hash[hashCode] = undefined;
		if (prev !== undefined) {
		    key[this.hashcodeField()] = undefined; // let's clean the
							    // key object
		    success = true;
		}
	    }
	}
	return success;
    },
    /*
     * iterate over key-value pairs passing them to provided callback the
     * iteration process is interrupted when the callback returns false. the
     * execution context of the callback is the value of the key-value pair @
     * returns the HashMap (so we can chain) (
     */
    each : function(callback, args) {
	var key;
	for (key in this.backing_hash) {
	    if (callback.call(this.backing_hash[key][1], this.backing_hash[key][0], this.backing_hash[key][1]) === false)
		break;
	}
	return this;
    },
    toString : function() {
	return "HashMapJS"
    }

}