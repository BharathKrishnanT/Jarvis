import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-visualizer3d',
  standalone: true,
  template: `<div #canvasContainer class="w-full h-full min-h-[300px]"></div>`,
  styles: [`:host { display: block; width: 100%; height: 100%; }`]
})
export class Visualizer3dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private coreMesh!: THREE.Mesh;
  private outerRings!: THREE.Group;
  private animationId: number = 0;
  private resizeObserver!: ResizeObserver;

  ngAfterViewInit() {
    // Small delay to let the layout settle mostly
    setTimeout(() => this.initThreeJs(), 50);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThreeJs() {
    if (typeof document === 'undefined') return;
    const container = this.canvasContainer.nativeElement;
    
    // Setup Scene
    this.scene = new THREE.Scene();

    // Setup Camera
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.z = 5;

    // Setup Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Create the "Core"
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00d2ff, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.8 
    });
    this.coreMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.coreMesh);

    // Create orbiting rings
    this.outerRings = new THREE.Group();
    const ringGeo1 = new THREE.RingGeometry(1.5, 1.52, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00d2ff, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    this.outerRings.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(1.8, 1.81, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    this.outerRings.add(ring2);

    this.scene.add(this.outerRings);

    // Animation Loop
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      // Rotate core
      this.coreMesh.rotation.x += 0.005;
      this.coreMesh.rotation.y += 0.01;
      
      // Rotate rings
      this.outerRings.rotation.x -= 0.002;
      this.outerRings.rotation.y -= 0.004;
      this.outerRings.rotation.z += 0.001;

      // Pulse core opacity
      const time = Date.now() * 0.001;
      (this.coreMesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(time * 2) * 0.3;

      this.renderer.render(this.scene, this.camera);
    };
    
    animate();

    // Handle Resize
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target === container) {
            const width = container.clientWidth;
            const height = container.clientHeight;
            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
          }
        }
      });
      this.resizeObserver.observe(container);
    }
  }
}
