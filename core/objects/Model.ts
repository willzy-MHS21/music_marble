import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';

export class Model {
    public threeObject: THREE.Object3D;
    public shapeType: string;
    public physicsBody: RAPIER.RigidBody | null = null;
    public nextTarget: Model | null = null;
    private isLit: boolean = false;
    private lights: THREE.PointLight[] = [];
    private lightColors: THREE.Color[] = [
        new THREE.Color(0xff69b4), // Hot pink
        new THREE.Color(0x87ceeb), // Sky blue
        new THREE.Color(0xffffe0)  // Pastel yellow
    ];

    constructor(threeObject: THREE.Object3D, shapeType: string) {
        this.threeObject = threeObject;
        this.shapeType = shapeType;
    }

    public highlight() {
        if (this.isLit) return;
        this.isLit = true;

        // Pick a random color from the palette
        const randomColor = this.lightColors[Math.floor(Math.random() * this.lightColors.length)];

        // Create one point light in the middle of the model
        const light = new THREE.PointLight(randomColor, 5, 15);
        light.position.copy(this.threeObject.position);
        light.castShadow = false;

        // Add light to the scene through the parent
        if (this.threeObject.parent) {
            this.threeObject.parent.add(light);
        }

        this.lights.push(light);
    }

    public unhighlight() {
        if (!this.isLit) return;
        this.isLit = false;

        // Remove all lights from the scene
        this.lights.forEach(light => {
            if (light.parent) {
                light.parent.remove(light);
            }
            light.dispose();
        });

        this.lights = [];
    }

    public getMesh(): THREE.Mesh {
        for (const child of this.threeObject.children) {
            if (child instanceof THREE.Mesh) {
                return child;
            }
        }
        throw new Error('No mesh found in model');
    }

    public setPosition(x: number, y: number, z: number): void {
        this.threeObject.position.set(x, y, z);
    }

    public setRotation(quaternion: THREE.Quaternion): void {
        this.threeObject.quaternion.copy(quaternion);
    }

    public getNoteData(): { note: string; octave: number; accidental: string } | null {
        if (this.threeObject.userData && this.threeObject.userData.note) {
            return {
                note: this.threeObject.userData.note,
                octave: this.threeObject.userData.octave,
                accidental: this.threeObject.userData.accidental
            };
        }
        return null;
    }

    public setNoteData(note: string, octave: number, accidental: string): void {
        this.threeObject.userData.note = note;
        this.threeObject.userData.octave = octave;
        this.threeObject.userData.accidental = accidental;
    }
}