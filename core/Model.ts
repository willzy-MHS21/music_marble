import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';

export class Model {
    public threeObject: THREE.Object3D;
    public shapeType: string;
    public physicsBody: RAPIER.RigidBody | null = null;

    constructor(threeObject: THREE.Object3D, shapeType: string) {
        this.threeObject = threeObject;
        this.shapeType = shapeType;
    }

    public getMesh(): THREE.Mesh {
        for (const child of this.threeObject.children) {
            if (child instanceof THREE.Mesh) {
                return child;
            }
        }
        throw new Error('No mesh found in model');
    }

    public setPosition(x: number, y: number, z: number): void {
        this.threeObject.position.set(x, y, z);
    }

    public setRotation(quaternion: THREE.Quaternion): void {
        this.threeObject.quaternion.copy(quaternion);
    }
}