import {ChangeDetectionStrategy, Component, signal, inject} from '@angular/core';
import { Visualizer3dComponent } from './core/components/visualizer3d';
import { TerminalComponent } from './core/components/terminal';
import { HudComponent } from './core/components/hud';
import { TaskManagerComponent } from './core/components/task-manager';
import { CommonModule } from '@angular/common';
import { JarvisService } from './core/services/jarvis.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [Visualizer3dComponent, TerminalComponent, HudComponent, TaskManagerComponent, CommonModule],
  template: `
    <div class="h-screen w-screen overflow-hidden bg-[#050505] text-[#e0e0e0] font-sans relative flex flex-col p-4 md:p-8">
      
      <!-- Ambient Background Glow -->
      <div class="absolute inset-0 z-0 pointer-events-none" 
        style="background: radial-gradient(circle at 50% 50%, rgba(0, 210, 255, 0.05) 0%, transparent 60%);">
      </div>

      <!-- Header -->
      <header class="z-10 flex justify-between items-end mb-6">
        <div>
          <h1 class="text-3xl font-light tracking-widest text-white">CENTRAL<span class="text-[#00d2ff]">CORE</span></h1>
          <div class="text-[10px] text-[#00d2ff] tracking-[0.3em] uppercase mt-1 opacity-60">Intelligence & Synthesis Protocol</div>
        </div>
        <div class="hidden sm:block text-right">
          <div class="text-[10px] tracking-widest uppercase opacity-40 font-mono">Status: ONLINE</div>
          <div class="text-[10px] tracking-widest uppercase opacity-40 font-mono">Uplink: ESTABLISHED</div>
        </div>
      </header>
      
      <!-- Main Content -->
      <main class="z-10 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 min-h-0">
        
        <!-- 3D Visualization or Media Display -->
        <div class="lg:col-span-2 relative h-[40vh] lg:h-full border border-[#1a1a1a] rounded-sm overflow-hidden bg-[#0a0a0a]/50 flex items-center justify-center">
          <!-- Overlays -->
          <div class="absolute top-4 left-4 text-[10px] font-mono text-[#00d2ff] tracking-widest uppercase opacity-60 z-20">
            [VIZ_DATAPOINT_RENDER]
          </div>
          <div class="absolute bottom-4 right-4 text-[10px] font-mono text-[#00d2ff] tracking-widest uppercase opacity-60 flex items-center gap-2 z-20">
            LAT <span class="w-1 h-1 bg-[#00d2ff] rounded-full animate-ping"></span>
          </div>
          
          @if (jarvis.currentImageUrl()) {
            <div class="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
                <img [src]="jarvis.currentImageUrl()" alt="Visualization" referrerpolicy="no-referrer" class="max-w-full max-h-full object-contain" />
                <button (click)="jarvis.currentImageUrl.set(null)" class="absolute top-4 right-4 text-xs font-mono border border-white/20 bg-black/50 hover:bg-black text-white px-2 py-1 rounded transition-colors backdrop-blur">
                  [DISMISS]
                </button>
            </div>
          } @else {
            <app-visualizer3d class="w-full h-full"></app-visualizer3d>
          }
        </div>

        <!-- Right Panel (Terminal / Tasks) -->
        <div class="lg:col-span-1 h-[40vh] lg:h-full flex flex-col min-h-0">
          <!-- Tabs -->
          <div class="flex gap-1 mb-2 font-mono text-xs tracking-widest uppercase shrink-0">
            <button (click)="activeTab.set('terminal')" 
              class="px-4 py-2 border border-b-0 border border-[#222] transition-colors"
              [ngClass]="activeTab() === 'terminal' ? 'bg-[#111] text-[#00d2ff] border-[#333]' : 'bg-[#0a0a0a]/50 text-[#555] hover:text-white'">
              [TERMINAL]
            </button>
            <button (click)="activeTab.set('tasks')" 
              class="px-4 py-2 border border-b-0 border border-[#222] transition-colors"
              [ngClass]="activeTab() === 'tasks' ? 'bg-[#111] text-[#00d2ff] border-[#333]' : 'bg-[#0a0a0a]/50 text-[#555] hover:text-white'">
              [TASKS]
            </button>
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-h-0 relative">
            <app-terminal class="absolute inset-0" [class.invisible]="activeTab() !== 'terminal'"></app-terminal>
            <app-task-manager class="absolute inset-0" [class.invisible]="activeTab() !== 'tasks'"></app-task-manager>
          </div>
        </div>
      </main>

      <!-- Bottom HUD -->
      <footer class="z-10 mt-6 shrink-0">
        <app-hud></app-hud>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; width: 100vw; overflow: hidden; }
  `]
})
export class App {
  jarvis = inject(JarvisService);
  activeTab = signal<'terminal' | 'tasks'>('terminal');
}
