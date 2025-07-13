// ======== INISIALISASI DASAR ========
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 70, 150);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
document.getElementById('container').appendChild(renderer.domElement);

// ======== KONTROL & CAHAYA (DENGAN PERBAIKAN) ========
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2.1;
controls.minDistance = 1;
controls.maxDistance = 800;
// --- Settingan baru untuk kontrol yang lebih enak ---
controls.screenSpacePanning = true;
controls.zoomSpeed = 1.5;
controls.panSpeed = 1.5;

const ambientLight = new THREE.AmbientLight(0x607D8B, 0.9);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(100, 200, 150);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 50;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -250;
directionalLight.shadow.camera.right = 250;
directionalLight.shadow.camera.top = 250;
directionalLight.shadow.camera.bottom = -250;
scene.add(directionalLight);
const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
scene.add(hemisphereLight);

// ======== KONTEN & VARIABEL GLOBAL ========
let clouds = [];
const textureLoader = new THREE.TextureLoader();
let varioMotor = null;

// ======== VARIABEL & LOGIKA KONTROL BARU ========
let isMotorControlActive = false;
const proximityThreshold = 35;
const keysPressed = {};
const moveSpeed = 0.8;
const turnSpeed = 0.04;

const controlPanel = document.getElementById('control-panel');
const enterBtn = document.getElementById('enter-control-btn');
const exitBtn = document.getElementById('exit-control-btn');

document.addEventListener('keydown', (event) => { keysPressed[event.key.toLowerCase()] = true; });
document.addEventListener('keyup', (event) => { keysPressed[event.key.toLowerCase()] = false; });

enterBtn.addEventListener('click', () => {
    isMotorControlActive = true;
});

exitBtn.addEventListener('click', () => {
    isMotorControlActive = false;
});

// ======== Inisialisasi KONTEN SCENE ========
const ground = createTerrain();
createRoad();
createClouds(25);
placeLargeHouse(ground);
placeSecondHouse(ground);
createVario();
placeCustomTrees();
createParkingLot();

// ======== LOOP ANIMASI UTAMA (FINAL) ========
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Selalu update OrbitControls

    checkProximityToVario();

    if (isMotorControlActive) {
        moveVario();
        if (varioMotor) {
            controls.target.copy(varioMotor.position);
        }
    }

    updateClouds();
    renderer.render(scene, camera);
}
animate();

// ======== FUNGSI-FUNGSI BARU & MODIFIKASI ========

function checkProximityToVario() {
    if (!varioMotor) return;

    if (!isMotorControlActive) {
        const distance = camera.position.distanceTo(varioMotor.position);
        if (distance < proximityThreshold) {
            controlPanel.style.display = 'flex';
            enterBtn.style.display = 'block';
            exitBtn.style.display = 'none';
        } else {
            controlPanel.style.display = 'none';
        }
    } else {
        controlPanel.style.display = 'flex';
        enterBtn.style.display = 'none';
        exitBtn.style.display = 'block';
    }
}
//tempat ini untuk bagian control motor Vario dikeyboard 
function moveVario() {
    if (!varioMotor) return;
    if (keysPressed['arrowdown'] || keysPressed['w']) {
        varioMotor.translateZ(-moveSpeed);
    }
    if (keysPressed['arrowup'] || keysPressed['s']) {
        varioMotor.translateZ(moveSpeed);
    }
    if (keysPressed['arrowleft'] || keysPressed['a']) {
        varioMotor.rotation.y += turnSpeed;
    }
    if (keysPressed['arrowright'] || keysPressed['d']) {
        varioMotor.rotation.y -= turnSpeed;
    }
}

// ======== SEMUA FUNGSI ASLI LO (DENGAN PERBAIKAN PATH) ========

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function createParkingLot() {
    const loader = new GLTFLoader();
    
    // wajib sama nama file modelnya ,jangan lupa diubah
    loader.load('models/parking/parking_lot.glb', (gltf) => {
        
        const parkingLot = gltf.scene;
        parkingLot.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        parkingLot.scale.set(1.5, 1.5, 1.5);
        parkingLot.position.set(-35, 0.1, -110);
        parkingLot.rotation.y = 0;
        scene.add(parkingLot);
    }, undefined, (error) => {
        console.error('Gagal load model parkiran:', error);
    });
}

function createRoad() {
    const roadLength = 1000;
    const roadWidth = 12;
    const roadGeometry = new THREE.BoxGeometry(roadWidth, 0.1, roadLength);
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x1c1c1c });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.y = 0.05;
    road.receiveShadow = true;
    scene.add(road);
    const markingMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const markingLength = 4;
    const markingGap = 6;
    const numMarkings = roadLength / (markingLength + markingGap);
    for (let i = 0; i < numMarkings; i++) {
        const markingGeometry = new THREE.BoxGeometry(0.3, 0.1, markingLength);
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        const zPos = -roadLength / 2 + i * (markingLength + markingGap) + markingLength / 2;
        marking.position.set(0, 0.15, zPos);
        marking.receiveShadow = true;
        scene.add(marking);
    }
}

function createVario() {
    const loader = new GLTFLoader();

    // wajib sama nama file modelnya ,jangan lupa diubah
    loader.load('models/vario/vario_psx_style_-_han66st.glb', (gltf) => {
        
        const motor = gltf.scene;
        motor.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        motor.position.set(15, 0.1, 20); //Yang tengah buat naik & turun 
        motor.scale.set(8, 8, 8);
        scene.add(motor);
        varioMotor = motor;
    }, undefined, (error) => {
        console.error('An error happened while loading the Vario model:', error);
    });
}

function createClouds(count) {
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 0.9 });
    for (let i = 0; i < count; i++) {
        const cloudGroup = new THREE.Group();
        const mainPuff = new THREE.Mesh(new THREE.SphereGeometry(20, 16, 16), cloudMaterial);
        const puff1 = new THREE.Mesh(new THREE.SphereGeometry(10 + Math.random() * 5, 16, 16), cloudMaterial);
        puff1.position.set(-15, -5, Math.random() * 5);
        const puff2 = new THREE.Mesh(new THREE.SphereGeometry(12 + Math.random() * 5, 16, 16), cloudMaterial);
        puff2.position.set(15, 0, Math.random() * 5);
        cloudGroup.add(mainPuff, puff1, puff2);
        const posX = Math.random() * 1000 - 500;
        const posY = 150 + Math.random() * 60;
        const posZ = Math.random() * 1000 - 500;
        cloudGroup.position.set(posX, posY, posZ);
        cloudGroup.scale.setScalar(0.8 + Math.random() * 0.5);
        cloudGroup.userData.speed = 0.05 + Math.random() * 0.05;
        scene.add(cloudGroup);
        clouds.push(cloudGroup);
    }
}

function updateClouds() {
    clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed;
        if (cloud.position.x > 600) {
            cloud.position.x = -600;
        }
    });
}

function createLargeHouse() {
    const house = new THREE.Group();
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xdeb887 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xadd8e6 });
    const floor1 = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 15), wallMaterial);
    floor1.position.y = 6;
    floor1.castShadow = true;
    house.add(floor1);
    const floor2 = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 14), wallMaterial);
    floor2.position.y = 17;
    floor2.castShadow = true;
    house.add(floor2);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(16, 8, 4), roofMaterial);
    roof.position.y = 26;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 0.5), roofMaterial);
    door.position.set(0, 3, 7.55);
    house.add(door);
    const window1 = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.5), windowMaterial);
    window1.position.set(-6, 7, 7.55);
    const window2 = window1.clone();
    window2.position.set(6, 7, 7.55);
    const window3 = window1.clone();
    window3.position.set(-5, 18, 7.05);
    const window4 = window1.clone();
    window4.position.set(5, 18, 7.05);
    house.add(window1, window2, window3, window4);
    return house;
}

function placeLargeHouse(groundObject) {
    const house = createLargeHouse();
    const placementRaycaster = new THREE.Raycaster();
    const housePosition = new THREE.Vector3(30, 100, 40);
    placementRaycaster.set(housePosition, new THREE.Vector3(0, -1, 0));
    const intersects = placementRaycaster.intersectObject(groundObject);
    if (intersects.length > 0) {
        house.position.copy(intersects[0].point);
        scene.add(house);
    } else {
        house.position.set(housePosition.x, 0, housePosition.z);
        scene.add(house);
    }
}

function placeSecondHouse(groundObject) {
    const house = createLargeHouse();
    const ray = new THREE.Raycaster();
    const position = new THREE.Vector3(-60, 100, 70);
    ray.set(position, new THREE.Vector3(0, -1, 0));
    const intersects = ray.intersectObject(groundObject);
    if (intersects.length > 0) {
        house.position.copy(intersects[0].point);
        scene.add(house);
    } else {
        house.position.set(position.x, 0, position.z);
        scene.add(house);
    }
}

function createTerrain() {
    const groundSize = 1000;
    
    const grassTexture = textureLoader.load('rumput.jpg'); //nama filenya harus sama ,ini untuk texture rumput ya 
    
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(100, 100);
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 0.9,
        metalness: 0.1
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
    return groundMesh;
}

function createRealisticTree() {
    const tree = new THREE.Group();
    const barkTexture = textureLoader.load('bark.jpg'); //nama filenya harus sama ,ini untuk texture kayu ya 
    barkTexture.wrapS = THREE.RepeatWrapping;
    barkTexture.wrapT = THREE.RepeatWrapping;
    const leavesTexture = textureLoader.load('leaves.jpg');
    leavesTexture.wrapS = THREE.RepeatWrapping;
    leavesTexture.wrapT = THREE.RepeatWrapping;
    const trunkMaterial = new THREE.MeshStandardMaterial({ map: barkTexture, roughness: 0.9 });
    const leavesMaterial = new THREE.MeshStandardMaterial({ map: leavesTexture, color: 0x556B2F, roughness: 0.8 });
    const trunkHeight = 7 + Math.random() * 3;
    const trunkRadius = 0.4 + Math.random() * 0.2;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 12), trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    tree.add(trunk);
    const canopyBaseY = trunkHeight;
    const canopySphereCount = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < canopySphereCount; i++) {
        const sphereRadius = 2.5 + Math.random() * 1.5;
        const leafSphere = new THREE.Mesh(new THREE.SphereGeometry(sphereRadius, 12, 8), leavesMaterial);
        leafSphere.position.set((Math.random() - 0.5) * 4, canopyBaseY + (Math.random() - 0.3) * 3, (Math.random() - 0.5) * 4);
        leafSphere.castShadow = true;
        tree.add(leafSphere);
    }
    tree.scale.setScalar(1.8 + Math.random() * 0.4);
    return tree;
}

function placeCustomTrees() {
    const tree1 = createRealisticTree();
    tree1.position.set(18, 0, 12);
    scene.add(tree1);
    const tree2 = createRealisticTree();
    tree2.position.set(55, 0, 45);
    scene.add(tree2);
}
