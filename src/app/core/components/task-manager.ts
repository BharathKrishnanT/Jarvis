import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService, Task } from '../services/task.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full font-mono text-sm border border-[#222] bg-[#0a0a0a]/80 backdrop-blur-md">
      <!-- Header -->
      <div class="px-4 py-2 border-b border-[#222] flex justify-between items-center text-[#e0e0e0] font-mono tracking-widest text-xs uppercase bg-[#111]">
        <span>[ACTIVE DIRECTIVES]</span>
        <button (click)="isAdding.set(!isAdding())" class="hover:text-[#00d2ff] transition-colors">
          {{ isAdding() ? '[CANCEL]' : '[+ NEW]' }}
        </button>
      </div>

      <!-- Add Task Form -->
      @if (isAdding()) {
        <div class="p-4 border-b border-[#222] bg-[#111]/50">
          <input [(ngModel)]="newTaskTitle" placeholder="Directive Title..." maxlength="100"
            class="w-full bg-transparent border-b border-[#333] focus:border-[#00d2ff] text-white p-1 mb-2 outline-none text-xs placeholder:text-[#555]">
          <textarea [(ngModel)]="newTaskDesc" placeholder="Description (Optional)..." rows="2"
            class="w-full bg-transparent border-b border-[#333] focus:border-[#00d2ff] text-white p-1 mb-2 outline-none text-xs placeholder:text-[#555] resize-none"></textarea>
          
          <div class="flex gap-2 justify-between items-center mt-2">
             <select [(ngModel)]="newTaskPriority"
              class="bg-transparent text-white border border-[#333] outline-none text-xs p-1 focus:border-[#00d2ff]">
              <option value="low">LOW PRIO</option>
              <option value="medium">MED PRIO</option>
              <option value="high">HIGH PRIO</option>
            </select>
            
            <button (click)="addTask()" [disabled]="!newTaskTitle.trim()"
              class="px-3 py-1 bg-[#222] hover:bg-[#333] hover:text-[#00d2ff] text-white text-xs border border-[#333] disabled:opacity-50">
              INITIALIZE
            </button>
          </div>
        </div>
      }

      <!-- Task List -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#333] p-2 space-y-2">
        @if (taskService.tasks().length === 0) {
          <div class="text-center text-[#555] py-8 text-xs italic">No active directives.</div>
        }
        @for (task of taskService.tasks(); track task.id) {
          <div class="border border-[#222] p-3 text-xs bg-[#0b0b0b] hover:border-[#333] hover:bg-[#111] transition-all duration-500 group group/item" [class.opacity-50]="task.status === 'completed'">
            <div class="flex justify-between items-start mb-2">
              <div class="flex items-center gap-2">
                <button (click)="toggleStatus(task)" class="w-3.5 h-3.5 shrink-0 border border-[#555] hover:border-[#00d2ff] rounded-sm flex items-center justify-center transition-colors">
                  <div class="w-2 h-2 bg-[#00d2ff] transition-transform duration-300 transform origin-center"
                       [class.scale-0]="task.status !== 'completed'"
                       [class.scale-100]="task.status === 'completed'"></div>
                </button>
                <span class="font-bold tracking-wide relative inline-block transition-colors duration-300" 
                      [ngClass]="{'text-[#555]': task.status === 'completed', 'text-[#00d2ff]': task.status === 'active'}">
                  {{task.title}}
                  <span class="absolute left-0 top-1/2 h-[1.5px] bg-[#555] transition-all duration-300 ease-out pointer-events-none"
                        [class.w-0]="task.status === 'active'"
                        [class.w-full]="task.status === 'completed'"></span>
                </span>
              </div>
              
              <div class="flex items-center gap-2">
                 <select [ngModel]="task.priority" (ngModelChange)="updatePriority(task, $event)"
                    class="bg-transparent text-white border-0 outline-none text-[10px] p-0 font-mono tracking-wider"
                    [ngClass]="{
                      'text-red-400': task.priority === 'high',
                      'text-yellow-400': task.priority === 'medium',
                      'text-green-400': task.priority === 'low'
                    }">
                    <option value="low" class="bg-[#111] text-green-400">LOW</option>
                    <option value="medium" class="bg-[#111] text-yellow-400">MED</option>
                    <option value="high" class="bg-[#111] text-red-400">HIGH</option>
                  </select>
                <button (click)="deleteTask(task.id)" class="text-[#555] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  [X]
                </button>
              </div>
            </div>
            
            @if (task.description) {
              <div class="text-[#888] pl-5 pr-2 mb-2 line-clamp-2 hover:line-clamp-none">
                {{task.description}}
              </div>
            }
            
            <div class="flex justify-between items-center text-[9px] text-[#444] pl-5 mt-1 border-t border-[#1a1a1a] pt-1">
              <span>ID: {{task.id.substring(0,8)}}</span>
              <span>{{task.createdAt | date:'shortTime'}}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class TaskManagerComponent {
  taskService = inject(TaskService);
  
  isAdding = signal(false);
  newTaskTitle = '';
  newTaskDesc = '';
  newTaskPriority: 'low' | 'medium' | 'high' = 'medium';

  addTask() {
    if (this.newTaskTitle.trim()) {
      this.taskService.addTask({
        title: this.newTaskTitle.trim(),
        description: this.newTaskDesc.trim(),
        priority: this.newTaskPriority
      });
      this.newTaskTitle = '';
      this.newTaskDesc = '';
      this.newTaskPriority = 'medium';
      this.isAdding.set(false);
    }
  }

  toggleStatus(task: Task) {
    this.taskService.updateTask(task.id, {
      status: task.status === 'active' ? 'completed' : 'active'
    });
  }

  updatePriority(task: Task, priority: 'low' | 'medium' | 'high') {
    this.taskService.updateTask(task.id, { priority });
  }

  deleteTask(id: string) {
    this.taskService.deleteTask(id);
  }
}
