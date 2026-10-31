// The owner's contact details from Admin → Settings, for the Contact page.
// Only details that are filled in are shown.

import { getSiteSettings } from "@/lib/site-content";

const SOCIALS = [
  { key: "instagram", label: "Instagram" },
  { key: "twitter", label: "X (Twitter)" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
] as const;

export async function ContactDetails() {
  const settings = await getSiteSettings();
  const socials = SOCIALS.filter((s) => settings[s.key]);

  return (
    <ul>
      {settings.supportEmail && (
        <li>
          <strong>Email:</strong> <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>
        </li>
      )}
      {settings.phone && (
        <li>
          <strong>Phone:</strong> <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>{settings.phone}</a>
        </li>
      )}
      {settings.address && (
        <li>
          <strong>Address:</strong> {settings.address}
        </li>
      )}
      {socials.map((s) => (
        <li key={s.key}>
          <strong>{s.label}:</strong>{" "}
          <a href={settings[s.key]} target="_blank" rel="noopener noreferrer">
            {settings[s.key].replace(/^https?:\/\/(www\.)?/, "")}
          </a>
        </li>
      ))}
    </ul>
  );
}
