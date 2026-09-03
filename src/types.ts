export interface Challenge {
  id: string;
  title: string;
  description: string;
  task: string;
  expectedResult: string;
  reward: number;
  deadline: any; // Firestore Timestamp
  rules: string;
  submissionRequirements: string;
  status: 'open' | 'closed';
  submissionsCount: number;
  createdAt: any;
  createdBy: string;
}

export interface Submission {
  id: string;
  challengeId: string;
  participantId: string;
  participantName: string;
  challengeTitle: string;
  response: string;
  submittedLink: string;
  fileData?: string; // base64 string
  status: 'pending' | 'approved' | 'rejected';
  adminFeedback?: string;
  submittedAt: any;
  verifiedAt?: any;
}

export interface Transaction {
  id: string;
  participantId: string;
  amount: number;
  type: 'reward';
  challengeId: string;
  challengeTitle: string;
  description: string;
  createdAt: any;
}

export interface Channel {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  subscribersCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface Video {
  id: string;
  channelId: string;
  ownerId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  viewsCount: number;
  likesCount: number;
  status: 'public' | 'private';
  createdAt: any;
  updatedAt: any;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: any;
}
