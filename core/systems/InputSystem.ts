import * as THREE from 'three';
import { DragController } from './DragSystem';
import { Model } from '../objects/Model';
import { ModelManager } from '../managers/ModelManager';

export class InputSystem {
    private isMouseDown: boolean = false;
    private mouseDownModel: Model | null = null;
    private dragType: 'hold' | 'click' = 'click';
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private mouse: THREE.Vector2 = new THREE.Vector2();
    private selectedModel: Model | null = null;
    private moveSpeed: number = 0.5; // Units to move per key press

    constructor(private wall: THREE.Mesh, private camera: THREE.PerspectiveCamera, private dragController: DragController, private modelManager: ModelManager,
        private onModelPlaced: (model: Model) => void,
        private onModelClicked: (model: Model) => void,
        private onModelDragStart: (model: Model) => void,
        private onEmptySpaceClicked: () => void,
        private onSpacePressed: () => void) {
        this.setupEventListeners();
    }

    public setSelectedModel(model: Model | null) {
        this.selectedModel = model;
    }

    private setupEventListeners() {
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('keydown', this.onKeyDown);
    }

    private onKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Space') {
            event.preventDefault();
            this.onSpacePressed();
            return;
        }

        // WASD movement controls
        if (this.selectedModel && !this.dragController.isDragging()) {
            const position = this.selectedModel.threeObject.position;
            let moved = false;

            switch (event.code) {
                case 'KeyW': // Move up
                    position.y += this.moveSpeed;
                    moved = true;
                    break;
                case 'KeyS': // Move down
                    position.y -= this.moveSpeed;
                    moved = true;
                    break;
                case 'KeyA': // Move left
                    position.x -= this.moveSpeed;
                    moved = true;
                    break;
                case 'KeyD': // Move right
                    position.x += this.moveSpeed;
                    moved = true;
                    break;
            }

            if (moved) {
                event.preventDefault();
                // Update physics body position if it exists
                this.onModelMoved(this.selectedModel);
            }
        }
    };

    private onModelMoved(model: Model) {
        // Notify that model has moved (for physics sync)
        // This will trigger physics body update
        this.onModelDragStart(model);
        this.dragController.endDrag();
        this.onModelPlaced(model);
    }

    private updateMousePosition(event: MouseEvent) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    public getWallIntersection(event: MouseEvent) {
        this.updateMousePosition(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObject(this.wall);
        if (intersects.length > 0) {
            return intersects[0].point;
        }
        return null;
    }

    private getClickedModel(event: MouseEvent) {
        this.updateMousePosition(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const allThreeObjects = this.modelManager.getAllModels().map(m => m.threeObject);
        const intersects = this.raycaster.intersectObjects(allThreeObjects, true);
        if (intersects.length > 0) {
            let hitObject = intersects[0].object;
            while (hitObject.parent && !allThreeObjects.includes(hitObject)) {
                hitObject = hitObject.parent;
            }
            return this.modelManager.getModelByThreeObject(hitObject);
        }
        return null;
    }

    private onMouseMove = (event: MouseEvent) => {
        if (this.dragController.isDragging()) {
            const wallIntersection = this.getWallIntersection(event);
            if (wallIntersection) {
                this.dragController.updateDragPosition(wallIntersection);
            }
        } else if (this.isMouseDown && this.mouseDownModel) {
            this.dragType = 'hold';
            this.onModelDragStart(this.mouseDownModel);
            this.mouseDownModel = null;
        }
    };

    private onMouseUp = (event: MouseEvent) => {
        this.isMouseDown = false;
        this.mouseDownModel = null;

        if (!this.dragController.isDragging()) return;

        if (this.dragType === 'hold') {
            const wallIntersection = this.getWallIntersection(event);
            if (wallIntersection) {
                this.dragController.updateDragPosition(wallIntersection);
            }
            const placeModel = this.dragController.endDrag();
            if (placeModel) {
                this.onModelPlaced(placeModel);
            }
        }
    };

    private onMouseDown = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.closest('.lil-gui')) {
            return;
        }

        this.isMouseDown = true;

        if (this.dragController.isDragging()) {
            if (this.dragType === 'click') {
                const placeModel = this.dragController.endDrag();
                if (placeModel) {
                    this.onModelPlaced(placeModel);
                }
            }
            return
        }

        const clickedModel = this.getClickedModel(event);
        if (clickedModel) {
            this.mouseDownModel = clickedModel;
            this.onModelClicked(clickedModel);
        } else {
            this.onEmptySpaceClicked();
        }
    };
}