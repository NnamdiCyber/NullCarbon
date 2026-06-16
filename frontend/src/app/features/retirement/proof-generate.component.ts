import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoirService, RetirementProof } from '../../shared/services/noir.service';

@Component({
  selector: 'app-proof-generate',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="proof-gen">
      <h3>Generate Zero-Knowledge Proof</h3>

      <div class="status" *ngIf="!generated && !errorMsg">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progress"></div>
        </div>
        <p class="stage-text">{{ stageText }}</p>
        <p class="elapsed">{{ elapsed }}s</p>
      </div>

      <div class="success" *ngIf="generated">
        <span class="checkmark">✓</span>
        <p>Proof generated in {{ generationTime }}s</p>
        <div class="nullifier-display">
          <code>{{ truncatedNullifier }}</code>
          <button class="copy-btn" (click)="copyNullifier()">Copy</button>
        </div>
      </div>

      <div class="error" *ngIf="errorMsg">
        <p>{{ errorMsg }}</p>
        <button class="retry-btn" (click)="generate()">Retry</button>
      </div>

      <button *ngIf="!generating" class="gen-btn" (click)="generate()">
        {{ generated ? 'Regenerate' : 'Generate Proof' }}
      </button>
    </div>
  `,
  styles: [
    `
    .proof-gen {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.5rem;
    }
    h3 { font-size: 1.1rem; margin-bottom: 1rem; }
    .progress-bar {
      height: 8px;
      background: #334155;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }
    .progress-fill {
      height: 100%;
      background: #22c55e;
      transition: width 0.3s;
    }
    .stage-text { color: #94a3b8; font-size: 0.9rem; }
    .elapsed { color: #64748b; font-size: 0.8rem; margin-top: 0.25rem; }
    .success { text-align: center; padding: 1rem; }
    .checkmark {
      font-size: 2rem;
      color: #22c55e;
    }
    .nullifier-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    .nullifier-display code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .copy-btn {
      background: #334155;
      border: none;
      color: #f8fafc;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .error { color: #ef4444; text-align: center; }
    .retry-btn {
      margin-top: 0.5rem;
      background: transparent;
      border: 1px solid #ef4444;
      color: #ef4444;
      padding: 0.4rem 1rem;
      border-radius: 6px;
    }
    .gen-btn {
      width: 100%;
      margin-top: 1rem;
      padding: 0.75rem;
      background: #22c55e;
      color: #0f172a;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
    }
    .gen-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    `,
  ],
})
export class ProofGenerateComponent {
  @Input() inputs: any;
  @Output() proofGenerated = new EventEmitter<RetirementProof>();

  generating = false;
  generated = false;
  progress = 0;
  elapsed = 0;
  generationTime = 0;
  stageText = '';
  errorMsg = '';
  nullifier = '';

  get truncatedNullifier(): string {
    return this.nullifier
      ? `${this.nullifier.slice(0, 10)}...${this.nullifier.slice(-8)}`
      : '';
  }

  constructor(private noirService: NoirService) {}

  async generate() {
    this.generating = true;
    this.generated = false;
    this.errorMsg = '';
    this.progress = 0;
    this.elapsed = 0;

    const start = Date.now();
    const timer = setInterval(() => {
      this.elapsed = parseFloat(((Date.now() - start) / 1000).toFixed(1));
    }, 100);

    try {
      this.noirService.proofProgress$.subscribe((p) => {
        this.progress = p.percent;
        this.stageText =
          p.stage === 'witness' ? 'Generating witness...' : 'Generating proof...';
      });

      const result = await this.noirService.generateRetirementProof(this.inputs);
      this.generated = true;
      this.generationTime = parseFloat((result.generationTimeMs / 1000).toFixed(1));
      this.nullifier = result.publicInputs?.['nullifier'] || '0x...';
      this.proofGenerated.emit(result);
    } catch (e: any) {
      this.errorMsg = e?.message || 'Proof generation failed';
    } finally {
      clearInterval(timer);
      this.generating = false;
    }
  }

  copyNullifier() {
    navigator.clipboard.writeText(this.nullifier);
  }
}
