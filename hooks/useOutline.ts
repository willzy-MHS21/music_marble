import { useRef, useCallback } from 'react';
import * as THREE from 'three';

export function useOutline() {
    const outlineMeshesRef = useRef<THREE.Mesh[]>([]);

    const removeOutline = useCallback(() => {
        outlineMeshesRef.current.forEach((outlineMesh) => {
            if (outlineMesh.parent) {
                outlineMesh.parent.remove(outlineMesh);
            }
            if (outlineMesh.geometry) {
                outlineMesh.geometry.dispose();
            }
            if (outlineMesh.material instanceof THREE.Material) {
                outlineMesh.material.dispose();
            }
        });
        outlineMeshesRef.current = [];
    }, []);

    const addOutline = useCallback((object: THREE.Object3D) => {
        removeOutline();

        object.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry && !(child as any).isOutline) {
                try {
                    const outlineMaterial = new THREE.MeshBasicMaterial({
                        color: 0x00aaff,
                        side: THREE.BackSide,
                    });

                    const outlineMesh = new THREE.Mesh(child.geometry, outlineMaterial);
                    outlineMesh.scale.set(1.05, 1.05, 1.05);
                    (outlineMesh as any).isOutline = true;

                    child.add(outlineMesh);
                    outlineMeshesRef.current.push(outlineMesh);
                } catch (error) {
                    console.error('Error creating outline:', error);
                }
            }
        });
    }, [removeOutline]);

    return { addOutline, removeOutline };
}