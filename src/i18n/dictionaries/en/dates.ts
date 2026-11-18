import type th from "../th/dates";
import { plural } from "../../plural";

const days = (n: number) => `${n} ${plural(n, { one: "day", other: "days" })}`;

const dates = {
  today: "Today",
  yesterday: "Yesterday",
  tomorrow: "Tomorrow",
  justNow: "Just now",
  minutesAgo: (n: number) => `${n} ${plural(n, { one: "minute", other: "minutes" })} ago`,
  hoursAgo: (n: number) => `${n} ${plural(n, { one: "hour", other: "hours" })} ago`,
  daysAgo: (n: number) => `${days(n)} ago`,
  weeksAgo: (n: number) => `${n} ${plural(n, { one: "week", other: "weeks" })} ago`,
  monthsAgo: (n: number) => `${n} ${plural(n, { one: "month", other: "months" })} ago`,
  inDays: (n: number) => `In ${days(n)}`,
  daysPast: (n: number) => `${days(n)} ago`,
  overdueDays: (n: number) => `${days(n)} overdue`,
  todayAt: (time: string) => `Today ${time}`,
  yesterdayAt: (time: string) => `Yesterday ${time}`,
  dayAt: (day: string, time: string) => `${day} ${time}`,

  deadline: {
    dueToday: "Due today",
    overdue: (n: number) => `${days(n)} overdue`,
    actWithin: (n: number) => `Act within ${days(n)}`,
    dueTodayOn: (day: string) => `Due today, ${day}`,
    overdueOn: (day: string, n: number) => `Was due ${day} · ${days(n)} overdue`,
    dueOn: (day: string, n: number) => `Due ${day} · in ${days(n)}`,
  },

  kyc: {
    expiresOn: (date: string) => `KYC expires ${date}`,
    expiredDays: (n: number) => `KYC expired ${days(n)} ago`,
    expiresToday: "KYC expires today",
    expiresIn: (n: number) => `KYC expires in ${days(n)}`,
    overdueBy: (n: number) => `Overdue by ${days(n)}`,
    dueToday: "Due today",
    dueIn: (n: number) => `in ${days(n)}`,
  },

  campaign: {
    lastDay: "Last day",
    daysLeft: (n: number) => `${days(n)} left`,
  },

  notesGroup: {
    today: "Today",
    yesterday: "Yesterday",
    prev7: "Previous 7 days",
    prev30: "Previous 30 days",
  },

  reminderTag: {
    done: (day: string) => `Done · ${day}`,
    overdue: (day: string) => `Overdue · ${day}`,
    dueToday: (day: string) => `Due today · ${day}`,
    scheduled: (day: string) => `Reminder · ${day}`,
  },

  relativeDay: {
    today: "Today",
    inDays: (n: number) => `In ${days(n)}`,
    overdue: (n: number) => `${days(n)} overdue`,
  },
} satisfies typeof th;

export default dates;
