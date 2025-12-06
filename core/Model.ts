import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';

export class Model {
    public threeObject: THREE.Object3D;
    public mesh: THREE.Mesh;
    public shapeType: string;
    public physicsBody: RAPIER.RigidBody | null = null;

    constructor(threeObject: THREE.Object3D, mesh: THREE.Mesh, shapeType: string) {
        this.threeObject = threeObject;
        this.mesh = mesh;
        this.shapeType = shapeType;
    }

    public setPosition(x: number, y: number, z: number): void {
        this.threeObject.position.set(x, y, z);
    }

    public setRotation(quaternion: THREE.Quaternion): void {
        this.threeObject.quaternion.copy(quaternion);
    }
}