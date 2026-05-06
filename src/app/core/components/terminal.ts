import { Component, ElementRef, ViewChild, inject, AfterViewChecked, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { JarvisService } from '../services/jarvis.service';

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex flex-col h-full bg-[#0a0a0a]/80 backdrop-blur-md border border-[#141414] rounded-sm font-mono relative overflow-hidden">
      <!-- Terminal Header -->
      <div class="px-4 py-2 border-b border-[#222] bg-[#111] flex justify-between items-center text-xs tracking-widest text-[#00d2ff]">
        <span class="opacity-70">CORE.TERMINAL_ACTIVE</span>
        <span class="opacity-40">SESSION_ID: {{sessionId}}</span>
      </div>
      
      <!-- Terminal Output -->
      <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-4 text-sm scrollbar-thin">
        @for (msg of jarvis.messages(); track $index) {
          <div class="flex flex-col animate-fade-in" [ngClass]="{
            'text-[#00d2ff] opacity-90': msg.role === 'system',
            'text-white': msg.role === 'user',
            'text-[#a0a0a0]': msg.role === 'assistant'
          }">
            <div class="text-[10px] opacity-50 tracking-wider mb-1 uppercase">{{msg.role}} // {{msg.timestamp | date:'HH:mm:ss.SSS'}}</div>
            <div class="whitespace-pre-wrap pl-2 border-l-2" [ngClass]="{
              'border-[#00d2ff]/30': msg.role === 'system',
              'border-white/20': msg.role === 'user',
              'border-[#a0a0a0]/20': msg.role === 'assistant'
            }">
              {{msg.content}}
            </div>
          </div>
        }
      </div>

      <!-- Status Indicator -->
      @if (jarvis.isProcessing()) {
        <div class="px-4 py-2 text-[#00d2ff] bg-[#00d2ff]/10 text-xs font-mono tracking-wider animate-pulse flex items-center gap-2 border-t border-b border-[#00d2ff]/20">
          <span class="inline-block w-2 h-2 bg-[#00d2ff]"></span>
          {{jarvis.currentThought() || 'PROCESSING...'}}
        </div>
      } @else if (isListening && !jarvis.isSpeaking()) {
        <div class="px-4 py-2 text-red-500 bg-red-500/10 text-xs font-mono tracking-wider flex items-center gap-2 border-t border-b border-red-500/20">
          <div class="flex items-end gap-[3px] h-3">
            <div class="w-1 h-1.5 bg-red-500 animate-[bounce_1s_infinite_0ms]"></div>
            <div class="w-1 h-3 bg-red-500 animate-[bounce_1s_infinite_100ms]"></div>
            <div class="w-1 h-2 bg-red-500 animate-[bounce_1s_infinite_200ms]"></div>
            <div class="w-1 h-2.5 bg-red-500 animate-[bounce_1s_infinite_300ms]"></div>
          </div>
          [VOICE UPLINK ACTIVE] AWAITING AUDIO...
        </div>
      }

      <!-- Terminal Input -->
      <div class="p-2 border-t border-[#222] bg-[#111] flex items-center relative gap-2">
        <span class="text-[#00d2ff] opacity-70 ml-2">></span>
        <input 
          type="text" 
          [formControl]="inputCtrl" 
          (keydown.enter)="submit()"
          class="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm px-2 focus:ring-0 placeholder-[#333]" 
          placeholder="Enter directive..."
          [attr.disabled]="jarvis.isProcessing() ? true : null"
        />
        <input type="file" #fileInput (change)="onFileSelected($event)" class="hidden" accept=".txt,.json,.md,.csv" />
        <button 
          (click)="fileInput.click()" 
          class="w-8 h-8 shrink-0 flex items-center justify-center rounded-sm transition-colors text-[#555] hover:text-[#00d2ff] bg-[#222]"
          title="Upload Document"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        </button>
        <button 
          (click)="toggleListening()" 
          class="w-8 h-8 shrink-0 flex items-center justify-center rounded-sm transition-colors mr-1"
          [ngClass]="isAlwaysListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-[#555] hover:text-[#00d2ff] bg-[#222]'"
          title="Toggle Always-Listening Wake Word"
        >
          <!-- Mic Icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10"/><path d="m9 22 6-6"/><path d="M12 2A4 4 0 0 0 8 6v6a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .scrollbar-thin::-webkit-scrollbar { width: 4px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #333; }
  `]
})
export class TerminalComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  
  jarvis = inject(JarvisService);
  cdr = inject(ChangeDetectorRef);
  inputCtrl = new FormControl('');
  sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();

  isAlwaysListening = false;
  isListening = false;
  recognition: any;

  constructor() {
    this.initSpeechRecognition();
  }

  ngOnDestroy() {
    if (this.recognitionTimer) clearInterval(this.recognitionTimer);
    if (this.recognition) {
       this.isAlwaysListening = false;
       this.recognition.stop();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      await this.jarvis.uploadFile(file);
      // reset the input
      input.value = '';
    }
  }

  private scrollToBottom() {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  submit() {
    const val = this.inputCtrl.value;
    if (val) {
      this.jarvis.processInput(val);
      this.inputCtrl.setValue('');
    }
  }

  recognitionTimer: any;

  initSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.cdr.detectChanges();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Show what's being said in the input bar
        this.inputCtrl.setValue((interimTranscript || finalTranscript).trim());

        if (finalTranscript) {
          let command = finalTranscript.trim();
          
          // Optional wake-word removal if they still use it
          if (command.toLowerCase().startsWith('jarvis')) {
            command = command.substring(6).trim();
          } else if (command.toLowerCase().startsWith('wake up')) {
            command = command.substring(7).trim();
          }

          if (command) {
             this.inputCtrl.setValue(command);
             this.submit();
          }
        }
        
        this.cdr.detectChanges();
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          this.isListening = false;
          this.isAlwaysListening = false;
        }
        this.cdr.detectChanges();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.cdr.detectChanges();
      };

      // Poll to keep recognition alive if always listening and not busy
      this.recognitionTimer = setInterval(() => {
        if (this.isAlwaysListening && !this.isListening && !this.jarvis.isProcessing() && !this.jarvis.isSpeaking()) {
            try { this.recognition.start(); } catch(e) {}
        }
        // If we are listening, but jarvis starts speaking, stop it.
        if (this.isListening && (this.jarvis.isProcessing() || this.jarvis.isSpeaking())) {
            try { this.recognition.stop(); } catch(e) {}
        }
      }, 500);
    }
  }

  toggleListening() {
    if (!this.recognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    
    this.isAlwaysListening = !this.isAlwaysListening;
    
    if (this.isAlwaysListening) {
      try { this.recognition.start(); } catch(e) {}
    } else {
      this.recognition.stop();
    }
  }
}

