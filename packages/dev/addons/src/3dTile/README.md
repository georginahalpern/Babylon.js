This is an in-progress test app used to load 3d tiles and navigate a globe with a geospatial camera. Right now the 3d tile loader is stubbed out to just load a single gltf file containing cubes placed around a 50 radius sphere.

To run the test playground

- run playground development launch command from vscode
- replace URL with http://localhost:1338/?inspectorv2#MQHLDI#5 to load the test playground
- in a terminal cd to packages/dev/addons/src/3dTile directiory and run http-server -a localhost -p 8003 --cors=http://localhost:8080/ to load the files locally (or update the calls in loader to fetch the texture URL / tileset.json and do a local fetch instead)

The playground will call into loader.ts TestApp.render3DTiles() which will do the following

--> TestApp.render3DTiles creates a GeospatialCamera, a simple sphere of radius 50 (wrapping it in a globe texture loaded from localhost:8003), and a tileLoader, then calls tileLoader.loadModelAsync
--> tileLoader.loadModelAsync fetches tileset.json from localhost:8003 and parses it to find the root URI
--> the root URI points to BoxPrimitiveOutline.gltf, which contains a set of simple cubes that are scattered around a sphere of radius 50

The code in question lives in this 3d tile addon folder, as well as
Camera/geospatialCamera.ts
Camera/inputs/geospatialCameraFooInput
Inspector-v2/geospatialCameraProperties
