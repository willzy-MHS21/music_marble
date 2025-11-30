"use client";

import { useRef } from 'react';
import * as THREE from 'three';

import { ShapeGUI } from '../ui/shape-gui';
import ShapeButtons from '../ui/shape-buttons';
import UtilityButtons from '../ui/utility-buttons';

import { useThreeScene } from '../../hooks/useThreeScene';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useOutline } from '../../hooks/useOutline';
import { useModelLoader } from '../../hooks/useModelLoader';

export default function MarbleScene() {
	const objectsRef = useRef<THREE.Object3D[]>([]);
	const shapeGUIRef = useRef<ShapeGUI>(new ShapeGUI());
	const selectedObjectRef = useRef<THREE.Object3D | null>(null);

	const { mountRef, sceneRef, cameraRef, rendererRef, controlsRef, planeRef } = useThreeScene();
	const { addOutline, removeOutline } = useOutline();

	const handleObjectSelected = (object: THREE.Object3D, isNew: boolean) => {
		if (selectedObjectRef.current && selectedObjectRef.current !== object) {
			removeOutline();
		}

		selectedObjectRef.current = object;
		addOutline(object);

		shapeGUIRef.current.create(object, () => {
			if (sceneRef.current) {
				removeOutline();
				sceneRef.current.remove(object);

				const index = objectsRef.current.indexOf(object);
				if (index > -1) {
					objectsRef.current.splice(index, 1);
				}

				selectedObjectRef.current = null;
			}
		});
	};

	const handleDeselect = () => {
		if (selectedObjectRef.current) {
			removeOutline();
			selectedObjectRef.current = null;
		}
		shapeGUIRef.current.destroy();
	};

	const { raycasterRef, startDragging } = useDragAndDrop({
		sceneRef,
		cameraRef,
		planeRef,
		controlsRef,
		objectsRef,
		onObjectSelected: handleObjectSelected,
		onDeselect: handleDeselect,
	});

	const { loadAndDragModel } = useModelLoader({
		sceneRef,
		cameraRef,
		planeRef,
		raycasterRef,
		objectsRef,
		onModelLoaded: startDragging,
	});

	return (
		<div
			ref={mountRef}
			style={{
				width: '100vw',
				height: '100vh',
				margin: 0,
				padding: 0,
				overflow: 'hidden',
			}}
		>
			<UtilityButtons
				onImport={() => { }}
				onExport={() => { }}
				onLoad={() => { }}
				onClear={() => { }}
				onCameraToggle={() => { }}
			/>
			<ShapeButtons
				marble={(e) => loadAndDragModel('/models/marble.glb', e)}
				plank={(e) => loadAndDragModel('/models/plank.glb', e)}
				cylinder={(e) => loadAndDragModel('/models/cylinder.glb', e)}
				curve={(e) => loadAndDragModel('/models/curve.glb', e)}
			/>
		</div>
	);
}