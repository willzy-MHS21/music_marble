import * as THREE from 'three';
import { ShapeGUI } from '../../components/ui/shape-gui';

export class SelectionSystem {
    private outlineMeshes: THREE.Mesh[] = [];
    private selectedObject: THREE.Object3D | null = null;
    private shapeGUI: ShapeGUI;
    private onDeleteCallback?: (object: THREE.Object3D) => void;

    constructor() {
        this.shapeGUI = new ShapeGUI();
    }
    public setOnDeleteCallback(callback: (object: THREE.Object3D) => void) {
        this.onDeleteCallback = callback;
    }

    public select(object: THREE.Object3D) {
        if (this.selectedObject == object) return;
        
        this.deselect();
        this.selectedObject = object;
        this.addOutline(object);
        this.shapeGUI.create(object, () => {
            if (this.onDeleteCallback && this.selectedObject) {
                this.onDeleteCallback(this.selectedObject);
            }
            this.deselect();
        });
    }

    public deselect() {
        this.removeOutline();
        this.selectedObject = null;
        this.shapeGUI.destroy();
    }

    public getSelectedObject() {
        return this.selectedObject;
    }

    private addOutline(object: THREE.Object3D) {
        object.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry && !(child as any).isOutline) {
            try {
                const outlineMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00aaff,
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