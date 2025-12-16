import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

export class ModelLoader {
    private loader = new GLTFLoader();
    private models = new Map<string, THREE.Group>();
    private modelUrls = ['models/curve.glb', 'models/plank.glb', 'models/cylinder.glb', 'models/marble.glb'];

    async loadAllModel() {
        const gltfs = await Promise.all(this.modelUrls.map(url => this.loader.loadAsync(url)));
        gltfs.forEach((gltf, index) => {
            const url = this.modelUrls[index];
            const name = url.split('/').pop()?.replace('.glb', '') || '';
            
            // Enable shadows on all meshes in the loaded model
            gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            this.models.set(name, gltf.scene);
        });
    }

    public getAllModels() {
        console.log(this.models);
        return this.models;
    }
}