import type { TranslationSchema } from './en';

// Hebrew (RTL) bundle. Typed against the en schema so key drift between the
// two locales cannot compile — "both languages from day one" (CLAUDE.md).
// The Hebrew-script brand rendering and the onboarding copy are placeholder
// translations; final copy comes with the deferred palette/copy pass.
export const he: TranslationSchema = {
  home: {
    title: 'לוקאל טיים',
  },
  onboarding: {
    pages: {
      valueProposition: {
        title: 'זמן ביחד, בלי הסחות דעת',
        body: 'לוקאל טיים חוסמת אפליקציות מסיחות דעת בזמן שאתם באמת ביחד — כך שלהיות נוכחים הופך לבחירה הקלה.',
      },
      howSessionsWork: {
        title: 'סשן זה דבר פשוט',
        body: 'מתחילים סשן או סורקים קוד QR של חבר. אפליקציות מסיחות דעת נשארות חסומות עד סוף הסשן, וצוברים נקודות על כל דקה של נוכחות.',
      },
      whyPermissionsMatter: {
        title: 'הרשאה אחת עושה את ההבדל',
        body: 'כדי לחסום אפליקציות באמת, הטלפון דורש הרשאת זמן מסך. נבקש אותה במסך הבא — והיא משמשת אך ורק במהלך סשן שבחרתם להתחיל.',
      },
    },
    skip: 'דילוג',
    next: 'הבא',
    getStarted: 'מתחילים',
  },
};
