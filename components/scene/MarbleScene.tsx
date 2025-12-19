"use client";

import { useEffect, useRef, useState } from 'react';
import ShapeButtons from '../ui/shape-buttons';
import UtilityButtons from '../ui/utility-buttons';
import { MarbleWorld } from '../../core/MarbleWorld';

export default function MarbleScene() {
	const mountRef = useRef<HTMLDivElement>(null);
	const marbleWorldRef = useRef<MarbleWorld | null>(null);
	const [isCameraLocked, setIsCameraLocked] = useState(false);
	const [isPaused, setIsPaused] = useState(true);

	useEffect(() => {
		if (!mountRef.current) return;

		// Create Marble World
		const marbleWorld = new MarbleWorld();
		marbleWorldRef.current = marbleWorld;
		mountRef.current.appendChild(marbleWorld.getDomElement());
		marbleWorld.animate();

		// Set initial paused state
		setIsPaused(marbleWorld.isPausedState());
		setIsCameraLocked(marbleWorld.isCameraLockedToMarble());

		// Sync pause and camera lock state periodically
		const syncInterval = setInterval(() => {
			if (!marbleWorldRef.current) return;
			const currentPausedState = marbleWorldRef.current.isPausedState();
			const currentCameraState = marbleWorldRef.current.isCameraLockedToMarble();
			
			setIsPaused(currentPausedState);
			setIsCameraLocked(currentCameraState);
		}, 50);

		return () => {
			clearInterval(syncInterval);
			if (mountRef.current && marbleWorld.getDomElement().parentNode === mountRef.current) {
				mountRef.current.removeChild(marbleWorld.getDomElement());
			}
			marbleWorld.dispose();
		};
	}, []); 

	const shapeClick = (shapeType: string, event: React.MouseEvent) => {
		if (marbleWorldRef.current) {
			marbleWorldRef.current.ShapeButtonClick(shapeType, event.nativeEvent);
		}
	};

	const exportScene = () => {
		if(marbleWorldRef.current) {
			const json = marbleWorldRef.current.exportScene();
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'scene.json';
			a.click();
			URL.revokeObjectURL(url);
		}
	};

	const loadScene = async () => {
		try {
			const response = await fetch('/scenes/default.json');
			console.log(response);
			if (!response.ok) {
				throw new Error('Default scene not found');
			}
			const sceneData = await response.json();
			marbleWorldRef.current?.importScene(sceneData);
		} catch (error) {
			console.error('Failed to load default scene:', error);
		}
	};

	const handleCameraToggle = () => {
		if (marbleWorldRef.current) {
			const newLockState = marbleWorldRef.current.toggleCameraLock();
			setIsCameraLocked(newLockState);
		}
	};

	const handlePlayPause = () => {
		if (marbleWorldRef.current) {
			const newPausedState = marbleWorldRef.current.togglePlayPause();
			setIsPaused(newPausedState);
		}
	};

	return (
		<div
			ref={mountRef}
			style={{
				width: '100vw',
				height: '100vh',
				margin: 0,
				padding: 0,
				overflow: 'hidden',
			}}>
			<input
				type="file"
				id="uploadSceneFile"
				accept=".json"
				style={{ display: "none" }}
				onChange={async (e) => {
					const file = e.target.files?.[0];
					if (!file) return;
					const text = await file.text();
					const json = JSON.parse(text);
					marbleWorldRef.current?.importScene(json);
				}}
			/>
			<UtilityButtons
				onImport={() => { 
					const input = document.getElementById('uploadSceneFile') as HTMLInputElement;
					input.click();
				}}
				onExport={() => { exportScene() }}
				onLoad={() => { loadScene() }}
				onClear={() => { marbleWorldRef.current?.clearALL() }}
				onCameraToggle={handleCameraToggle}
				isCameraLocked={isCameraLocked}
			/>
			<ShapeButtons
				marble={(e) => shapeClick('marble', e)}
				plank={(e) => shapeClick('plank', e)}
				cylinder={(e) => shapeClick('cylinder', e)}
				curve={(e) => shapeClick('curve', e)}
				spongebob={(e) => shapeClick('spongebob', e)}
				onPlayPause={handlePlayPause}
				isPaused={isPaused}
			/>
		</div>
	);
}