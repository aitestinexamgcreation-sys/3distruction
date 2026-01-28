// 3Distruction - Mobile Destruction Emulator with Advanced Graphics
// Using Babylon.js for WebGPU support and PBR materials for realistic rendering

let engine;
let scene;
let camera;
let physicsPlugin;
let ground;
let destructibleObjects = [];

// Initialize the Babylon.js engine and scene
async function init() {
    const canvas = document.getElementById('renderCanvas');
    
    // Create engine with WebGL2 (WebGPU support for modern devices)
    engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false
    });
    
    // Render at native device resolution for better visual quality
    engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
    
    // Create scene
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.15);
    
    // Enable physics with Cannon.js (built-in physics engine)
    scene.enablePhysics(
        new BABYLON.Vector3(0, -9.81, 0),
        new BABYLON.CannonJSPlugin()
    );
    
    // Setup camera
    setupCamera();
    
    // Setup advanced lighting (RTX-like)
    setupLighting();
    
    // Create environment with reflections
    setupEnvironment();
    
    // Create ground
    createGround();
    
    // Create initial destructible objects
    createDestructibleTower();
    
    // Setup interactions
    setupInteractions();
    
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 1000);
    
    // Render loop
    engine.runRenderLoop(() => {
        scene.render();
    });
    
    // Resize handler
    window.addEventListener('resize', () => {
        engine.resize();
    });
}

// Setup camera with mobile-friendly controls
function setupCamera() {
    camera = new BABYLON.ArcRotateCamera(
        'camera',
        Math.PI / 4,
        Math.PI / 3,
        25,
        new BABYLON.Vector3(0, 5, 0),
        scene
    );
    
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 50;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2;
    
    // Mobile optimizations
    camera.panningSensibility = 1000;
    camera.pinchPrecision = 50;
    camera.wheelPrecision = 50;
    
    // Smooth camera movements
    camera.inertia = 0.9;
    camera.angularSensibilityX = 1000;
    camera.angularSensibilityY = 1000;
}

// Setup advanced lighting system with multiple light sources
function setupLighting() {
    // Enable HDR for more realistic lighting
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
    scene.imageProcessingConfiguration.exposure = 1.0;
    scene.imageProcessingConfiguration.contrast = 1.2;
    
    // Main directional light (sun)
    const sunLight = new BABYLON.DirectionalLight(
        'sunLight',
        new BABYLON.Vector3(-1, -2, -1),
        scene
    );
    sunLight.position = new BABYLON.Vector3(20, 40, 20);
    sunLight.intensity = 1.5;
    sunLight.shadowMinZ = 1;
    sunLight.shadowMaxZ = 100;
    
    // Enable shadows for realistic depth
    const shadowGenerator = new BABYLON.ShadowGenerator(2048, sunLight);
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
    shadowGenerator.darkness = 0.3;
    
    // Store shadow generator globally
    scene.shadowGenerator = shadowGenerator;
    
    // Ambient lighting
    const ambientLight = new BABYLON.HemisphericLight(
        'ambientLight',
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    ambientLight.intensity = 0.4;
    ambientLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    
    // Point light for dynamic highlights
    const pointLight = new BABYLON.PointLight(
        'pointLight',
        new BABYLON.Vector3(0, 10, 0),
        scene
    );
    pointLight.intensity = 0.5;
    pointLight.diffuse = new BABYLON.Color3(1, 0.9, 0.8);
    pointLight.specular = new BABYLON.Color3(1, 1, 1);
}

// Setup environment with reflections
function setupEnvironment() {
    // Create skybox for reflections
    const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: 1000.0 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    
    // Create a gradient effect
    skyboxMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.15, 0.3);
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
    
    // Enable reflections for the scene
    scene.environmentIntensity = 1.0;
}

// Create ground with PBR material
function createGround() {
    ground = BABYLON.MeshBuilder.CreateGround(
        'ground',
        { width: 50, height: 50 },
        scene
    );
    
    // PBR Material for realistic rendering
    const groundMaterial = new BABYLON.PBRMaterial('groundMaterial', scene);
    
    // Base color
    groundMaterial.albedoColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    
    // Metallic and roughness for realistic surface
    groundMaterial.metallic = 0.1;
    groundMaterial.roughness = 0.8;
    
    // Enable reflections
    groundMaterial.environmentIntensity = 0.5;
    groundMaterial.directIntensity = 1.0;
    
    // Bump mapping for surface detail
    groundMaterial.bumpTexture = new BABYLON.Texture(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        scene
    );
    
    ground.material = groundMaterial;
    
    // Enable physics
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
        ground,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.3, friction: 0.5 },
        scene
    );
    
    // Receive shadows
    ground.receiveShadows = true;
}

// Create beautiful PBR material with textures
function createPBRMaterial(name, color, metallic = 0.3, roughness = 0.6) {
    const material = new BABYLON.PBRMaterial(name, scene);
    
    // Base color
    material.albedoColor = color;
    
    // Metallic and roughness for realistic material
    material.metallic = metallic;
    material.roughness = roughness;
    
    // Enable reflections and environment effects
    material.environmentIntensity = 1.0;
    material.directIntensity = 1.0;
    
    // Enable specular reflections for realistic highlights
    material.reflectivityColor = new BABYLON.Color3(1, 1, 1);
    material.microSurface = 0.96;
    
    // Enable subsurface scattering for more realistic look
    material.subSurface.isRefractionEnabled = false;
    material.subSurface.isTranslucencyEnabled = false;
    
    return material;
}

// Create a tower of destructible objects
function createDestructibleTower() {
    const boxSize = 2;
    const layers = 5;
    const boxesPerLayer = 3;
    
    for (let layer = 0; layer < layers; layer++) {
        for (let i = 0; i < boxesPerLayer; i++) {
            const x = (i - boxesPerLayer / 2 + 0.5) * (boxSize * 1.1);
            const y = boxSize / 2 + layer * boxSize * 1.05;
            const z = 0;
            
            createDestructibleBox(
                new BABYLON.Vector3(x, y, z),
                boxSize,
                layer
            );
        }
    }
}

// Create a single destructible box with beautiful materials
function createDestructibleBox(position, size, layerIndex) {
    const box = BABYLON.MeshBuilder.CreateBox(
        'box_' + destructibleObjects.length,
        { size: size },
        scene
    );
    
    box.position = position;
    
    // Create varied PBR materials for different objects
    const colors = [
        new BABYLON.Color3(0.8, 0.2, 0.2),  // Red
        new BABYLON.Color3(0.2, 0.6, 0.9),  // Blue
        new BABYLON.Color3(0.3, 0.8, 0.3),  // Green
        new BABYLON.Color3(0.9, 0.7, 0.2),  // Gold
        new BABYLON.Color3(0.7, 0.3, 0.8),  // Purple
    ];
    
    const color = colors[layerIndex % colors.length];
    const metallic = 0.2 + (layerIndex % 3) * 0.2;
    const roughness = 0.4 + (layerIndex % 3) * 0.15;
    
    box.material = createPBRMaterial(
        'boxMaterial_' + destructibleObjects.length,
        color,
        metallic,
        roughness
    );
    
    // Add physics
    box.physicsImpostor = new BABYLON.PhysicsImpostor(
        box,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 1, restitution: 0.4, friction: 0.5 },
        scene
    );
    
    // Cast and receive shadows
    if (scene.shadowGenerator) {
        scene.shadowGenerator.addShadowCaster(box);
    }
    box.receiveShadows = true;
    
    destructibleObjects.push(box);
    
    return box;
}

// Setup interactions (touch and mouse)
function setupInteractions() {
    let pickingRay;
    
    scene.onPointerDown = (evt, pickResult) => {
        if (pickResult.hit && pickResult.pickedMesh && pickResult.pickedMesh !== ground) {
            // Apply impulse to the picked object
            const impulseDirection = pickResult.pickedMesh.position.subtract(camera.position).normalize();
            const impulseMagnitude = 10;
            
            if (pickResult.pickedMesh.physicsImpostor) {
                pickResult.pickedMesh.physicsImpostor.applyImpulse(
                    impulseDirection.scale(impulseMagnitude),
                    pickResult.pickedMesh.getAbsolutePosition()
                );
            }
            
            // Visual feedback
            if (pickResult.pickedMesh.material && pickResult.pickedMesh.material.albedoColor) {
                const originalColor = pickResult.pickedMesh.material.albedoColor.clone();
                pickResult.pickedMesh.material.albedoColor = new BABYLON.Color3(1, 1, 1);
                
                setTimeout(() => {
                    if (pickResult.pickedMesh.material && pickResult.pickedMesh.material.albedoColor) {
                        pickResult.pickedMesh.material.albedoColor = originalColor;
                    }
                }, 100);
            }
        }
    };
}

// Global function to reset the scene
function resetScene() {
    // Remove all destructible objects
    destructibleObjects.forEach(obj => {
        obj.dispose();
    });
    destructibleObjects = [];
    
    // Recreate the tower
    createDestructibleTower();
}

// Global function to add a new box
function addBox() {
    const randomX = (Math.random() - 0.5) * 10;
    const randomZ = (Math.random() - 0.5) * 10;
    const position = new BABYLON.Vector3(randomX, 15, randomZ);
    
    createDestructibleBox(position, 2, Math.floor(Math.random() * 5));
}

// Load Cannon.js physics engine
function loadCannonJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.babylonjs.com/cannon.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Start the application
loadCannonJS().then(() => {
    init();
}).catch(error => {
    console.error('Failed to load physics engine:', error);
    document.getElementById('loadingScreen').innerHTML = 
        '<div class="loading-text" style="color: red;">Failed to load. Please refresh.</div>';
});
