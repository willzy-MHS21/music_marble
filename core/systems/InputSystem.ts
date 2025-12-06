import * as THREE from 'three';
import { DragController } from './DragSystem';
import { Model } from '../Model';
import { ModelManager } from '../ModelManager';

export class InputSystem {
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private mouse: THREE.Vector2 = new THREE.Vector2();

    constructor(private wall: THREE.Mesh, private camera: THREE.PerspectiveCamera, private dragController: DragController, private modelManager: ModelManager,
        private onModelPlaced: (model: Model) => void,
        private onModelClicked: (model: Model) => void,
        private onEmptySpaceClicked: () => void) {
        this.setupEventListeners();
    }

    private setupEventListeners() {
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousedown', this.onMouseDown);
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
        }
    };

    private onMouseUp = (event: MouseEvent) => {
        if (!this.dragController.isDragging()) return;
        const wallIntersection = this.getWallIntersection(event);
        if (wallIntersection) {
            this.dragController.updateDragPosition(wallIntersection);
        }
    };

    private onMouseDown = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.closest('.lil-gui')) {
            return;
        }
        if (this.dragController.isDragging()) {
            const placeModel = this.dragController.endDrag();
            if (placeModel) {
                this.onModelPlaced(placeModel);
            }
            return
        }

        const clickedModel = this.getClickedModel(event);
        if (clickedModel) {
            this.onModelClicked(clickedModel);
        } else {
            this.onEmptySpaceClicked();
        }
    };
}