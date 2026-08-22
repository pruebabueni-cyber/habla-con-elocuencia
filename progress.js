const SUPABASE_URL = 'https://nnfcppwruhethardmmvq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1EYhImZLjFH-Z9jgQf7f_Q_VMCBbY6f';

function json(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(data));
}

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return json(res, 200, { ok: true, service: 'progress-api' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const testerId = String(body.testerId || '').trim();
    const testerName = String(body.testerName || '').trim();
    const event = String(body.event || '').trim();

    if (!testerId || !testerName || !event) {
      return json(res, 400, { ok: false, error: 'Missing tester data' });
    }

    const currentDay = Math.max(1, Math.min(15, Number(body.currentDay) || 1));
    const currentStep = Math.max(1, Number(body.currentStep) || 1);
    const completedDays = Array.isArray(body.completedDays)
      ? body.completedDays.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 15)
      : [];
    const completedCount = Math.max(0, Math.min(15, Number(body.completedCount) || completedDays.length));
    const now = new Date().toISOString();

    const progressPayload = [{
      tester_id: testerId,
      tester_name: testerName,
      current_day: currentDay,
      current_step: currentStep,
      completed_days: completedDays,
      completed_count: completedCount,
      last_event: event,
      last_activity: now,
    }];

    await supabase('/rest/v1/tester_progress?on_conflict=tester_id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(progressPayload),
    });

    const eventPayload = [{
      tester_id: testerId,
      tester_name: testerName,
      event,
      current_day: currentDay,
      current_step: currentStep,
      completed_count: completedCount,
      completed_days: completedDays,
    }];

    await supabase('/rest/v1/tester_events', {
      method: 'POST',
      headers: {
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(eventPayload),
    });

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    return json(res, 500, { ok: false, error: 'Progress sync failed' });
  }
}