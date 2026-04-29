import { Injectable, signal, computed } from '@angular/core';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

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

const internetSearchDef = {
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

const fileSearchDef = {
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

const hardwareCommandDef = {
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

const createTaskDef = {
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

const manageTaskDef = {
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
  private ai! : any;
  
  public messages = signal<JarvisMessage[]>([]);
  public isProcessing = signal<boolean>(false);
  public currentThought = signal<string>('');
  
  // Storage for uploaded files
  public uploadedFiles = signal<{name: string, content: string}[]>([]);
  
  // Use Local Ollama API (Free Open Source App)
  public useLocalLLM = signal<boolean>(false);
  
  public metrics = signal<SystemMetrics>({
    cpu: 12,
    memory: 45,
    networkLatency: 12,
    temperature: 32,
  });

  constructor() {
    this.addMessage('system', 'INITIALIZING CENTRAL INTELLIGENCE CORE...\nBOOT SEQUENCE COMPLETE.\nAWAITING DIRECTIVE.');
    
    // Attempt init Gemini
    try {
      // @ts-ignore
      let key = "AIzaSyApOAUtowArFpbf9CwlnmMG3gdYE6bLevE";
      this.ai = new GoogleGenAI({ apiKey: key });
    } catch(e) {}

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

  public async uploadFile(file: File) {
    if (!file) return;
    try {
      const text = await file.text();
      this.uploadedFiles.update(files => [...files, { name: file.name, content: text }]);
      this.addMessage('system', `[FILE UPLOADED AND INDEXED] ${file.name}`);
    } catch (err) {
      this.addMessage('system', `[UPLOAD ERROR] Failed to read ${file.name}`);
    }
  }

  public speak(text: string) {
    if (typeof window === 'undefined') return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const ukVoice = voices.find(v => v.lang === 'en-GB' || v.name.includes('UK'));
      if (ukVoice) utterance.voice = ukVoice;
      window.speechSynthesis.speak(utterance);
    }
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

      let finalResponse = '';

      if (this.useLocalLLM()) {
        this.currentThought.set('Engaging Local Open Source LLM (Ollama)...');
        try {
          finalResponse = await this.processWithOllama(text, systemInstruction);
        } catch (e: any) {
          this.addMessage('system', `[WARNING] Local LLM (Ollama) unreachable: ${e.message}. Falling back to Cloud Intelligence Core...`);
          this.useLocalLLM.set(false);
          if (!this.ai) throw new Error('Cloud LLM is also unavailable. Please check your API keys.');
          this.currentThought.set('Engaging Cloud LLM core...');
          finalResponse = await this.processWithGemini(text, systemInstruction);
        }
      } else {
        if (!this.ai) throw new Error('No LLM Provider available (Gemini API missing and Local LLM disabled)');
        this.currentThought.set('Engaging Cloud LLM core...');
        finalResponse = await this.processWithGemini(text, systemInstruction);
      }

      this.addMessage('assistant', finalResponse.trim());
      this.speak(finalResponse.replace(/\[.*?\]/g, '').trim());

    } catch (e: any) {
      this.addMessage('system', `ERROR: ${e.message}\n(Hint: If using Local LLM, ensure Ollama is running on localhost:11434 with llama3)`);
      this.speak('I encountered an error connecting to the intelligence network.');
    } finally {
      this.currentThought.set('');
      this.isProcessing.set(false);
    }
  }

  private mapOllamaTools() {
    return [
      { type: 'function', function: { name: createTaskDef.name, description: createTaskDef.description, parameters: createTaskDef.parameters } },
      { type: 'function', function: { name: manageTaskDef.name, description: manageTaskDef.description, parameters: manageTaskDef.parameters } },
      { type: 'function', function: { name: hardwareCommandDef.name, description: hardwareCommandDef.description, parameters: hardwareCommandDef.parameters } },
      { type: 'function', function: { name: fileSearchDef.name, description: fileSearchDef.description, parameters: fileSearchDef.parameters } },
    ];
  }

  private async processWithOllama(text: string, systemInstruction: string): Promise<string> {
    const history = this.messages()
        .filter(m => m.role !== 'system' || m.content.startsWith('INITIALIZING'))
        .map(m => ({ role: m.role === 'system' ? 'assistant' : m.role, content: m.content }));
    
    // Override first message to be system instruction for ollama format
    const messages = [
      { role: 'system', content: systemInstruction },
      ...history,
      { role: 'user', content: text }
    ];

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3', // commonly available free model
        messages: messages,
        stream: false,
        tools: this.mapOllamaTools()
      })
    });

    if (!response.ok) throw new Error('Local LLM (Ollama) is not reachable.');

    const data = await response.json();
    let finalResponse = '';

    if (data.message?.tool_calls?.length > 0) {
      this.currentThought.set('Executing local tool calls...');
      for (const call of data.message.tool_calls) {
         const args = call.function.arguments;
         finalResponse += this.executeTool(call.function.name, args);
      }
      
      messages.push(data.message); // assistant message with tool calls
      messages.push({
         role: 'tool',
         content: 'Tool execution logs:\n' + finalResponse
      });

      // Fetch follow-up
      const followUp = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          messages: messages,
          stream: false
        })
      });
      const followUpData = await followUp.json();
      finalResponse += '\n' + (followUpData.message?.content || 'Action completed.');
    } else {
      finalResponse = data.message?.content || 'No verbal response generated.';
    }

    return finalResponse;
  }

  private executeTool(name: string, args: any): string {
    if (name === 'fileSearch') {
      const q = args.query.toLowerCase();
      const files = this.uploadedFiles();
      const matches = files.filter(f => f.content.toLowerCase().includes(q) || f.name.toLowerCase().includes(q));
      
      if (matches.length > 0) {
        let result = `\n[SYSTEM] Executed local file search for: ${args.query}.\nFound in ${matches.length} file(s):\n`;
        matches.forEach(m => {
          const index = m.content.toLowerCase().indexOf(q);
          const snippet = index !== -1 
            ? m.content.substring(Math.max(0, index - 50), Math.min(m.content.length, index + 50)) 
            : '';
          result += `- ${m.name}: "...${snippet.replace(/\n/g, ' ')}..."\n`;
        });
        return result;
      } else {
        return `\n[SYSTEM] Executed local file search for: ${args.query}. Found 0 indexed nodes.\n`;
      }
    } else if (name === 'hardwareCommand') {
      return `\n[SYSTEM] Sent MQTT command '${args.action}' to target '${args.target}'.\n`;
    } else if (name === 'createTask') {
      return `\n[SYSTEM] Created new task '${args.taskName}' with priority '${args.priority}'. Task ID: TSK-${Math.floor(Math.random() * 10000)}.\n`;
    } else if (name === 'manageTask') {
      return `\n[SYSTEM] Action '${args.action}' executed on Task ID '${args.taskId}'.\n`;
    }
    return '';
  }

  private async processWithGemini(text: string, systemInstruction: string): Promise<string> {
    const history = this.messages().map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const contents = `${history}\nUSER: ${text}`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents,
      config: {
        systemInstruction,
        tools: [
          { googleSearch: {} },
          { functionDeclarations: [fileSearchDef, hardwareCommandDef, createTaskDef, manageTaskDef] as unknown as FunctionDeclaration[] }
        ],
        toolConfig: { includeServerSideToolInvocations: true },
        temperature: 0.3
      }
    });

    let finalResponse = '';

    if (response.functionCalls && response.functionCalls.length > 0) {
      this.currentThought.set('Executing tool calls...');
      for (const call of response.functionCalls) {
        finalResponse += this.executeTool(call.name, call.args);
      }
      
      const previousContent = response.candidates?.[0]?.content;
      const nextContents: any[] = previousContent ? [previousContent] : [];
      nextContents.push(`[Tool output processed. Reply to the user.]`);

      const secondResponse = await this.ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: nextContents,
        config: { systemInstruction, temperature: 0.3 }
      });
      
      finalResponse += secondResponse.text || 'Action complete.';
    } else {
      finalResponse = response.text || 'No verbal response generated.';
    }

    return finalResponse;
  }
}

