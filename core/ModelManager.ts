import * as THREE from 'three';
import { Model } from './Model';

export class ModelManager {
    private models: Model[] = [];
    private preloadedMeshes: Map<string, THREE.Mesh>;

    constructor(private scene: THREE.Scene, preloadedMeshes: Map<string, THREE.Mesh>) {
        this.preloadedMeshes = preloadedMeshes;
    }

    public spawnModel(shapeType: string, position: THREE.Vector3): Model {
        const askMesh = this.preloadedMeshes.get(shapeType);
        if (!askMesh) {
            throw new Error(`Model ${shapeType} not preloaded`);
        }
        const clonedMesh = askMesh.clone();
        const container = new THREE.Object3D();
        // console.log(container);
        container.add(clonedMesh);
        container.position.copy(position);
        container.userData.shapeType = shapeType;

        const model = new Model(container, clonedMesh, shapeType);

        this.scene.add(container);
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