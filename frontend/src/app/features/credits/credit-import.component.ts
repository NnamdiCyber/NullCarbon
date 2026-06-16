import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-credit-import',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="import-card">
      <h3>Import Carbon Credits</h3>
      <p>Sync credits from connected registries to view your portfolio.</p>
      <button class="import-btn" (click)="handleImport()">
        Sync from Verra & Gold Standard
      </button>
    </div>
  `,
  styles: [
    `
    .import-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }
    h3 {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }
    p {
      color: #94a3b8;
      font-size: 0.9rem;
      margin-bottom: 1.25rem;
    }
    .import-btn {
      background: #3b82f6;
      color: #fff;
      border: none;
      padding: 0.7rem 1.5rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      transition: background 0.2s;
    }
    .import-btn:hover {
      background: #2563eb;
    }
    `,
  ],
})
export class CreditImportComponent {
  handleImport() {
    console.log('Importing credits...');
  }
}
