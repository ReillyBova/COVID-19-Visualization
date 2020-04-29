/**
 * entry.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */

import { WebGLRenderer, PerspectiveCamera, Vector2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import EarthScene from './objects/EarthScene.js';
// Scene and renderer
const scene = new EarthScene();
const renderer = new WebGLRenderer({ antialias: true });

// camera
const fov = 60;
const aspect = 2; // the canvas default
const near = 0.1;
const far = 70;
const camera = new PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2.5;

// controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 1.2;
controls.maxDistance = 4;
controls.update();

// renderer
renderer.setPixelRatio(window.devicePixelRatio);

// Create Bloom
const renderedScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
);
bloomPass.renderToScreen = true;
bloomPass.threshold = 0;
bloomPass.strength = 0.4;
bloomPass.radius = 0.4;
const composer = new EffectComposer(renderer);
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(renderedScene);
composer.addPass(bloomPass);

// render loop
const onAnimationFrameHandler = (timeStamp) => {
    controls.update();
    composer.render(scene, camera);
    scene.update && scene.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

// resize
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler);

// dom
document.body.style.margin = 0;
document.body.appendChild(renderer.domElement);
