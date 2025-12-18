import * as THREE from 'three';
import { Model } from './Model';
import { ModelManager } from './ModelManager';
import { PhysicsSystem } from './systems/PhysicsSystem';

export class MarbleManager {
    private marbleGoalTimers: Map<Model, NodeJS.Timeout> = new Map();
    private marbleFallTimers: Map<Model, NodeJS.Timeout> = new Map();
    private marbleInitialPositions: Map<Model, THREE.Vector3> = new Map();
    private modelManager: ModelManager;
    private physics: PhysicsSystem;

    constructor(modelManager: ModelManager, physics: PhysicsSystem) {
        this.modelManager = modelManager;
        this.physics = physics;
    }

    public storeInitialPosition(marble: Model): void {
        if (marble.shapeType === 'marble') {
            this.marbleInitialPositions.set(marble, marble.threeObject.position.clone());
        }
    }

    public removeInitialPosition(marble: Model): void {
        this.marbleInitialPositions.delete(marble);
    }

    public getInitialPosition(marble: Model): THREE.Vector3 | undefined {
        return this.marbleInitialPositions.get(marble);
    }

    public checkGoalCollision(marble: Model, otherShape: Model, onMarbleRemoved: (marble: Model) => void): void {
        // Don't start a new timer if one already exists for this marble
        if (this.marbleGoalTimers.has(marble)) return;

        // Get the goal shape (lowest Y position)
        const goalShape = this.getGoalShape();
        if (!goalShape) return;

        // Check if the marble collided with the goal shape
        if (otherShape === goalShape) {
            console.log('Marble touched the goal! Disappearing in 1 second...');

            // Set a timer to remove the marble after 1 second
            const timer = setTimeout(() => {
                this.removeMarble(marble, onMarbleRemoved);
                this.marbleGoalTimers.delete(marble);
            }, 1000);

            this.marbleGoalTimers.set(marble, timer);
        }
    }

    public checkMarbleFallOffTrack(onMarbleRemoved: (marble: Model) => void): void {
        const models = this.modelManager.getAllModels();
        const marbles = models.filter(model => model.shapeType === 'marble');
        const goalShape = this.getGoalShape();

        if (!goalShape) return;

        const lowestY = goalShape.threeObject.position.y;

        marbles.forEach(marble => {
            const marbleY = marble.threeObject.position.y;

            // Check if marble has fallen below the lowest shape
            if (marbleY < lowestY && !this.marbleFallTimers.has(marble) && !this.marbleGoalTimers.has(marble)) {
                console.log('Marble fell below track! Removing in 1 second...');

                // Start 1-second timer before removal
                const timer = setTimeout(() => {
                    this.removeMarble(marble, onMarbleRemoved);
                    this.marbleFallTimers.delete(marble);
                }, 1000);

                this.marbleFallTimers.set(marble, timer);
            }
        });
    }

    private getGoalShape(): Model | null {
        const models = this.modelManager.getAllModels();
        const nonMarbleModels = models.filter(model => model.shapeType !== 'marble');

        if (nonMarbleModels.length === 0) return null;

        // Find the model with the lowest Y position
        let lowestModel = nonMarbleModels[0];
        let lowestY = lowestModel.threeObject.position.y;

        for (const model of nonMarbleModels) {
            if (model.threeObject.position.y < lowestY) {
                lowestY = model.threeObject.position.y;
                lowestModel = model;
            }
        }

        return lowestModel;
    }

    private removeMarble(marble: Model, onMarbleRemoved: (marble: Model) => void): void {
        // Get the initial position before removing
        const initialPosition = this.marbleInitialPositions.get(marble);

        // Notify parent (for camera unlock logic)
        onMarbleRemoved(marble);

        // Clear all timers for this marble
        if (this.marbleGoalTimers.has(marble)) {
            clearTimeout(this.marbleGoalTimers.get(marble)!);
            this.marbleGoalTimers.delete(marble);
        }
        if (this.marbleFallTimers.has(marble)) {
            clearTimeout(this.marbleFallTimers.get(marble)!);
            this.marbleFallTimers.delete(marble);
        }

        // Remove initial position tracking
        this.marbleInitialPositions.delete(marble);

        // Remove the marble from physics and scene
        this.physics.removeBody(marble);
        this.modelManager.removeModel(marble);

        // Spawn a new marble at the initial position 
        if (initialPosition) {
            const newMarble = this.modelManager.spawnModel('marble', initialPosition.clone());
            this.physics.createBody(newMarble);
            this.marbleInitialPositions.set(newMarble, initialPosition.clone());
            console.log('New marble spawned at initial position');
        }
    }

    public clearAllTimers(): void {
        this.marbleGoalTimers.forEach(timer => clearTimeout(timer));
        this.marbleGoalTimers.clear();
        this.marbleFallTimers.forEach(timer => clearTimeout(timer));
        this.marbleFallTimers.clear();
        this.marbleInitialPositions.clear();
    }

    public getAllInitialPositions(): Map<Model, THREE.Vector3> {
        return this.marbleInitialPositions;
    }
}