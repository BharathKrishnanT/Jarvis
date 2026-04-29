import {ChangeDetectionStrategy, Component} from '@angular/core';
import { Visualizer3dComponent } from './core/components/visualizer3d';
import { TerminalComponent } from './core/components/terminal';
import { HudComponent } from './core/components/hud';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [Visualizer3dComponent, TerminalComponent, HudComponent],
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
        
        <!-- 3D Visualization -->
        <div class="lg:col-span-2 relative h-[40vh] lg:h-full border border-[#1a1a1a] rounded-sm overflow-hidden bg-[#0a0a0a]/50">
          <!-- Overlays -->
          <div class="absolute top-4 left-4 text-[10px] font-mono text-[#00d2ff] tracking-widest uppercase opacity-60">
            [VIZ_DATAPOINT_RENDER]
          </div>
          <div class="absolute bottom-4 right-4 text-[10px] font-mono text-[#00d2ff] tracking-widest uppercase opacity-60 flex items-center gap-2">
            LAT <span class="w-1 h-1 bg-[#00d2ff] rounded-full animate-ping"></span>
          </div>
          
          <app-visualizer3d></app-visualizer3d>
        </div>

        <!-- Terminal Panel -->
        <div class="lg:col-span-1 h-[40vh] lg:h-full flex flex-col min-h-0">
          <app-terminal class="flex-1 min-h-0"></app-terminal>
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
export class App {}
