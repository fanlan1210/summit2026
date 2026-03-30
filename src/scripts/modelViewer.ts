import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ViewHelper } from 'three/addons/helpers/ViewHelper.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function initModelViewer() {
  const container = document.querySelector('.model-viewer') as HTMLElement;

  if (!container) return;

  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let viewHelper: ViewHelper;
  let world: CANNON.World;
  let cannonDebugger: any;
  let rolling = {
    mesh: null as THREE.Group | null,
    radius: 0.33,
    height: 0.0001,
    speed: 5,
  }

  // Physics bodies and meshes mapping
  const physicsBodies: Array<{ mesh: THREE.Mesh; body: CANNON.Body }> = [];
  let groundBody: CANNON.Body;

  // Camera shake tracking
  let lastCameraPosition = new THREE.Vector3();
  let cameraVelocity = new THREE.Vector3();
  const initCameraPosition = [3, 2, -3] as [number, number, number];
  const targetCameraPosition = [3, 0, 2] as [number, number, number];
  const isMobile = container.clientWidth <= container.clientHeight;

  // Get props from data attributes
  const modelPath = container.dataset.modelPath || '';
  const invertOrbit = container.dataset.invertOrbit === 'true';
  const backgroundColor = 0xFCF5F1;
  const stools = [
    {
      color: 0xC0282A,
      position: new THREE.Vector3(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
    },
    {
      color: 0x2C76B4,
      position: new THREE.Vector3(0, 0, -0.5),
      scale: new THREE.Vector3(1, 0.6, 1),
    },
    {
      color: 0xD2C446,
      position: new THREE.Vector3(0, 0, 0.5),
      scale: new THREE.Vector3(1, 0.6, 1),
    },
    {
      color: 0x40AC3A,
      position: new THREE.Vector3(0, 0, 1),
      scale: new THREE.Vector3(1, 0.8, 1),
    },
    {
      color: 0x40AC3A,
      position: new THREE.Vector3(0, 0, -1),
      scale: new THREE.Vector3(1, 0.8, 1),
    },
  ]

  const init = () => {
    // Initialize Cannon.js physics world
    world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0), // Earth gravity
    });
    world.broadphase = new CANNON.NaiveBroadphase();
    (world.solver as CANNON.GSSolver).iterations = 10;
    world.defaultContactMaterial.friction = 0.3;
    world.defaultContactMaterial.restitution = 0.1; // No bouncing

    // Create ground physics body
    const groundShape = new CANNON.Plane();
    groundBody = new CANNON.Body({
      mass: 0, // Static body
      shape: groundShape,
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Create wall
    const wallShape1 = new CANNON.Box(new CANNON.Vec3(0.1, 50, 10));
    const wallShape2 = new CANNON.Box(new CANNON.Vec3(10, 50, 0.1));
    const wallBody = new CANNON.Body({ mass: 0 });
    wallBody.addShape(wallShape1, new CANNON.Vec3(1, 20, 0));
    wallBody.addShape(wallShape1, new CANNON.Vec3(-1, 20, 0));
    wallBody.addShape(wallShape2, new CANNON.Vec3(0, 20, 4));
    wallBody.addShape(wallShape2, new CANNON.Vec3(0, 20, -4));
    world.addBody(wallBody);

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(0, 3, 1);
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
    scene.fog = new THREE.Fog(backgroundColor, 3, 10);

    // Create camera
    camera = new THREE.PerspectiveCamera(
      isMobile ? 60 : 35,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(...initCameraPosition);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);

    viewHelper = new ViewHelper(camera, renderer.domElement);
    const helperContainer = document.createElement('div');
    helperContainer.style.position = 'absolute';
    helperContainer.style.right = '0';
    helperContainer.style.top = '0';
    helperContainer.style.width = '128px';
    helperContainer.style.height = '128px';
    document.body.appendChild(helperContainer);

    // Add controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = isTouchDevice();
    controls.touches.ONE = null;
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    controls.minPolarAngle = Math.PI * 0.1;
    controls.maxPolarAngle = Math.PI * 0.4;
    controls.enabled = false;

    if (invertOrbit) {
      controls.rotateSpeed = -0.3;
    } else {
      controls.rotateSpeed = 0.5;
    }
    if (isMobile) {
      controls.rotateSpeed *= 2.5;
    }

    controls.target.set(0, 0.4, 0);
    controls.update();

    // add floor
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: backgroundColor
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.002, 0);
    scene.add(floor);

    for (let i = 0; i < 8; i++) {
      const floorGeometry = new THREE.PlaneGeometry(0.1, 30);
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: i % 2 == 0 ? 0xE62327 : 0x3282B8,
        opacity: 0.5,
        transparent: true
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.receiveShadow = true;
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(-0.8 + i * 0.2, -0.001, 0);
      scene.add(floor);
    }

    // Create slogan
    const loader = new SVGLoader();
    loader.load('models/slogan_merge.svg', (data) => {
      const paths = data.paths;
      const group = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({ color: 0x333333 });

      paths.forEach((path) => {
        const shapes = SVGLoader.createShapes(path);
        shapes.forEach((shape) => {
          const geometry = new THREE.ExtrudeGeometry(shape, { depth: 10, bevelEnabled: false });
          const mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);
        });
      });
      if (isMobile) {
        group.position.set(-1, 1.5, 1.15);
      } else {
        group.position.set(-1, 1, 1.15);
      }
      group.scale.set(0.002, 0.002, 0.002);
      group.rotation.set(0, - Math.PI / 2, Math.PI);
      scene.add(group);
    });

    // add rolling pangolin
    loader.load('models/pangolin-mono.svg', (data) => {
      const paths = data.paths;
      const group = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({ color: 0xd0ba7f });
      paths.forEach((path) => {
        const shapes = SVGLoader.createShapes(path);
        shapes.forEach((shape) => {
          const geometry = new THREE.ExtrudeGeometry(shape, { depth: 30, bevelEnabled: false });
          geometry.center();
          const mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);
        });
      });
      group.scale.set(0.002, 0.002, 0.002);
      group.rotation.y = -Math.PI / 2;
      group.position.set(-1.5, rolling.radius / 2, -10);
      rolling.mesh = group;
      scene.add(group);
    });

    // Load model and scene
    Promise.all([
      new Promise<void>((resolve, reject) => {
        if (modelPath) {
          // Load GLTF model
          new GLTFLoader().load(
            modelPath,
            (gltf) => {
              const mesh = gltf.scene.children[0] as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              mesh.geometry.computeBoundingBox();
              mesh.geometry.center();

              for (const stool of stools) {
                const clone = mesh.clone();
                const material = new THREE.MeshStandardMaterial();
                material.color.setHex(stool.color);
                material.side = THREE.DoubleSide;
                clone.material = material;
                clone.scale.set(stool.scale.x, stool.scale.y, stool.scale.z);

                // Create physics body for the stool using cylinder for better accuracy
                const stoolRadius = 0.24 * stool.scale.x;
                const stoolHeight = 0.48 * stool.scale.y;
                const stoolShape = new CANNON.Cylinder(stoolRadius * 0.78, stoolRadius, stoolHeight, 4);

                // Position the stool with its bottom at the ground (y=0)
                const physicsYPosition = stoolHeight / 2 + 0.1; // Center of mass at half height, just above ground

                const stoolBody = new CANNON.Body({
                  mass: 1,
                  position: new CANNON.Vec3(
                    stool.position.x,
                    physicsYPosition,
                    stool.position.z
                  ),
                  linearDamping: 0.4,
                  angularDamping: 0.8,
                });
                const q = new CANNON.Quaternion();
                q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 4);
                stoolBody.addShape(stoolShape, new CANNON.Vec3(), q)
                  ;
                world.addBody(stoolBody);

                // Store the mesh-body pair
                physicsBodies.push({ mesh: clone, body: stoolBody });

                scene.add(clone);
              }
              resolve();
            },
            (xhr) => { },
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
      // Enable physics debugger to see collision shapes
      // cannonDebugger = CannonDebugger(scene, world, {
      //   color: 0x00ff00,
      //   scale: 1.0,
      // });
      document.querySelector('.model-viewer')?.classList.add('loaded');
      animate();
    });
  };

  const timer = new THREE.Timer();
  const fixedTimeStep = 1 / 60; // 60 FPS fixed timestep
  let accumulator = 0;
  let isVisible = true;
  let canMove = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // 當 canvas 進入視窗 (isIntersecting 為 true)
      isVisible = entry.isIntersecting;

      if (isVisible) {
        animate();
      }
    });
  }, {
    threshold: 0.1 // 只要 Canvas 露出 10% 就開始渲染
  });
  observer.observe(container);

  const animate = () => {
    if (!isVisible) return;

    requestAnimationFrame(animate);

    // Update physics world with fixed timestep
    timer.update();
    const deltaTime = Math.min(timer.getDelta(), 0.1); // Cap delta to prevent spiral of death
    accumulator += deltaTime;

    // Step physics with fixed timestep
    while (accumulator >= fixedTimeStep) {
      world.step(fixedTimeStep);
      accumulator -= fixedTimeStep;
    }

    // update camera position
    const distance = camera.position.distanceTo(new THREE.Vector3(...targetCameraPosition));
    if (!canMove && distance > 1.495) {
      const deltaVector = new THREE.Vector3(...targetCameraPosition).sub(camera.position);
      camera.position.add(deltaVector.multiplyScalar(2 * deltaTime));
    } else if (!canMove) {
      lastCameraPosition.copy(camera.position);
      controls.enabled = true;
      canMove = true;
    } else {
      // Detect camera shake (velocity from OrbitControls movement)
      const currentCameraPosition = camera.position.clone();
      cameraVelocity.copy(currentCameraPosition).sub(lastCameraPosition);
      lastCameraPosition.copy(currentCameraPosition);

      // Calculate shake intensity
      const shakeIntensity = cameraVelocity.length();

      // If camera is shaking (moving fast), apply forces to stools
      if (shakeIntensity > 0.0005) {
        const forceMagnitude = shakeIntensity * 100; // Significantly amplify the effect
        physicsBodies.forEach(({ body }) => {
          // Apply a horizontal force in the direction opposite to camera movement
          const force = new CANNON.Vec3(
            -cameraVelocity.x * forceMagnitude,
            0.1,
            -cameraVelocity.z * forceMagnitude
          );

          // Apply force at the top of the stool to create wobble
          const worldPoint = new CANNON.Vec3(
            body.position.x,
            body.position.y,
            body.position.z
          );

          body.applyForce(force, worldPoint);

          // Also add some torque for more natural wobble
          const torqueStrength = forceMagnitude * 0.2;
          const torque = new CANNON.Vec3(
            (Math.random() - 0.5) * torqueStrength,
            0,
            (Math.random() - 0.5) * torqueStrength
          );
          body.torque.vadd(torque, body.torque);
        });
      }
    }
    controls.update();

    // update rolling pangolin
    if (rolling.mesh) {
      rolling.mesh.rotation.x += rolling.speed * deltaTime;
      rolling.mesh.position.z += rolling.speed * rolling.radius * deltaTime;
      if (rolling.mesh.position.z > 10) {
        rolling.mesh.position.z = -10;
        rolling.speed = Math.random() * 4 + 3;
      }
    }

    // Update physics debugger
    if (cannonDebugger) cannonDebugger.update();

    // Sync Three.js meshes with Cannon.js bodies
    physicsBodies.forEach(({ mesh, body }) => {
      mesh.position.copy(body.position as any);
      mesh.quaternion.copy(body.quaternion as any);
    });

    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth(); // 確保座標軸不被方塊遮擋
    viewHelper.render(renderer);
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
  window.addEventListener('load', () => {
    try {
      window.addEventListener('resize', handleResize);
      // window.addEventListener('deviceorientation', handleOrientation);
    } catch (e) {
      alert(e);
    }
  });
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('resize', handleResize);
    // window.removeEventListener('deviceorientation', handleOrientation);
    if (renderer) {
      renderer.dispose();
    }
  });
}
