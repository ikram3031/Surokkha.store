import { recordNotification, sendSystemMail, buildNotificationHtml, rowsToText, formatWhen } from "../services/notification.service.js";
import { config } from "../config/index.js";

/**
 * A finished `make deploy`: dashboard bell notification and a deploy report placed in the Webmail (IMAP)
 * inbox only. No SMTP email goes out to anyone. Never throws.
 * entry: { target, version, commit, branch, host, at, status }
 */
export const notifyDeploy = async ({ target, version, commit = "", branch = "", host = "", at = new Date(), status = "SUCCESS" }) => {
  const ok = String(status).toUpperCase() !== "FAILED";
  const brand = config.brandName || "Surokkha";
  const rows = [
    ["Status", ok ? "Completed" : "Failed"],
    ["Version", `v${version}`],
    ["Commit", commit || "—"],
    ["Branch", branch || "—"],
    ["Server", host || "—"],
    ["When", formatWhen(new Date(at))],
  ];

  await recordNotification({
    type: "deploy",
    typeDid: "117",
    description: `${ok ? "Deployed" : "Deploy FAILED"} ${brand} v${version}${commit ? `: ${commit.slice(0, 80)}` : ""}`,
    createdBy: "make-deploy",
  });

  await sendSystemMail({
    to: [],
    subject: `${ok ? "🚀" : "❌"} ${brand} deployed v${version}${ok ? "" : " (FAILED)"}`,
    html: buildNotificationHtml({
      heading: ok ? "Deploy completed" : "Deploy failed",
      subheading: `${brand} · make deploy`,
      rows,
      accent: ok ? "#059669" : "#dc2626",
    }),
    text: rowsToText(rows),
    fromName: `${brand} Deploy`,
    headers: { "X-Surokkha-System": `deploy ${target}` },
  });
};
