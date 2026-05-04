import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, signal } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { JarvisService } from '../services/jarvis.service';

@Component({
  selector: 'app-visualizer3d',
  standalone: true,
  template: `
    <div class="relative w-full h-full min-h-[300px]">
      <div #canvasContainer class="w-full h-full cursor-pointer" (click)="onCanvasClick($event)" (mousemove)="onCanvasMouseMove($event)"></div>
      
      @if (hoveredObjectName()) {
        <div class="absolute top-4 left-4 border border-[#00d2ff]/30 bg-black/60 backdrop-blur text-[#00d2ff] px-3 py-1 text-xs font-mono rounded">
          TARGET: {{hoveredObjectName()}}
        </div>
      }
      
      @if (lastClickedInfo()) {
        <div class="absolute bottom-4 left-4 border border-[#00d2ff]/50 bg-black/80 backdrop-blur text-white p-3 text-sm font-mono max-w-[250px] shadow-[0_0_15px_rgba(0,210,255,0.2)] rounded">
          <div class="text-[#00d2ff] text-xs mb-1 border-b border-[#00d2ff]/30 pb-1">[SYSTEM SCAN]</div>
          <div>{{lastClickedInfo()}}</div>
          <button (click)="lastClickedInfo.set(null)" class="text-xs text-gray-500 hover:text-[#00d2ff] mt-2 block ml-auto">DISMISS</button>
        </div>
      }
      
      <div class="absolute bottom-4 right-4 flex gap-2">
        @if (saveSuccessMessage()) {
          <span class="text-xs text-green-400 font-mono self-center mr-2 animate-pulse">{{saveSuccessMessage()}}</span>
        }
        <button (click)="saveCameraView()" class="border border-[#333] bg-[#111] hover:bg-[#222] text-xs text-[#00d2ff] p-1 rounded font-mono" title="Save View">
          [SAVE VIEW]
        </button>
        <button (click)="loadCameraView()" class="border border-[#333] bg-[#111] hover:bg-[#222] text-xs text-[#00d2ff] p-1 rounded font-mono" title="Load View">
          [LOAD VIEW]
        </button>
        <button (click)="resetCamera()" class="border border-[#333] bg-[#111] hover:bg-[#222] text-xs text-gray-400 p-1 rounded font-mono" title="Reset View">
          [RESET]
        </button>
      </div>
    </div>
  `,
  styles: [`:host { display: block; width: 100%; height: 100%; }`]
})
export class Visualizer3dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;
  
  jarvis = inject(JarvisService);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  
  private coreMesh!: THREE.Mesh;
  private outerRings!: THREE.Group;
  private animationId: number = 0;
  private resizeObserver!: ResizeObserver;
  
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  
  public hoveredObjectName = signal<string | null>(null);
  public lastClickedInfo = signal<string | null>(null);
  public saveSuccessMessage = signal<string | null>(null);

  ngAfterViewInit() {
    // Small delay to let the layout settle mostly
    setTimeout(() => this.initThreeJs(), 50);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.controls) {
      this.controls.dispose();
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

    // Setup OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = true;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 15;

    // Create the "Core"
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00d2ff, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.8 
    });
    this.coreMesh = new THREE.Mesh(geometry, material);
    this.coreMesh.name = "INTELLIGENCE_CORE";
    this.coreMesh.userData = {
      info: "Central Processing Core: Maintains master state and orchestrates logical routines."
    };
    this.scene.add(this.coreMesh);

    // Create orbiting rings
    this.outerRings = new THREE.Group();
    const ringGeo1 = new THREE.RingGeometry(1.5, 1.52, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00d2ff, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    ring1.name = "ORBITAL_RING_ALPHA";
    ring1.userData = { info: "Alpha Ring: Handles high-speed synchronous communications." };
    this.outerRings.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(1.8, 1.81, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.name = "ORBITAL_RING_BETA";
    ring2.userData = { info: "Beta Ring: Regulates thermal and latency distribution layers." };
    this.outerRings.add(ring2);

    this.scene.add(this.outerRings);

    // Animation Loop
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      this.controls.update();

      // Rotate core
      this.coreMesh.rotation.x += 0.005;
      this.coreMesh.rotation.y += 0.01;
      
      // Rotate rings
      this.outerRings.rotation.x -= 0.002;
      this.outerRings.rotation.y -= 0.004;
      this.outerRings.rotation.z += 0.001;

      // Pulse core opacity if not hovered over
      const time = Date.now() * 0.001;
      if (this.hoveredObjectName() !== this.coreMesh.name) {
        (this.coreMesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(time * 2) * 0.3;
      } else {
        (this.coreMesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
      }

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

  onCanvasMouseMove(event: MouseEvent) {
    if (!this.camera || !this.scene) return;

    this.updatePointerInfo(event);
    
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      const obj = intersects[0].object;
      this.hoveredObjectName.set(obj.name || "UNIDENTIFIED_OBJECT");
      document.body.style.cursor = 'pointer';
    } else {
      this.hoveredObjectName.set(null);
      document.body.style.cursor = 'default';
    }
  }

  onCanvasClick(event: MouseEvent) {
    if (!this.camera || !this.scene) return;

    this.updatePointerInfo(event);
    
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData && obj.userData['info']) {
        this.lastClickedInfo.set(obj.userData['info']);
      } else {
        this.lastClickedInfo.set("No data available for " + (obj.name || "this artifact."));
      }
    }
  }

  private updatePointerInfo(event: MouseEvent) {
    const rect = this.canvasContainer.nativeElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  public resetCamera() {
    if (this.controls && this.camera) {
      this.controls.reset();
      this.camera.position.set(0, 0, 5);
      this.camera.lookAt(0, 0, 0);
    }
  }

  public saveCameraView() {
    if (!this.camera || !this.controls) return;
    const viewConfig = {
      position: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
      target: { x: this.controls.target.x, y: this.controls.target.y, z: this.controls.target.z }
    };
    localStorage.setItem('jarvis-3d-view', JSON.stringify(viewConfig));
    this.saveSuccessMessage.set("VIEW SAVED");
    setTimeout(() => this.saveSuccessMessage.set(null), 2000);
  }

  public loadCameraView() {
    if (!this.camera || !this.controls) return;
    const saved = localStorage.getItem('jarvis-3d-view');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        this.camera.position.set(config.position.x, config.position.y, config.position.z);
        this.controls.target.set(config.target.x, config.target.y, config.target.z);
        this.controls.update();
        this.saveSuccessMessage.set("VIEW LOADED");
        setTimeout(() => this.saveSuccessMessage.set(null), 2000);
      } catch (e) {
        console.error("Failed to load view config", e);
      }
    } else {
        this.saveSuccessMessage.set("NO SAVED VIEW");
        setTimeout(() => this.saveSuccessMessage.set(null), 2000);
    }
  }
}
