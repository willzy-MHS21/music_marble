import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface UseDragAndDropProps {
    sceneRef: React.MutableRefObject<THREE.Scene | null>;
    cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
    planeRef: React.MutableRefObject<THREE.Mesh | null>;
    controlsRef: React.MutableRefObject<OrbitControls | null>;
    objectsRef: React.MutableRefObject<THREE.Object3D[]>;
    onObjectSelected: (object: THREE.Object3D, isNew: boolean) => void;
    onDeselect: () => void;
}

export function useDragAndDrop({
    sceneRef,
    cameraRef,
    planeRef,
    controlsRef,
    objectsRef,
    onObjectSelected,
    onDeselect,
}: UseDragAndDropProps) {
    const raycasterRef = useRef(new THREE.Raycaster());
    const draggedObjectRef = useRef<THREE.Object3D | null>(null);
    const isDraggingRef = useRef(false);
    const isNewShapeRef = useRef(false);

    const onMouseMove = useCallback((event: MouseEvent) => {
        if (!isDraggingRef.current || !draggedObjectRef.current) return;
        if (!cameraRef.current || !planeRef.current) return;

        if (controlsRef.current) {
            controlsRef.current.enabled = false;
        }

        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycasterRef.current.setFromCamera(mouse, cameraRef.current);
        const intersects = raycasterRef.current.intersectObject(planeRef.current);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            draggedObjectRef.current.position.set(point.x, point.y, point.z + 1);
        }
    }, [cameraRef, planeRef, controlsRef]);

    const onMouseUp = useCallback(() => {
        if (isDraggingRef.current) {
            const wasNewShape = isNewShapeRef.current;
            const draggedObject = draggedObjectRef.current;

            isDraggingRef.current = false;
            isNewShapeRef.current = false;
            draggedObjectRef.current = null;

            if (controlsRef.current) {
                controlsRef.current.enabled = true;
            }

            if (wasNewShape && draggedObject) {
                onObjectSelected(draggedObject, true);
            }
        }
    }, [controlsRef, onObjectSelected]);

    const onMouseDown = useCallback((event: MouseEvent) => {
        if (isDraggingRef.current) return;

        const target = event.target as HTMLElement;
        if (target.closest('.lil-gui')) {
            return;
        }

        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycasterRef.current.setFromCamera(mouse, cameraRef.current!);
        const intersects = raycasterRef.current.intersectObjects(objectsRef.current, true);

        if (intersects.length > 0) {
            let selectedObject = intersects[0].object;
            while (selectedObject.parent && !objectsRef.current.includes(selectedObject)) {
                selectedObject = selectedObject.parent;
            }

            if (objectsRef.current.includes(selectedObject)) {
                if (controlsRef.current) {
                    controlsRef.current.enabled = false;
                }

                draggedObjectRef.current = selectedObject;
                isDraggingRef.current = true;

                onObjectSelected(selectedObject, false);
            }
        } else {
            onDeselect();
        }
    }, [cameraRef, controlsRef, objectsRef, onObjectSelected, onDeselect]);

    useEffect(() => {
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseDown, onMouseMove, onMouseUp]);

    const startDragging = useCallback((object: THREE.Object3D) => {
        draggedObjectRef.current = object;
        isDraggingRef.current = true;
        isNewShapeRef.current = true;
    }, []);

    return { raycasterRef, startDragging };
}