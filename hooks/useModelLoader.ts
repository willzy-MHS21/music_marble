import { useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface UseModelLoaderProps {
    sceneRef: React.MutableRefObject<THREE.Scene | null>;
    cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
    planeRef: React.MutableRefObject<THREE.Mesh | null>;
    raycasterRef: React.MutableRefObject<THREE.Raycaster>;
    objectsRef: React.MutableRefObject<THREE.Object3D[]>;
    onModelLoaded: (model: THREE.Object3D) => void;
}

export function useModelLoader({
    sceneRef,
    cameraRef,
    planeRef,
    raycasterRef,
    objectsRef,
    onModelLoaded,
}: UseModelLoaderProps) {
    const loadAndDragModel = useCallback((modelPath: string, event: React.MouseEvent) => {
        if (!sceneRef.current || !cameraRef.current || !planeRef.current) return;

        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycasterRef.current.setFromCamera(mouse, cameraRef.current);
        const intersects = raycasterRef.current.intersectObject(planeRef.current);

        const initialPosition = intersects.length > 0
            ? intersects[0].point
            : new THREE.Vector3(0, 0, 1);

        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (gltf) => {
                const model = gltf.scene;
                model.position.set(initialPosition.x, initialPosition.y, initialPosition.z + 1);

                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        if (child.material instanceof THREE.MeshStandardMaterial) {
                            child.material.roughness = 0.1;
                        }
                    }
                });

                sceneRef.current!.add(model);
                objectsRef.current.push(model);
                onModelLoaded(model);
            },
            undefined,
            (error) => {
                console.error(`Error loading model from ${modelPath}:`, error);
            }
        );
    }, [sceneRef, cameraRef, planeRef, raycasterRef, objectsRef, onModelLoaded]);

    return { loadAndDragModel };
}