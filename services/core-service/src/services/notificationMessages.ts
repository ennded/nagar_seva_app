import type { Language } from 'shared';

export type NotifyType =
  | 'new_request'
  | 'request_verified'
  | 'request_rejected'
  | 'request_assigned'
  | 'request_in_progress'
  | 'request_completed'
  | 'request_closed'
  | 'appointment_scheduled'
  | 'announcement_published';

export interface NotifyParams {
  title?: string;
  purpose?: string;
  label?: string;
  note?: string;
  date?: string;
  slot?: string;
  scope?: 'ward' | 'city';
}

type Template = (lang: Language, params: NotifyParams) => string;

// Bilingual copy for every backend-generated notification. Keep in sync with
// request.service.ts / announcement.resolvers.ts's notifyRecipients() call sites — this is the
// single place that renders the final message text, per-recipient, in their stored language.
const TEMPLATES: Record<NotifyType, Template> = {
  new_request: (lang, p) =>
    p.title !== undefined
      ? lang === 'mr'
        ? `नवीन तक्रार नोंदवली: ${p.title}`
        : `New complaint registered: ${p.title}`
      : lang === 'mr'
        ? `नवीन भेटीची विनंती: ${p.purpose}`
        : `New appointment requested: ${p.purpose}`,
  request_verified: (lang, p) =>
    lang === 'mr' ? `तुमची विनंती सत्यापित झाली: ${p.label}` : `Your request has been verified: ${p.label}`,
  request_rejected: (lang, p) =>
    lang === 'mr'
      ? `तुमची विनंती नाकारली गेली: ${p.label}${p.note ? ` — ${p.note}` : ''}`
      : `Your request was rejected: ${p.label}${p.note ? ` — ${p.note}` : ''}`,
  request_assigned: (lang, p) =>
    lang === 'mr'
      ? `तुमची विनंती अधिकाऱ्याकडे सोपवली आहे: ${p.label}`
      : `Your request has been assigned to an officer: ${p.label}`,
  request_in_progress: (lang, p) =>
    lang === 'mr' ? `तुमच्या विनंतीवर काम सुरू झाले आहे: ${p.label}` : `Work has started on your request: ${p.label}`,
  request_completed: (lang, p) =>
    lang === 'mr' ? `तक्रार पूर्ण झाली: ${p.title}` : `Complaint completed: ${p.title}`,
  request_closed: (lang, p) =>
    lang === 'mr' ? `तुमची विनंती बंद करण्यात आली: ${p.label}` : `Your request has been closed: ${p.label}`,
  appointment_scheduled: (lang, p) =>
    lang === 'mr'
      ? `तुमची भेट निश्चित झाली आहे: ${p.date} ${p.slot}`
      : `Your appointment is scheduled for ${p.date} ${p.slot}`,
  announcement_published: (lang, p) =>
    p.scope === 'ward'
      ? lang === 'mr'
        ? `तुमच्या वॉर्डसाठी नवीन सूचना: ${p.title}`
        : `New notice for your ward: ${p.title}`
      : lang === 'mr'
        ? `नवीन सूचना: ${p.title}`
        : `New notice: ${p.title}`,
};

export function buildNotificationMessage(type: NotifyType, lang: Language, params: NotifyParams): string {
  return TEMPLATES[type](lang, params);
}
