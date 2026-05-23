#!/usr/bin/env node
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function datesInRangeInclusive(from, to) {
  const out = [];
  const end = new Date(`${to}T12:00:00`);
  let cur = new Date(`${from}T12:00:00`);
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function endOfMonthIso(iso) {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

describe('agenda date helpers', () => {
  it('endOfMonthIso', () => {
    assert.equal(endOfMonthIso('2026-05-10'), '2026-05-31');
  });

  it('datesInRangeInclusive', () => {
    const days = datesInRangeInclusive('2026-05-20', '2026-05-22');
    assert.deepEqual(days, ['2026-05-20', '2026-05-21', '2026-05-22']);
  });
});

describe('security static checks', () => {
  const apiFiles = [
    'src/pages/api/patients.ts',
    'src/pages/api/appointments.ts',
    'src/pages/api/admin/metrics.ts',
    'src/pages/api/admin/modules.ts',
    'src/pages/api/notifications/appointment.ts',
    'src/pages/api/billing/invoice.ts',
    'src/pages/api/billing/payment.ts',
    'src/pages/api/schedule/blocks.ts'
  ];

  for (const f of apiFiles) {
    it(`${f} exists`, () => {
      assert.ok(existsSync(resolve(root, f)));
    });
  }

  it('APIs críticas sin fallback p-maria', () => {
    for (const f of ['src/pages/api/patients.ts', 'src/pages/api/appointments.ts']) {
      const content = readFileSync(resolve(root, f), 'utf8');
      assert.ok(!content.includes('p-maria'), f);
    }
  });

  it('patients.ts con guards de sede', () => {
    const content = readFileSync(resolve(root, 'src/pages/api/patients.ts'), 'utf8');
    assert.ok(content.includes('assertClinicScopeAsync'));
    assert.ok(content.includes('requireStaffSession'));
  });

  it('notifications/appointment requiere staff', () => {
    const content = readFileSync(resolve(root, 'src/pages/api/notifications/appointment.ts'), 'utf8');
    assert.ok(content.includes('requireStaffSession'));
  });

  it('migración RLS 0028 presente', () => {
    assert.ok(existsSync(resolve(root, 'supabase/migrations/0028_rls_records_gaps.sql')));
  });

  it('migración clínicas independientes 0029', () => {
    assert.ok(existsSync(resolve(root, 'supabase/migrations/0029_independent_clinics_only.sql')));
  });

  it('guards sin cruce por tenant hermano', () => {
    const content = readFileSync(resolve(root, 'src/lib/api/guards.ts'), 'utf8');
    assert.ok(!content.includes('clinicBelongsToTenant'));
    assert.ok(content.includes('listAssignedClinicIdsForSession'));
  });
});
