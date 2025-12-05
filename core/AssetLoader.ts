import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

export class AssetLoader {
    private loader = new GLTFLoader();
    private models = new Map<string, THREE.Mesh>();
    private modelUrls = ['models/curve.glb', 'models/plank.glb', 'models/cylinder.glb', 'models/marble.glb'];

    async loadAllModel() {
        const gltfs = await Promise.all(this.modelUrls.map(url => this.loader.loadAsync(url)));

        gltfs.forEach((gltf, index) => {
            const url = this.modelUrls[index];
            const name = url.split('/').pop()?.replace('.glb', '') || '';

            gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    this.models.set(name, child);
                }
            });
        });
    }
    
    public getMesh(name: string): THREE.Mesh | undefined {
        const mesh = this.models.get(name);
        return mesh ? mesh.clone() : undefined;
    }
}
