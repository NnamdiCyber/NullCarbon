import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistryService, Credit } from '../../shared/services/registry.service';

@Component({
  selector: 'app-credit-portfolio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="portfolio">
      <div class="filter-bar">
        <select (change)="onRegistryFilter($event)">
          <option value="">All Registries</option>
          <option value="Verra">Verra</option>
          <option value="GoldStandard">Gold Standard</option>
        </select>
        <input type="number" placeholder="Min vintage" (input)="onVintageFilter($event)" />
        <select (change)="onMethodologyFilter($event)">
          <option value="">All Methodologies</option>
          <option value="REDD+">REDD+</option>
          <option value="IFM">IFM</option>
          <option value="DAC">DAC</option>
        </select>
      </div>

      <div class="credit-grid">
        <div *ngFor="let credit of filteredCredits()" class="credit-card">
          <span class="registry-badge" [class.verra]="credit.registry === 'Verra'"
                [class.gold]="credit.registry === 'GoldStandard'">
            {{ credit.registry === 'Verra' ? 'VCS' : 'GS' }}
          </span>
          <h4>{{ credit.creditId }}</h4>
          <div class="detail">
            <span class="label">Vintage</span>
            <span>{{ credit.vintage }}</span>
          </div>
          <div class="detail">
            <span class="label">Methodology</span>
            <span>{{ credit.methodology }}</span>
          </div>
          <div class="detail">
            <span class="label">Volume</span>
            <span>{{ credit.volume.toLocaleString() }} t</span>
          </div>
          <div class="permanence" [class.green]="credit.permanenceRating >= 90"
               [class.yellow]="credit.permanenceRating >= 70 && credit.permanenceRating < 90"
               [class.red]="credit.permanenceRating < 70">
            {{ credit.permanenceRating }}
          </div>
          <button *ngIf="!credit.isRetired; else retiredBadge"
                  class="select-btn"
                  (click)="toggleSelect(credit)">
            {{ isSelected(credit) ? 'Selected' : 'Select for Retirement' }}
          </button>
          <ng-template #retiredBadge>
            <span class="retired-badge">Retired</span>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .portfolio { width: 100%; }
    .filter-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .filter-bar select, .filter-bar input {
      background: #1e293b;
      border: 1px solid #334155;
      color: #f8fafc;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
    }
    .credit-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    .credit-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.25rem;
      position: relative;
    }
    .registry-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .registry-badge.verra { background: #16a34a; color: #fff; }
    .registry-badge.gold { background: #ca8a04; color: #fff; }
    h4 { font-size: 1rem; margin-bottom: 0.75rem; }
    .detail {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 0.4rem;
    }
    .detail .label { color: #94a3b8; }
    .permanence {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      margin: 0.5rem 0;
    }
    .permanence.green { background: #166534; color: #22c55e; }
    .permanence.yellow { background: #713f12; color: #eab308; }
    .permanence.red { background: #7f1d1d; color: #ef4444; }
    .select-btn {
      width: 100%;
      padding: 0.5rem;
      border-radius: 8px;
      border: 1px solid #22c55e;
      background: transparent;
      color: #22c55e;
      font-size: 0.85rem;
      font-weight: 600;
      margin-top: 0.75rem;
      transition: all 0.2s;
    }
    .select-btn:hover { background: #22c55e; color: #0f172a; }
    .retired-badge {
      display: block;
      text-align: center;
      padding: 0.5rem;
      color: #64748b;
      font-size: 0.85rem;
      margin-top: 0.75rem;
    }
    `,
  ],
})
export class CreditPortfolioComponent {
  @Input() walletAddress: string = '';
  @Output() creditsSelected = new EventEmitter<Credit[]>();

  credits = signal<Credit[]>([]);
  selected = signal<Set<string>>(new Set());
  filteredCredits = signal<Credit[]>([]);

  constructor(private registryService: RegistryService) {
    this.registryService.getCredits().subscribe((res) => {
      this.credits.set(res.credits);
      this.filteredCredits.set(res.credits);
    });
  }

  toggleSelect(credit: Credit) {
    const s = new Set(this.selected());
    if (s.has(credit.creditId)) {
      s.delete(credit.creditId);
    } else {
      s.add(credit.creditId);
    }
    this.selected.set(s);
    const selectedCredits = this.credits().filter((c) => s.has(c.creditId));
    this.creditsSelected.emit(selectedCredits);
  }

  isSelected(credit: Credit): boolean {
    return this.selected().has(credit.creditId);
  }

  onRegistryFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.applyFilters({ registry: value || undefined });
  }

  onVintageFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.applyFilters({ vintageMin: value ? Number(value) : undefined });
  }

  onMethodologyFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.applyFilters({ methodology: value || undefined });
  }

  private applyFilters(filters: Partial<CreditFilters>) {
    let result = this.credits();
    if (filters.registry) {
      result = result.filter((c) => c.registry === filters.registry);
    }
    if (filters.vintageMin) {
      result = result.filter((c) => c.vintage >= filters.vintageMin!);
    }
    if (filters.methodology) {
      result = result.filter((c) => c.methodology === filters.methodology);
    }
    this.filteredCredits.set(result);
  }
}

interface CreditFilters {
  registry?: string;
  vintageMin?: number;
  methodology?: string;
}
