import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { Model } from '../Model';
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

export class PhysicsSystem {
    world: RAPIER.World | null = null;
    private debugLines: THREE.LineSegments | null = null;
    private audioContext: AudioContext | null = null;
    private activeCollisions: Map<string, number> = new Map(); 
    private bodyToModelMap: Map<number, Model> = new Map();
    private eventQueue: RAPIER.EventQueue | null = null;

    async init(scene: THREE.Scene) {
        await RAPIER.init();
        const gravity = { x: 0.0, y: -9.81 * 10, z: 0.0 };
        this.world = new RAPIER.World(gravity);
        this.eventQueue = new RAPIER.EventQueue(true);

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
        const mesh = model.getMesh();
        const scale = mesh.scale;

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
            colliderDesc.setRotation(mesh.quaternion);
            colliderDesc.setRestitution(0); 
            colliderDesc.setFriction(0.5); 
            colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
            const collider = this.world.createCollider(colliderDesc, rigidBody);
        } else {
            if (type == 'plank') {
                colliderDesc = RAPIER.ColliderDesc.cuboid(scale.x, scale.y, scale.z);
                colliderDesc.setRotation(mesh.quaternion);
                colliderDesc.setRestitution(0.9);
                colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
                const collider = this.world.createCollider(colliderDesc, rigidBody);
            } else if (type == 'cylinder') {
                colliderDesc = RAPIER.ColliderDesc.cylinder(scale.y, scale.x);
                colliderDesc.setRotation(mesh.quaternion);
                colliderDesc.setRestitution(0.9);
                colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
                const collider = this.world.createCollider(colliderDesc, rigidBody);
            } else if (type == 'curve') {
                // Use trimesh collider for accurate curve collision
                const geometry = mesh.geometry.clone();
                
                // Apply mesh transformations to geometry
                geometry.applyMatrix4(mesh.matrix);
                
                const mergedGeometry = BufferGeometryUtils.mergeVertices(geometry);
                
                // Ensure we have Float32Array for positions
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
                
                colliderDesc = RAPIER.ColliderDesc.trimesh(
                    positionsFloat32,
                    indicesUint32
                );
                colliderDesc.setRestitution(0.0); 
                colliderDesc.setFriction(0.5); 
                colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
                const collider = this.world.createCollider(colliderDesc, rigidBody);
                
                // Clean up
                geometry.dispose();
                mergedGeometry.dispose();
            } else {
                console.error(`Unknown shape type: ${type}`);
                return;
            }
        }
        
        model.physicsBody = rigidBody;

        // Store the mapping between body handle and model
        this.bodyToModelMap.set(rigidBody.handle, model);
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

    // Update rotation of physics body
    public updateBodyRotation(model: Model): void {
        if (!model.physicsBody) return;

        // Update the rigid body's rotation
        model.physicsBody.setRotation(model.threeObject.quaternion, true);

        // Recreate the body for curves and static objects
        if (!model.physicsBody.isDynamic() || model.shapeType === 'curve') {
            this.removeBody(model);
            this.createBody(model);
        }
    }
    
    public step() {
        if (!this.world || !this.eventQueue) return;

        this.world.step(this.eventQueue);

        const currentTime = performance.now();

        // Process collision events
        this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
            // Get colliders from handles
            const collider1 = this.world!.getCollider(handle1);
            const collider2 = this.world!.getCollider(handle2);

            if (!collider1 || !collider2) return;

            // Get parent rigid bodies
            const body1 = collider1.parent();
            const body2 = collider2.parent();

            if (!body1 || !body2) return;

            // Get models from rigid body handles
            const model1 = this.bodyToModelMap.get(body1.handle);
            const model2 = this.bodyToModelMap.get(body2.handle);

            if (model1 && model2 && model1.physicsBody && model2.physicsBody) {
                // Use body handles for tracking - this treats entire rigid body as one
                const collisionKey = `${body1.handle}-${body2.handle}`;
                
                if (started) {
                    const lastCollisionTime = this.activeCollisions.get(collisionKey);
                    
                    // Only play sound if this is a new collision (no recent collision in last 1 second)
                    if (!lastCollisionTime || currentTime - lastCollisionTime > 1000) {
                        this.activeCollisions.set(collisionKey, currentTime);
                        this.handleCollision(model1.physicsBody, model2.physicsBody);
                    }
                }
            }
        });
    }

    public updateDebug() {
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

    private handleCollision(body1: RAPIER.RigidBody, body2: RAPIER.RigidBody): void {
        // Find which body is the marble and which is the shape
        let marbleBody: RAPIER.RigidBody | null = null;
        let shapeBody: RAPIER.RigidBody | null = null;

        if (body1.isDynamic()) {
            marbleBody = body1;
            shapeBody = body2;
        } else if (body2.isDynamic()) {
            marbleBody = body2;
            shapeBody = body1;
        }

        if (!marbleBody || !shapeBody) return;

        // Get the velocity of the marble to determine impact strength
        const velocity = marbleBody.linvel();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);

        // Only play sound if marble is moving fast enough 
        if (speed < 0.5) return;

        // Get the model from the shape body
        const shapeModel = this.bodyToModelMap.get(shapeBody.handle);

        if (!shapeModel) return;

        // Play the note (no debouncing needed since we track collision start/end)
        this.playNote(shapeModel);
    }

    private async playNote(model: Model): Promise<void> {
        const userData = model.threeObject.userData;

        // Check if the model has note data
        if (!userData.note || userData.octave === undefined) {
            return;
        }

        try {
            const note = userData.note;
            const octave = userData.octave;
            const accidental = userData.accidental || '';
            const fileName = `${note}${accidental}${octave}.mp3`;
            const soundPath = `/sounds/${fileName}`;

            // Create audio context if it doesn't exist
            if (!this.audioContext) {
                this.audioContext = new AudioContext();
            }

            // Fetch and play the audio
            const response = await fetch(soundPath);
            if (!response.ok) {
                console.error(`Sound file not found: ${soundPath}`);
                return;
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            source.start(0);

            console.log(`Playing collision note: ${note}${accidental}${octave}`);
        } catch (error) {
            console.error('Error playing collision note:', error);
        }
    }

    public dispose(): void {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.bodyToModelMap.clear();
        this.activeCollisions.clear();
    }
}