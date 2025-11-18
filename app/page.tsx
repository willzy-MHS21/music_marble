'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function Home() {
	const mountRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!mountRef.current) return;

		// Create the scene
		const scene = new THREE.Scene();

		// Set up the camera
		const fov = 75;
		const ratio = window.innerWidth / window.innerHeight;
		const zNear = 1;
		const zFar = 10000;
		const camera = new THREE.PerspectiveCamera(fov, ratio, zNear, zFar);
		camera.position.set(0, 0, 100);

		// Set up the renderer and add the canvas
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		mountRef.current.appendChild(renderer.domElement);

		// Set up lights
		const ambientLight = new THREE.AmbientLight();
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 5.0);
		directionalLight.position.set(10, 100, 10);
		scene.add(directionalLight);

		// Add cube
		const geometry = new THREE.BoxGeometry(20, 20, 20);
		const material = new THREE.MeshLambertMaterial({ color: 0xffffff, wireframe: false });
		const cube = new THREE.Mesh(geometry, material);
		scene.add(cube);

		// Set up controls
		const controls = new OrbitControls(camera, renderer.domElement);

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

	return (
		<div
			ref={mountRef}
			style={{
				width: '100vw',
				height: '100vh',
				margin: 0,
				padding: 0,
				overflow: 'hidden',
				backgroundColor: '#000',
			}}
		/>
	);
}