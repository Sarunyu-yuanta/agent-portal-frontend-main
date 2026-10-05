export type ClientProfile = {
  /**
   * The trading account the client books orders under.
   *
   * Not the client id: one client can hold more than one account, and the
   * booking modal prints the account the order is actually placed on. Mocked
   * here as the client id plus a two-digit account suffix, which is the shape
   * the real numbers take.
   */
  accountNo: string;
  /** The client's name in Thai — what Order Management prints as "Full Name (TH)". */
  nameTh: string;
  phone: string;
  email: string;
  lineId?: string;
  birthday: string;
  age: number;
  nationality: string;
  address: string;
  occupation: string;
  company: string;
  riskProfile: string;
  relationshipSince: string;
  referredBy?: string;
  familyMembers?: { relation: string; name: string }[];
};

const PROFILES: Record<string, ClientProfile> = {
  "110001": {
    accountNo: "11000122",
    nameTh: "ศรัณยู ศิริพัฒน์",
    phone: "+66 81 234 5678",
    email: "sarunyu.s@gmail.com",
    lineId: "sarunyu.s",
    birthday: "12 Mar 1975",
    age: 51,
    nationality: "Thai",
    address: "88/12 Sukhumvit 39, Khlong Toei Nuea, Bangkok 10110",
    occupation: "CEO",
    company: "Siripat Holdings Co., Ltd.",
    riskProfile: "Aggressive",
    relationshipSince: "Jan 2018",
    referredBy: "Thanawat Boonmee",
    familyMembers: [
      { relation: "Spouse", name: "Wanida Siripat" },
      { relation: "Son", name: "Natthawut Siripat" },
    ],
  },
  "110002": {
    accountNo: "11000222",
    nameTh: "มาลี พงษ์พิพัฒน์",
    phone: "+66 89 345 6789",
    email: "malee.p@pongpipat.co.th",
    birthday: "5 Jul 1968",
    age: 57,
    nationality: "Thai",
    address: "22/4 Wireless Road, Lumpini, Pathumwan, Bangkok 10330",
    occupation: "Director",
    company: "Pongpipat Group",
    riskProfile: "Moderate",
    relationshipSince: "Mar 2016",
    familyMembers: [
      { relation: "Spouse", name: "Krit Pongpipat" },
    ],
  },
  "110003": {
    accountNo: "11000322",
    nameTh: "ประวิทย์ สุวรรณรัตน์",
    phone: "+66 92 456 7890",
    email: "pravit.s@outlook.com",
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
    phone: "+66 84 567 8901",
    email: "nattaporn.c@chaiwong.com",
    lineId: "nattaporn_c",
    birthday: "19 Feb 1972",
    age: 54,
    nationality: "Thai",
    address: "55 Charoen Nakhon Rd, Khlong San, Bangkok 10600",
    occupation: "Founder",
    company: "Chaiwong Real Estate",
    riskProfile: "Aggressive",
    relationshipSince: "Aug 2015",
    referredBy: "Sarunyu Siripat",
    familyMembers: [
      { relation: "Daughter", name: "Pacharee Chaiwong" },
      { relation: "Son", name: "Natthaphon Chaiwong" },
    ],
  },
  "110005": {
    accountNo: "11000522",
    nameTh: "วิชัย ทองคำ",
    phone: "+66 95 678 9012",
    email: "wichai.t@thongkam.co.th",
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
    phone: "+66 86 789 0123",
    email: "siriporn.l@gmail.com",
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
    phone: "+66 81 890 1234",
    email: "thanawat.b@boonmee.co.th",
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
    phone: "+66 98 901 2345",
    email: "kannika.s@kannikasri.com",
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

const DEFAULT_PROFILE: ClientProfile = {
  accountNo: "—",
  nameTh: "—",
  phone: "+66 80 000 0000",
  email: "client@example.com",
  birthday: "1 Jan 1980",
  age: 46,
  nationality: "Thai",
  address: "Bangkok, Thailand",
  occupation: "—",
  company: "—",
  riskProfile: "Moderate",
  relationshipSince: "2020",
};

export function getClientProfile(clientId: string): ClientProfile {
  return PROFILES[clientId] ?? DEFAULT_PROFILE;
}
