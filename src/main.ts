import './style.css';
import * as THREE from 'three';
import run from './lib/runner.ts';
import * as globalScene from './lib/globalScene.ts';

document.body.appendChild(globalScene.renderer.domElement);

try {
  run(`

  let x = [2, 4, 6];
  
  print(x);
  
  let x = x + [8, 10];
  
  print(x);
  
  let x = append(x, 12);
  
  print(x);
  
  print(get(x, 2));
  
  `);

  run(`

  setBackgroundColor('#fff');
  block([10, 5, 10], [0, 5, 5], '#433F81');
  block([5, 2.5, 5], [0, 0, 0], '#023032');
  pyramid([2.5, 2.5, 2.5], [5, 0, 0], '#239254');
  
  `);
} catch (e) {
  console.error(`${e}`);
}

function render() {
  requestAnimationFrame(render);
  globalScene.renderer.render(globalScene.scene, globalScene.camera);
}

render();
