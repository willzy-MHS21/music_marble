import * as THREE from 'three';
import { Model } from '../Model';
import { ShapeGUI } from '../../components/ui/shape-gui';
import { AudioSystem } from './AudioSystem';

export class SelectionSystem {
    private outlineMeshes: THREE.Mesh[] = [];
    private selectedModel: Model | null = null;
    private shapeGUI: ShapeGUI;
    private onDeleteCallback?: (model: Model) => void;
    private onRotationChangeCallback?: (model: Model) => void;
    private onSelectionChangeCallback?: (model: Model | null) => void;
    private audioSystem?: AudioSystem;

    constructor(audioSystem?: AudioSystem) {
        this.shapeGUI = new ShapeGUI();
        this.audioSystem = audioSystem;
    }

    public setOnDeleteCallback(callback: (model: Model) => void) {
        this.onDeleteCallback = callback;
    }

    public setOnRotationChangeCallback(callback: (model: Model) => void) {
        this.onRotationChangeCallback = callback;
    }

    public setOnSelectionChangeCallback(callback: (model: Model | null) => void) {
        this.onSelectionChangeCallback = callback;
    }

    public select(model: Model) {
        if (this.selectedModel == model) return;

        this.deselect();
        this.selectedModel = model;
        this.addOutline(model.threeObject);
        this.shapeGUI.create(
            model,
            () => {
                if (this.onDeleteCallback && this.selectedModel) {
                    this.onDeleteCallback(this.selectedModel);
                }
                this.deselect();
            },
            () => {
                if (this.onRotationChangeCallback && this.selectedModel) {
                    this.onRotationChangeCallback(this.selectedModel);
                }
            },
            this.audioSystem
        );

        if (this.onSelectionChangeCallback) {
            this.onSelectionChangeCallback(model);
        }
    }

    public deselect() {
        this.removeOutline();
        this.selectedModel = null;
        this.shapeGUI.destroy();

        if (this.onSelectionChangeCallback) {
            this.onSelectionChangeCallback(null);
        }
    }

    public getSelectedModel(): Model | null {
        return this.selectedModel;
    }

    private addOutline(object: THREE.Object3D) {
        object.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry && !(child as any).isOutline) {
                try {
                    const outlineMaterial = new THREE.MeshBasicMaterial({
                        color: 'red',
                        side: THREE.BackSide,
                    });

                    const outlineMesh = new THREE.Mesh(child.geometry, outlineMaterial);
                    outlineMesh.scale.set(1.05, 1.05, 1.05);
                    (outlineMesh as any).isOutline = true;

                    child.add(outlineMesh);
                    this.outlineMeshes.push(outlineMesh);
                } catch (error) {
                    console.error('Error creating outline:', error);
                }
            }
        });
    }

    private removeOutline() {
        this.outlineMeshes.forEach((outlineMesh) => {
            if (outlineMesh.parent) {
                outlineMesh.parent.remove(outlineMesh);
            }
            if (outlineMesh.geometry) {
                outlineMesh.geometry.dispose();
            }
            if (outlineMesh.material instanceof THREE.Material) {
                outlineMesh.material.dispose();
            }
        });
        this.outlineMeshes = [];
    }
}