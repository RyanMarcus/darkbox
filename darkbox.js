// < begin copyright > 
// Copyright Ryan Marcus 2017
// 
// This file is part of darkbox.
// 
// darkbox is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// darkbox is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with darkbox.  If not, see <http://www.gnu.org/licenses/>.
// 
// < end copyright > 
 
 
 
 
const MIN_DIM = -3;
const MAX_DIM = 3;

const MIN_CUT_HEIGHT = 8;
const MIN_CUT_WIDTH = 40;
const EDGE_PADDING = 1;

const MAX_HEIGHT = 3;

const MAX_ANIMATION_HEIGHT = 0.5;
const ANIMATION_INCREMENT = MAX_ANIMATION_HEIGHT / 1000;

function doCuts(depthArray, numCuts, value) {
    for (let cuts = 0; cuts < numCuts; cuts++) {
        // select a random chunk to reduce to 5
        const totalPadding = MIN_CUT_WIDTH + EDGE_PADDING;
        let x = EDGE_PADDING + Math.floor(Math.random() * (100 - totalPadding));
        let y = EDGE_PADDING + Math.floor(Math.random() * (100 - totalPadding));

        const maxWidth = (100 - x) - EDGE_PADDING;
        const maxHeight = (100 - y) - EDGE_PADDING;
        let width = MIN_CUT_WIDTH
                + Math.floor(Math.random() * (maxWidth - MIN_CUT_WIDTH));
        let height = MIN_CUT_HEIGHT
                + Math.floor(Math.random() * (maxHeight - MIN_CUT_HEIGHT));
        
        for (let i = y; i < y + height; i++) {
            for (let j = x; j < x + width; j++) {
                depthArray[i][j] = Math.min(depthArray[i][j], value);
            }
        }
    }
    
    return depthArray;
}

function buildRandomDepthArray() {
    let toR = [];
    for (let i = 0; i < 100; i++) {
        let toAdd = [];
        for (let j = 0; j < 100; j++)
            toAdd.push(10);

        toR.push(toAdd);
    }

    toR = doCuts(toR, 3, 8);
    toR = doCuts(toR, 2, 5);
    return toR;
}

function normToDim(norm) {
    return (norm * (MAX_DIM - MIN_DIM));
}

function normToPos(norm) {
    return MIN_DIM + (norm * (MAX_DIM - MIN_DIM));
}
const loader = new THREE.TextureLoader();
const texture = loader.load("images/dark-wood.png");

function levelSetToMeshes(depthArray, level) {
    // build a list of boxes running right to left of the appropiate height
    // for the given level. Maximize the width of the box first.

    let boxes = [[]];
    
    for (let i = 0; i < depthArray.length; i++) {
        let startingPoint = -1;
        for (let j = 0; j < depthArray[i].length; j++) {
            if (depthArray[i][j] == level && startingPoint == -1) {
                startingPoint = j;
            }

            if (depthArray[i][j] != level && startingPoint != -1) {
                boxes[boxes.length-1].push(startingPoint + "," +  (j-1));
                startingPoint = -1;
            }
        }

        if (startingPoint != -1)
            boxes[boxes.length-1].push(startingPoint
                                       + "," + depthArray[i].length);
        
        boxes.push([]);        
    }

    const toR = [];
    //const material = new THREE.MeshStandardMaterial( { color: 0x555555 } );
    const material = new THREE.MeshStandardMaterial({
        map: texture
    });
    for (let i = 0; i < boxes.length; i++) {
        while (boxes[i].length != 0) {
            const candidate = boxes[i].shift();
            let height = 1;

            // look down below us to see how far we can extend this block
            for (let j = i+1; j < boxes.length; j++) {
                const idxOf = boxes[j].indexOf(candidate);
                if (idxOf != -1) {
                    boxes[j].splice(idxOf, 1);
                    height++;
                } else {
                    break;
                }
            }

            let values = candidate.split(",").map(x => parseInt(x));
            let normalizedWidth = (values[1] - values[0])/100;
            let normalizedHeight = height / 100;
            let geometry = new THREE.BoxGeometry(normToDim(normalizedWidth),
                                                 normToDim(normalizedHeight),
                                                 MAX_HEIGHT * (level / 10));
            
            const box = new THREE.Mesh(geometry, material);
            box.castShadow = true;
            box.receiveShadow = true;
            let x = normToPos(values[0] / 100);
            let y = normToPos(i / boxes.length);

            // x and y are the coords of the "top left" corner of the box,
            // we need to translate them to the box's center.
            x += normToDim(normalizedWidth) / 2;
            y += normToDim(normalizedHeight) / 2;
            
            box.position.x = x;
            box.position.y = y;

            toR.push(box);
            
        }
    }

    return toR;
    
}

document.addEventListener("DOMContentLoaded", function() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(
        75, // field of view
        window.innerWidth / window.innerHeight, // aspect ratio
        0.1, 1000 // near and far clipping points
    );
    
    var renderer = new THREE.WebGLRenderer();

    renderer.setPixelRatio(0.25);
    renderer.setSize( window.innerWidth, window.innerHeight );

    console.log("Pixel ratio: " + renderer.getPixelRatio());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild( renderer.domElement );

    /*var geometry = new THREE.BoxGeometry( 0.5, 4, 1 );
     var material = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
     var cube = new THREE.Mesh(geometry, material);
     var cube2 = new THREE.Mesh(geometry, material);
     var cube3 = new THREE.Mesh(geometry, material);
     var cube4 = new THREE.Mesh(geometry, material);

     cube.castShadow = true;
     cube2.castShadow = true;

     cube.position.x = -1.75;
     cube2.position.x = 1.75;

     cube3.rotation.z = Math.PI / 2;
     cube3.position.y = 2;

     cube4.rotation.z = Math.PI / 2;
     cube4.position.y = -2;

     scene.add(cube4);
     scene.add(cube3);
     scene.add(cube2);
     scene.add(cube);*/

    const grid = buildRandomDepthArray();
    let boxes = [];
    boxes = boxes.concat(levelSetToMeshes(grid, 10), boxes);
    boxes = boxes.concat(levelSetToMeshes(grid, 8), boxes);
    boxes = boxes.concat(levelSetToMeshes(grid, 5), boxes);

    for (let box of boxes) {
        scene.add(box);
    }
    
    var planeGeometry = new THREE.PlaneGeometry(20, 20);
    var pMaterial = new THREE.MeshStandardMaterial({color: 0x555555});
    var plane = new THREE.Mesh(planeGeometry, pMaterial);
    plane.position.z = -0.5;
    plane.receiveShadow = true;
    scene.add(plane);
    
    camera.position.z = 6;
    camera.position.y = 0;


    var light = new THREE.DirectionalLight(0xb0b0b0);
    light.position.set(0, -2, 2);
    scene.add(light);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    var light2 = new THREE.DirectionalLight(0x444444);
    light2.position.set(3, -1, 8);
    scene.add(light2);
    light2.castShadow = true;
    light2.shadow.mapSize.width = 1024;
    light2.shadow.mapSize.height = 1024;

    
    var light3 = new THREE.DirectionalLight(0x444444);
    light3.position.set(-3, -1, 8);
    scene.add(light3);
    light3.castShadow = true;
    light3.shadow.mapSize.width = 1024;
    light3.shadow.mapSize.height = 1024;

    var light4 = new THREE.DirectionalLight(0x444444);
    light4.position.set(0, 1, 8);
    scene.add(light4);
    light4.castShadow = true;
    light4.shadow.mapSize.width = 1024;
    light4.shadow.mapSize.height = 1024;

    var light5 = new THREE.DirectionalLight(0x444444);
    light5.position.set(-3, 1, 8);
    scene.add(light5);
    light5.castShadow = true;
    light5.shadow.mapSize.width = 1024;
    light5.shadow.mapSize.height = 1024;


    var light6 = new THREE.DirectionalLight(0x444444);
    light6.position.set(3, 1, 8);
    scene.add(light6);
    light6.castShadow = true;
    light6.shadow.mapSize.width = 1024;
    light6.shadow.mapSize.height = 1024;


    // add some ambient light
    var aLight = new THREE.AmbientLight(0x777777);
    scene.add(aLight);

    let currentBox = false;
    let direction = -1;
    function selectNewBox() {
        const idx = Math.floor(Math.random() * boxes.length);
        currentBox = boxes[idx];
        direction = 1;
    }
    selectNewBox();

    let lastT = 0;
    function render(t) {
        if (currentBox.position.z <= 0) {
            currentBox.position.z = 0;
            selectNewBox();
        }
        const steps = t - lastT;
        currentBox.position.z += steps * (direction * ANIMATION_INCREMENT);
        if (currentBox.position.z >= MAX_ANIMATION_HEIGHT)
            direction = -1;
        
        lastT = t;
        
	requestAnimationFrame( render );
	renderer.render( scene, camera );
    }
    render(0);
});
