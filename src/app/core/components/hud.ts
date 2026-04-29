import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JarvisService } from '../services/jarvis.service';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full font-mono">
      <div class="bg-[#0a0a0a]/80 backdrop-blur-md border border-[#222] p-4 flex flex-col items-center justify-center">
        <span class="text-[10px] text-[#00d2ff] tracking-[0.2em] opacity-70 mb-2 uppercase">Core Load</span>
        <div class="text-3xl font-light text-white">{{ jarvis.metrics().cpu | number:'1.0-0' }}<span class="text-sm text-[#555]">%</span></div>
        <div class="w-full h-1 bg-[#222] mt-3">
          <div class="h-full bg-[#00d2ff] transition-all duration-1000 ease-in-out" [style.width.%]="jarvis.metrics().cpu"></div>
        </div>
      </div>
      
      <div class="bg-[#0a0a0a]/80 backdrop-blur-md border border-[#222] p-4 flex flex-col items-center justify-center">
        <span class="text-[10px] text-[#00d2ff] tracking-[0.2em] opacity-70 mb-2 uppercase">Memory</span>
        <div class="text-3xl font-light text-white">{{ jarvis.metrics().memory | number:'1.0-0' }}<span class="text-sm text-[#555]">%</span></div>
        <div class="w-full h-1 bg-[#222] mt-3">
          <div class="h-full bg-[#00d2ff] transition-all duration-1000 ease-in-out" [style.width.%]="jarvis.metrics().memory"></div>
        </div>
      </div>

      <div class="bg-[#0a0a0a]/80 backdrop-blur-md border border-[#222] p-4 flex flex-col items-center justify-center">
        <span class="text-[10px] text-[#00d2ff] tracking-[0.2em] opacity-70 mb-2 uppercase">Latency</span>
        <div class="text-3xl font-light text-white">{{ jarvis.metrics().networkLatency | number:'1.0-0' }}<span class="text-sm text-[#555]">ms</span></div>
        <div class="w-full h-1 bg-[#222] mt-3">
          <div class="h-full bg-[#00d2ff] transition-all duration-1000 ease-in-out" [style.width.%]="jarvis.metrics().networkLatency"></div>
        </div>
      </div>

      <div class="bg-[#0a0a0a]/80 backdrop-blur-md border border-[#222] p-4 flex flex-col items-center justify-center">
        <span class="text-[10px] text-[#00d2ff] tracking-[0.2em] opacity-70 mb-2 uppercase">Core Temp</span>
        <div class="text-3xl font-light text-white" [ngClass]="{'text-red-400': jarvis.metrics().temperature > 80}">
          {{ jarvis.metrics().temperature | number:'1.0-0' }}<span class="text-sm text-[#555]">°C</span>
        </div>
        <div class="w-full h-1 bg-[#222] mt-3">
          <div class="h-full transition-all duration-1000 ease-in-out" 
            [ngClass]="jarvis.metrics().temperature > 80 ? 'bg-red-500' : 'bg-[#00d2ff]'" 
            [style.width.%]="jarvis.metrics().temperature"></div>
        </div>
      </div>
    </div>
  `
})
export class HudComponent {
  jarvis = inject(JarvisService);
}
