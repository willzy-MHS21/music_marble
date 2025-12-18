import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { Model } from '../Model';
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

export class PhysicsSystem {
    world: RAPIER.World | null = null;
    eventQueue: RAPIER.EventQueue | null = null;
    private gravity = new THREE.Vector3(0, -9.81 * 15, 0);

    private activeCollisions: Map<string, number> = new Map();
    private bodyToModelMap: Map<number, Model> = new Map();
    public onCollision?: (model1: Model, model2: Model) => void;

    async init(scene: THREE.Scene) {
        await RAPIER.init();
        this.world = new RAPIER.World(this.gravity);
        this.eventQueue = new RAPIER.EventQueue(true);
    }

    public createBody(model: Model) {
        if (!this.world || model.physicsBody) return;
        const rigidBody = this.createRigidBody(model);
        this.createCollider(model, rigidBody);
        model.physicsBody = rigidBody;
        this.bodyToModelMap.set(rigidBody.handle, model);
    }

    public createRigidBody(model: Model, targetWorld?: RAPIER.World): RAPIER.RigidBody {
        const type = model.shapeType;
        let rigidBodyDesc: RAPIER.RigidBodyDesc;
        if (type === 'marble') {
            rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setCcdEnabled(true);
        } else {
            rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
        }
        rigidBodyDesc.setTranslation(model.threeObject.position.x, model.threeObject.position.y, model.threeObject.position.z);
        rigidBodyDesc.setRotation(model.threeObject.quaternion);
        const world = targetWorld || this.world!;
        if (!world) throw new Error("No physics world available");
        return world.createRigidBody(rigidBodyDesc);
    }

    public createCollider(model: Model, rigidBody: RAPIER.RigidBody, targetWorld?: RAPIER.World) {
        const type = model.shapeType;
        const mesh = model.getMesh();
        const scale = mesh.scale;

        let colliderDesc: RAPIER.ColliderDesc | null = null;

        if (type == 'curve') {
            this.createCurveCollider(model, mesh, rigidBody, targetWorld);
            return;
        }

        switch (type) {
            case 'marble':
                colliderDesc = RAPIER.ColliderDesc.ball(scale.x);
                break;
            case 'plank':
                colliderDesc = RAPIER.ColliderDesc.cuboid(scale.x, scale.y, scale.z);
                break;
            case 'cylinder':
                colliderDesc = RAPIER.ColliderDesc.cylinder(scale.y, scale.x);
                break;
            default:
                console.error(`Unknown shape type: ${type}`);
                return;
        }

        if (colliderDesc) {
            colliderDesc.setRotation(mesh.quaternion);
            colliderDesc.setRestitution(1);
            colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
            const world = targetWorld || this.world!;
            world.createCollider(colliderDesc, rigidBody);
        }
    }

    public createCurveCollider(model: Model, mesh: THREE.Mesh, rigidBody: RAPIER.RigidBody, targetWorld?: RAPIER.World) {
        const geometry = mesh.geometry.clone();
        geometry.applyMatrix4(mesh.matrix);
        const mergedGeometry = BufferGeometryUtils.mergeVertices(geometry);

        const positions = mergedGeometry.getAttribute('position').array;
        const indices = mergedGeometry.index?.array;

        if (!indices) {
            console.error('Curve geometry has no indices');
            return;
        }

        const positionsFloat32 = positions instanceof Float32Array
            ? positions
            : new Float32Array(positions);

        const indicesUint32 = indices instanceof Uint32Array
            ? indices
            : new Uint32Array(indices);

        const colliderDesc = RAPIER.ColliderDesc.trimesh(positionsFloat32, indicesUint32);
        colliderDesc.setRestitution(0.0);
        colliderDesc.setFriction(0.5);
        colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
        const world = targetWorld || this.world!;
        world.createCollider(colliderDesc, rigidBody);
        geometry.dispose();
        mergedGeometry.dispose();
    }

    public removeBody(model: Model): void {
        if (!this.world || !model.physicsBody) return;

        this.bodyToModelMap.delete(model.physicsBody.handle);
        this.world.removeRigidBody(model.physicsBody);
        model.physicsBody = null;
    }

    public clearAllBodies(models: Model[]) {
        models.forEach(model => this.removeBody(model));
    }

    public updateBodyRotation(model: Model): void {
        if (!model.physicsBody) return;
        model.physicsBody.setRotation(model.threeObject.quaternion, true);
        if (!model.physicsBody.isDynamic() || model.shapeType === 'curve') {
            this.removeBody(model);
            this.createBody(model);
        }
    }

    public step() {
        if (!this.world || !this.eventQueue) return;

        this.world.step(this.eventQueue);
        const currentTime = performance.now();

        this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
            this.processCollisionEvent(handle1, handle2, started, currentTime);
        });
    }

    private processCollisionEvent(handle1: number, handle2: number, started: boolean, currentTime: number) {
        if (!started) return;

        const collider1 = this.world!.getCollider(handle1);
        const collider2 = this.world!.getCollider(handle2);
        if (!collider1 || !collider2) return;

        const body1 = collider1.parent();
        const body2 = collider2.parent();
        if (!body1 || !body2) return;

        const model1 = this.bodyToModelMap.get(body1.handle);
        const model2 = this.bodyToModelMap.get(body2.handle);

        if (model1 && model2 && model1.physicsBody && model2.physicsBody) {
            const collisionKey = `${body1.handle}-${body2.handle}`;
            const lastCollisionTime = this.activeCollisions.get(collisionKey);

            if (!lastCollisionTime || currentTime - lastCollisionTime > 150) {
                this.activeCollisions.set(collisionKey, currentTime);
                this.handleCollision(model1.physicsBody, model2.physicsBody, model1, model2);
            }
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

    private handleCollision(body1: RAPIER.RigidBody, body2: RAPIER.RigidBody, model1: Model, model2: Model): void {
        // Identify Marble vs Shape
        let marbleBody: RAPIER.RigidBody | null = null;
        let shapeModel: Model | null = null;
        let marbleModel: Model | null = null;

        if (body1.isDynamic() && model1.shapeType === 'marble') {
            marbleBody = body1;
            marbleModel = model1;
            shapeModel = model2;
        } else if (body2.isDynamic() && model2.shapeType === 'marble') {
            marbleBody = body2;
            marbleModel = model2;
            shapeModel = model1;
        }

        if (!marbleBody || !shapeModel || !marbleModel) return;

        // Skip bouncing logic for curves - they are for rolling
        if (shapeModel.shapeType === 'curve') return;

        // Notify listener (Play Sound)
        if (this.onCollision) {
            this.onCollision(marbleModel, shapeModel);
        }

        const targetModel = this.getNextModel(marbleModel, shapeModel);

        if (targetModel) {
            const jumpVelocity = this.calculateVelocity(marbleModel, targetModel);
            marbleBody.setLinvel(jumpVelocity, true);
            marbleBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        } else {
            const currentVel = marbleBody.linvel();
            if (currentVel.y > 0) {
                marbleBody.setLinvel({
                    x: currentVel.x,
                    y: currentVel.y * 0.5,
                    z: currentVel.z
                }, true);
            }
        }
    }

    // Determine the next target block using Global Y-Axis Sorting (Highest to Lowest)
    private getNextModel(marble: Model, currentBlock: Model): Model | null {
        if (currentBlock.nextTarget) {
            return currentBlock.nextTarget;
        }
        const allBlocks = Array.from(this.bodyToModelMap.values()).filter(m =>
            m.shapeType !== 'marble' && m.shapeType !== 'curve'
        );
        allBlocks.sort((a, b) => {
            const yDiff = b.threeObject.position.y - a.threeObject.position.y;
            if (Math.abs(yDiff) > 0.01) return yDiff;
            return 0;
        });
        const currentIndex = allBlocks.indexOf(currentBlock);
        if (currentIndex !== -1 && currentIndex < allBlocks.length - 1) {
            return allBlocks[currentIndex + 1];
        }
        return null;
    }

    // Calculate velocity needed to hit the target model 
    // t is derived from the distance and a constant speed factor
    // projectile motion formula: v = (p - p0 - 0.5 * g * t^2) / t
    public speed: number = 60;

    public setGravity(y: number) {
        this.gravity.y = y;
        if (this.world) {
            this.world.gravity = { x: 0.0, y: y, z: 0.0 };
        }
    }

    public getGravityY(): number {
        return this.gravity.y;
    }

    public getGravity(): THREE.Vector3 {
        return this.gravity.clone();
    }

    public calculateVelocity(marble: Model, target: Model): THREE.Vector3 {
        const initial_position = marble.threeObject.position.clone();
        const final_position = target.threeObject.position.clone();
        const distance = initial_position.distanceTo(final_position);

        // Use the instance property speed instead of hardcoded value
        let t = distance / this.speed;

        if (t < 0.25) t = 0.25;
        const gravity = this.gravity;
        const displacement = new THREE.Vector3().subVectors(final_position, initial_position);
        const velocity = displacement.sub(gravity.clone().multiplyScalar(0.5 * t * t)).divideScalar(t);
        return velocity;
    }

    public dispose(): void {
        this.bodyToModelMap.clear();
        this.activeCollisions.clear();
    }
}