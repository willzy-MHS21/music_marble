import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

/**
 * Preload and store all 3d models and audio before web app starts
 */
export class AssetLoader {
    private loader = new GLTFLoader();
    private models = new Map<string, THREE.Group>();
    private audioBuffers = new Map<string, AudioBuffer>();
    private audioContext: AudioContext;

    private modelUrls = ['models/curve.glb', 'models/plank.glb', 'models/cylinder.glb', 'models/marble.glb'];

    constructor() {
        this.audioContext = new AudioContext();
    }

    async loadAllAssets() {
        const audioUrls = this.generateAudioUrls();
        await Promise.all(audioUrls.map(url => this.loadAudio(url)));
        const gltfs = await Promise.all(this.modelUrls.map(url => this.loader.loadAsync(url)));

        gltfs.forEach((gltf, index) => {
            const url = this.modelUrls[index];
            const name = url.split('/').pop()?.replace('.glb', '') || '';
            this.models.set(name, gltf.scene);
        });

        console.log("All assets loaded");
    }

    private generateAudioUrls(): string[] {
        const urls: string[] = [];
        const notes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

        ['A0', 'Bb0', 'B0'].forEach(note => urls.push(`sounds/${note}.mp3`));

        for (let i = 1; i < 8; i++) {
            notes.forEach(note => {
                urls.push(`sounds/${note}${i}.mp3`);
            });
        }

        urls.push('sounds/C8.mp3');
        return urls;
    }

    private async loadAudio(url: string) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            const name = url.split('/').pop()?.replace('.mp3', '') || '';
            this.audioBuffers.set(name, audioBuffer);
        } catch (error) {
            console.error(`Failed to load audio: ${url}`, error);
        }
    }

    public getAllModels() {
        return this.models;
    }

    public getAllAudio() {
        return this.audioBuffers;
    }

    public getAudioContext() {
        return this.audioContext;
    }
}