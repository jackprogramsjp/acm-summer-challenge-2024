import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export const scene = new THREE.Scene();
scene.background = new THREE.Color('#fff');

const light = new THREE.DirectionalLight('#fff', 5);
light.position.set(0.5, 1.0, 0.5).normalize();

scene.add(light);


export const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 750);

camera.position.y = 5;
camera.position.z = 10;

scene.add(camera);

const grid = new THREE.GridHelper(50, 50, '#fff', 0x7b7b7b);

scene.add(grid);

export const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener('change', render);
controls.update();

window.addEventListener('resize', onResize);

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}

function render() {
  renderer.render(scene, camera);
}
