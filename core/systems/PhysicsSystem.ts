import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { Model } from '../Model';

export class PhysicsSystem {
    world: RAPIER.World | null = null;
    private debugLines: THREE.LineSegments | null = null;

    async init(scene: THREE.Scene) {
        await RAPIER.init();
        const gravity = { x: 0.0, y: -9.81 * 20, z: 0.0 };
        this.world = new RAPIER.World(gravity);

        // Setup Debug Renderer
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            vertexColors: true,
            linewidth: 2,
            depthTest: false,
            depthWrite: false
        });
        const geometry = new THREE.BufferGeometry();
        this.debugLines = new THREE.LineSegments(geometry, material);
        this.debugLines.renderOrder = 999;
        scene.add(this.debugLines);
    }

    public createBody(model: Model) {
        if (!this.world || model.physicsBody) return;

        const type = model.shapeType;
        const scale = model.mesh.scale;        
        let rigidBodyDesc: RAPIER.RigidBodyDesc;
        if (type === 'marble') {
            rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
                .setCcdEnabled(true);
        } else {
            rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
        }
        rigidBodyDesc.setTranslation(model.threeObject.position.x, model.threeObject.position.y, model.threeObject.position.z);
        rigidBodyDesc.setRotation(model.threeObject.quaternion);
        const rigidBody = this.world.createRigidBody(rigidBodyDesc);
        let colliderDesc: RAPIER.ColliderDesc;
        if (type === 'marble') {
            colliderDesc = RAPIER.ColliderDesc.ball(scale.x);
        } else {
            if (type == 'plank') {
                colliderDesc = RAPIER.ColliderDesc.cuboid(scale.x, scale.y, scale.z);
            } else if (type == 'cylinder') {
                colliderDesc = RAPIER.ColliderDesc.cylinder(scale.y, scale.x);
            } else if (type == 'curve'){
                colliderDesc = RAPIER.ColliderDesc.cuboid(scale.x, scale.y, scale.z);
            } else {
                console.error(`Unknown shape type: ${type}`);
                return;
            }
        }
        colliderDesc.setRotation(model.mesh.quaternion);
        colliderDesc.setRestitution(0.9);
        this.world.createCollider(colliderDesc, rigidBody);
        model.physicsBody = rigidBody;
    }

    public removeBody(model: Model): void {
        if (!this.world || !model.physicsBody) return;
        this.world.removeRigidBody(model.physicsBody);
        model.physicsBody = null;
    }

    public clearAllBodies(models: Model[]) {
        models.forEach(model => this.removeBody(model));
    }

    // Update rotation of physics body
    public updateBodyRotation(model: Model): void {
        if (!model.physicsBody) return;
        
        // Update the rigid body's rotation
        model.physicsBody.setRotation(model.threeObject.quaternion, true);
        
        // Recreate the body
        if (!model.physicsBody.isDynamic()) {
            this.removeBody(model);
            this.createBody(model);
        }
    }

    public update() {
        this.world?.step();
        // Update Debug Geometry 
        if (this.world && this.debugLines) {
            const { vertices, colors } = this.world.debugRender();
            this.debugLines.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            this.debugLines.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
        }
    }

    public syncFromPhysics(model: Model): void {
        if (!model.physicsBody) return;
        if (model.physicsBody.isDynamic()) {
            const position = model.physicsBody.translation();
            const rotation = model.physicsBody.rotation();
            model.threeObject.position.set(position.x, position.y, position.z);
            model.threeObject.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        }
    }

    public syncAllModels(models: Model[]): void {
        models.forEach(model => this.syncFromPhysics(model));
    }
}