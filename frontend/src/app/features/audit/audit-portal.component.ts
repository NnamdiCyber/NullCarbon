import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CertificateService, Certificate } from '../../shared/services/certificate.service';

@Component({
  selector: 'app-audit-portal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audit-portal">
      <h1>Audit Portal</h1>
      <p class="subtitle">Public retirement certificate verification — no wallet required.</p>

      <div class="search-bar">
        <input
          type="text"
          placeholder="Enter Certificate ID (CERT-...) or Nullifier (0x...)"
          #searchInput
          (keyup.enter)="search(searchInput.value)" />
        <button (click)="search(searchInput.value)">Search</button>
      </div>

      <div class="result" *ngIf="certificate">
        <div class="certificate-card">
          <div class="cert-header">
            <span class="shield">✓</span>
            <div>
              <h3>{{ certificate.certificateId }}</h3>
              <span class="status verified">Verified On-Chain ✓</span>
            </div>
          </div>

          <div class="details">
            <div class="row">
              <span class="label">Nullifier</span>
              <code class="value mono">{{ certificate.nullifier }}</code>
            </div>
            <div class="row">
              <span class="label">Corridor</span>
              <span class="value">{{ certificate.corridorId || '—' }}</span>
            </div>
            <div class="row">
              <span class="label">Timestamp</span>
              <span class="value">{{ certificate.timestamp || '—' }}</span>
            </div>
            <div class="row">
              <span class="label">Ledger</span>
              <span class="value">{{ certificate.ledger || '—' }}</span>
            </div>
          </div>

          <a *ngIf="certificate.stellarTxHash" class="explorer-link"
             [href]="'https://stellar.expert/explorer/testnet/tx/' + certificate.stellarTxHash"
             target="_blank">
            View on Stellar Explorer →
          </a>
        </div>
      </div>

      <div class="not-found" *ngIf="searched && !certificate">
        <p>No certificate found. Try a different ID or nullifier.</p>
      </div>
    </div>
  `,
  styles: [
    `
    .audit-portal { max-width: 800px; margin: 0 auto; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .subtitle { color: #94a3b8; margin-bottom: 2rem; }
    .search-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    .search-bar input {
      flex: 1;
      background: #1e293b;
      border: 1px solid #334155;
      color: #f8fafc;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .search-bar button {
      background: #22c55e;
      color: #0f172a;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
    }
    .certificate-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.5rem;
    }
    .cert-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .shield {
      width: 40px;
      height: 40px;
      background: #22c55e20;
      color: #22c55e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    h3 { font-size: 1.1rem; }
    .status.verified { color: #22c55e; font-size: 0.85rem; }
    .details { display: flex; flex-direction: column; gap: 0.75rem; }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .row .label { color: #94a3b8; font-size: 0.85rem; }
    .row .value { font-size: 0.85rem; }
    .row .value.mono {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .explorer-link {
      display: inline-block;
      margin-top: 1rem;
      color: #3b82f6;
      font-size: 0.85rem;
    }
    .not-found { text-align: center; color: #94a3b8; padding: 2rem; }
    `,
  ],
})
export class AuditPortalComponent implements OnInit {
  certificate: Certificate | null = null;
  searched = false;

  constructor(private certificateService: CertificateService) {}

  ngOnInit() {}

  async search(query: string) {
    this.searched = true;
    this.certificate = null;

    if (query.startsWith('CERT-')) {
      this.certificateService.getByCertificateId(query).subscribe({
        next: (c) => (this.certificate = c),
        error: () => (this.certificate = null),
      });
    } else if (query.startsWith('0x')) {
      this.certificateService.getByNullifier(query).subscribe({
        next: (c) => (this.certificate = c),
        error: () => (this.certificate = null),
      });
    }
  }
}
