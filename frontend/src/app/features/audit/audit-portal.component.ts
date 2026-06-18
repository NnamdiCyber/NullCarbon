import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CertificateService, Certificate } from '../../shared/services/certificate.service';

function corridorLabel(corridorId: string): string {
  const map: Record<string, string> = {
    ['0x' + '01'.repeat(32)]: 'EU-CORSIA',
    ['0x' + '02'.repeat(32)]: 'Article 6',
    ['0x' + '03'.repeat(32)]: 'Voluntary',
    ['0x' + '04'.repeat(32)]: 'EU Taxonomy',
  };
  return map[corridorId] ?? corridorId.slice(0, 16) + '...';
}

@Component({
  selector: 'app-audit-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="audit-portal">
      <div class="page-header">
        <h1>Audit Portal</h1>
        <p class="subtitle">
          Public retirement certificate verification — no wallet required.
          Every record is permanently anchored to Stellar.
        </p>
      </div>

      <!-- Search -->
      <div class="search-section">
        <div class="search-bar">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Enter Certificate ID (CERT-...) or Nullifier (0x...)"
            (keyup.enter)="search()" />
          <button class="search-btn" (click)="search()" [disabled]="searching()">
            {{ searching() ? '...' : 'Search' }}
          </button>
        </div>
      </div>

      <!-- Search Result -->
      @if (certificate()) {
        <div class="result-section">
          <div class="certificate-card">
            <div class="cert-header">
              <div class="shield-icon">✓</div>
              <div>
                <h3>{{ certificate()!.certificateId }}</h3>
                <span class="verified-badge">Verified On-Chain ✓</span>
              </div>
            </div>

            <div class="details-grid">
              <div class="detail-row">
                <span class="dlabel">Nullifier</span>
                <div class="dval-row">
                  <code class="mono-val">{{ certificate()!.nullifier }}</code>
                  <button class="copy-mini" (click)="copy(certificate()!.nullifier)">⧉</button>
                </div>
              </div>
              <div class="detail-row">
                <span class="dlabel">Corridor</span>
                <span class="dval">{{ decodeCorridorId(certificate()!.corridorId) }}</span>
              </div>
              <div class="detail-row">
                <span class="dlabel">Volume Commitment</span>
                <code class="mono-val">{{ truncate(certificate()!.volumeCommitment) }}</code>
              </div>
              <div class="detail-row">
                <span class="dlabel">Registry Root</span>
                <code class="mono-val">{{ truncate(certificate()!.registryRoot) }}</code>
              </div>
              <div class="detail-row">
                <span class="dlabel">Timestamp</span>
                <span class="dval">{{ formatTime(certificate()!.timestamp) }}</span>
              </div>
              <div class="detail-row">
                <span class="dlabel">Ledger</span>
                <span class="dval">{{ certificate()!.ledger ?? '—' }}</span>
              </div>
              @if (certificate()!.stellarTxHash) {
                <div class="detail-row">
                  <span class="dlabel">Tx Hash</span>
                  <a class="tx-link"
                     [href]="'https://stellar.expert/explorer/testnet/tx/' + certificate()!.stellarTxHash"
                     target="_blank">
                    {{ truncate(certificate()!.stellarTxHash) }} →
                  </a>
                </div>
              }
            </div>

            <button class="verify-btn"
                    [disabled]="verifying()"
                    (click)="verifyOnChain(certificate()!.nullifier)">
              @if (verifying()) { <span class="spinner"></span> Verifying... }
              @else if (onChainVerified() === true) { ✓ Independently Verified }
              @else if (onChainVerified() === false) { ✕ On-chain record not found }
              @else { Verify On-Chain }
            </button>
          </div>
        </div>
      }

      @if (searched() && !certificate() && !searching()) {
        <div class="not-found">
          <p>No certificate found for "<em>{{ lastQuery() }}</em>".</p>
          <p class="hint">Try a Certificate ID like <code>CERT-20260601-00001</code> or a 0x-prefixed nullifier.</p>
        </div>
      }

      <!-- Public Feed -->
      <div class="feed-section">
        <h2>Recent Retirements</h2>
        <p class="feed-desc">Live public feed of all verified retirement certificates.</p>

        @if (feedLoading()) {
          <div class="loading">Loading certificates...</div>
        } @else if (feed().length === 0) {
          <div class="empty-feed">
            <p>No retirement certificates yet.</p>
            <p class="hint">Connect a wallet and retire a carbon credit to see the first record here.</p>
          </div>
        } @else {
          <div class="feed-list">
            @for (cert of feed(); track cert.certificateId) {
              <div class="feed-item" (click)="selectFromFeed(cert)">
                <div class="feed-id">{{ cert.certificateId }}</div>
                <div class="feed-meta">
                  <span class="feed-corridor">{{ decodeCorridorId(cert.corridorId) }}</span>
                  <span class="feed-time">{{ formatTime(cert.timestamp) }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .audit-portal { max-width: 860px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .subtitle { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
    .search-section { margin-bottom: 1.5rem; }
    .search-bar { display: flex; gap: 0.75rem; }
    .search-bar input {
      flex: 1;
      background: #1e293b; border: 1px solid #334155;
      color: #f8fafc; padding: 0.75rem 1rem;
      border-radius: 8px; font-size: 0.9rem;
      font-family: 'JetBrains Mono', monospace;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-bar input:focus { border-color: #22c55e40; }
    .search-btn {
      background: #22c55e; color: #0f172a; border: none;
      padding: 0.75rem 1.5rem; border-radius: 8px;
      font-weight: 600; cursor: pointer; white-space: nowrap;
    }
    .search-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .result-section { margin-bottom: 2rem; }
    .certificate-card {
      background: #1e293b; border: 1px solid #22c55e40;
      border-radius: 12px; padding: 1.5rem;
    }
    .cert-header {
      display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;
    }
    .shield-icon {
      width: 44px; height: 44px; border-radius: 50%;
      background: #0f2a1a; border: 2px solid #22c55e;
      color: #22c55e; display: flex; align-items: center;
      justify-content: center; font-size: 1.3rem; flex-shrink: 0;
    }
    .cert-header h3 { margin: 0 0 0.2rem; font-size: 1.05rem; }
    .verified-badge { color: #22c55e; font-size: 0.8rem; font-weight: 600; }
    .details-grid { display: flex; flex-direction: column; gap: 0; margin-bottom: 1.25rem; }
    .detail-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 0.6rem 0; border-bottom: 1px solid #0f172a; font-size: 0.85rem;
    }
    .dlabel { color: #94a3b8; flex-shrink: 0; width: 140px; }
    .dval { color: #f8fafc; }
    .dval-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; flex: 1; }
    .mono-val { font-family: monospace; font-size: 0.78rem; color: #cbd5e1; word-break: break-all; flex: 1; }
    .copy-mini {
      background: #334155; border: none; color: #94a3b8;
      padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.7rem;
      cursor: pointer; flex-shrink: 0;
    }
    .tx-link { color: #3b82f6; font-size: 0.8rem; text-decoration: none; }
    .verify-btn {
      width: 100%; padding: 0.65rem; border-radius: 8px;
      border: 1px solid #334155; background: #0f172a;
      color: #f8fafc; font-size: 0.875rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      transition: all 0.2s;
    }
    .verify-btn:hover:not(:disabled) { border-color: #22c55e; color: #22c55e; }
    .verify-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner {
      width: 14px; height: 14px; border: 2px solid #334155;
      border-top-color: #22c55e; border-radius: 50%;
      animation: spin 0.6s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .not-found {
      text-align: center; color: #64748b; padding: 2rem;
      background: #1e293b; border-radius: 12px; margin-bottom: 2rem;
    }
    .not-found .hint { font-size: 0.85rem; margin-top: 0.5rem; }
    .feed-section { margin-top: 2rem; }
    h2 { font-size: 1.15rem; margin-bottom: 0.25rem; }
    .feed-desc { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1rem; }
    .loading, .empty-feed {
      text-align: center; color: #64748b; padding: 2rem;
      background: #1e293b; border-radius: 12px;
    }
    .empty-feed .hint { font-size: 0.85rem; margin-top: 0.5rem; }
    .feed-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .feed-item {
      background: #1e293b; border: 1px solid #334155;
      border-radius: 8px; padding: 0.75rem 1rem;
      display: flex; justify-content: space-between; align-items: center;
      cursor: pointer; transition: border-color 0.2s;
    }
    .feed-item:hover { border-color: #22c55e40; }
    .feed-id { font-family: monospace; font-size: 0.85rem; color: #f8fafc; }
    .feed-meta { display: flex; gap: 1rem; align-items: center; }
    .feed-corridor {
      background: #0f2a1a; color: #22c55e;
      padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem;
    }
    .feed-time { color: #64748b; font-size: 0.78rem; }
    code { font-family: monospace; }
  `],
})
export class AuditPortalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private certService = inject(CertificateService);

  searchQuery = '';
  certificate = signal<Certificate | null>(null);
  feed = signal<Certificate[]>([]);
  searching = signal(false);
  searched = signal(false);
  feedLoading = signal(true);
  verifying = signal(false);
  onChainVerified = signal<boolean | null>(null);
  lastQuery = signal('');

  ngOnInit() {
    // Pre-populate from route param (e.g., /audit/CERT-...)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.searchQuery = id;
      this.search();
    }

    this.loadFeed();
  }

  async search() {
    const q = this.searchQuery.trim();
    if (!q) return;

    this.searching.set(true);
    this.searched.set(false);
    this.certificate.set(null);
    this.onChainVerified.set(null);
    this.lastQuery.set(q);

    try {
      if (q.startsWith('CERT-')) {
        this.certService.getByCertificateId(q).subscribe({
          next: (c) => { this.certificate.set(c); this.searched.set(true); this.searching.set(false); },
          error: () => { this.certificate.set(null); this.searched.set(true); this.searching.set(false); },
        });
      } else {
        this.certService.getByNullifier(q).subscribe({
          next: (c) => { this.certificate.set(c); this.searched.set(true); this.searching.set(false); },
          error: () => { this.certificate.set(null); this.searched.set(true); this.searching.set(false); },
        });
      }
    } catch {
      this.certificate.set(null);
      this.searched.set(true);
      this.searching.set(false);
    }
  }

  verifyOnChain(nullifier: string) {
    this.verifying.set(true);
    this.certService.verifyOnChain(nullifier).subscribe({
      next: (res) => { this.onChainVerified.set(res.verified); this.verifying.set(false); },
      error: () => { this.onChainVerified.set(false); this.verifying.set(false); },
    });
  }

  selectFromFeed(cert: Certificate) {
    this.searchQuery = cert.certificateId;
    this.certificate.set(cert);
    this.searched.set(true);
    this.onChainVerified.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  decodeCorridorId(corridorId?: string): string {
    if (!corridorId) return '—';
    return corridorLabel(corridorId);
  }

  truncate(val?: string): string {
    if (!val) return '—';
    if (val.length <= 20) return val;
    return `${val.slice(0, 10)}...${val.slice(-8)}`;
  }

  formatTime(ts?: string): string {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
      }) + ' UTC';
    } catch {
      return ts;
    }
  }

  copy(val: string) {
    navigator.clipboard.writeText(val);
  }

  private loadFeed() {
    this.feedLoading.set(true);
    this.certService.getPublicFeed(20, 0).subscribe({
      next: (certs) => { this.feed.set(Array.isArray(certs) ? certs : []); this.feedLoading.set(false); },
      error: () => { this.feed.set([]); this.feedLoading.set(false); },
    });
  }
}
