THREE.SimpleDatGuiOculusRiftDemo.html
-------------------------------------
Demonstrates the use of *THREE.SimpleDatGui* for Oculus Rift DK2. 

*Just open http://webgl-examples.appspot.com/simple-webgl-gui-oculus-rift/THREE.SimpleDatGuiOculusRiftDemo.html and/or install this project locally.* 

Motivation
----------
For simple WebGL applications with THREE.js the Google's Chrome Experiment DAT.GUI is a good choice to render a minimal user interface, but there is no simple and reliable way to render DAT.GUI inside the WebGL scene. Oculus Rift Applications need to render the user interface inside the scene to display for both eyes. 

At the moment I know no support of a simple GUI in THREE.js. This was my motivation to develop a simple GUI based on THREE.js which should be as good as reasonable API compatible with DAT.GUI and has the same Look & Feel. The following article describes THREE.SimpleDatGui the result of these experiments. THREE.SimpleDatGui can serve as Heads-Up Display (HUD) in WebGL and/or in Oculus Rift applications.

Main Components
---------------
* **THREE.SimpleDatGuiOculusRiftDemo.html** (321 sloc) - renders a simple skydome with Oculus Rift style
* **THREE.SimpleDatGui.js** (1584 sloc) - renders the GUI
* **THREE.OculusRiftMouse.js** (90 sloc) - renders two mouse cursors
* **THREE.OculusRiftControls.js** (101 sloc) - gets sensor data from Oculus Rift Data at http:\\localhost:8444
* **OculusRiftSensorConnector.jar** - fetches Oculus Rift Data from USB port and provides at http:\\localhost:8444

Use of Oculus Rift Sensor Connector
-----------------------------------
The *Oculus Rift Sensor Connector* provides sensor data at http://localhost:8444 and the access from *THREE.OculusRiftControls.js* happens with JSONP. The performance of this integration is not as fast as some other implementations based on web sockets, but is works without additional browser plug-in. Execute the following five steps to run with Oculus Rift Sensor:

* **Get the project:** 
Fork project on GitHub (https://github.com/MarkusSprunck/oculus-rift-sensor-connector.git) or download the zip (https://github.com/MarkusSprunck/oculus-rift-sensor-connector).
* **Connect your Oculus Rift DK2 to your computer:** 
Use the *Oculus Configuration Utility* to set the *Rift Display Mode* to *Extended Desktop to the HMD*.
* **Start ./target/OculusRiftSensorConnector.jar:** 
You may use _OculusRiftSensorConnector.cmd_ on Windows. The compiled version expects Java 8 runtime, but it should work also with elder Java versions (maybe you have to change some lines).
* **Open ./client/THREE.SimpleDatGuiOculusRiftDemo.html:** 
Chrome Options for Local Development - The Google Chrome browser will not load local file by default due to security reason.  When you fork the project and open from file system, start with the command line option _--allow-file-access-from-files_ to load the textures. See also http://www.chrome-allow-file-access-from-file.com/
* **Activate Connection to Oculus Rift:** The Oculus Control is not active by default, because most visitors will not have the Oculus Rift hardware connected when opening. In this case you may use the standard trackbar control to move the scene. To connect to Oculus Rift, just open folder _Advanced Options_ and check _Oculus Control Active_.

Tested Configurations
---------------------
The demo THREE.SimpleDatGuiOculusRiftDemo.html has been tested with the following browsers on Windows 7 with Oculus Rift DK2:
* Chrome 41 (60 FPS)
* Firefox 36 (60 FPS)
* Internet Explorer 11 (8 FPS, definitely to slow for Oculus Rift)

The component THREE.SimpleDatGui has been tested additionally on iOS 8.2 with iPad II with the following configurations: 
* Safari (30 FPS)
* Chrome (30 FPS)

Just open THREE.SimpleDatGuiDemo.html:
* http://webgl-examples.appspot.com/simple-webgl-gui/THREE.SimpleDatGuiDemo.html?hud=false
* http://webgl-examples.appspot.com/simple-webgl-gui/THREE.SimpleDatGuiDemo.html?hud=true

Open Issues and Missing Features
--------------------------------
* THREE.SimpleDatGui.js - Compared to DAT.GUI the color picker control is missing and the save & restore of values
* THREE.SimpleDatGui.js - No copy & paste support in text and value controls
* THREE.SimpleDatGui.js - value control - slider just accepts mouse click - no mouse drag
* THREE.SimpleDatGui.js - value control - the value can not be edited directly just with click on slider 
* THREE.SimpleDatGui.js - in the case the scene is rotated in non fixed mode the location of the cursor in the text control is wrong
* THREE.OculusRiftControls.js - performance and robustness should be improved

Credits for Equirectangular Pictures
------------------------------------
The tree scenes in this demo are licensed under the Creative Commons Attribution-Share Alike 2.0 Generic license. 

* http://commons.wikimedia.org/wiki/File:Place_Dauphine,_Paris_November_2011.jpg
* http://commons.wikimedia.org/wiki/File:Place_de_la_Concorde,_Paris_March_2007.jpg
* http://commons.wikimedia.org/wiki/File:Parc_de_Belleville,_Paris_June_2007.jpg	

Many thanks to the author Alexandre Duret-Lutz (https://www.flickr.com/people/24183489@N00) from Paris, France.

Credits for Libraries
---------------------
* Ricardo Cabello for three.js (see https://github.com/mrdoob)
* Daniel Kwiecinski for hashmap.js
	
Read More
---------
http://www.sw-engineering-candies.com




