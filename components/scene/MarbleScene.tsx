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

	const shapeClick = (shapeType: string, event: React.MouseEvent) => {
		if (marbleWorldRef.current) {
			marbleWorldRef.current.ShapeButtonClick(shapeType, event.nativeEvent);
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
			<UtilityButtons
				onImport={() => { /*Todo */ }}
				onExport={() => { /*Todo */ }}
				onLoad={() => { /*Todo */ }}
				onClear={() => { /*Todo */ }}
				onCameraToggle={() => { /*Todo */ }}
			/>
			<ShapeButtons
				marble={(e) => shapeClick('marble', e)}
				plank={(e) => shapeClick('plank', e)}
				cylinder={(e) => shapeClick('cylinder', e)}
				curve={(e) => shapeClick('curve', e)}
			/>
		</div>
	);
} 