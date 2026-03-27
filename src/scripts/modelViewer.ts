import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initModelViewer() {
  const container = document.querySelector('.model-viewer') as HTMLElement;

  if (!container) return;

  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;

  // Get props from data attributes
  const modelPath = container.dataset.modelPath || '';
  const initCamera = JSON.parse(container.dataset.initCamera || '[5, -1, 5]') as [number, number, number];
  const invertOrbit = container.dataset.invertOrbit === 'true';

  const init = () => {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(0, 2, 1);
    directionalLight.castShadow = true;

    // Configure shadow properties to fix banding/lines
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 10;
    directionalLight.shadow.camera.left = -2;
    directionalLight.shadow.camera.right = 2;
    directionalLight.shadow.camera.top = 2;
    directionalLight.shadow.camera.bottom = -2;
    directionalLight.shadow.bias = -0.0001;
    directionalLight.shadow.normalBias = 0.02;

    scene.add(ambientLight);
    scene.add(directionalLight);

    // Create camera
    camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(...initCamera);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Add controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.1;
    controls.maxPolarAngle = Math.PI * 0.5;

    if (invertOrbit) {
      controls.rotateSpeed = -0.3;
    } else {
      controls.rotateSpeed = 0.5;
    }

    // Load model and scene
    Promise.all([
      new Promise<void>((resolve, reject) => {
        if (modelPath) {
          // Load GLTF model
          new GLTFLoader().load(
            modelPath,
            (gltf) => {
              const mesh = gltf.scene.children[0] as THREE.Mesh;
              mesh.pivot = new THREE.Vector3(0, -0.19, 0);
              mesh.position.set(0, 0, -0.2);
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              scene.add(mesh);
              const clone = mesh.clone();
              clone.scale.set(1, 0.7, 1);
              const material = new THREE.MeshStandardMaterial();
              material.color.setHex(0x00ff00);
              material.side = THREE.DoubleSide;
              clone.material = material;
              clone.position.set(0, 0, 0.2);
              scene.add(clone);
              resolve();
            },
            (xhr) => {
              console.log('model:', (xhr.loaded / xhr.total) * 100 + '% loaded');
            },
            (error) => {
              console.error('An error occurred loading the model:', error);
              reject(error);
            }
          );
        } else {
          resolve();
        }
      })
    ]).then(() => {
      animate();
    });
  };

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };

  const handleResize = () => {
    if (camera && renderer && container) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  };
  // Initialize
  init();

  // Add event listeners
  window.addEventListener('resize', handleResize);
  // Cleanup function for when the page unloads
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('resize', handleResize);
    if (renderer) {
      renderer.dispose();
    }
  });
}
