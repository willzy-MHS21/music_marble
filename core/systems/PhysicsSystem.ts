import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { Model } from '../Model';

export class PhysicsSystem {
    world: RAPIER.World | null = null;
    private debugLines: THREE.LineSegments | null = null;
    private audioContext: AudioContext | null = null;
    private playedNotes: Set<string> = new Set();
    private bodyToModelMap: Map<number, Model> = new Map();
    private eventQueue: RAPIER.EventQueue | null = null;

    async init(scene: THREE.Scene) {
        await RAPIER.init();
        const gravity = { x: 0.0, y: -9.81 * 20, z: 0.0 };
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
        colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
        const collider = this.world.createCollider(colliderDesc, rigidBody);
        model.physicsBody = rigidBody;
        
        // Store the mapping between body handle and model
        this.bodyToModelMap.set(rigidBody.handle, model);
    }

    public removeBody(model: Model): void {
        if (!this.world || !model.physicsBody) return;
        
        // Remove from body map
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
        
        // Recreate the body
        if (!model.physicsBody.isDynamic()) {
            this.removeBody(model);
            this.createBody(model);
        }
    }

    public update() {
        if (!this.world || !this.eventQueue) return;
        
        this.world.step(this.eventQueue);
        
        // Process collision events
        this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
            if (started) {
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
                    this.handleCollision(model1.physicsBody, model2.physicsBody);
                }
            }
        });
        
        // Update Debug Geometry 
        if (this.debugLines) {
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
        
        // Create collision key for debouncing
        const collisionKey = `${marbleBody.handle}-${shapeBody.handle}`;
        
        // Prevent playing the same note multiple times in quick succession
        if (this.playedNotes.has(collisionKey)) return;
        
        this.playedNotes.add(collisionKey);
        setTimeout(() => this.playedNotes.delete(collisionKey), 200); // Debounce for 200ms
        
        // Play the note
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
        this.playedNotes.clear();
    }
}