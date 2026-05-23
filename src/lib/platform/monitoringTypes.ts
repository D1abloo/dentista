export type MonitoringSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type MonitoringResult = 'ok' | 'blocked' | 'failed';
export type MonitoringChip = 'all' | 'login' | 'security' | 'errors' | 'downloads' | 'critical';

export type MonitoringKpiId =
  | 'events_today'
  | 'logins_ok'
  | 'logins_failed'
  | 'access_denied'
  | 'critical_errors'
  | 'downloads';

export type MonitoringEventRow = {
  id: string;
  event_code: string;
  created_at: string;
  date_time_label: string;
  event_label: string;
  module: string;
  module_label: string;
  user_email: string;
  user_role: string;
  clinic_name: string;
  resource_label: string;
  severity: MonitoringSeverity;
  severity_label: string;
  result: MonitoringResult;
  result_label: string;
  route: string;
  ip_address: string;
  user_agent: string;
  browser_label: string;
  os_label: string;
  event_type: string;
  metadata: Record<string, unknown>;
  reviewed: boolean;
  escalated: boolean;
};

export type MonitoringKpi = {
  id: MonitoringKpiId;
  label: string;
  value: number;
  trend_label: string;
  trend_direction: 'up' | 'down' | 'neutral';
  trend_positive: boolean;
};

export type CriticalAlert = {
  id: string;
  title: string;
  time_label: string;
  tone: 'red' | 'orange';
  event_id: string;
};

export type HourlyActivity = { hour: string; events: number };
export type ModuleShare = { label: string; percent: number; color: string };
export type SeverityRow = {
  severity: MonitoringSeverity;
  label: string;
  count: number;
  percent: number;
};

export type MonitoringPayload = {
  kpis: MonitoringKpi[];
  alerts: CriticalAlert[];
  hourly: HourlyActivity[];
  modules: ModuleShare[];
  severity_breakdown: SeverityRow[];
  events: MonitoringEventRow[];
  clinics: string[];
  users: string[];
  total_events: number;
};

export type MonitoringFilters = {
  q?: string;
  chip?: MonitoringChip;
  kpi?: MonitoringKpiId | null;
  module?: string;
  severity?: string;
  clinic?: string;
  user?: string;
  page?: number;
  page_size?: number;
};
