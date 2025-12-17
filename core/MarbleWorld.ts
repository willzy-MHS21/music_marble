import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InputSystem } from './systems/InputSystem';
import { SelectionSystem } from './systems/SelectionSystem';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { AssetLoader } from './AssetLoader';
import { ModelManager } from './ModelManager';
import { DragController } from './systems/DragSystem';
import { Model } from './Model';
import { AudioSystem } from './systems/AudioSystem';

export class MarbleWorld {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private wall: THREE.Mesh;
    private isPaused: boolean = true; // Start paused

    // Camera lock functionality
    private isCameraLocked: boolean = false;
    private cameraOffset: THREE.Vector3 = new THREE.Vector3(-15, 15, 15);
    private savedControlsState: {
        enabled: boolean;
        target: THREE.Vector3;
        position: THREE.Vector3;
    } | null = null;
    private marbleGoalTimers: Map<Model, NodeJS.Timeout> = new Map();
    private marbleFallTimers: Map<Model, NodeJS.Timeout> = new Map();
    private marbleInitialPositions: Map<Model, THREE.Vector3> = new Map();

    // Systems
    private input!: InputSystem;
    private selection!: SelectionSystem;
    private physics!: PhysicsSystem;
    private assetLoader!: AssetLoader;
    private modelManager!: ModelManager;
    private dragController!: DragController;
    private audioSystem!: AudioSystem;

    constructor() {
        this.scene = this.createScene();
        this.camera = this.setupCamera();
        this.renderer = this.setupRenderer();
        this.addLights();
        this.wall = this.createWall();
        this.controls = this.setupControls();

        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        this.init();
    }

    private async init() {
        // Initialize physics
        this.physics = new PhysicsSystem();
        await this.physics.init(this.scene);

        // Load all assets (models and audio)
        this.assetLoader = new AssetLoader();
        await this.assetLoader.loadAllAssets();

        // Initialize Audio System
        const audioContext = this.assetLoader.getAudioContext();
        const audioBuffers = this.assetLoader.getAllAudio();
        this.audioSystem = new AudioSystem(audioContext, audioBuffers);

        // Wire Physics to Audio and check for goal collision
        this.physics.onCollision = (model1, model2, speed) => {
            this.audioSystem.playCollisionSound(model1, model2, speed);
            this.onMarbleCollision(model1, model2);
        };

        // Create Model Manager
        const preLoadedModels = this.assetLoader.getAllModels();
        this.modelManager = new ModelManager(this.scene, preLoadedModels);

        // Create other Systems
        this.selection = new SelectionSystem(this.audioSystem);
        this.selection.setOnDeleteCallback((model) => { this.onModelDeleted(model); });
        this.selection.setOnRotationChangeCallback((model) => { this.onModelRotationChanged(model); });
        this.selection.setOnSelectionChangeCallback((model) => { this.onSelectionChanged(model); });
        this.dragController = new DragController(this.controls);
        this.input = new InputSystem(
            this.wall,
            this.camera,
            this.dragController,
            this.modelManager,
            (model) => this.onModelPlaced(model),
            (model) => this.onModelClicked(model),
            (model) => this.onModelDragStart(model),
            () => this.onEmptySpaceClicked(),
            () => { this.togglePlayPause(); });

    }

    public togglePlayPause(): boolean {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    public isPausedState(): boolean {
        return this.isPaused;
    }

    public ShapeButtonClick(shapeType: string, mouseevent: MouseEvent) {
        if (!this.input) return;
        const wallPoint = this.input.getWallIntersection(mouseevent);
        if (!wallPoint) return;
        const newModel = this.modelManager.spawnModel(shapeType, wallPoint);
        this.dragController.startDrag(newModel);
    }

    private onModelPlaced(model: Model) {
        this.physics.createBody(model);
        this.selection.select(model);
        
        // Store initial position for marbles
        if (model.shapeType === 'marble') {
            this.marbleInitialPositions.set(model, model.threeObject.position.clone());
        }
    }

    private onModelClicked(model: Model) {
        this.selection.select(model);
    }

    private onModelDragStart(model: Model) {
        this.physics.removeBody(model);
        this.selection.select(model);
        this.dragController.startDrag(model);
    }

    private onEmptySpaceClicked() {
        this.selection.deselect();
    }

    private onModelDeleted(model: Model) {
        this.physics.removeBody(model);
        this.modelManager.removeModel(model);
        
        // Remove initial position tracking
        if (model.shapeType === 'marble') {
            this.marbleInitialPositions.delete(model);
        }
    }

    private onModelRotationChanged(model: Model) {
        this.physics.updateBodyRotation(model);
    }

    private onSelectionChanged(model: Model | null) {
        this.input.setSelectedModel(model);
    }

    private onMarbleCollision(model1: Model, model2: Model) {
        // Check if one of the models is a marble
        const marble = model1.shapeType === 'marble' ? model1 : 
                      model2.shapeType === 'marble' ? model2 : null;

        if (marble) {
            // Check for goal collision
            const otherShape = model1.shapeType === 'marble' ? model2 : model1;
            this.checkGoalCollision(marble, otherShape);
        }
    }

    private checkGoalCollision(marble: Model, otherShape: Model) {
        // Don't start a new timer if one already exists for this marble
        if (this.marbleGoalTimers.has(marble)) return;

        // Get the goal shape (lowest Y position)
        const goalShape = this.getGoalShape();
        if (!goalShape) return;

        // Check if the marble collided with the goal shape
        if (otherShape === goalShape) {
            console.log('Marble touched the goal! Disappearing in 1 second...');
            
            // Set a timer to remove the marble after 1 second
            const timer = setTimeout(() => {
                this.removeMarble(marble);
                this.marbleGoalTimers.delete(marble);
            }, 1000);
            
            this.marbleGoalTimers.set(marble, timer);
        }
    }

    private getGoalShape(): Model | null {
        const models = this.modelManager.getAllModels();
        const nonMarbleModels = models.filter(model => model.shapeType !== 'marble');
        
        if (nonMarbleModels.length === 0) return null;

        // Find the model with the lowest Y position
        let lowestModel = nonMarbleModels[0];
        let lowestY = lowestModel.threeObject.position.y;

        for (const model of nonMarbleModels) {
            if (model.threeObject.position.y < lowestY) {
                lowestY = model.threeObject.position.y;
                lowestModel = model;
            }
        }

        return lowestModel;
    }

    private removeMarble(marble: Model) {
        // Get the initial position before removing
        const initialPosition = this.marbleInitialPositions.get(marble);
        
        // Check if camera was locked to this marble
        const shouldRelockCamera = this.isCameraLocked && this.getFirstMarble() === marble;
        
        // Unlock camera temporarily if it was following this marble
        if (shouldRelockCamera) {
            this.toggleCameraLock();
        }

        // Clear all timers for this marble
        if (this.marbleGoalTimers.has(marble)) {
            clearTimeout(this.marbleGoalTimers.get(marble)!);
            this.marbleGoalTimers.delete(marble);
        }
        if (this.marbleFallTimers.has(marble)) {
            clearTimeout(this.marbleFallTimers.get(marble)!);
            this.marbleFallTimers.delete(marble);
        }

        // Remove initial position tracking
        this.marbleInitialPositions.delete(marble);

        // Remove the marble from physics and scene
        this.physics.removeBody(marble);
        this.modelManager.removeModel(marble);

        // Pause the scene - set to true to ensure it's paused
        this.isPaused = true;

        // Spawn a new marble at the initial position 
        if (initialPosition) {
            const newMarble = this.modelManager.spawnModel('marble', initialPosition.clone());
            this.physics.createBody(newMarble);
            this.marbleInitialPositions.set(newMarble, initialPosition.clone());
            console.log('New marble spawned at initial position');
            
            // Re-lock camera to the new marble if it was locked before
            if (shouldRelockCamera) {
                this.toggleCameraLock();
            }
        }
    }

    private checkMarbleFallOffTrack() {
        const models = this.modelManager.getAllModels();
        const marbles = models.filter(model => model.shapeType === 'marble');
        const goalShape = this.getGoalShape();
        
        if (!goalShape) return;
        
        const lowestY = goalShape.threeObject.position.y;
        
        marbles.forEach(marble => {
            const marbleY = marble.threeObject.position.y;
            
            // Check if marble has fallen below the lowest shape
            if (marbleY < lowestY && !this.marbleFallTimers.has(marble) && !this.marbleGoalTimers.has(marble)) {
                console.log('Marble fell below track! Removing in 1 second...');
                
                // Start 1-second timer before removal
                const timer = setTimeout(() => {
                    this.removeMarble(marble);
                    this.marbleFallTimers.delete(marble);
                }, 1000);
                
                this.marbleFallTimers.set(marble, timer);
            }
        });
    }

    public toggleCameraLock(): boolean {
        this.isCameraLocked = !this.isCameraLocked;
        
        if (this.isCameraLocked) {
            // Find the first marble to follow
            const marble = this.getFirstMarble();
            if (!marble) {
                console.warn('No marble found in scene. Cannot lock camera.');
                this.isCameraLocked = false;
                return false;
            }
            
            console.log('Camera locked to marble at position:', marble.threeObject.position);
            
            // Save current controls state
            this.savedControlsState = {
                enabled: this.controls.enabled,
                target: this.controls.target.clone(),
                position: this.camera.position.clone()
            };
            
            // Keep orbit controls enabled for user interaction
            this.controls.enabled = true;
            
            // Set target to marble position
            const marblePos = marble.threeObject.position.clone();
            this.controls.target.copy(marblePos);
            
            // Position camera 
            const currentDistance = this.camera.position.distanceTo(marblePos);
            if (currentDistance < 10 || currentDistance > 80) {
                // Camera is too close or too far, reposition it
                const offset = new THREE.Vector3(15, 20, 30);
                this.camera.position.set(
                    marblePos.x + offset.x,
                    marblePos.y + offset.y,
                    marblePos.z + offset.z
                );
                console.log('Adjusted camera position to:', this.camera.position);
            }
            
            this.controls.update();
            
            console.log('Camera target set to:', this.controls.target);
            console.log('Camera position:', this.camera.position);
        } else {
            console.log('Camera unlocked');
            // Restore controls state
            if (this.savedControlsState) {
                this.controls.enabled = this.savedControlsState.enabled;
                this.controls.target.copy(this.savedControlsState.target);
                this.camera.position.copy(this.savedControlsState.position);
                this.controls.update();
            } else {
                this.controls.enabled = true;
            }
        }
        
        return this.isCameraLocked;
    }

    private getFirstMarble(): Model | null {
        const models = this.modelManager.getAllModels();
        const marble = models.find(model => model.shapeType === 'marble') || null;
        return marble;
    }

    private updateCameraToFollowMarble(marble: Model, immediate: boolean = false) {
        const marblePosition = marble.threeObject.position;
        
        // Calculate the offset between current camera and current target
        const currentOffset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
        
        // Update target to marble position
        const newTarget = marblePosition.clone();
        
        // Update camera position to maintain the same offset from the new target
        const newCameraPosition = new THREE.Vector3().addVectors(newTarget, currentOffset);
        
        if (immediate) {
            this.controls.target.copy(newTarget);
            this.camera.position.copy(newCameraPosition);
        } else {
            // Smoothly update both target and camera position
            this.controls.target.lerp(newTarget, 0.15);
            this.camera.position.lerp(newCameraPosition, 0.15);
        }
        
        // Ensure controls update is called
        this.controls.update();
    }

    public isCameraLockedToMarble(): boolean {
        return this.isCameraLocked;
    }

    public clearALL() {
        // Unlock camera when clearing
        if (this.isCameraLocked) {
            this.toggleCameraLock();
        }
        
        // Clear all pending marble timers
        this.marbleGoalTimers.forEach(timer => clearTimeout(timer));
        this.marbleGoalTimers.clear();
        this.marbleFallTimers.forEach(timer => clearTimeout(timer));
        this.marbleFallTimers.clear();
        this.marbleInitialPositions.clear();
        
        this.physics.clearAllBodies(this.modelManager.getAllModels());
        this.modelManager.clear();
        this.selection.deselect();
    }

    public exportScene() {
        const models = this.modelManager.getAllModels().filter(model => model.shapeType != 'marble');
        
        // Get marble's initial position if it exists
        const marbles = this.modelManager.getAllModels().filter(model => model.shapeType === 'marble');
        let marbleInitialPosition = null;
        if (marbles.length > 0) {
            const marble = marbles[0];
            const initialPos = this.marbleInitialPositions.get(marble);
            if (initialPos) {
                marbleInitialPosition = {
                    x: initialPos.x,
                    y: initialPos.y,
                    z: initialPos.z,
                };
            }
        }
        
        const sceneData = {
            models: models.map(model => ({
                shapeType: model.shapeType,
                position: {
                    x: model.threeObject.position.x,
                    y: model.threeObject.position.y,
                    z: model.threeObject.position.z,
                },
                rotation: {
                    x: model.threeObject.quaternion.x,
                    y: model.threeObject.quaternion.y,
                    z: model.threeObject.quaternion.z,
                    w: model.threeObject.quaternion.w,
                },
                userData: model.threeObject.userData,
            })),
            marbleInitialPosition: marbleInitialPosition,
        }
        return JSON.stringify(sceneData);
    }

    public importScene(sceneData: any) {
        this.clearALL();

        if (sceneData.models) {
            sceneData.models.forEach((modelData: any) => {
                const position = new THREE.Vector3(
                    modelData.position.x,
                    modelData.position.y,
                    modelData.position.z
                );

                const model = this.modelManager.spawnModel(modelData.shapeType, position);

                if (modelData.rotation) {
                    model.threeObject.quaternion.set(
                        modelData.rotation.x,
                        modelData.rotation.y,
                        modelData.rotation.z,
                        modelData.rotation.w
                    );
                }

                if (modelData.userData) {
                    model.threeObject.userData = modelData.userData;
                }
                this.physics.createBody(model);
                
                // Store initial position for marbles
                if (model.shapeType === 'marble') {
                    this.marbleInitialPositions.set(model, position.clone());
                }
            });
        }
        
        // Restore marble's initial position if it was saved
        if (sceneData.marbleInitialPosition) {
            const marblePos = new THREE.Vector3(
                sceneData.marbleInitialPosition.x,
                sceneData.marbleInitialPosition.y,
                sceneData.marbleInitialPosition.z
            );
            
            // Spawn a marble at the initial position
            const marble = this.modelManager.spawnModel('marble', marblePos.clone());
            this.physics.createBody(marble);
            this.marbleInitialPositions.set(marble, marblePos.clone());
        }
    }

    // THREE.JS Setup
    private createScene() {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);
        return scene;
    }

    private setupCamera() {
        const fov = 50;
        const ratio = window.innerWidth / window.innerHeight;
        const zNear = 0.1;
        const zFar = 1000;
        const camera = new THREE.PerspectiveCamera(fov, ratio, zNear, zFar);
        camera.position.set(0, 10, 50);
        return camera;
    }

    private setupRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        return renderer;
    }

    private setupControls() {
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.minDistance = 10;
        controls.maxDistance = 100;
        controls.minAzimuthAngle = -(Math.PI / 2) + 0.1;
        controls.maxAzimuthAngle = (Math.PI / 2) - 0.1;
        controls.minPolarAngle = 0.1;
        controls.maxPolarAngle = Math.PI - 0.1;
        return controls;
    }

    private addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);
    }

    private createWall() {
        const planeGeometry = new THREE.PlaneGeometry(200, 200);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xF4D3B0 });
        const wall = new THREE.Mesh(planeGeometry, planeMaterial);

        wall.receiveShadow = true;
        this.scene.add(wall);
        return wall;
    }

    animate() {
        requestAnimationFrame(this.animate);
        if (!this.physics || !this.modelManager) return;

        this.physics.updateDebug();

        if (!this.isPaused) {
            this.physics.step();
            const models = this.modelManager.getAllModels();
            this.physics.syncAllModels(models);
            
            // Check if any marbles have fallen below the track
            this.checkMarbleFallOffTrack();
        }
        
        // Update camera if locked (even when paused)
        if (this.isCameraLocked) {
            const marble = this.getFirstMarble();
            if (marble) {
                this.updateCameraToFollowMarble(marble);
            }
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    public getDomElement() {
        return this.renderer.domElement;
    }

    private handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        // Clear all pending timers
        this.marbleGoalTimers.forEach(timer => clearTimeout(timer));
        this.marbleGoalTimers.clear();
        this.marbleFallTimers.forEach(timer => clearTimeout(timer));
        this.marbleFallTimers.clear();
        this.marbleInitialPositions.clear();
        
        window.removeEventListener('resize', this.handleResize);
        this.renderer.dispose();
    }
}