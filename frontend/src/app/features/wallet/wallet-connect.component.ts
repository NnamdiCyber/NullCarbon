import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StellarService } from '../../shared/services/stellar.service';

@Component({
  selector: 'app-wallet-connect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wallet-card">
      <ng-container *ngIf="!connected; else connectedState">
        <button class="connect-btn" (click)="handleConnect()" [disabled]="loading">
          <span class="freighter-icon">▲</span>
          <span>{{ loading ? 'Connecting...' : 'Connect Freighter Wallet' }}</span>
        </button>
        <p class="error" *ngIf="error">{{ error }}</p>
      </ng-container>

      <ng-template #connectedState>
        <div class="wallet-info">
          <span class="status-dot"></span>
          <div class="address-section">
            <span class="label">Connected</span>
            <code class="address">{{ truncatedAddress }}</code>
          </div>
          <span class="balance">{{ balance }} XLM</span>
          <button class="disconnect-btn" (click)="handleDisconnect()">Disconnect</button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
    .wallet-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1rem 1.5rem;
    }
    .connect-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #22c55e;
      color: #0f172a;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      transition: all 0.2s;
      width: 100%;
      justify-content: center;
    }
    .connect-btn:hover:not(:disabled) {
      background: #16a34a;
    }
    .connect-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .freighter-icon {
      font-size: 1.2rem;
    }
    .wallet-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .status-dot {
      width: 10px;
      height: 10px;
      background: #22c55e;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .address-section {
      flex: 1;
    }
    .label {
      font-size: 0.75rem;
      color: #94a3b8;
      display: block;
    }
    .address {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #f8fafc;
    }
    .balance {
      color: #22c55e;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .disconnect-btn {
      background: transparent;
      border: 1px solid #ef4444;
      color: #ef4444;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.8rem;
      transition: all 0.2s;
    }
    .disconnect-btn:hover {
      background: #ef4444;
      color: #fff;
    }
    .error {
      color: #ef4444;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }
    `,
  ],
})
export class WalletConnectComponent {
  @Output() walletConnected = new EventEmitter<string>();

  connected = false;
  loading = false;
  error = '';
  address = '';
  balance = '0';

  get truncatedAddress(): string {
    return this.address
      ? `${this.address.slice(0, 4)}...${this.address.slice(-4)}`
      : '';
  }

  constructor(private stellarService: StellarService) {}

  async handleConnect() {
    this.loading = true;
    this.error = '';
    try {
      this.address = await this.stellarService.connect();
      this.connected = true;
      this.balance = await this.stellarService.getXlmBalance();
      this.walletConnected.emit(this.address);
    } catch {
      this.error = 'Freighter not detected. Install from freighter.app';
    } finally {
      this.loading = false;
    }
  }

  handleDisconnect() {
    this.stellarService.disconnect();
    this.connected = false;
    this.address = '';
    this.balance = '0';
  }
}
