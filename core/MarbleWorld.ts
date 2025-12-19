import * as THREE from 'three';
import { WorldGUI } from './systems/WorldGUI';
import { TrajectoryLine } from './objects/TrajectoryLine';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InputSystem } from './systems/InputSystem';
import { SelectionSystem } from './systems/SelectionSystem';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { AssetLoader } from './managers/AssetLoader';
import { ModelManager } from './managers/ModelManager';
import { DragController } from './systems/DragSystem';
import { Model } from './objects/Model';
import { AudioSystem } from './systems/AudioSystem';
import { CameraController } from './systems/CameraController';
import { MarbleManager } from './managers/MarbleManager';
import { SceneManager } from './managers/SceneManager';

export class MarbleWorld {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private wall: THREE.Mesh;
    private isPaused: boolean = true;

    private clock = new THREE.Clock();
    private accumulator: number = 0;
    private readonly fixedTimeStep: number = 1 / 60;
    private readonly maxSubSteps: number = 15;

    private highlightTimers: Map<Model, any> = new Map();

    // Systems
    private input!: InputSystem;
    private selection!: SelectionSystem;
    private physics!: PhysicsSystem;
    private assetLoader!: AssetLoader;
    private modelManager!: ModelManager;
    private dragController!: DragController;
    private audioSystem!: AudioSystem;
    private trajectoryLine!: TrajectoryLine;
    private worldGUI!: WorldGUI;
    private cameraController!: CameraController;
    private marbleManager!: MarbleManager;
    private sceneManager!: SceneManager;

    constructor() {
        this.scene = this.createScene();
        this.camera = this.setupCamera();
        this.renderer = this.setupRenderer();
        this.addLights();
        this.wall = this.createWall();
        this.controls = this.setupControls();

        // Initialize camera controller early since it's used immediately
        this.cameraController = new CameraController(this.camera, this.controls);

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

        // Create Model Manager
        const preLoadedModels = this.assetLoader.getAllModels();
        this.modelManager = new ModelManager(this.scene, preLoadedModels);

        // Initialize new managers (camera controller already initialized in constructor)
        this.marbleManager = new MarbleManager(this.modelManager, this.physics);
        this.sceneManager = new SceneManager(this.modelManager, this.physics, this.marbleManager);

        // Play audio, light up shape, and handle final collision
        this.physics.onCollision = (model1, model2) => {
            this.audioSystem.playCollisionSound(model1, model2);
            this.highlightShape(model2);
            this.onMarbleCollision(model1, model2);
        };

        // Create other Systems
        this.trajectoryLine = new TrajectoryLine(this.scene, this.physics);
        this.worldGUI = new WorldGUI(this.physics, this.trajectoryLine);
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
        if (!this.isPaused) {
            this.clock.getDelta();
            this.accumulator = 0;
        }
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

    private highlightShape(model: Model): void {
        const existingTimer = this.highlightTimers.get(model);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        model.highlight();

        const timer = setTimeout(() => {
            model.unhighlight();
            this.highlightTimers.delete(model);
        }, 300);

        this.highlightTimers.set(model, timer);
    }

    private onModelPlaced(model: Model) {
        this.physics.createBody(model);
        this.selection.select(model);

        if (model.shapeType === 'marble') {
            this.marbleManager.storeInitialPosition(model);
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

        if (model.shapeType === 'marble') {
            this.marbleManager.removeInitialPosition(model);
        }
    }

    private onModelRotationChanged(model: Model) {
        this.physics.updateBodyRotation(model);
    }

    private onSelectionChanged(model: Model | null) {
        this.input.setSelectedModel(model);
    }

    private onMarbleCollision(model1: Model, model2: Model) {
        const marble = model1.shapeType === 'marble' ? model1 :
            model2.shapeType === 'marble' ? model2 : null;

        if (marble) {
            const otherShape = model1.shapeType === 'marble' ? model2 : model1;
            this.marbleManager.checkCompletion(marble, otherShape, (removedMarble) => {
                this.onMarbleRemoved(removedMarble);
            });
        }
    }

    private onMarbleRemoved(marble: Model): void {
        // Check if camera was locked to this marble
        const shouldRelockCamera = this.cameraController.isCameraLockedToMarble() &&
            this.getFirstMarble() === marble;

        // Unlock camera temporarily if it was following this marble
        if (shouldRelockCamera) {
            this.cameraController.unlockCamera();
        }

        // Pause the scene
        this.isPaused = true;

        // Re-lock camera to the new marble if it was locked before
        if (shouldRelockCamera) {
            this.toggleCameraLock();
        }
    }

    private getFirstMarble(): Model | null {
        const models = this.modelManager.getAllModels();
        return models.find(model => model.shapeType === 'marble') || null;
    }

    public toggleCameraLock(): boolean {
        return this.cameraController.toggleCameraLock(() => this.getFirstMarble());
    }

    public isCameraLockedToMarble(): boolean {
        return this.cameraController.isCameraLockedToMarble();
    }

    public clearALL() {
        this.cameraController.unlockCamera();
        this.marbleManager.clearAllTimers();
        this.physics.clearAllBodies(this.modelManager.getAllModels());
        this.modelManager.clear();
        this.selection.deselect();
    }

    public exportScene(): string {
        return this.sceneManager.exportScene();
    }

    public importScene(sceneData: any) {
        this.clearALL();
        this.sceneManager.importScene(sceneData);
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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xf5efe5, 1.75);
        mainLight.position.set(-28.2, 35, 26.8);
        // mainLight.position.set(-36.2, 35, 26.8);

        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.bias = -0.0001;
        mainLight.shadow.camera.top = 20;
        mainLight.shadow.camera.bottom = -30;
        mainLight.shadow.camera.left = -30;
        mainLight.shadow.camera.right = 30;
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0xcceeff, 1.01);
        fillLight.position.set(-44, 13.6, 52.8);
        // fillLight.position.set(-17.8, 13.6, 39.8);
        this.scene.add(fillLight);
    }

    private createWall() {
        const planeGeometry = new THREE.PlaneGeometry(200, 600);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xA9A9A9, roughness: 1, metalness: 0 });
        const wall = new THREE.Mesh(planeGeometry, planeMaterial);
        wall.receiveShadow = true;
        this.scene.add(wall);
        return wall;
    }

    animate() {
        requestAnimationFrame(this.animate);
        if (!this.physics || !this.modelManager) return;

        if (!this.isPaused) {
            let deltaTime = this.clock.getDelta();

            if (deltaTime > 0.1) deltaTime = 0.1;

            this.accumulator += deltaTime;

            let stepCount = 0;
            while (this.accumulator >= this.fixedTimeStep && stepCount < this.maxSubSteps) {
                this.physics.step();
                this.accumulator -= this.fixedTimeStep;
                stepCount++;
            }

            this.trajectoryLine.clear();
            const models = this.modelManager.getAllModels();
            this.physics.syncAllModels(models);

            this.marbleManager.checkMarbleFallOffTrack((marble) => {
                this.onMarbleRemoved(marble);
            });
        } else {
            const models = this.modelManager.getAllModels();
            this.trajectoryLine.update(models);
        }

        // Update camera if locked (even when paused)
        if (this.cameraController.isCameraLockedToMarble()) {
            const marble = this.getFirstMarble();
            if (marble) {
                this.cameraController.updateCameraToFollowMarble(marble);
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
        this.marbleManager.clearAllTimers();
        this.highlightTimers.forEach(timer => clearTimeout(timer));
        this.highlightTimers.clear();

        window.removeEventListener('resize', this.handleResize);
        if (this.worldGUI) this.worldGUI.dispose();
        this.renderer.dispose();
    }
}