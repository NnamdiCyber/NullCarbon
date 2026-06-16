import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletConnectComponent } from '../wallet/wallet-connect.component';
import { CreditPortfolioComponent, Credit } from '../../shared/services/registry.service';

@Component({
  selector: 'app-retirement-flow',
  standalone: true,
  imports: [CommonModule, WalletConnectComponent, CreditPortfolioComponent],
  template: `
    <div class="retirement-flow">
      <h1>Retire Carbon Credits</h1>
      <p class="subtitle">Generate a zero-knowledge proof and retire credits on Stellar.</p>

      <div class="layout">
        <aside class="sidebar">
          <app-wallet-connect (walletConnected)="onWalletConnected($event)" />
          <div class="steps">
            <div class="step" [class.active]="currentStep() === 1">1. Configure</div>
            <div class="step" [class.active]="currentStep() === 2">2. Generate Proof</div>
            <div class="step" [class.active]="currentStep() === 3">3. Submit</div>
            <div class="step" [class.active]="currentStep() === 4">4. Certificate</div>
          </div>
        </aside>

        <main class="content">
          <app-credit-portfolio
            [walletAddress]="walletAddress()"
            (creditsSelected)="onCreditsSelected($event)" />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
    .retirement-flow { }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .subtitle { color: #94a3b8; margin-bottom: 2rem; }
    .layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
    }
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .steps {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1rem;
    }
    .step {
      padding: 0.75rem 1rem;
      margin-bottom: 0.5rem;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #64748b;
    }
    .step.active {
      background: #22c55e20;
      color: #22c55e;
      font-weight: 600;
    }
    `,
  ],
})
export class RetirementFlowComponent {
  currentStep = signal(1);
  walletAddress = signal('');
  selectedCredits = signal<Credit[]>([]);

  onWalletConnected(address: string) {
    this.walletAddress.set(address);
  }

  onCreditsSelected(credits: Credit[]) {
    this.selectedCredits.set(credits);
  }
}
