import { json, requireAdmin } from '../../../_utils.js';

export async function onRequestGet({ params, request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: 'Belum login.' }, 401);
  const url = new URL(request.url);
  const isExport = url.searchParams.get('export') === 'csv';

  const { results = [] } = await env.DB.prepare(`
    SELECT guest_name, attendance, guest_count, message, created_at
    FROM rsvps WHERE invitation_id = ?
    ORDER BY created_at DESC
  `).bind(params.id).all();

  if (isExport) {
    let csv = '\uFEFF"Nama Tamu","Kehadiran","Jumlah","Ucapan / Doa","Waktu"\r\n';
    for (const r of results) {
      const cleanName = (r.guest_name || '').replace(/"/g, '""');
      const cleanAtt = (r.attendance || '').replace(/"/g, '""');
      const cleanMsg = (r.message || '').replace(/"/g, '""');
      const cleanDate = (r.created_at || '').replace(/"/g, '""');
      csv += `"${cleanName}","${cleanAtt}",${Number(r.guest_count) || 1},"${cleanMsg}","${cleanDate}"\r\n`;
    }
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="rekap-rsvp-${params.id}.csv"`,
        'cache-control': 'no-store'
      }
    });
  }

  return json({ rsvps: results });
}
