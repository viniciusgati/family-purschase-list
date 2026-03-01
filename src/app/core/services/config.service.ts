import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
  app: {
    name: string;
    version: string;
    defaultCurrency: string;
    maxPhotoSizeMB: number;
    maxItemsPerList: number;
    maxListsPerFamily: number;
  };
  features: {
    enableNotifications: boolean;
    enableOfflineMode: boolean;
    enableSharedLists: boolean;
    enablePhotoUpload: boolean;
    enableBudget: boolean;
    enableReports: boolean;
  };
  budget: {
    defaultCategories: string[];
  };
  ui: {
    theme: string;
    primaryColor: string;
    accentColor: string;
    itemsPerPage: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config = signal<AppConfig | null>(null);

  readonly appConfig = this.config.asReadonly();

  constructor(private http: HttpClient) {}

  async loadConfig(): Promise<void> {
    try {
      const config = await firstValueFrom(this.http.get<AppConfig>('/assets/config.json'));
      this.config.set(config);
    } catch (error) {
      console.warn('Failed to load config, using defaults:', error);
      // Set default config if loading fails
      this.config.set({
        app: {
          name: 'Family Purchase List',
          version: '1.0.0',
          defaultCurrency: 'BRL',
          maxPhotoSizeMB: 5,
          maxItemsPerList: 100,
          maxListsPerFamily: 50,
        },
        features: {
          enableNotifications: false,
          enableOfflineMode: false,
          enableSharedLists: true,
          enablePhotoUpload: true,
          enableBudget: true,
          enableReports: true,
        },
        budget: {
          defaultCategories: [
            'Alimentação',
            'Casa',
            'Transporte',
            'Saúde',
            'Educação',
            'Lazer',
            'Vestuário',
            'Outros',
          ],
        },
        ui: {
          theme: 'light',
          primaryColor: '#3F51B5',
          accentColor: '#FF4081',
          itemsPerPage: 20,
        },
      });
    }
  }

  get features() {
    return this.config()?.features;
  }

  get budgetCategories(): string[] {
    return this.config()?.budget?.defaultCategories || [];
  }

  get maxPhotoSizeMB(): number {
    return this.config()?.app?.maxPhotoSizeMB || 5;
  }

  get currency(): string {
    return this.config()?.app?.defaultCurrency || 'BRL';
  }
}
