const SUPABASE_URL = 'https://nnfcppwruhethardmmvq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1EYhImZLjFH-Z9jgQf7f_Q_VMCBbY6f';

function sendJson(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(data));
}

async function supabase(path) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) {
    return sendJson(res, 503, { ok: false, error: 'Admin password is not configured' });
  }

  const suppliedPassword = String(req.headers['x-admin-password'] || '');
  if (!suppliedPassword || suppliedPassword !== configuredPassword) {
    return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
  }

  try {
    const testers = await supabase(
      '/rest/v1/tester_progress?select=tester_id,tester_name,current_day,current_step,completed_count,completed_days,last_event,last_activity,created_at&order=last_activity.desc'
    );

    const safeTesters = Array.isArray(testers) ? testers : [];
    const events = safeTesters
      .filter(t => t.last_activity)
      .map((t, index) => ({
        id: index + 1,
        tester_id: t.tester_id,
        tester_name: t.tester_name,
        event: t.last_event,
        current_day: t.current_day,
        current_step: t.current_step,
        completed_count: t.completed_count,
        created_at: t.last_activity
      }))
      .slice(0, 30);

    return sendJson(res, 200, {
      ok: true,
      testers: safeTesters,
      events
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { ok: false, error: 'Dashboard load failed' });
  }
}