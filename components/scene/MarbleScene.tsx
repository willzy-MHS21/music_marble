'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import ShapeButtons from '../ui/shape-buttons';
import UtilityButtons from '../ui/utility-buttons';

export default function MarbleScene() {
	const mountRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
	const planeRef = useRef<THREE.Mesh | null>(null);
	const draggedObjectRef = useRef<THREE.Object3D | null>(null);
	const isDraggingRef = useRef(false);

	useEffect(() => {
		if (!mountRef.current) return;

		// Create the scene
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xffffff);
		sceneRef.current = scene;
		
		// Set up the camera
		const fov = 50;
		const ratio = window.innerWidth / window.innerHeight;
		const zNear = 0.1;
		const zFar = 1000;
		const camera = new THREE.PerspectiveCamera(fov, ratio, zNear, zFar);
		camera.position.set(0, 0, 100);
		cameraRef.current = camera;

		// Set up the renderer and add the canvas
		const renderer = new THREE.WebGLRenderer({antialias: true});
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.0;
		rendererRef.current = renderer;
		mountRef.current.appendChild(renderer.domElement);

		// Set up wall
		const planeGeometry = new THREE.PlaneGeometry(200, 200);
       	const planeMaterial = new THREE.MeshStandardMaterial({color:0xF4D3B0});
		const plane = new THREE.Mesh(planeGeometry, planeMaterial);
		planeRef.current = plane;
		scene.add(plane);

		// Set up lights
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
		directionalLight.position.set(10, 10, 10);
		scene.add(directionalLight);

		// Set up controls
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.minDistance = 10;
		controls.maxDistance = 100;
		controls.minAzimuthAngle = -(Math.PI / 2) + 0.1;
		controls.maxAzimuthAngle = (Math.PI / 2) - 0.1;
		controls.minPolarAngle = 0.1;
		controls.maxPolarAngle = Math.PI - 0.1;
		controlsRef.current = controls;

		// Mouse event handlers for dragging
		const onMouseMove = (event: MouseEvent) => {
			if (!isDraggingRef.current || !draggedObjectRef.current) return;
			if (!cameraRef.current || !planeRef.current) return;

			// Disable orbit controls while dragging
			if (controlsRef.current) {
				controlsRef.current.enabled = false;
			}

			// Calculate mouse position in normalized device coordinates
			const mouse = new THREE.Vector2();
			mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

			// Update the raycaster
			raycasterRef.current.setFromCamera(mouse, cameraRef.current);

			// Find intersection with the plane
			const intersects = raycasterRef.current.intersectObject(planeRef.current);
			
			if (intersects.length > 0) {
				const point = intersects[0].point;
				draggedObjectRef.current.position.set(point.x, point.y, point.z + 1);
			}
		};

		const onMouseUp = () => {
			if (isDraggingRef.current) {
				isDraggingRef.current = false;
				draggedObjectRef.current = null;
				
				// Re-enable orbit controls
				if (controlsRef.current) {
					controlsRef.current.enabled = true;
				}
			}
		};

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);

		// Animation loop
		const animate = () => {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};

		animate();

		// Handle window resize
		const handleResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', handleResize);

		// Cleanup
		return () => {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
			mountRef.current?.removeChild(renderer.domElement);
			renderer.dispose();
		};
	}, []);

	// Load and start dragging a model
	const loadAndDragModel = (modelPath: string, event: React.MouseEvent) => {
		if (!sceneRef.current || !cameraRef.current || !planeRef.current) return;

		// Calculate mouse position in normalized device coordinates
		const mouse = new THREE.Vector2();
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		// Get initial position using raycaster
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
				
				draggedObjectRef.current = model;
				isDraggingRef.current = true;
			},
			undefined,
			(error) => {
				console.error(`Error loading model from ${modelPath}:`, error);
			}
		);
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