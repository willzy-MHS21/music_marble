import * as THREE from 'three';
import { Model } from '../objects/Model';

export class ModelManager {
    private models: Model[] = [];
    private preloadedModels: Map<string, THREE.Group>;

    constructor(private scene: THREE.Scene, preloadedModels: Map<string, THREE.Group>) {
        this.preloadedModels = preloadedModels;
    }

    public spawnModel(shapeType: string, position: THREE.Vector3): Model {
        const askModel = this.preloadedModels.get(shapeType);
        if (!askModel) {
            throw new Error(`Model ${shapeType} not preloaded`);
        }
        const cloneModel = askModel.clone();

        // Ensure shadows are enabled on cloned model
        cloneModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.roughness = 0.3;
                    child.material.metalness = 0.1;
                }
            }
        });

        cloneModel.position.copy(position);
        cloneModel.userData.shapeType = shapeType;
        const model = new Model(cloneModel, shapeType);
        this.scene.add(cloneModel);
        this.models.push(model);
        return model;
    }

    public removeModel(model: Model): void {
        this.scene.remove(model.threeObject);
        const index = this.models.indexOf(model);
        if (index > -1) {
            this.models.splice(index, 1);
        }
    }

    public getAllModels(): Model[] {
        return this.models;
    }

    public getModelByThreeObject(threeObject: THREE.Object3D): Model | null {
        return this.models.find(m => m.threeObject === threeObject) || null;
    }

    public clear(): void {
        [...this.models].forEach(model => this.removeModel(model));
    }
}