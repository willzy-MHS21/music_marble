import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { Model } from './Model';
import { PhysicsSystem } from '../systems/PhysicsSystem';

export class TrajectoryLine {
    private scene: THREE.Scene;
    private line: THREE.Line | null = null;
    private physicsSystem: PhysicsSystem;
    private isVisible: boolean = false;

    constructor(scene: THREE.Scene, physicsSystem: PhysicsSystem) {
        this.scene = scene;
        this.physicsSystem = physicsSystem;
    }

    public setVisible(visible: boolean) {
        this.isVisible = visible;
        if (!visible) {
            this.clear();
        }
    }

    public update(models: Model[]) {
        if (!this.isVisible) {
            this.clear();
            return;
        }

        const marble = models.find(m => m.shapeType === 'marble');
        if (!marble || !marble.physicsBody) {
            this.clear();
            return;
        }

        const futureWorld = new RAPIER.World(this.physicsSystem.getGravity());
        const eventQueue = new RAPIER.EventQueue(true);
        const futureBodyToModel = new Map<number, Model>();

        for (const model of models) {
            if (model === marble) continue;

            const body = this.physicsSystem.createRigidBody(model, futureWorld);
            this.physicsSystem.createCollider(model, body, futureWorld);
            futureBodyToModel.set(body.handle, model);
        }

        const marbleBody = this.physicsSystem.createRigidBody(marble, futureWorld);
        this.physicsSystem.createCollider(marble, marbleBody, futureWorld);

        // SYNC VELOCITY from real world to prediction world
        if (marble.physicsBody) {
            marbleBody.setLinvel(marble.physicsBody.linvel(), true);
            marbleBody.setAngvel(marble.physicsBody.angvel(), true);
        }

        const points: THREE.Vector3[] = [];
        points.push(marble.threeObject.position.clone());

        const predictionSteps = 200;
        const activeCollisions = new Map<string, number>();

        for (let step = 0; step < predictionSteps; step++) {
            futureWorld.step(eventQueue);

            // Handle Collisions (Bounce/Jump Logic)
            eventQueue.drainCollisionEvents((handle1, handle2, started) => {
                this.processCollisionEvent(
                    futureWorld,
                    handle1,
                    handle2,
                    started,
                    marbleBody,
                    futureBodyToModel,
                    models,
                    activeCollisions,
                    step
                );
            });

            const t = marbleBody.translation();
            points.push(new THREE.Vector3(t.x, t.y, t.z));

            // Optimization: Stop if falls too low
            if (t.y < -200) break;
        }

        // Cleanup & Render
        futureWorld.free();
        this.renderLine(points);
    }

    private processCollisionEvent(
        world: RAPIER.World,
        handle1: number,
        handle2: number,
        started: boolean,
        marbleBody: RAPIER.RigidBody,
        invisibleBodyToModel: Map<number, Model>,
        allModels: Model[],
        activeCollisions: Map<string, number>,
        currentStep: number
    ) {
        if (!started) return;

        const c1 = world.getCollider(handle1);
        const c2 = world.getCollider(handle2);
        if (!c1 || !c2) return;

        const b1 = c1.parent();
        const b2 = c2.parent();
        if (!b1 || !b2) return;

        let invisibleMarble: RAPIER.RigidBody | null = null;
        let invisibleBlockModel: Model | null = null;
        let otherBodyHandle: number | null = null;

        if (b1.handle === marbleBody.handle) {
            invisibleMarble = b1;
            invisibleBlockModel = invisibleBodyToModel.get(b2.handle) || null;
            otherBodyHandle = b2.handle;
        } else if (b2.handle === marbleBody.handle) {
            invisibleMarble = b2;
            invisibleBlockModel = invisibleBodyToModel.get(b1.handle) || null;
            otherBodyHandle = b1.handle;
        }

        if (invisibleMarble && invisibleBlockModel && otherBodyHandle !== null) {
            const collisionKey = `${marbleBody.handle}-${otherBodyHandle}`;
            const lastCollisionStep = activeCollisions.get(collisionKey);

            if (lastCollisionStep === undefined || (currentStep - lastCollisionStep) > 9) {
                activeCollisions.set(collisionKey, currentStep);
                this.handleInvisibleCollision(invisibleMarble, invisibleBlockModel, allModels);
            }
        }
    }

    private handleInvisibleCollision(invisibleMarble: RAPIER.RigidBody, invisibleBlockModel: Model, allModels: Model[]) {
        if (invisibleBlockModel.shapeType === 'curve') return;

        const targetModel = this.getNextModel(invisibleBlockModel, allModels);

        const tempObject = new THREE.Object3D();
        const t = invisibleMarble.translation();
        tempObject.position.set(t.x, t.y, t.z);
        const invisibleMarbleToModelWrapper = new Model(tempObject, 'marble');

        if (targetModel) {
            const jumpVelocity = this.physicsSystem.calculateVelocity(invisibleMarbleToModelWrapper, targetModel);
            invisibleMarble.setLinvel(jumpVelocity, true);
            invisibleMarble.setAngvel({ x: 0, y: 0, z: 0 }, true);
        } else {
            const cv = invisibleMarble.linvel();
            if (cv.y > 0) {
                invisibleMarble.setLinvel({ x: cv.x, y: cv.y * 0.5, z: cv.z }, true);
            }
        }
    }

    private getNextModel(currentBlock: Model, allModels: Model[]): Model | null {
        if (currentBlock.nextTarget) {
            return currentBlock.nextTarget;
        }

        const validBlocks = allModels.filter(m =>
            m.shapeType !== 'marble' && m.shapeType !== 'curve'
        );

        validBlocks.sort((a, b) => {
            const yDiff = b.threeObject.position.y - a.threeObject.position.y;
            if (Math.abs(yDiff) > 0.01) return yDiff;
            return 0;
        });

        const currentIndex = validBlocks.indexOf(currentBlock);

        if (currentIndex !== -1 && currentIndex < validBlocks.length - 1) {
            return validBlocks[currentIndex + 1];
        }

        return null;
    }

    private renderLine(points: THREE.Vector3[]) {
        if (this.line) {
            this.scene.remove(this.line);
            this.line.geometry.dispose();
            (this.line.material as THREE.Material).dispose();
            this.line = null;
        }

        if (points.length > 1) {
            const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const pathMaterial = new THREE.LineBasicMaterial({
                color: 0xff0000,
                opacity: 0.8,
                transparent: true,
                linewidth: 1
            });
            this.line = new THREE.Line(pathGeometry, pathMaterial);
            this.scene.add(this.line);
        }
    }

    public clear() {
        if (this.line) {
            this.scene.remove(this.line);
            this.line.geometry.dispose();
            (this.line.material as THREE.Material).dispose();
            this.line = null;
        }
    }
}