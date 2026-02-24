// lib/email/templates/_base.ts

export function getEmailVars() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://owtra.xyz'
  return {
    appUrl,
    logoUrl: `${appUrl}/owtra_logo.png`,
    year: new Date().getFullYear(),
  }
}

export function emailWrapper(content: string, title: string): string {
  const { appUrl, logoUrl, year } = getEmailVars()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:36px 24px;">
    <tr><td align="center">

      <!-- 650px card — wide enough to avoid scroll on a short message -->
      <table width="650" cellpadding="0" cellspacing="0" border="0"
             style="max-width:650px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">

        <!-- Logo bar -->
        <tr>
          <td style="background:#0f172a;padding:20px 40px;">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:10px;vertical-align:middle;">
                <img src="${logoUrl}" alt="Owtra" width="28" height="28"
                     style="display:block;width:28px;height:28px;object-fit:contain;"/>
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">Owtra</span>
              </td>
            </tr></table>
          </td>
        </tr>

        ${content}

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.8;">
              © ${year} Owtra &nbsp;·&nbsp;
              <a href="mailto:support@owtra.xyz" style="color:#94a3b8;text-decoration:underline;">support@owtra.xyz</a>
              &nbsp;·&nbsp;
              <a href="${appUrl}/contact" style="color:#94a3b8;text-decoration:underline;">Help center</a>
            </p>
          </td>
        </tr>

      </table>

    </td></tr>
  </table>

</body>
</html>`
}

/** Intro block — emoji + heading + subtitle, on white, no background color */
export function intro(emoji: string, heading: string, subtitle: string): string {
  return `
  <tr>
    <td style="padding:36px 40px 0;">
      <p style="margin:0 0 14px;font-size:30px;line-height:1;">${emoji}</p>
      <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${heading}</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.5;">${subtitle}</p>
      <div style="height:1px;background:#f1f5f9;"></div>
    </td>
  </tr>`
}

/** Body content cell */
export function body(content: string): string {
  return `<tr><td style="padding:28px 40px 36px;">${content}</td></tr>`
}

/** Brand blue CTA button */
export function cta(href: string, label: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
    <tr><td align="center">
      <a href="${href}"
         style="display:inline-block;background:#1769ff;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 32px;border-radius:7px;letter-spacing:0.1px;">
        ${label}
      </a>
    </td></tr>
  </table>`
}

/** Key-value details table — bordered, no fill */
export function details(rows: { label: string; value: string; mono?: boolean }[]): string {
  const html = rows.map((r, i) => {
    const border = i < rows.length - 1 ? 'border-bottom:1px solid #f1f5f9;' : ''
    return `<tr>
      <td style="padding:11px 0;font-size:13px;color:#64748b;${border}">${r.label}</td>
      <td style="padding:11px 0;font-size:${r.mono ? '12px' : '13px'};color:#0f172a;font-weight:600;text-align:right;${r.mono ? 'font-family:monospace;' : ''}${border}">${r.value}</td>
    </tr>`
  }).join('')

  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:20px 0;">
    <tr><td style="padding:6px 18px 10px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">${html}</table>
    </td></tr>
  </table>`
}

/** Numbered steps — dark step numbers, no color */
export function steps(items: { title: string; description: string }[]): string {
  const html = items.map((s, i) => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="${i < items.length - 1 ? 'margin-bottom:18px;' : ''}">
      <tr>
        <td width="36" valign="top" style="padding-right:14px;padding-top:1px;">
          <div style="width:24px;height:24px;background:#0f172a;border-radius:50%;text-align:center;line-height:24px;">
            <span style="color:#ffffff;font-size:12px;font-weight:700;">${i + 1}</span>
          </div>
        </td>
        <td valign="top">
          <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#0f172a;">${s.title}</p>
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${s.description}</p>
        </td>
      </tr>
    </table>`).join('')

  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin:20px 0;">
    <tr><td style="padding:22px 22px 4px;">${html}</td></tr>
  </table>`
}

/** Body paragraph */
export function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">${text}</p>`
}

/** Small section label */
export function sectionLabel(text: string): string {
  return `<p style="margin:20px 0 8px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.7px;">${text}</p>`
}