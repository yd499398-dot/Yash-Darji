
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Scene3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00f2ff, 15);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x7000ff, 15);
    pointLight2.position.set(-5, -5, 2);
    scene.add(pointLight2);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const count = 1000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 15;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x475569,
      transparent: true,
      opacity: 0.5
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Floating Coins (Cylinders)
    const coins: THREE.Mesh[] = [];
    const coinGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 32);
    const coinMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x1e293b, 
      shininess: 100, 
      transparent: true, 
      opacity: 0.3,
      emissive: 0x00f2ff,
      emissiveIntensity: 0.1
    });

    for (let i = 0; i < 15; i++) {
      const coin = new THREE.Mesh(coinGeometry, coinMaterial);
      coin.position.x = (Math.random() - 0.5) * 10;
      coin.position.y = (Math.random() - 0.5) * 10;
      coin.position.z = (Math.random() - 0.5) * 5;
      coin.rotation.x = Math.random() * Math.PI;
      coin.rotation.z = Math.random() * Math.PI;
      scene.add(coin);
      coins.push(coin);
    }

    camera.position.z = 5;

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 0.5;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 0.5;
    };

    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      requestAnimationFrame(animate);

      particles.rotation.y += 0.001;
      
      coins.forEach((coin, i) => {
        coin.rotation.y += 0.01;
        coin.rotation.z += 0.005;
        coin.position.y += Math.sin(Date.now() * 0.001 + i) * 0.002;
      });

      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 1 }} />;
};

export default Scene3D;
