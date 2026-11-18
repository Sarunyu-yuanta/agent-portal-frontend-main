/**
 * Words around dates: relative times, countdowns, deadline lines. The dates
 * themselves are formatted by `src/i18n/format.ts` (พ.ศ. in Thai); these are
 * the sentences they sit in.
 */
const dates = {
  today: "วันนี้",
  yesterday: "เมื่อวาน",
  tomorrow: "พรุ่งนี้",
  justNow: "เมื่อสักครู่",
  minutesAgo: (n: number) => `${n} นาทีที่แล้ว`,
  hoursAgo: (n: number) => `${n} ชม. ที่แล้ว`,
  daysAgo: (n: number) => `${n} วันก่อน`,
  weeksAgo: (n: number) => `${n} สัปดาห์ก่อน`,
  monthsAgo: (n: number) => `${n} เดือนก่อน`,
  inDays: (n: number) => `อีก ${n} วัน`,
  daysPast: (n: number) => `${n} วันที่แล้ว`,
  overdueDays: (n: number) => `เลยมา ${n} วัน`,
  /** "วันนี้ 09:12 น." */
  todayAt: (time: string) => `วันนี้ ${time} น.`,
  yesterdayAt: (time: string) => `เมื่อวาน ${time} น.`,
  dayAt: (day: string, time: string) => `${day} ${time} น.`,

  deadline: {
    dueToday: "ครบกำหนดวันนี้",
    overdue: (n: number) => `เลยกำหนดมา ${n} วัน`,
    actWithin: (n: number) => `ต้องดำเนินการใน ${n} วัน`,
    dueTodayOn: (day: string) => `ครบกำหนดวันนี้ ${day}`,
    overdueOn: (day: string, n: number) => `เลยกำหนด ${day} · ${n} วัน`,
    dueOn: (day: string, n: number) => `ครบกำหนด ${day} · อีก ${n} วัน`,
  },

  kyc: {
    expiresOn: (date: string) => `KYC หมดอายุ ${date}`,
    expiredDays: (n: number) => `KYC หมดอายุแล้ว ${n} วัน`,
    expiresToday: "KYC หมดอายุวันนี้",
    expiresIn: (n: number) => `KYC จะหมดอายุในอีก ${n} วัน`,
    /** The KYC tab's countdown beside the expiry date. */
    overdueBy: (n: number) => `เลยกำหนด ${n} วัน`,
    dueToday: "ครบกำหนดวันนี้",
    dueIn: (n: number) => `อีก ${n} วัน`,
  },

  campaign: {
    lastDay: "วันสุดท้าย",
    daysLeft: (n: number) => `เหลือ ${n} วัน`,
  },

  /** The Notes list's date groups. */
  notesGroup: {
    today: "วันนี้",
    yesterday: "เมื่อวาน",
    prev7: "7 วันที่ผ่านมา",
    prev30: "30 วันที่ผ่านมา",
  },

  /** The chip a note with a reminder carries. */
  reminderTag: {
    done: (day: string) => `เสร็จแล้ว · ${day}`,
    overdue: (day: string) => `เลยกำหนด · ${day}`,
    dueToday: (day: string) => `ครบกำหนดวันนี้ · ${day}`,
    scheduled: (day: string) => `เตือน · ${day}`,
  },

  /** The calendar's "in N days" line under a reminder. */
  relativeDay: {
    today: "วันนี้",
    inDays: (n: number) => `อีก ${n} วัน`,
    overdue: (n: number) => `เลยกำหนด ${n} วัน`,
  },
};

export default dates;
