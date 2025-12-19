import * as THREE from 'three';
import { ModelManager } from './ModelManager';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { MarbleManager } from './MarbleManager';

export class SceneManager {
    private modelManager: ModelManager;
    private physics: PhysicsSystem;
    private marbleManager: MarbleManager;

    constructor(modelManager: ModelManager, physics: PhysicsSystem, marbleManager: MarbleManager) {
        this.modelManager = modelManager;
        this.physics = physics;
        this.marbleManager = marbleManager;
    }

    public exportScene(): string {
        const models = this.modelManager.getAllModels().filter(model => model.shapeType !== 'marble');

        // Get marble's initial position if it exists
        const marbles = this.modelManager.getAllModels().filter(model => model.shapeType === 'marble');
        let marbleInitialPosition = null;
        if (marbles.length > 0) {
            const marble = marbles[0];
            const initialPos = this.marbleManager.getInitialPosition(marble);
            if (initialPos) {
                marbleInitialPosition = {
                    x: initialPos.x,
                    y: initialPos.y,
                    z: initialPos.z,
                };
            }
        }

        const sceneData = {
            models: models.map(model => ({
                shapeType: model.shapeType,
                position: {
                    x: model.threeObject.position.x,
                    y: model.threeObject.position.y,
                    z: model.threeObject.position.z,
                },
                rotation: {
                    x: model.threeObject.quaternion.x,
                    y: model.threeObject.quaternion.y,
                    z: model.threeObject.quaternion.z,
                    w: model.threeObject.quaternion.w,
                },
                scale: {
                    x: model.threeObject.scale.x,
                    y: model.threeObject.scale.y,
                    z: model.threeObject.scale.z,
                },
                userData: model.threeObject.userData,
            })),
            marbleInitialPosition: marbleInitialPosition,
        };
        return JSON.stringify(sceneData);
    }

    public importScene(sceneData: any): void {
        if (sceneData.models) {
            sceneData.models.forEach((modelData: any) => {
                const position = new THREE.Vector3(
                    modelData.position.x,
                    modelData.position.y,
                    modelData.position.z
                );

                const model = this.modelManager.spawnModel(modelData.shapeType, position);

                if (modelData.rotation) {
                    model.threeObject.quaternion.set(
                        modelData.rotation.x,
                        modelData.rotation.y,
                        modelData.rotation.z,
                        modelData.rotation.w
                    );
                }

                if (modelData.scale) {
                    model.threeObject.scale.set(
                        modelData.scale.x,
                        modelData.scale.y,
                        modelData.scale.z
                    );
                }

                if (modelData.userData) {
                    model.threeObject.userData = modelData.userData;
                }
                if (!model.isDecoration) {
                    this.physics.createBody(model);
                }

                // Store initial position for marbles
                if (model.shapeType === 'marble') {
                    this.marbleManager.storeInitialPosition(model);
                }
            });
        }

        // Restore marble's initial position if it was saved
        if (sceneData.marbleInitialPosition) {
            const marblePos = new THREE.Vector3(
                sceneData.marbleInitialPosition.x,
                sceneData.marbleInitialPosition.y,
                sceneData.marbleInitialPosition.z
            );

            // Spawn a marble at the initial position
            const marble = this.modelManager.spawnModel('marble', marblePos.clone());
            this.physics.createBody(marble);
            this.marbleManager.storeInitialPosition(marble);
        }
    }
}