import * as THREE from 'three';
import { Model } from '../objects/Model';

export class ModelManager {
    private physicsModels: Model[] = [];
    private decorationModels: Model[] = [];
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

        if (shapeType === 'spongebob') {
            model.isDecoration = true;
            model.threeObject.scale.set(3, 3, 3);
        }

        this.scene.add(cloneModel);

        if (model.isDecoration) {
            this.decorationModels.push(model);
        } else {
            this.physicsModels.push(model);
        }

        return model;
    }

    public removeModel(model: Model): void {
        this.scene.remove(model.threeObject);
        if (model.isDecoration) {
            const index = this.decorationModels.indexOf(model);
            if (index > -1) this.decorationModels.splice(index, 1);
        } else {
            const index = this.physicsModels.indexOf(model);
            if (index > -1) this.physicsModels.splice(index, 1);
        }
    }

    public getAllModels(): Model[] {
        return [...this.physicsModels, ...this.decorationModels];
    }

    public getPhysicsModels(): Model[] {
        return this.physicsModels;
    }

    public getDecorationModels(): Model[] {
        return this.decorationModels;
    }

    public getModelByThreeObject(threeObject: THREE.Object3D): Model | null {
        let model = this.physicsModels.find(m => m.threeObject === threeObject);
        if (model) return model;
        return this.decorationModels.find(m => m.threeObject === threeObject) || null;
    }

    public clear(): void {
        [...this.physicsModels].forEach(model => this.removeModel(model));
        [...this.decorationModels].forEach(model => this.removeModel(model));
    }
}