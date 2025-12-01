import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InputSystem } from './systems/InputSystem';
import { SelectionSystem } from './systems/SelectionSystem';

export class MarbleWorld {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private wall: THREE.Mesh;
    private input: InputSystem;
    private selection: SelectionSystem;
    private objects: THREE.Object3D[] = [];

    constructor() {
        this.scene = this.createScene();
        this.camera = this.setupCamera();
        this.renderer = this.setupRenderer();
        this.addLights();
        this.wall = this.createWall();
        this.controls = this.setupControls();
        this.selection = new SelectionSystem();
        this.selection.setOnDeleteCallback((object) => {
            this.handleObjectDelete(object);
        });
        this.input = new InputSystem(this.scene,this.camera,this.controls,this.wall,this.objects,this.selection);
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
    }

    private createScene() {
        // Setup Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);
        return scene;
    }

    private setupCamera() {
        // Setup Camera
        const fov = 50;
        const ratio = window.innerWidth / window.innerHeight;
        const zNear = 0.1;
        const zFar = 1000;
        const camera = new THREE.PerspectiveCamera(fov, ratio, zNear, zFar);
        camera.position.set(0, 0, 100);
        return camera;
    }

    private setupRenderer() {
        // Setup Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        return renderer;
    }

    private setupControls() {
        // Set up controls
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
        // Set up lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
    }

    private createWall() {
        // Set up wall
        const planeGeometry = new THREE.PlaneGeometry(200, 200);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xF4D3B0 });
        const wall = new THREE.Mesh(planeGeometry, planeMaterial);
        this.scene.add(wall);
        return wall;
    }

    private handleObjectDelete(object: THREE.Object3D): void {
        // Remove from scene
        this.scene.remove(object);

        // Remove from objects array
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
    }
}
    animate() {
        // Animation loop
        requestAnimationFrame(this.animate);
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

    public getInputSystem() {
        return this.input;
    }
    dispose() {
        window.removeEventListener('resize', this.handleResize);
        this.renderer.dispose();
    }
}