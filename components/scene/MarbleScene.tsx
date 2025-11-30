'use client';

import { useEffect, useRef } from 'react';
import ShapeButtons from '../ui/shape-buttons';
import UtilityButtons from '../ui/utility-buttons';
import { MarbleWorld } from '../../core/MarbleWorld';

export default function MarbleScene() {
	const mountRef = useRef<HTMLDivElement>(null);
	const marbleWorldRef = useRef<MarbleWorld | null>(null);

	useEffect(() => {
		if (!mountRef.current) return;

		// Create Marble World
		const marbleWorld = new MarbleWorld();
		marbleWorldRef.current = marbleWorld;
		mountRef.current.appendChild(marbleWorld.getDomElement());
		marbleWorld.animate();

		return () => {
			if (mountRef.current) {
				mountRef.current.removeChild(marbleWorld.getDomElement());
			}
			marbleWorld.dispose();
		};
	}, []);

	const loadAndDragModel = (modelPath: string, event: React.MouseEvent) => {
		if (marbleWorldRef.current) {
			marbleWorldRef.current.getInputSystem().loadAndDragModel(modelPath, event.nativeEvent);
		}
	};

	// Shape button handlers
	const handleMarble = (event: React.MouseEvent) => {
		loadAndDragModel('/models/marble.glb', event);
	};

	const handlePlank = (event: React.MouseEvent) => {
		loadAndDragModel('/models/plank.glb', event);
	};

	const handleCylinder = (event: React.MouseEvent) => {
		loadAndDragModel('/models/cylinder.glb', event);
	};

	const handleCurve = (event: React.MouseEvent) => {
		loadAndDragModel('/models/curve.glb', event);
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
			<UtilityButtons
				onImport={() => { }}
				onExport={() => { }}
				onLoad={() => { }}
				onClear={() => { }}
			/>
			<ShapeButtons
				marble={handleMarble}
				plank={handlePlank}
				cylinder={handleCylinder}
				curve={handleCurve}
			/>
		</div>
	);
} 