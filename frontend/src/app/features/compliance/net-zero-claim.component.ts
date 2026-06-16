import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-net-zero-claim',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="claim-card">
      <h2>Net-Zero Compliance Claim</h2>
      <p>Generate a zero-knowledge compliance proof for a reporting period.</p>
      <button class="claim-btn" (click)="generateClaim()">
        Generate Compliance Proof
      </button>
    </div>
  `,
  styles: [
    `
    .claim-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
    }
    h2 { font-size: 1.3rem; margin-bottom: 0.5rem; }
    p { color: #94a3b8; margin-bottom: 1.5rem; }
    .claim-btn {
      background: #22c55e;
      color: #0f172a;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-weight: 600;
    }
    `,
  ],
})
export class NetZeroClaimComponent {
  generateClaim() {
    console.log('Generating compliance claim...');
  }
}
