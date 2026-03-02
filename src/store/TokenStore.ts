import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

export interface TenantTokens {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number; // ms epoch
  calendarId?: string; // preferred calendar for this tenant
}

export class TokenStore {
  private filePath: string;
  private cache: Record<string, TenantTokens> = {};

  constructor(baseDir = path.join(process.cwd(), 'data')) {
    if (!existsSync(baseDir)) mkdirSync(baseDir, { recursive: true });
    this.filePath = path.join(baseDir, 'tokens.json');
    if (existsSync(this.filePath)) {
      try {
        this.cache = JSON.parse(readFileSync(this.filePath, 'utf-8'));
      } catch {
        this.cache = {};
      }
    }
  }

  get(tenantId: string): TenantTokens | undefined {
    return this.cache[tenantId];
  }

  set(tenantId: string, tokens: TenantTokens) {
    this.cache[tenantId] = { ...(this.cache[tenantId] ?? {}), ...tokens };
    this.flush();
  }

  setCalendar(tenantId: string, calendarId: string) {
    const prev = this.cache[tenantId] ?? {};
    this.cache[tenantId] = { ...prev, calendarId };
    this.flush();
  }

  private flush() {
    writeFileSync(this.filePath, JSON.stringify(this.cache, null, 2), 'utf-8');
  }
}

