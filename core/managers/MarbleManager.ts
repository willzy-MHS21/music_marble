import * as THREE from 'three';
import { Model } from '../objects/Model';
import { ModelManager } from '../managers/ModelManager';
import { PhysicsSystem } from '../systems/PhysicsSystem';

export class MarbleManager {
    private completionTimers: Map<Model, NodeJS.Timeout> = new Map();
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

    public checkCompletion(marble: Model, otherShape: Model, onMarbleRemoved: (marble: Model) => void): void {
        if (this.completionTimers.has(marble)) return;

        const lowestPiece = this.getLowestTrackPiece();
        if (!lowestPiece) return;

        if (otherShape === lowestPiece) {
            console.log('Marble reached end of track. Resetting in 1 second...');

            const timer = setTimeout(() => {
                this.removeMarble(marble, onMarbleRemoved);
                this.completionTimers.delete(marble);
            }, 1000);

            this.completionTimers.set(marble, timer);
        }
    }

    public checkMarbleFallOffTrack(onMarbleRemoved: (marble: Model) => void): void {
        const models = this.modelManager.getAllModels();
        const marbles = models.filter(model => model.shapeType === 'marble');
        const lowestPiece = this.getLowestTrackPiece();

        if (!lowestPiece) return;

        const lowestY = lowestPiece.threeObject.position.y;

        marbles.forEach(marble => {
            const marbleY = marble.threeObject.position.y;

            if (marbleY < lowestY && !this.marbleFallTimers.has(marble) && !this.completionTimers.has(marble)) {
                console.log('Marble fell below track! Removing in 1 second...');

                const timer = setTimeout(() => {
                    this.removeMarble(marble, onMarbleRemoved);
                    this.marbleFallTimers.delete(marble);
                }, 1000);

                this.marbleFallTimers.set(marble, timer);
            }
        });
    }

    private getLowestTrackPiece(): Model | null {
        const models = this.modelManager.getAllModels();
        const nonMarbleModels = models.filter(model => model.shapeType !== 'marble');

        if (nonMarbleModels.length === 0) return null;

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
        const initialPosition = this.marbleInitialPositions.get(marble);

        onMarbleRemoved(marble);

        if (this.completionTimers.has(marble)) {
            clearTimeout(this.completionTimers.get(marble)!);
            this.completionTimers.delete(marble);
        }
        if (this.marbleFallTimers.has(marble)) {
            clearTimeout(this.marbleFallTimers.get(marble)!);
            this.marbleFallTimers.delete(marble);
        }

        this.marbleInitialPositions.delete(marble);

        this.physics.removeBody(marble);
        this.modelManager.removeModel(marble);

        if (initialPosition) {
            const newMarble = this.modelManager.spawnModel('marble', initialPosition.clone());
            this.physics.createBody(newMarble);
            this.marbleInitialPositions.set(newMarble, initialPosition.clone());
            console.log('New marble spawned at initial position');
        }
    }

    public clearAllTimers(): void {
        this.completionTimers.forEach(timer => clearTimeout(timer));
        this.completionTimers.clear();
        this.marbleFallTimers.forEach(timer => clearTimeout(timer));
        this.marbleFallTimers.clear();
        this.marbleInitialPositions.clear();
    }

    public getAllInitialPositions(): Map<Model, THREE.Vector3> {
        return this.marbleInitialPositions;
    }
}