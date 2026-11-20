/** One logged call between the IC and a client. */
export type CallLogEntry = {
  id: string;
  date: string;
  time: string;
  duration: string;
  direction: "inbound" | "outbound";
  summary: string;
};
