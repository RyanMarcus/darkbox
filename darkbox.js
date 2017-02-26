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
 
 
 
 
let MIN_DIM = -3;
let MAX_DIM = 3;

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

function isMobile() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

document.addEventListener("DOMContentLoaded", function() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(
        75, // field of view
        window.innerWidth / window.innerHeight, // aspect ratio
        0.1, 1000 // near and far clipping points
    );
    
    var renderer = new THREE.WebGLRenderer();

    if (isMobile()) {
        renderer.setPixelRatio(0.25);
    } else {
        renderer.setPixelRatio(0.75);
    }
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild( renderer.domElement );

    // compute the visible dimensions at z = MAX_HEIGHT
    const cFOV = camera.fov * Math.PI / 180;
    const height = 2 * Math.tan(cFOV / 2) * MAX_HEIGHT;
    const aspect = window.innerWidth / window.innerHeight;
    const width = height * aspect;
    const minDim = Math.min(width, height);
    MIN_DIM = 0 - (minDim / 2);
    MAX_DIM = minDim / 2;


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
