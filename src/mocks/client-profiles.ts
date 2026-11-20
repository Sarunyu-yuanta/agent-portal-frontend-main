import type { AccountIdentity, ClientProfile } from "@/types/client";

const PROFILES: Record<string, ClientProfile> = {
  "110001": {
    accountNo: "11000122",
    nameTh: "ธนากร วัฒนา",
    phone: "+66 00 000 0002",
    email: "thanakorn.w@example.com",
    lineId: "thanakorn.w",
    birthday: "12 Mar 1975",
    age: 51,
    nationality: "Thai",
    address: "88/12 Sukhumvit 39, Khlong Toei Nuea, Bangkok 10110",
    occupation: "CEO",
    company: "Wattana Holdings Co., Ltd.",
    riskProfile: "Aggressive",
    relationshipSince: "Jan 2018",
    referredBy: "Thanawat Boonmee",
    familyMembers: [
      { relation: "Spouse", name: "Wanida Wattana" },
      { relation: "Son", name: "Natthawut Wattana" },
    ],
  },
  "110002": {
    accountNo: "11000222",
    nameTh: "มาลี พงษ์พิพัฒน์",
    phone: "+66 00 000 0003",
    email: "malee.p@example.com",
    birthday: "5 Jul 1968",
    age: 57,
    nationality: "Thai",
    address: "22/4 Wireless Road, Lumpini, Pathumwan, Bangkok 10330",
    occupation: "Director",
    company: "Pongpipat Group",
    riskProfile: "Moderate",
    relationshipSince: "Mar 2016",
    familyMembers: [{ relation: "Spouse", name: "Krit Pongpipat" }],
  },
  "110003": {
    accountNo: "11000322",
    nameTh: "ประวิทย์ สุวรรณรัตน์",
    phone: "+66 00 000 0004",
    email: "pravit.s@example.com",
    lineId: "pravit_s",
    birthday: "28 Nov 1980",
    age: 45,
    nationality: "Thai",
    address: "12 Ratchadaphisek Rd, Din Daeng, Bangkok 10400",
    occupation: "Managing Director",
    company: "Suwannarat Construction",
    riskProfile: "Moderate",
    relationshipSince: "Jun 2020",
  },
  "110004": {
    accountNo: "11000422",
    nameTh: "ณัฐพร ชัยวงศ์",
    phone: "+66 00 000 0005",
    email: "nattaporn.c@example.com",
    lineId: "nattaporn_c",
    birthday: "19 Feb 1972",
    age: 54,
    nationality: "Thai",
    address: "55 Charoen Nakhon Rd, Khlong San, Bangkok 10600",
    occupation: "Founder",
    company: "Chaiwong Real Estate",
    riskProfile: "Aggressive",
    relationshipSince: "Aug 2015",
    referredBy: "Thanakorn Wattana",
    familyMembers: [
      { relation: "Daughter", name: "Pacharee Chaiwong" },
      { relation: "Son", name: "Natthaphon Chaiwong" },
    ],
  },
  "110005": {
    accountNo: "11000522",
    nameTh: "วิชัย ทองคำ",
    phone: "+66 00 000 0006",
    email: "wichai.t@example.com",
    birthday: "3 Sep 1965",
    age: 60,
    nationality: "Thai",
    address: "8/1 Silom Rd, Bang Rak, Bangkok 10500",
    occupation: "Chairman",
    company: "Thongkam Industries",
    riskProfile: "Conservative",
    relationshipSince: "Nov 2012",
  },
  "110006": {
    accountNo: "11000622",
    nameTh: "ศิริพร ลดาวัลย์",
    phone: "+66 00 000 0007",
    email: "siriporn.l@example.com",
    lineId: "siriporn_lad",
    birthday: "14 Jun 1983",
    age: 43,
    nationality: "Thai",
    address: "101 Phahonyothin Rd, Chatuchak, Bangkok 10900",
    occupation: "CFO",
    company: "Ladawan Financial Services",
    riskProfile: "Moderate",
    relationshipSince: "Apr 2019",
  },
  "110007": {
    accountNo: "11000722",
    nameTh: "ธนวัฒน์ บุญมี",
    phone: "+66 00 000 0008",
    email: "thanawat.b@example.com",
    lineId: "thanawat_b",
    birthday: "22 Jan 1970",
    age: 56,
    nationality: "Thai",
    address: "333 Sathorn Rd, Yan Nawa, Sathorn, Bangkok 10120",
    occupation: "CEO",
    company: "Boonmee Capital Group",
    riskProfile: "Aggressive",
    relationshipSince: "Feb 2014",
    familyMembers: [
      { relation: "Spouse", name: "Orathai Boonmee" },
      { relation: "Son", name: "Teerapat Boonmee" },
    ],
  },
  "110008": {
    accountNo: "11000822",
    nameTh: "กรรณิการ์ ศรีสุพรรณ",
    phone: "+66 00 000 0009",
    email: "kannika.s@example.com",
    birthday: "8 Oct 1978",
    age: 47,
    nationality: "Thai",
    address: "47/3 Phloen Chit Rd, Lumpini, Bangkok 10330",
    occupation: "Partner",
    company: "Srisuphan Law Office",
    riskProfile: "Moderate",
    relationshipSince: "Sep 2021",
  },
};

/**
 * Clients of *other* ICs, which is a different thing from a client of ours.
 *
 * A basket is shared across the desk, so the book for one product lists
 * bookings placed by other ICs — and those are their clients, not ours. They
 * cannot be the ids in `PROFILES`: that list is the signed-in IC's own book,
 * the one Client 360 shows, and a name appearing there under somebody else's
 * IC would contradict the page it came from.
 *
 * Only what a shared book actually prints is filled in — the name, the Thai
 * name and the account. The rest is the default, because the rest is theirs:
 * this app has no business holding another desk's KYC, and the order table
 * renders "—" where it has no check to show.
 */
const OTHER_DESK_PROFILES: Record<string, Pick<ClientProfile, "accountNo" | "nameTh">> = {
  // Nalinee Vorakit's
  "220101": { accountNo: "22010122", nameTh: "อภิญญา รัตนกร" },
  "220102": { accountNo: "22010222", nameTh: "ฉัตรชัย วงศ์ศิริ" },
  "220103": { accountNo: "22010322", nameTh: "ดวงใจ เพชรา" },
  // Korn Panitchpakdi's
  "330201": { accountNo: "33020122", nameTh: "โสภณ ตระกูลวงศ์" },
  "330202": { accountNo: "33020222", nameTh: "รุ่งนภา อินทรัตน์" },
  "330203": { accountNo: "33020322", nameTh: "กิตติพงษ์ แซ่ลิ้ม" },
};

/** Their names in English, for the booking rows that print one. */
export const OTHER_DESK_CLIENT_NAMES: Record<string, string> = {
  "220101": "Apinya Rattanakorn",
  "220102": "Chatchai Wongsiri",
  "220103": "Duangjai Petchara",
  "330201": "Sophon Trakulwong",
  "330202": "Rungnapa Intharat",
  "330203": "Kittipong Saelim",
};

/**
 * The client's profile, or `undefined` when there is none on file.
 *
 * There used to be a `DEFAULT_PROFILE` here — a made-up phone number, email,
 * age and a "Moderate" risk profile — returned for any id without a record.
 * Screens then showed an IC a plausible way to call a client that wasn't
 * theirs, and a risk rating nobody had assessed. Callers now show "ไม่มีข้อมูล"
 * instead.
 */
export function getClientProfile(clientId: string): ClientProfile | undefined {
  return PROFILES[clientId];
}

/**
 * Just the account number and Thai name — what the order screens print beside
 * a booking. Unlike {@link getClientProfile} this also answers for another
 * desk's client, whose bookings share a basket with this IC's, because a
 * shared book prints that much of them and no more. "—" when neither has it.
 */
export function getAccountIdentity(clientId: string): AccountIdentity {
  const own = PROFILES[clientId];
  if (own) return { accountNo: own.accountNo, nameTh: own.nameTh };
  const other = OTHER_DESK_PROFILES[clientId];
  return { accountNo: other?.accountNo ?? "—", nameTh: other?.nameTh ?? "—" };
}

/** Every account identity this IC's screens may print, keyed by client id. */
export function getAccountIdentities(): Record<string, AccountIdentity> {
  const directory: Record<string, AccountIdentity> = {};
  for (const [id, other] of Object.entries(OTHER_DESK_PROFILES)) directory[id] = other;
  for (const [id, own] of Object.entries(PROFILES)) {
    directory[id] = { accountNo: own.accountNo, nameTh: own.nameTh };
  }
  return directory;
}
