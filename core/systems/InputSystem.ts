import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SelectionSystem } from './SelectionSystem';
import { ShapeGUI } from '../../components/ui/shape-gui';

export class InputSystem {
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private controls!: OrbitControls;
    private wall!: THREE.Mesh;
    private raycaster!: THREE.Raycaster;
    private draggedObject: THREE.Object3D | null = null;
    private isDragging: boolean = false;
    private objects: THREE.Object3D[];
    private isNewShape: boolean = false;
    private selectionSystem: SelectionSystem;

    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls, wall: THREE.Mesh, objects: THREE.Object3D[], selectionSystem: SelectionSystem) {
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.wall = wall;
        this.objects = objects;
        this.selectionSystem = selectionSystem;
        this.raycaster = new THREE.Raycaster();
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousedown', this.onMouseDown);
    }

    private onMouseMove = (event: MouseEvent) => {
        if (!this.isDragging || !this.draggedObject) return;

        // Disable orbit controls while dragging
        if (this.controls) {
            this.controls.enabled = false;
        }

        // Calculate mouse position in normalized device coordinates
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the raycaster
        this.raycaster.setFromCamera(mouse, this.camera);

        // Find intersection with the wall
        const intersects = this.raycaster.intersectObject(this.wall);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.draggedObject.position.set(point.x, point.y, point.z + 1);
        }
    };

    private onMouseUp = (event: MouseEvent) => {
        if (this.isDragging) {
            const wasNewShape = this.isNewShape;
            const draggedObject = this.draggedObject;
            this.isDragging = false;
            this.isNewShape = false;
            this.draggedObject = null;
            if (this.controls) {
                this.controls.enabled = true;
            }
            if (wasNewShape && draggedObject) {
              this.selectionSystem.select(draggedObject);
            }
        }
    };

    private onMouseDown = (event: MouseEvent) => {
        if (this.isDragging) return;

        const target = event.target as HTMLElement;
        if (target.closest('.lil-gui')) {
            return;
        }

        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects, true);

        if (intersects.length > 0) {
            let selectedObject = intersects[0].object;
            while (selectedObject.parent && !this.objects.includes(selectedObject)) {
                selectedObject = selectedObject.parent;
            }
            if (this.objects.includes(selectedObject)) {
                if (this.controls) {
                    this.controls.enabled = false;
                }

                this.draggedObject = selectedObject;
                this.isDragging = true;

                this.selectionSystem.select(selectedObject);
            }
        } else {
            this.selectionSystem.deselect();
        }
    };

    public loadAndDragModel(modelPath: string, event: MouseEvent) {
        if (!this.scene || !this.camera || !this.wall) return;
        
        // Calculate mouse position in normalized device coordinates
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Get initial position using raycaster
        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.wall);

        const initialPosition = intersects.length > 0
            ? intersects[0].point
            : new THREE.Vector3(0, 0, 1);

        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (gltf) => {
                const model = gltf.scene;
                model.position.set(initialPosition.x, initialPosition.y, initialPosition.z + 1);

                // Identify the shape type based on the model path
                const shapeType = modelPath.split('/').pop()?.replace('.glb', '') || 'unknown';
                model.userData.shapeType = shapeType;

                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        if (child.material instanceof THREE.MeshStandardMaterial) {
                            child.material.roughness = 0.1;
                        }
                    }
                });

                this.scene.add(model);
                this.objects.push(model);
                this.draggedObject = model;
                this.isDragging = true;
                this.isNewShape = true;
            },
            undefined,
            (error) => {
                console.error(`Error loading model from ${modelPath}:`, error);
            }
        );
    }
}