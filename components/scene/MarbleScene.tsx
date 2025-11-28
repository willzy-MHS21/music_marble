'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import UI from '../ui/UI';

export default function MarbleScene() {
	const mountRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!mountRef.current) return;

		// Create the scene
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xffffff);
		
		// Set up the camera
		const fov = 50;
		const ratio = window.innerWidth / window.innerHeight;
		const zNear = 0.1;
		const zFar = 1000;
		const camera = new THREE.PerspectiveCamera(fov, ratio, zNear, zFar);
		camera.position.set(0, 0, 100);

		// Set up the renderer and add the canvas
		const renderer = new THREE.WebGLRenderer({antialias: true});
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.0;
		mountRef.current.appendChild(renderer.domElement);

		// Set up wall
		const planeGeometry = new THREE.PlaneGeometry(200, 200);
       	const planeMaterial = new THREE.MeshStandardMaterial( {color:0xF4D3B0});
		const plane = new THREE.Mesh(planeGeometry, planeMaterial);
		scene.add(plane);

		// Set up lights
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
		directionalLight.position.set(10, 10, 10);
		scene.add(directionalLight);

		// Load marble model
		const loader = new GLTFLoader();
		loader.load(
			'/models/cylinder.glb',
			(gltf) => {
				const marble = gltf.scene;
				marble.position.set(0, 0, 2);

				marble.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						if (child.material) {
							if (child.material instanceof THREE.MeshStandardMaterial) {
								child.material.roughness = 0.1;
							}
						}
					}
				});

				scene.add(marble);
			},
			undefined,
			(error) => {
				console.error('Error loading marble model:', error);
			}
		);

		// Set up controls
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.minDistance = 10;
		controls.maxDistance = 100;
		controls.minAzimuthAngle = -(Math.PI / 2) + 0.1;
		controls.maxAzimuthAngle = (Math.PI / 2) - 0.1;
		controls.minPolarAngle = 0.1;
		controls.maxPolarAngle = Math.PI - 0.1;

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
			mountRef.current?.removeChild(renderer.domElement);
			renderer.dispose();
		};
	}, []);

	// handle drop ball
	const handleDropBall = () => {
		console.log("ball drop");
	}

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
			<UI
				onDropBall={handleDropBall}
				onImport={() => { }}
				onExport={() => { }}
				onLoad={() => { }}
				onClear={() => { }}
				noteBlock={() => { }}
				track={() => { }}
			/>
		</div>
	);
}