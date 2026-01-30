import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { initFurnitureSystem } from '../utils/FurnitureSystem';

function ThreeViewer({ modelUrl }) {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!modelUrl || !mountRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(5, 5, 5);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const loader = new GLTFLoader();
        loader.load(modelUrl, (gltf) => {
            const model = gltf.scene;
            scene.add(model);
            
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            
            renderer.render(scene, camera);
        });

        // utils/furnitureSystem.js에서 리턴하는 window 이벤트 제거 함수를 받음
        const cleanupFurniture = initFurnitureSystem(scene, camera, renderer, controls);

        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!mountRef.current) return;
            const newWidth = mountRef.current.clientWidth;
            const newHeight = mountRef.current.clientHeight;
            
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameId);
            
            if (cleanupFurniture) cleanupFurniture();

            controls.dispose();
            renderer.dispose();
            
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            
            scene.traverse((object) => {
                if (!object.isMesh) return;
                object.geometry.dispose();
                if (object.material.isMaterial) {
                    object.material.dispose();
                } else {
                    for (const material of object.material) material.dispose();
                }
            });
        };
    }, [modelUrl]);

    return (
        <div 
            ref={mountRef} 
            className="three-canvas-container"
            style={{ 
                width: '100%', 
                height: '600px', 
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '8px',
                border: '1px solid #ddd'
            }} 
        />
    );
}

export default ThreeViewer;