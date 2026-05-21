export function wrapEmailHtml(body: string, title?: string) {
  const heading = title ? `<h1 style="margin:0 0 12px;font-size:22px;color:#0f172a">${title}</h1>` : '';
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:28px">
    <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e2e8f0">
      <strong style="color:#0e7490;font-size:18px">Dentista+</strong>
    </div>
    ${heading}
    <div style="font-size:15px;line-height:1.6">${body}</div>
    <p style="margin-top:28px;font-size:12px;color:#64748b">Estructura Web · Dentista+</p>
  </div>
</body>
</html>`;
}

export function textToHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
