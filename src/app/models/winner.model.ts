export interface Winner {
  couponNumber: string;
  prizeName: string;
  prizeNumber: string;
  customerName: string;
  agentName: string;
  createdDate: string;
  avatarUrl?: string; // Client-side enhancement for UI
  timeString?: string; // Client-side enhancement (e.g., "Just now")
}
