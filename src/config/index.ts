import { readFileSync, existsSync } from 'fs';
import path from 'path';
import YAML from 'yaml';

export type Vertical = 'dentistry' | 'veterinary';

export interface DomainConfig {
  opening_hours: Record<string, { start: string; end: string }[]>; // e.g., Mon..Sun
  slot_duration_minutes: number;
  services: { key: string; name: string; duration_minutes?: number }[];
  timezone?: string;
}

export interface AppConfig {
  port: number;
  vertical: Vertical;
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    calendarId?: string;
  };
  domain: DomainConfig;
}

export function loadConfig(): AppConfig {
  const port = Number(process.env.PORT ?? '3000');
  const vertical = (process.env.VERTICAL ?? 'dentistry') as Vertical;
  const google = {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? '',
    calendarId: process.env.GOOGLE_CALENDAR_ID,
  };

  const domainPath = path.join(process.cwd(), 'config', `${vertical}.yml`);
  const domainYaml = existsSync(domainPath)
    ? readFileSync(domainPath, 'utf-8')
    : '';
  const domain = domainYaml ? (YAML.parse(domainYaml) as DomainConfig) : {
    opening_hours: {},
    slot_duration_minutes: 30,
    services: [],
  } as DomainConfig;

  return { port, vertical, google, domain };
}

