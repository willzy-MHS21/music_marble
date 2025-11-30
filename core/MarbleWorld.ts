import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InputSystem } from './systems/InputSystem';

export class MarbleWorld {
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private controls!: OrbitControls;
    private wall!: THREE.Mesh;
    private input!: InputSystem;

    constructor() {
        this.createScene();
        this.setupCamera();
        this.setupRenderer();
        this.addLights();
        this.createWall();
        this.setupControls();
        this.input = new InputSystem(this.scene, this.camera, this.controls, this.wall);
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
    }

    createScene() {
        // Setup Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
    }

    setupCamera() {
        // Setup Camera
        const fov = 50;
        const ratio = window.innerWidth / window.innerHeight;
        const zNear = 0.1;
        const zFar = 1000;
        this.camera = new THREE.PerspectiveCamera(fov, ratio, zNear, zFar);
        this.camera.position.set(0, 0, 100);
    }

    setupRenderer() {
        // Setup Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }

    setupControls() {
        // Set up controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        this.controls.minAzimuthAngle = -(Math.PI / 2) + 0.1;
        this.controls.maxAzimuthAngle = (Math.PI / 2) - 0.1;
        this.controls.minPolarAngle = 0.1;
        this.controls.maxPolarAngle = Math.PI - 0.1;
    }

    addLights() {
        // Set up lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
    }

    createWall() {
        // Set up wall
        const planeGeometry = new THREE.PlaneGeometry(200, 200);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xF4D3B0 });
        this.wall = new THREE.Mesh(planeGeometry, planeMaterial);
        this.scene.add(this.wall);
    }

    animate() {
        // Animation loop
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    getDomElement() {
        return this.renderer.domElement;
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    getInputSystem() {
        return this.input;
    }

    dispose() {
        window.removeEventListener('resize', this.handleResize);
        this.renderer.dispose();
    }
}