/**
 * Builds the Supabase Auth e-mail templates in supabase/templates/.
 *
 *   node scripts/build-email-templates.cjs
 *
 * The committed HTML files are generated from this source. Make design, copy,
 * or link changes here, then run this script to keep both templates in sync.
 *
 * Supabase templates are single-language Go templates, so each string is
 * emitted as an if/else chain on the user's `locale` metadata (sent by the
 * signup form; falls back to English). Edit the copy here, never the .html.
 *
 * Variables used: {{ .SiteURL }}, {{ .TokenHash }}, {{ .RedirectTo }},
 * {{ .Email }}, {{ .Data.full_name }}, {{ .Data.locale }}.
 *
 * Links deliberately avoid {{ .ConfirmationURL }}: with @supabase/ssr that is a
 * PKCE link whose code can only be exchanged in the browser that asked for it,
 * so opening the e-mail on another device failed. Instead the link carries the
 * token hash to a route that calls verifyOtp() — works anywhere.
 *
 * WHICH DOMAIN the link opens: the site answers on several (tradeindrc.net,
 * .com, .org, staging, localhost) but a Supabase project has a single Site URL.
 * So the link is {{ .RedirectTo }} — the address the app sent at sign-up, on
 * the domain the person was on (src/lib/auth/email-redirect.ts) — with the
 * token appended; /[locale]/callback verifies it. {{ .RedirectTo }} always
 * carries a query string, hence the `&`.
 * If that domain is not in Supabase's Redirect URLs list, Supabase replaces
 * {{ .RedirectTo }} with the Site URL; the template detects it and falls back
 * to the Site URL's /[locale]/confirm route.
 */

// This file is intentionally CommonJS so it can run directly with Node.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const LOCALES = ["fr", "es", "tr", "zh"]; // + "en" as the fallback

/** Template prelude: resolves $l (locale) and $url (the action link). */
function prelude(t) {
  return (
    `{{ $l := "en" }}{{ with .Data.locale }}{{ $l = . }}{{ end }}` +
    `{{ $url := printf "%s&token_hash=%s&type=${t.otpType}" .RedirectTo .TokenHash }}` +
    `{{ if eq .RedirectTo .SiteURL }}{{ $url = printf "%s/%s/confirm?token_hash=%s&type=${t.otpType}" .SiteURL $l .TokenHash }}{{ end }}`
  );
}

// `--preview fr` renders plain HTML in one language (sample data) to
// supabase/templates/preview/ so the design can be opened in a browser.
const previewArg = process.argv.indexOf("--preview");
const PREVIEW = previewArg > -1 ? process.argv[previewArg + 1] || "fr" : null;

/** Go-template switch on $l for a { en, fr, es, tr, zh } string map. */
function tr(map) {
  if (PREVIEW) return map[PREVIEW] ?? map.en;
  let out = "";
  LOCALES.forEach((l, i) => {
    out += `{{ ${i === 0 ? "if" : "else if"} eq $l "${l}" }}${map[l]}`;
  });
  return `${out}{{ else }}${map.en}{{ end }}`;
}

/** "Hello Jean," or "Hello," when no name was captured. */
function greeting(map) {
  if (PREVIEW) return tr(map.named).replace("{{ . }}", "Jean Mukendi");
  return `{{ with .Data.full_name }}${tr(map.named)}{{ else }}${tr(map.anon)}{{ end }}`;
}

const COMMON = {
  greeting: {
    named: { en: "Hello {{ . }},", fr: "Bonjour {{ . }},", es: "Hola {{ . }}:", tr: "Merhaba {{ . }},", zh: "{{ . }}，您好：" },
    anon: { en: "Hello,", fr: "Bonjour,", es: "Hola:", tr: "Merhaba,", zh: "您好：" },
  },
  fallback: {
    en: "Button not working? Copy and paste this link into your browser:",
    fr: "Le bouton ne fonctionne pas ? Copiez et collez ce lien dans votre navigateur :",
    es: "¿El botón no funciona? Copie y pegue este enlace en su navegador:",
    tr: "Düğme çalışmıyor mu? Bu bağlantıyı kopyalayıp tarayıcınıza yapıştırın:",
    zh: "按钮无法使用？请将以下链接复制并粘贴到浏览器中：",
  },
  footer: {
    en: "TradeInDRC — the official trade portal of the Democratic Republic of the Congo.",
    fr: "TradeInDRC — le portail officiel du commerce de la République démocratique du Congo.",
    es: "TradeInDRC — el portal comercial oficial de la República Democrática del Congo.",
    tr: "TradeInDRC — Kongo Demokratik Cumhuriyeti'nin resmî ticaret portalı.",
    zh: "TradeInDRC — 刚果民主共和国官方贸易门户。",
  },
};

const TEMPLATES = {
  "confirm-signup.html": {
    design: "navy-gold",
    otpType: "email",
    icon: "&#9993;", // envelope
    subject: {
      en: "Confirm your TradeInDRC account", fr: "Confirmez votre compte TradeInDRC", es: "Confirme su cuenta de TradeInDRC",
      tr: "TradeInDRC hesabınızı onaylayın", zh: "确认您的 TradeInDRC 账户",
    },
    title: {
      en: "Verify your e-mail address", fr: "Vérifiez votre adresse e-mail", es: "Verifique su dirección de correo",
      tr: "E-posta adresinizi doğrulayın", zh: "验证您的邮箱地址",
    },
    body: {
      en: "Thanks for joining TradeInDRC. You entered <strong style=\"color:#0B1B33;\">{{ .Email }}</strong> as the address for your account. Please confirm it by clicking the button below.",
      fr: "Merci de rejoindre TradeInDRC. Vous avez indiqué <strong style=\"color:#0B1B33;\">{{ .Email }}</strong> comme adresse de votre compte. Confirmez-la en cliquant sur le bouton ci-dessous.",
      es: "Gracias por unirse a TradeInDRC. Indicó <strong style=\"color:#0B1B33;\">{{ .Email }}</strong> como dirección de su cuenta. Confírmela haciendo clic en el botón de abajo.",
      tr: "TradeInDRC'ye katıldığınız için teşekkürler. Hesabınız için <strong style=\"color:#0B1B33;\">{{ .Email }}</strong> adresini girdiniz. Lütfen aşağıdaki düğmeye tıklayarak onaylayın.",
      zh: "感谢您加入 TradeInDRC。您填写的账户邮箱为 <strong style=\"color:#0B1B33;\">{{ .Email }}</strong>。请点击下方按钮进行确认。",
    },
    cta: {
      en: "Verify my e-mail", fr: "Vérifier mon e-mail", es: "Verificar mi correo", tr: "E-postamı doğrula", zh: "验证我的邮箱",
    },
    note: {
      en: "If you didn't create a TradeInDRC account, you can safely ignore this e-mail.",
      fr: "Si vous n'avez pas créé de compte TradeInDRC, vous pouvez ignorer cet e-mail.",
      es: "Si no creó una cuenta de TradeInDRC, puede ignorar este correo.",
      tr: "TradeInDRC hesabı oluşturmadıysanız bu e-postayı yok sayabilirsiniz.",
      zh: "如果您没有创建 TradeInDRC 账户，请忽略此邮件。",
    },
  },
  "reset-password.html": {
    design: "navy-gold",
    otpType: "recovery",
    icon: "&#128274;", // lock
    subject: {
      en: "Reset your TradeInDRC password", fr: "Réinitialisez votre mot de passe TradeInDRC", es: "Restablezca su contraseña de TradeInDRC",
      tr: "TradeInDRC parolanızı sıfırlayın", zh: "重置您的 TradeInDRC 密码",
    },
    title: {
      en: "Reset your password", fr: "Réinitialisez votre mot de passe", es: "Restablezca su contraseña",
      tr: "Parolanızı sıfırlayın", zh: "重置您的密码",
    },
    body: {
      en: "We received a request to reset the password for <strong style=\"color:#0B1B33;\">{{ .Email }}</strong>. Click the button below to choose a new one.",
      fr: "Nous avons reçu une demande de réinitialisation du mot de passe pour <strong style=\"color:#0B1B33;\">{{ .Email }}</strong>. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.",
      es: "Recibimos una solicitud para restablecer la contraseña de <strong style=\"color:#0B1B33;\">{{ .Email }}</strong>. Haga clic en el botón de abajo para elegir una nueva.",
      tr: "<strong style=\"color:#0B1B33;\">{{ .Email }}</strong> için parola sıfırlama talebi aldık. Yeni bir parola seçmek için aşağıdaki düğmeye tıklayın.",
      zh: "我们收到了重置 <strong style=\"color:#0B1B33;\">{{ .Email }}</strong> 密码的请求。请点击下方按钮设置新密码。",
    },
    cta: {
      en: "Choose a new password", fr: "Choisir un nouveau mot de passe", es: "Elegir una nueva contraseña",
      tr: "Yeni parola belirle", zh: "设置新密码",
    },
    note: {
      en: "If you didn't request this, ignore this e-mail — your password stays unchanged. The link expires in 1 hour.",
      fr: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé. Le lien expire dans 1 heure.",
      es: "Si no lo solicitó, ignore este correo: su contraseña no cambiará. El enlace caduca en 1 hora.",
      tr: "Bu talebi siz yapmadıysanız bu e-postayı yok sayın; parolanız değişmez. Bağlantının süresi 1 saat içinde dolar.",
      zh: "如果这不是您本人的操作，请忽略此邮件，您的密码不会改变。链接将在 1 小时后失效。",
    },
  },
};

// E-mail HTML: tables + inline styles only (no <style> reliance, no Tailwind).
function render(t) {
  return `${prelude(t)}<!DOCTYPE html>
<html lang="{{ $l }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${tr(t.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F3F6FA;font-family:Arial,Helvetica,sans-serif;color:#334155;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F6FA;padding:36px 16px;">
<tr><td align="center">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E4EAF2;border-radius:18px;overflow:hidden;">
    <tr><td style="background:#FFFFFF;padding:24px 36px;border-bottom:1px solid #E8EDF4;" align="left">
      <img src="{{ .SiteURL }}/images/brand/logo-color.png" alt="TradeInDRC" width="184" style="display:block;width:184px;max-width:100%;height:auto;border:0;">
    </td></tr>
    <tr><td style="height:3px;line-height:3px;font-size:0;background:#1384C8;">&nbsp;</td></tr>

    <tr><td style="padding:36px 40px 8px;" align="center">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td align="center" valign="middle" style="width:56px;height:56px;border-radius:16px;background:#EAF4FC;font-size:26px;line-height:56px;color:#0878C9;">${t.icon}</td>
      </tr></table>
      <h1 style="margin:20px 0 0;font-size:25px;line-height:1.3;font-weight:700;color:#0B1B33;">${tr(t.title)}</h1>
    </td></tr>

    <tr><td style="padding:16px 40px 0;font-size:15px;line-height:1.65;color:#475569;">
      <p style="margin:0 0 12px;">${greeting(COMMON.greeting)}</p>
      <p style="margin:0;">${tr(t.body)}</p>
    </td></tr>

    <tr><td style="padding:32px 40px;" align="center">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td align="center" style="border-radius:10px;background:#0878C9;">
          <a href="{{ $url }}" style="display:inline-block;padding:15px 32px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;">${tr(t.cta)}</a>
        </td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:0 40px 32px;font-size:12px;line-height:1.6;color:#64748B;" align="center">
      <p style="margin:0 0 6px;">${tr(COMMON.fallback)}</p>
      <p style="margin:0;word-break:break-all;"><a href="{{ $url }}" style="color:#0047AB;">{{ $url }}</a></p>
    </td></tr>

    <tr><td style="padding:20px 40px;background:#F7F9FC;border-top:1px solid #E8EDF4;font-size:12px;line-height:1.6;color:#64748B;" align="center">
      <p style="margin:0 0 8px;">${tr(t.note)}</p>
      <p style="margin:0;color:#94A3B8;">${tr(COMMON.footer)}</p>
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>
`;
}

// Navy + gold brand design (TradeInDRC palette): navy #0B1B33, deep navy
// #07142A, gold #D9A441 (gradient #E7C173 → #C8941F). Used by reset-password.
const NAVY = "#0B1B33";
const NAVY_DEEP = "#07142A";
const GOLD = "#D9A441";
const GOLD_LIGHT = "#E7C173";
const GOLD_DARK = "#C8941F";

function renderNavyGold(t) {
  return `${prelude(t)}<!DOCTYPE html>
<html lang="{{ $l }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${tr(t.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${NAVY_DEEP};font-family:'Poppins',Segoe UI,Helvetica,Arial,sans-serif;color:#334155;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY_DEEP};padding:40px 16px;">
<tr><td align="center">

  <!-- Logo on navy, above the card -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
    <tr><td align="center" style="padding:0 0 28px;">
      <img src="{{ .SiteURL }}/images/brand/logo-mark.png" alt="Trade in DRC" width="228" height="50" style="display:block;width:228px;height:50px;border:0;">
    </td></tr>
  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;border-top:4px solid ${GOLD};">
    <tr><td style="padding:44px 40px 8px;" align="center">
      <!-- Gold icon badge (t.icon) -->
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td align="center" valign="middle" style="width:68px;height:68px;border-radius:34px;background:${NAVY};border:3px solid ${GOLD};font-size:28px;line-height:62px;color:${GOLD};">${t.icon}</td>
      </tr></table>
      <h1 style="margin:24px 0 0;font-size:25px;line-height:1.3;font-weight:700;color:${NAVY};">${tr(t.title)}</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px;"><tr>
        <td style="width:48px;height:3px;line-height:3px;font-size:0;border-radius:2px;background:${GOLD};">&nbsp;</td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:20px 44px 0;font-size:15px;line-height:1.7;color:#475569;">
      <p style="margin:0 0 12px;">${greeting(COMMON.greeting)}</p>
      <p style="margin:0;">${tr(t.body)}</p>
    </td></tr>

    <!-- Gold CTA with navy text -->
    <tr><td style="padding:32px 40px;" align="center">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td align="center" style="border-radius:10px;background:${GOLD};background-image:linear-gradient(135deg,${GOLD_LIGHT},${GOLD} 55%,${GOLD_DARK});box-shadow:0 8px 20px -8px rgba(200,148,31,0.6);">
          <a href="{{ $url }}" style="display:inline-block;padding:15px 36px;font-size:15px;font-weight:700;color:${NAVY};text-decoration:none;border-radius:10px;letter-spacing:0.2px;">${tr(t.cta)}</a>
        </td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:0 40px 32px;font-size:12px;line-height:1.6;color:#64748B;" align="center">
      <p style="margin:0 0 6px;">${tr(COMMON.fallback)}</p>
      <p style="margin:0;word-break:break-all;"><a href="{{ $url }}" style="color:${NAVY};text-decoration:underline;">{{ $url }}</a></p>
    </td></tr>

    <!-- Security note on a soft gold tint -->
    <tr><td style="padding:0 40px 36px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="padding:14px 18px;border-radius:10px;background:#FBF5E8;border-left:3px solid ${GOLD};font-size:12px;line-height:1.6;color:#6B5320;">
          ${tr(t.note)}
        </td>
      </tr></table>
    </td></tr>
  </table>

  <!-- Navy footer -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
    <tr><td align="center" style="padding:28px 24px 0;font-size:12px;line-height:1.6;color:#94A3B8;">
      <p style="margin:0 0 6px;color:${GOLD};font-weight:600;letter-spacing:1.5px;font-size:11px;">TRADEINDRC</p>
      <p style="margin:0;">${tr(COMMON.footer)}</p>
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>
`;
}

const RENDERERS = { default: render, "navy-gold": render };

const outDir = path.join(__dirname, "..", "supabase", "templates");

if (PREVIEW) {
  const previewDir = path.join(outDir, "preview");
  fs.mkdirSync(previewDir, { recursive: true });
  for (const [file, t] of Object.entries(TEMPLATES)) {
    const html = RENDERERS[t.design ?? "default"](t)
      .replace(prelude(t), "")
      .replaceAll("{{ $l }}", PREVIEW)
      .replaceAll("{{ .Email }}", "jean@exemple.com")
      .replaceAll("{{ $url }}", `https://tradeindrc.net/${PREVIEW}/callback?redirect=%2F${PREVIEW}%2Fdashboard&token_hash=0123abcd&type=${t.otpType}`)
      .replaceAll("{{ .SiteURL }}", "https://tradeindrc.net");
    const out = path.join(previewDir, file.replace(".html", `.${PREVIEW}.html`));
    fs.writeFileSync(out, html);
    console.log(`preview: ${path.relative(process.cwd(), out)}`);
  }
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
for (const [file, t] of Object.entries(TEMPLATES)) {
  fs.writeFileSync(path.join(outDir, file), RENDERERS[t.design ?? "default"](t));
  console.log(`wrote supabase/templates/${file}`);
  console.log(`  subject: {{ $l := "en" }}{{ with .Data.locale }}{{ $l = . }}{{ end }}${tr(t.subject)}`);
}
