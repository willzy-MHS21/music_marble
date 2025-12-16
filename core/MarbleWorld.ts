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
    private isPaused: boolean = false;

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

        // Wire Physics to Audio
        this.physics.onCollision = (model1, model2, speed) => {
            this.audioSystem.playCollisionSound(model1, model2, speed);
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
            () => { this.isPaused = !this.isPaused; });

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
    }

    private onModelRotationChanged(model: Model) {
        this.physics.updateBodyRotation(model);
    }

    private onSelectionChanged(model: Model | null) {
        this.input.setSelectedModel(model);
    }

    public clearALL() {
        this.physics.clearAllBodies(this.modelManager.getAllModels());
        this.modelManager.clear();
        this.selection.deselect();
    }

    public exportScene() {
        const models = this.modelManager.getAllModels().filter(model => model.shapeType != 'marble');
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
            });
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
        window.removeEventListener('resize', this.handleResize);
        this.renderer.dispose();
    }
}