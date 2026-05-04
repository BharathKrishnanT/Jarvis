import { Injectable, signal } from '@angular/core';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  tasks = signal<Task[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jarvis-tasks', JSON.stringify(this.tasks()));
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('jarvis-tasks');
      if (stored) {
        try {
          const parsed = JSON.parse(stored).map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt)
          }));
          this.tasks.set(parsed);
        } catch (e) {
          console.error('Failed to load tasks', e);
        }
      } else {
        // Initial dummy data
        this.tasks.set([
          {
            id: crypto.randomUUID(),
            title: 'Initialize Core Systems',
            description: 'Ensure memory and networking nodes are active.',
            status: 'completed',
            priority: 'high',
            createdAt: new Date()
          },
          {
            id: crypto.randomUUID(),
            title: 'Scan Sub-Ether Relays',
            description: 'Check for latency spikes in orbital nodes.',
            status: 'active',
            priority: 'medium',
            createdAt: new Date()
          }
        ]);
        this.saveToStorage();
      }
    }
  }

  addTask(partialTask: Pick<Task, 'title' | 'description' | 'priority'>) {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: partialTask.title,
      description: partialTask.description,
      status: 'active',
      priority: partialTask.priority,
      createdAt: new Date()
    };
    this.tasks.update(t => [newTask, ...t]);
    this.saveToStorage();
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>) {
    this.tasks.update(tasks =>
      tasks.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
    this.saveToStorage();
  }

  deleteTask(id: string) {
    this.tasks.update(tasks => tasks.filter(t => t.id !== id));
    this.saveToStorage();
  }
}
