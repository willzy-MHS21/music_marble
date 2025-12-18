import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Model } from './Model';

export class CameraController {
    private camera: THREE.PerspectiveCamera;
    private controls: OrbitControls;
    private isCameraLocked: boolean = false;
    private cameraOffset: THREE.Vector3 = new THREE.Vector3(-15, 15, 15);
    private savedControlsState: {
        enabled: boolean;
        target: THREE.Vector3;
        position: THREE.Vector3;
    } | null = null;

    constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
        this.camera = camera;
        this.controls = controls;
    }

    public toggleCameraLock(getFirstMarble: () => Model | null): boolean {
        this.isCameraLocked = !this.isCameraLocked;

        if (this.isCameraLocked) {
            const marble = getFirstMarble();
            if (!marble) {
                console.warn('No marble found in scene. Cannot lock camera.');
                this.isCameraLocked = false;
                return false;
            }

            console.log('Camera locked to marble at position:', marble.threeObject.position);

            // Save current controls state
            this.savedControlsState = {
                enabled: this.controls.enabled,
                target: this.controls.target.clone(),
                position: this.camera.position.clone()
            };

            // Keep orbit controls enabled for user interaction
            this.controls.enabled = true;

            // Set target to marble position
            const marblePos = marble.threeObject.position.clone();
            this.controls.target.copy(marblePos);

            // Always position camera at exact front view
            const offset = new THREE.Vector3(0, 10, 40);
            this.camera.position.set(
                marblePos.x + offset.x,
                marblePos.y + offset.y,
                marblePos.z + offset.z
            );

            this.controls.update();

            console.log('Camera target set to:', this.controls.target);
            console.log('Camera position:', this.camera.position);
        } else {
            console.log('Camera unlocked');
            // Restore controls state
            if (this.savedControlsState) {
                this.controls.enabled = this.savedControlsState.enabled;
                this.controls.target.copy(this.savedControlsState.target);
                this.camera.position.copy(this.savedControlsState.position);
                this.controls.update();
            } else {
                this.controls.enabled = true;
            }
        }

        return this.isCameraLocked;
    }

    public updateCameraToFollowMarble(marble: Model, immediate: boolean = false) {
        const marblePosition = marble.threeObject.position;

        // Calculate the offset between current camera and current target
        const currentOffset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);

        // Update target to marble position
        const newTarget = marblePosition.clone();

        // Update camera position to maintain the same offset from the new target
        const newCameraPosition = new THREE.Vector3().addVectors(newTarget, currentOffset);

        if (immediate) {
            this.controls.target.copy(newTarget);
            this.camera.position.copy(newCameraPosition);
        } else {
            // Smoothly update both target and camera position
            this.controls.target.lerp(newTarget, 0.15);
            this.camera.position.lerp(newCameraPosition, 0.15);
        }

        // Ensure controls update is called
        this.controls.update();
    }

    public isCameraLockedToMarble(): boolean {
        return this.isCameraLocked;
    }

    public unlockCamera(): void {
        if (this.isCameraLocked) {
            this.isCameraLocked = false;
            if (this.savedControlsState) {
                this.controls.enabled = this.savedControlsState.enabled;
                this.controls.target.copy(this.savedControlsState.target);
                this.camera.position.copy(this.savedControlsState.position);
                this.controls.update();
            }
        }
    }
}