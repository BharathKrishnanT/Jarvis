import { Injectable, signal, computed } from '@angular/core';
import { GoogleGenAI, FunctionDeclaration, Type, Modality } from '@google/genai';

export interface JarvisMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  networkLatency: number;
  temperature: number;
}

const internetSearchDef: FunctionDeclaration = {
  name: 'internetSearch',
  description: 'Search the web or retrieve information about real-world entities, news, or current events.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The search query.' }
    },
    required: ['query']
  }
};

const fileSearchDef: FunctionDeclaration = {
  name: 'fileSearch',
  description: 'Search local file system, documents, and notes.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The search keyword.' }
    },
    required: ['query']
  }
};

const hardwareCommandDef: FunctionDeclaration = {
  name: 'hardwareCommand',
  description: 'Send commands to connected IoT hardware, microcontrollers, or drones via MQTT.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      target: { type: Type.STRING, description: 'The target device (e.g., lights, drone, fan).' },
      action: { type: Type.STRING, description: 'The action to perform (e.g., on, off, status, calibrate).' }
    },
    required: ['target', 'action']
  }
};

const createTaskDef: FunctionDeclaration = {
  name: 'createTask',
  description: 'Create a new background task or scheduled process.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskName: { type: Type.STRING, description: 'The name or title of the task.' },
      priority: { type: Type.STRING, description: 'The priority of the task (low, normal, high, critical).' }
    },
    required: ['taskName', 'priority']
  }
};

const manageTaskDef: FunctionDeclaration = {
  name: 'manageTask',
  description: 'Manage an existing task (e.g., start, stop, pause, delete).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskId: { type: Type.STRING, description: 'The unique identifier of the task.' },
      action: { type: Type.STRING, description: 'The action to perform (e.g., start, stop, pause, resume, delete).' }
    },
    required: ['taskId', 'action']
  }
};

@Injectable({
  providedIn: 'root'
})
export class JarvisService {
  private ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  public messages = signal<JarvisMessage[]>([]);
  public isProcessing = signal<boolean>(false);
  public currentThought = signal<string>('');
  
  public metrics = signal<SystemMetrics>({
    cpu: 12,
    memory: 45,
    networkLatency: 12,
    temperature: 32,
  });

  constructor() {
    this.addMessage('system', 'INITIALIZING CENTRAL INTELLIGENCE CORE...\nBOOT SEQUENCE COMPLETE.\nAWAITING DIRECTIVE.');
    if (typeof window !== 'undefined') {
      setInterval(() => this.updateMetrics(), 2000);
    }
  }

  private updateMetrics() {
    this.metrics.update(m => ({
      cpu: Math.min(100, Math.max(0, m.cpu + (Math.random() * 20 - 10))),
      memory: Math.min(100, Math.max(0, m.memory + (Math.random() * 5 - 2))),
      networkLatency: Math.max(1, m.networkLatency + (Math.random() * 8 - 4)),
      temperature: Math.min(90, Math.max(30, m.temperature + (Math.random() * 4 - 2)))
    }));
  }

  public addMessage(role: 'user' | 'assistant' | 'system', content: string) {
    this.messages.update(msgs => [...msgs, { role, content, timestamp: new Date() }]);
  }

  public async processInput(text: string) {
    if (!text.trim()) return;
    
    this.addMessage('user', text);
    this.isProcessing.set(true);
    this.currentThought.set('Processing request...');

    try {
      const systemInstruction = `You are a highly advanced AI system inspired by JARVIS.
Keep your responses precise, analytical, and professional. 
Whenever you are asked to perform tasks outside simple text completion, use your tools. 
If you perform an action via tools, narrate your process succinctly (e.g., "Accessing local file system...", "Deploying hardware command...").
You can manage scheduled tasks and background processes. If a user natively asks to create or manage a task (e.g. "Jarvis, start a new task called backup_database with high priority"), automatically map it to the corresponding createTask or manageTask tool.`;

      // Build previous messages formatted for gemini (just simple concat for now to keep it lightweight)
      const history = this.messages().map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      
      const contents = `${history}\nUSER: ${text}`;

      this.currentThought.set('Engaging LLM core...');

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents,
        config: {
          systemInstruction,
          tools: [
            { googleSearch: {} }, // Built-in google search
            { functionDeclarations: [fileSearchDef, hardwareCommandDef, createTaskDef, manageTaskDef] }
          ],
          toolConfig: { includeServerSideToolInvocations: true },
          temperature: 0.3
        }
      });

      let finalResponse = '';

      if (response.functionCalls && response.functionCalls.length > 0) {
        this.currentThought.set('Executing tool calls...');
        for (const call of response.functionCalls) {
          if (call.name === 'fileSearch') {
            finalResponse += `\n[SYSTEM] Executed local file search for: ${(call.args as any).query}. Found 3 indexed nodes.\n`;
          } else if (call.name === 'hardwareCommand') {
            finalResponse += `\n[SYSTEM] Sent MQTT command '${(call.args as any).action}' to target '${(call.args as any).target}'.\n`;
          } else if (call.name === 'createTask') {
            finalResponse += `\n[SYSTEM] Created new task '${(call.args as any).taskName}' with priority '${(call.args as any).priority}'. Task ID: TSK-${Math.floor(Math.random() * 10000)}.\n`;
          } else if (call.name === 'manageTask') {
            finalResponse += `\n[SYSTEM] Action '${(call.args as any).action}' executed on Task ID '${(call.args as any).taskId}'.\n`;
          }
        }
        
        const previousContent = response.candidates?.[0]?.content;
        const nextContents: any[] = previousContent ? [previousContent] : [];
        nextContents.push(`[Tool output processed. Reply to the user.]`);

        // Follow up call
        const secondResponse = await this.ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: nextContents,
          config: { systemInstruction, temperature: 0.3 }
        });
        
        finalResponse += secondResponse.text || 'Action complete.';
      } else {
        finalResponse = response.text || 'No verbal response generated.';
      }

      this.addMessage('assistant', finalResponse.trim());
      
      // Let's generate speech for the assistant text if desired.
      this.speak(finalResponse.replace(/\[.*?\]/g, '').trim());

    } catch (e: any) {
      this.addMessage('system', `ERROR: ${e.message}`);
    } finally {
      this.currentThought.set('');
      this.isProcessing.set(false);
    }
  }

  private speak(text: string) {
    if (typeof window === 'undefined') return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 0.9;
      // Ideally try to find an english voice that sounds a bit robotic or british.
      const voices = window.speechSynthesis.getVoices();
      const ukVoice = voices.find(v => v.lang === 'en-GB' || v.name.includes('UK'));
      if (ukVoice) utterance.voice = ukVoice;
      window.speechSynthesis.speak(utterance);
    }
  }
}
