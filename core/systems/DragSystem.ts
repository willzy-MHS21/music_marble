import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Model } from '../Model';

export class DragController {
    private draggedModel: Model | null = null;

    constructor(private orbitControls: OrbitControls) { }

    public startDrag(model: Model): void {
        this.draggedModel = model;
        // console.log("Drag Model", this.draggedModel);
        this.orbitControls.enabled = false;
    }

    public updateDragPosition(worldPoint: THREE.Vector3): void {
        if (!this.draggedModel) return;
        this.draggedModel.setPosition(worldPoint.x, worldPoint.y, worldPoint.z + 1);
    }

    public endDrag(): Model | null {
        if (!this.draggedModel) return null;

        const model = this.draggedModel;
        this.draggedModel = null;
        this.orbitControls.enabled = true;
        return model;
    }

    public isDragging(): boolean {
        return this.draggedModel !== null;
    }
}
