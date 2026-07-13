'use strict';

/**
 * Email notification when a new lead is saved (fire-and-forget).
 * Requires RESEND_API_KEY + LEAD_NOTIFY_EMAIL in Vercel env.
 * Optional: LEAD_FROM_EMAIL (must be verified in Resend).
 */
async function notifyNewLead(lead, tabName) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const to = String(process.env.LEAD_NOTIFY_EMAIL || process.env.ADMIN_EMAILS || '')
    .split(',')[0]
    .trim();
  const from =
    String(process.env.LEAD_FROM_EMAIL || '').trim() ||
    'NC Consulting <notifications@resend.dev>';

  if (!apiKey || !to) {
    return { ok: false, skipped: true, reason: 'missing_config' };
  }

  const name = [lead.prenom, lead.nom].filter(Boolean).join(' ').trim() || '—';
  const subject = `Nouveau contact NC Consulting — ${name}`;
  const text = [
    'Une nouvelle demande vient d\'être enregistrée sur ncconsulting.ma.',
    '',
    `Nom : ${name}`,
    `Téléphone : ${lead.telephone || '—'}`,
    `Email : ${lead.email || '—'}`,
    `Profil : ${lead.niveau || '—'}`,
    `Option : ${lead.filiere || '—'}`,
    `Service : ${lead.service || '—'}`,
    `Mode : ${lead.mode || '—'}`,
    `Onglet Google Sheet : ${tabName || '—'}`,
    '',
    'Répondez depuis votre tableau de leads ou par email direct.',
  ].join('\n');

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    console.error('[notifyLead] Resend error', resp.status, detail.slice(0, 300));
    return { ok: false, skipped: false, status: resp.status };
  }
  return { ok: true };
}

module.exports = { notifyNewLead };
