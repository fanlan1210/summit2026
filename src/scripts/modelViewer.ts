import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { ViewHelper } from 'three/addons/helpers/ViewHelper.js'
import * as CANNON from 'cannon-es'
// import CannonDebugger from 'cannon-es-debugger'

export function initModelViewer() {
  const container = document.querySelector('.model-viewer') as HTMLElement

  if (!container) return

  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let controls: OrbitControls
  let world: CANNON.World

  // Debuggers
  let viewHelper: any
  // let cannonDebugger: any

  // Physics bodies and meshes mapping
  type PhysicBody = { mesh: THREE.Object3D; body: CANNON.Body }
  const stoolBodies: PhysicBody[] = []
  let pangolin: PhysicBody
  let groundBody: CANNON.Body

  // Camera shake tracking
  let lastCameraPosition = new THREE.Vector3()
  let cameraVelocity = new THREE.Vector3()
  let initialPosition = Math.floor(Math.random() * 3)
  const initCameraPosition = new THREE.Vector3(...(initialPosition < 1 ? [3, 1, -1] : initialPosition > 1 ? [-3, 1, -1] : [-2, 1, -1]))
  const targetCameraPosition = new THREE.Vector3(...(initialPosition < 1 ? [3, 0, 2] : initialPosition > 1 ? [3, 0, -2] : [3.23, 0, 0]))
  const initCameraShift = targetCameraPosition.clone().sub(initCameraPosition)
  const isMobile = container.clientWidth <= container.clientHeight

  // Get props from data attributes
  const backgroundColor = 0xfcf5f1
  const stools = [
    {
      color: 0xc0282a,
      position: new THREE.Vector3(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
    },
    {
      color: 0x2c76b4,
      position: new THREE.Vector3(0, 0, -0.5),
      scale: new THREE.Vector3(1, 0.6, 1),
    },
    {
      color: 0xd2c446,
      position: new THREE.Vector3(0, 0, 0.5),
      scale: new THREE.Vector3(1, 0.6, 1),
    },
    {
      color: 0x40ac3a,
      position: new THREE.Vector3(0, 0, 1),
      scale: new THREE.Vector3(1, 0.8, 1),
    },
    {
      color: 0x40ac3a,
      position: new THREE.Vector3(0, 0, -1),
      scale: new THREE.Vector3(1, 0.8, 1),
    },
  ]

  const init = () => {
    // Initialize Cannon.js physics world
    world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0), // Earth gravity
    })
    world.broadphase = new CANNON.NaiveBroadphase()
      ; (world.solver as CANNON.GSSolver).iterations = 10
    world.defaultContactMaterial.friction = 0.3
    world.defaultContactMaterial.restitution = 0.1 // No bouncing

    // Create ground physics body
    const groundShape = new CANNON.Plane()
    groundBody = new CANNON.Body({
      mass: 0, // Static body
      shape: groundShape,
    })
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(groundBody)

    // Create wall
    const wallBody = new CANNON.Body({ mass: 0 })
    const walls: [[number, number, number], [number, number, number]][] = [
      [[-1, 0, 0], [0, Math.PI / 2, 0]],
      [[2, 0, 0], [0, -Math.PI / 2, 0]],
      [[0, 0, 4], [-Math.PI / 6, Math.PI, 0]],
      [[0, 0, -4], [Math.PI / 6, 0, 0]],
    ]
    for (const [position, rotation] of walls) {
      const plane = new CANNON.Plane()
      const offset = new CANNON.Vec3(...position)
      let orientation = new CANNON.Quaternion()
      orientation.setFromEuler(...rotation)
      wallBody.addShape(plane, offset, orientation)
    }
    world.addBody(wallBody)

    // Create scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(backgroundColor)

    const ambientLight = new THREE.AmbientLight(0xffffff, 2)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(0, 3, 1)
    directionalLight.castShadow = true

    // Configure shadow properties to fix banding/lines
    directionalLight.shadow.mapSize.width = 4096
    directionalLight.shadow.mapSize.height = 4096
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 10
    directionalLight.shadow.camera.left = -2
    directionalLight.shadow.camera.right = 2
    directionalLight.shadow.camera.top = 2
    directionalLight.shadow.camera.bottom = -2
    directionalLight.shadow.bias = -0.0001
    directionalLight.shadow.normalBias = 0.02

    scene.add(ambientLight)
    scene.add(directionalLight)
    scene.fog = new THREE.Fog(backgroundColor, 3, 10)

    // Create camera
    camera = new THREE.PerspectiveCamera(isMobile ? 60 : 35, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.copy(initCameraPosition)

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.autoClear = false
    container.appendChild(renderer.domElement)

    const canvas = renderer.domElement
    const preventGesture = (e: Event) => e.preventDefault()
    canvas.addEventListener('gesturestart', preventGesture, { passive: false })
    canvas.addEventListener('gesturechange', preventGesture, { passive: false })

    // Add controls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = false
    controls.touches.ONE = null
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE
    controls.minPolarAngle = Math.PI * 0.1
    controls.maxPolarAngle = Math.PI * 0.4
    controls.enabled = false
    controls.rotateSpeed = (isMobile ? 1.25 : 0.5)
    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    controls.target.set(0, 0.4, 0)
    controls.update()

    // add floor
    const floorGeometry = new THREE.PlaneGeometry(30, 30)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: backgroundColor,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.receiveShadow = true
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, -0.002, 0)
    scene.add(floor)

    for (let i = 0; i < 8; i++) {
      const floorGeometry = new THREE.PlaneGeometry(0.1, 30)
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: i % 2 == 0 ? 0xe62327 : 0x3282b8,
        opacity: 0.5,
        transparent: true,
      })
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.receiveShadow = true
      floor.rotation.x = -Math.PI / 2
      floor.position.set(-0.8 + i * 0.2, -0.001, 0)
      scene.add(floor)
    }

    // Create slogan
    const svgLoader = new SVGLoader()
    svgLoader.load('models/slogan_merge.svg', data => {
      const paths = data.paths
      const group = new THREE.Group()
      const material = new THREE.MeshStandardMaterial({ color: 0x333333 })

      paths.forEach(path => {
        const shapes = SVGLoader.createShapes(path)
        shapes.forEach(shape => {
          const geometry = new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false })
          const mesh = new THREE.Mesh(geometry, material)
          group.add(mesh)
        })
      })
      group.position.set(-1, (isMobile ? 1.5 : 1), 1.15)
      group.scale.set(0.002, 0.002, 0.002)
      group.rotation.set(0, -Math.PI / 2, Math.PI)
      scene.add(group)
    })

    // add rolling pangolin
    svgLoader.load('models/pangolin-mono.svg', data => {
      const radius = 0.33 / 2
      const paths = data.paths
      const group = new THREE.Group()
      const material = new THREE.MeshStandardMaterial({ color: 0xd0ba7f })
      paths.forEach(path => {
        const shapes = SVGLoader.createShapes(path)
        shapes.forEach(shape => {
          const geometry = new THREE.ExtrudeGeometry(shape, { depth: 30, bevelEnabled: false })
          geometry.center()
          const mesh = new THREE.Mesh(geometry, material)
          group.add(mesh)
        })
      })
      group.scale.set(0.002, 0.002, 0.002)
      group.rotation.set(0, -Math.PI / 2, 0)
      group.position.set(-1.5, radius, initialPosition < 1 ? 10 : -10)

      const rotation = new CANNON.Quaternion()
      rotation.setFromEuler(group.rotation.x, group.rotation.y, group.rotation.z)

      const body = new CANNON.Body({
        mass: 600,
        position: group.position.clone() as any,
        quaternion: rotation,
        type: CANNON.Body.STATIC,
        linearDamping: 0,
        angularDamping: 0.8
      })
      const shape = new CANNON.Sphere(radius)
      body.addShape(shape)
      world.addBody(body)

      pangolin = { mesh: group, body: body }
      scene.add(group)
    })

    // Load GLTF model
    const gltfLoader = new GLTFLoader()
    gltfLoader.load('models/plastic-stool-r.glb', gltf => {
      const mesh = gltf.scene.children[0] as THREE.Mesh
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.geometry.computeBoundingBox()
      mesh.geometry.center()

      for (const stool of stools) {
        const clone = mesh.clone()
        const material = new THREE.MeshStandardMaterial()
        material.color.setHex(stool.color)
        material.side = THREE.DoubleSide
        clone.material = material
        clone.scale.set(stool.scale.x, stool.scale.y, stool.scale.z)

        // Create physics body for the stool using cylinder for better accuracy
        const stoolRadius = 0.24 * stool.scale.x
        const stoolHeight = 0.48 * stool.scale.y
        const stoolShape = new CANNON.Cylinder(stoolRadius * 0.78, stoolRadius, stoolHeight, 4)

        // Position the stool with its bottom at the ground (y=0)
        const physicsYPosition = stoolHeight / 2 + 0.1 // Center of mass at half height, just above ground

        const stoolBody = new CANNON.Body({
          mass: 1,
          position: new CANNON.Vec3(stool.position.x, physicsYPosition, stool.position.z),
          linearDamping: 0.4,
          angularDamping: 0.8,
        })
        const q = new CANNON.Quaternion()
        q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 4)
        stoolBody.addShape(stoolShape, new CANNON.Vec3(), q)
        world.addBody(stoolBody)

        // Store the mesh-body pair
        stoolBodies.push({ mesh: clone, body: stoolBody })
        scene.add(clone)
      }
    },
      null,
      error => console.error('An error occurred loading the model:', error)
    )

    // Enable view helper to see orbit
    viewHelper = new ViewHelper(camera, renderer.domElement)

    // Enable physics debugger to see collision shapes
    // cannonDebugger = CannonDebugger(scene, world, {
    //   color: 0x00ff00,
    //   scale: 1.0,
    // });
  }

  const timer = new THREE.Timer()
  const fixedTimeStep = 1 / 60 // 60 FPS fixed timestep
  let accumulator = 0
  let elapsed = 0
  let isVisible = false
  let canMove = false
  let lastDirection = initialPosition < 1 ? -1 : 1

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        // 當 canvas 進入視窗且動畫是暫停狀態，則恢復動畫
        if (entry.isIntersecting && !isVisible) {
          container.classList.add('loaded')
          isVisible = true
          animate()
        } else {
          isVisible = entry.isIntersecting
        }
      })
    },
    {
      threshold: 0.1, // 只要 Canvas 露出 10% 就開始渲染
    }
  )
  observer.observe(container)

  const animate = () => {

    if (!isVisible) return
    requestAnimationFrame(animate)

    // Update physics world with fixed timestep
    timer.update()
    const deltaTime = Math.min(timer.getDelta(), 0.1) // Cap delta to prevent spiral of death
    accumulator += deltaTime
    elapsed += deltaTime

    // Step physics with fixed timestep
    while (accumulator >= fixedTimeStep) {
      world.step(fixedTimeStep)
      accumulator -= fixedTimeStep
    }

    // update camera position
    if (!canMove) {
      // We are in the launch animation
      const progress = elapsed / 1.1
      if (progress <= 1.0) {
        const value = Math.min(1.724 * progress * (1 - 0.26 * progress * (1 + 0.616 * progress)), 1.0)
        const newPosition = initCameraPosition.clone().add(initCameraShift.clone().multiplyScalar(value))
        camera.position.copy(newPosition)
      } else {
        // bump the chairs and start the pangolin
        lastCameraPosition.copy(camera.position.clone().add(new THREE.Vector3(0, 1.5 + Math.random(), 0)))
        if (pangolin.body.type === CANNON.Body.STATIC) {
          pangolin.body.type = CANNON.Body.KINEMATIC
          pangolin.body.velocity.set(0, 0, lastDirection * 1.2)
          pangolin.body.angularVelocity.set(lastDirection * 8, 0, 0)
        }
        controls.enabled = true
        canMove = true
      }
    } else {
      // Detect camera shake (velocity from OrbitControls movement)
      const currentCameraPosition = camera.position.clone()
      cameraVelocity.copy(currentCameraPosition).sub(lastCameraPosition)
      lastCameraPosition.copy(currentCameraPosition)

      // Calculate shake intensity
      const shakeIntensity = cameraVelocity.length()

      // If camera is shaking (moving fast), apply forces to stools
      if (shakeIntensity > 0.0005) {
        const forceMagnitude = shakeIntensity * 100 // Significantly amplify the effect
        stoolBodies.forEach(({ body }) => {
          // Apply a horizontal force in the direction opposite to camera movement
          const force = new CANNON.Vec3(-cameraVelocity.x * forceMagnitude, 0.1, -cameraVelocity.z * forceMagnitude)

          // Apply force at the top of the stool to create wobble
          const worldPoint = new CANNON.Vec3(body.position.x, body.position.y, body.position.z)

          body.applyForce(force, worldPoint)

          // Also add some torque for more natural wobble
          const torqueStrength = forceMagnitude * 0.2
          const torque = new CANNON.Vec3((Math.random() - 0.5) * torqueStrength, 0, (Math.random() - 0.5) * torqueStrength)
          body.torque.vadd(torque, body.torque)
        })
      }
    }
    controls.update()

    // update rolling pangolin
    if (pangolin) {
      pangolin.mesh.position.copy(pangolin.body.position as any)
      pangolin.mesh.quaternion.copy(pangolin.body.quaternion as any)

      if (pangolin.body.type === CANNON.Body.KINEMATIC) {
        if (Math.abs(pangolin.body.position.z) > 10) { // only bounce back if we reached one side
          lastDirection = -lastDirection
          pangolin.body.velocity.set(0, 0, lastDirection * 1.2)
          pangolin.body.angularVelocity.set(lastDirection * 8, 0, 0)
        }
      }
    }

    // Update physics debugger
    // if (cannonDebugger) cannonDebugger.update()

    // Sync Three.js meshes with Cannon.js bodies
    stoolBodies.forEach(({ mesh, body }) => {
      mesh.position.copy(body.position as any)
      mesh.quaternion.copy(body.quaternion as any)
    })

    renderer.clear()
    renderer.render(scene, camera)
    renderer.clearDepth() // 確保座標軸不被方塊遮擋
    viewHelper.render(renderer)
  }

  const handlePointerDown = (e: PointerEvent) => {
    controls.enableZoom = e.pointerType === 'touch'
  }

  const handleResize = () => {
    if (camera && renderer && container) {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
  }

  // Initialize
  init()

  // Add event listeners
  window.addEventListener('load', () => {
    try {
      window.addEventListener('resize', handleResize)
      // window.addEventListener('deviceorientation', handleOrientation);
    } catch (e) {
      alert(e)
    }
  })
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('resize', handleResize)
    renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
    // window.removeEventListener('deviceorientation', handleOrientation);
    if (renderer) {
      renderer.dispose()
    }
  })
  window.addEventListener('keydown', (e) => {
    if (!stoolBodies.length) return
    if (e.key === "r") {
      stoolBodies.forEach(({ body }, idx) => {
        const stool = stools[idx]
        const stoolHeight = 0.48 * stool.scale.y
        body.position.set(stool.position.x, stoolHeight / 2 + 0.1, stool.position.z)
        body.quaternion.set(0, 0, 0, 1)
        body.velocity.set(0, 0, 0)
        body.angularVelocity.set(0, 0, 0)
      })
    } else if (e.key === "Enter") {
      // simple konami
      pangolin.body.type = CANNON.Body.DYNAMIC
      const i = Math.floor(Math.random() * stoolBodies.length)
      pangolin.body.quaternion.setFromEuler(0, Math.PI / 2, 0)
      pangolin.body.position.set(stoolBodies[i].body.position.x, 0, initialPosition < 1 ? 3.5 : -3.5)
      pangolin.body.velocity.set(0, 0, initialPosition < 1 ? -12 : 12)
    }
  })
}
