import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NoirService, RetirementProof, RetirementProofInputs } from '../../shared/services/noir.service';

@Component({
  selector: 'app-proof-generate',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="proof-gen">
      <div class="header-row">
        <h3>Zero-Knowledge Proof Generator</h3>
        <span class="constraints">6,841 constraints</span>
      </div>

      <div class="status-block" *ngIf="generating">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progress"></div>
        </div>
        <div class="status-row">
          <span class="stage-text">{{ stageText }}</span>
          <span class="elapsed">{{ elapsed }}s</span>
        </div>
      </div>

      <div class="success-block" *ngIf="generated">
        <div class="success-header">
          <span class="checkmark">✓</span>
          <span>Proof generated in <strong>{{ generationTime }}s</strong></span>
        </div>
        <div class="nullifier-row">
          <span class="null-label">Nullifier</span>
          <code class="nullifier-val">{{ truncatedNullifier }}</code>
          <button class="copy-btn" (click)="copyNullifier()" title="Copy full nullifier">⧉</button>
        </div>
      </div>

      <div class="error-block" *ngIf="errorMsg">
        <p>⚠ {{ errorMsg }}</p>
        <button class="retry-btn" (click)="generate()">Retry</button>
      </div>

      <button class="gen-btn" [disabled]="generating" (click)="generate()">
        {{ generated ? 'Regenerate Proof' : 'Generate Proof' }}
      </button>
    </div>
  `,
  styles: [`
    .proof-gen {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.5rem;
    }
    .header-row {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;
    }
    h3 { font-size: 1rem; margin: 0; }
    .constraints {
      background: #334155;
      color: #94a3b8;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .status-block { margin-bottom: 1rem; }
    .progress-bar {
      height: 8px; background: #334155; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem;
    }
    .progress-fill { height: 100%; background: #22c55e; transition: width 0.3s ease; }
    .status-row { display: flex; justify-content: space-between; }
    .stage-text { color: #94a3b8; font-size: 0.85rem; }
    .elapsed { color: #64748b; font-size: 0.8rem; }
    .success-block {
      background: #0f2a1a;
      border: 1px solid #166534;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .success-header {
      display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; color: #22c55e;
    }
    .checkmark { font-size: 1.25rem; }
    .nullifier-row {
      display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
    }
    .null-label { color: #94a3b8; font-size: 0.75rem; }
    .nullifier-val { font-family: monospace; font-size: 0.8rem; color: #cbd5e1; word-break: break-all; }
    .copy-btn {
      background: #1e3a2f; border: 1px solid #166534; color: #22c55e;
      padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.75rem; cursor: pointer;
    }
    .error-block { color: #ef4444; text-align: center; margin-bottom: 1rem; }
    .retry-btn {
      margin-top: 0.5rem;
      background: transparent; border: 1px solid #ef4444;
      color: #ef4444; padding: 0.4rem 1rem; border-radius: 6px; cursor: pointer;
    }
    .gen-btn {
      width: 100%; margin-top: 0.5rem; padding: 0.75rem;
      background: #22c55e; color: #0f172a; border: none;
      border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer;
      transition: background 0.2s;
    }
    .gen-btn:hover:not(:disabled) { background: #16a34a; }
    .gen-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class ProofGenerateComponent implements OnDestroy {
  @Input() inputs: RetirementProofInputs | null = null;
  @Output() proofGenerated = new EventEmitter<RetirementProof>();

  generating = false;
  generated = false;
  progress = 0;
  elapsed = 0;
  generationTime = 0;
  stageText = '';
  errorMsg = '';
  nullifier = '';

  private progressSub?: Subscription;
  private timer?: ReturnType<typeof setInterval>;

  get truncatedNullifier(): string {
    if (!this.nullifier) return '';
    return `${this.nullifier.slice(0, 12)}...${this.nullifier.slice(-10)}`;
  }

  constructor(private noirService: NoirService) {}

  ngOnDestroy() {
    this.cleanup();
  }

  async generate() {
    if (!this.inputs) {
      this.errorMsg = 'No proof inputs available.';
      return;
    }

    this.cleanup();
    this.generating = true;
    this.generated = false;
    this.errorMsg = '';
    this.progress = 0;
    this.elapsed = 0;

    const start = Date.now();
    this.timer = setInterval(() => {
      this.elapsed = parseFloat(((Date.now() - start) / 1000).toFixed(1));
    }, 100);

    this.progressSub = this.noirService.proofProgress$.subscribe((p) => {
      this.progress = p.percent;
      this.stageText = p.stage === 'witness' ? 'Generating witness...' : 'Generating proof...';
    });

    try {
      await this.noirService.initialize();
      const result = await this.noirService.generateRetirementProof(this.inputs);

      this.generated = true;
      this.generationTime = parseFloat((result.generationTimeMs / 1000).toFixed(1));
      this.nullifier = result.publicInputs?.nullifier ?? '0x';
      this.proofGenerated.emit(result);
    } catch (e: any) {
      this.errorMsg = e?.message || 'Proof generation failed';
    } finally {
      this.cleanup();
      this.generating = false;
    }
  }

  copyNullifier() {
    navigator.clipboard.writeText(this.nullifier);
  }

  private cleanup() {
    this.progressSub?.unsubscribe();
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
