import type { Dictionary } from "../th";
import { plural } from "../../plural";
import orders from "./orders";
import dates from "./dates";
import fund from "./fund";
import stock from "./stock";
import products from "./products";
import client from "./client";
import commandCenter from "./commandCenter";
import planner from "./planner";
import shell from "./shell";
import research from "./research";
import compliance from "./compliance";
import pipeline from "./pipeline";
import performance from "./performance";
import campaigns from "./campaigns";
import learning from "./learning";

/**
 * English. Must match `th/index.ts` key for key — `satisfies Dictionary` turns
 * a missing or misspelled key into a compile error.
 */
const en = {
  orders,
  dates,
  fund,
  stock,
  products,
  client,
  commandCenter,
  planner,
  shell,
  research,
  compliance,
  pipeline,
  performance,
  campaigns,
  learning,
  common: {
    back: "Back",
    backHome: "Back to home",
    close: "Close",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
    sending: "Sending…",
    loading: "Loading…",
    noData: "No data",
    notSpecified: "Not specified",
    showing: (from: number, to: number, total: number) =>
      `Showing ${from}–${to} of ${total} ${plural(total, { one: "item", other: "items" })}`,
  },

  states: {
    loadErrorTitle: "Couldn't load this",
    loadErrorBody: "Check your connection and try again.",
    staleBanner: "This may be out of date — the last refresh failed.",
    retry: "Try again",
    saveError: "Couldn't save. Try again.",
    deleteError: "Couldn't delete. Try again.",
    sendError: "Couldn't send. Try again.",
    empty: "Nothing here yet",
    noResultTitle: "No matching results",
    noResultBody: "Try a different search or change the filters.",
    noFilterResultTitle: "Nothing matches these filters",
    noFilterResultBody: "Change or clear the filters.",
    clearFilters: "Clear filters",
    notFoundPage: "Page not found",
    notFoundPageBody: "The page you're looking for may have moved, been removed, or never existed.",
    notFoundClient: "Client not found",
    notFoundProduct: "Product not found",
    notFoundOrder: "Order not found",
    backToClientHub: "Back to Client 360",
    pageErrorTitle: "This page couldn't be displayed",
    pageErrorBody:
      "Something went wrong while showing this page. Try again, or pick another page from the menu.",
  },

  nav: {
    sections: {
      workspace: "Workspace",
      sales: "Sales",
      planner: "Planner",
      growth: "Growth",
    },
    items: {
      "command-center": "Command Center",
      "client-hub": "Client 360",
      insights: "Insights",
      promotions: "Promotion/Events",
      "product-catalog": "Product Catalog",
      orders: "Order Management",
      performance: "Performance",
      "ic-learning": "IC Learning",
      "yaa-team-head": "YAA/Team Head",
      notes: "Notes",
      calendar: "Calendar",
      reminders: "Reminders",
    },
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
    showClientNames: "Show client names",
    hideClientNames: "Hide client names",
    openNavigation: "Open navigation",
    openNotifications: "Open notifications",
    notifications: "Notifications",
    noNotifications: "No notifications",
    logout: "Log out",
    language: "Language",
    accountOf: (name: string) => `${name}'s account`,
  },

  pageTitles: {
    "/command-center": "Command Center",
    "/client-hub": "Client 360",
    "/pipeline": "Pipeline",
    "/ai-insights": "AI Insights",
    "/promotions": "Promotion/Events",
    "/client": "Client 360",
    "/performance": "Performance",
    "/compliance": "Compliance & Risk",
    "/insights": "Insights",
    "/ic-learning": "IC Learning",
    "/yaa-team-head": "YAA/Team Head",
    "/product-catalog": "Product Catalog",
    "/orders": "Order Management",
    "/notes": "Notes",
    "/calendar": "Calendar",
    "/reminders": "Reminders",
  },

  auth: {
    loginTitle: "Sign in to IC Portal",
    employeeId: "Employee ID",
    password: "Password",
    forgotPassword: "Forgot password",
    login: "Sign in",
    signingIn: "Signing in",
    showPassword: "Show password",
    hidePassword: "Hide password",
    copyright: "©Copyright 2016 Yuanta Securities (Thailand). All Rights Reserved",
    errors: {
      credentials: "Incorrect employee ID or password.",
      locked: "This account is temporarily locked. Contact your administrator.",
      network: "Couldn't reach the server. Check your internet connection and try again.",
    },
    forgot: {
      title: "Forgot password",
      body: "Enter the email you registered with and we'll send you a link to set a new password.",
      email: "Email",
      submit: "Send reset link",
      emailRequired: "Enter your email.",
      emailInvalid: "That doesn't look like an email address.",
      requestFailed: "Couldn't send the link. Check your connection and try again.",
      sentTitle: "Email sent",
      sentBodyBefore: "If",
      sentBodyAfter: "is registered, we've sent a link to set a new password. Check your inbox.",
    },
    reset: {
      title: "Set a new password",
      body: "Choose a new password for your account.",
      newPassword: "New password",
      confirmPassword: "Confirm new password",
      submit: "Save new password",
      passwordRequired: "Enter a password.",
      passwordTooShort: (min: number) => `Use at least ${min} characters.`,
      confirmRequired: "Confirm your password.",
      mismatch: "The passwords don't match.",
      requestFailed: "Couldn't set the password. Check your connection and try again.",
      doneTitle: "Password changed",
      doneBody: "You can sign in with your new password now.",
      invalidTitle: "This link is invalid or has expired",
      invalidBody:
        "A reset link works once and only for a limited time. Request a new one to set your password.",
      requestNew: "Request a new link",
    },
  },

  assetClass: {
    หุ้นไทย: "Thai equities",
    หุ้นต่างประเทศ: "Foreign equities",
    อนุพันธ์: "Derivatives",
    กองทุนรวม: "Mutual funds",
    ตราสารหนี้: "Fixed income",
    ตราสารหนี้ต่างประเทศ: "Foreign fixed income",
    หุ้นกู้ที่มีอนุพันธ์แฝง: "Structured notes",
    เงินสด: "Cash",
  } as Record<string, string>,

  clientHub: {
    columns: {
      clientId: "Client ID",
      client: "Client",
      aum: "AUM (THB)",
      thaiStock: "Thai equities (THB)",
      foreignStock: "Foreign equities (THB)",
      derivatives: "TFEX (THB)",
      mutualFund: "Mutual funds (THB)",
      bond: "Fixed income (THB)",
      foreignBond: "Foreign fixed income (THB)",
      structuredBond: "Structured notes (THB)",
      cashIdle: "Cash (THB)",
      plYtd: "YTD P&L (%)",
      liabilities: "Liabilities (THB)",
    } as Record<string, string>,
  },

  promotions: {
    seatState: { available: "Seats left", full: "Full", past: "Past" },
    product: {
      stock: "Stocks",
      "mutual-fund": "Funds",
      global: "Global",
      fcn: "FCN",
      bond: "Bond",
    },
    status: { upcoming: "Coming soon", active: "Running", ended: "Ended" },
    segment: {
      uhnw: "UHNW",
      hnw: "HNW",
      aggressive: "Aggressive",
      moderate: "Moderate",
      conservative: "Conservative",
      "idle-cash": "Idle cash",
    },
    format: { online: "Online", onsite: "Onsite" },
    type: { promotion: "Promotions", event: "Seminars & events" },
    clientStatus: {
      "not-sent": "Not sent",
      sent: "Sent",
      interested: "Interested",
      redeemed: "Redeemed",
    },
    rsvp: {
      registered: "Registered",
      confirmed: "Confirmed",
      attended: "Attended",
      "no-show": "No-show",
    },
    noPeriod: "No set period",
    statusLine: {
      running: "Running",
      endedOn: (date: string) => `Ended ${date}`,
      notStarted: "Not started",
      lastDayToday: "Last day today",
      daysLeft: (n: number) => `${n} ${n === 1 ? "day" : "days"} left`,
    },
  },

  buckets: {
    past: { today: "Today", yesterday: "Yesterday", week: "Past 7 days", earlier: "Earlier" },
    reminder: { overdue: "Overdue", today: "Today", upcoming: "Upcoming", done: "Done" },
    zone: {
      overdue: "Overdue",
      today: "Today",
      tomorrow: "Tomorrow",
      thisWeek: "This week",
      next2Weeks: "Next 2 weeks",
    },
  },

  catalog: {
    fundDetailTabs: {
      overview: "Overview",
      returns: "Returns",
      allocation: "Allocation",
      info: "Fund info",
    },
  },

  insights: {
    allResearch: "All research",
  },

  risk: {
    severity: { critical: "Critical", warning: "Warning", watch: "Watch" },
    category: {
      margin: "Margin / credit",
      suitability: "Suitability",
      conduct: "Trading conduct",
      other: "Other",
    },
    all: "All",
    cta: "Lorem ipsum",
  },

  globalError: {
    title: "Something went wrong",
    body: "An unexpected error occurred. Please try again.",
  },
} satisfies Dictionary;

export default en;
