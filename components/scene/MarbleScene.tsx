'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import UI from '../ui/UI';

export default function MarbleScene() {
	const mountRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!mountRef.current) return;

		// Create the scene
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0x111111);
		
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
		mountRef.current.appendChild(renderer.domElement);

		// Set up wall
		const planeGeometry = new THREE.PlaneGeometry(200, 200);
       	const planeMaterial = new THREE.MeshBasicMaterial( {color:0x222222});
		const plane = new THREE.Mesh(planeGeometry, planeMaterial);
		scene.add(plane);

		// Set up lights
		const ambientLight = new THREE.AmbientLight();
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 5.0);
		directionalLight.position.set(10, 100, 10);
		scene.add(directionalLight);

		// Add cube
		const geometry = new THREE.SphereGeometry( 2, 16, 16);
		const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false });
		const sphere = new THREE.Mesh(geometry, material);
		sphere.position.set(0, 0, 2);
		scene.add(sphere);

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
			geometry.dispose();
			material.dispose();
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
