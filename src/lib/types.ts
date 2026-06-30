export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
};

export interface RhSubmission {
  id: string;
  subject: string;
  category: string;
  priority: string;
  body: string;
  attachments: string | null;
  status: string;
  createdAt: string;
  submitterId: string;
  submitter: {
    name: string;
    email: string;
  };
}

export interface IdeaSubmission {
  id: string;
  title: string;
  category: string;
  body: string;
  createdAt: string;
}

export interface HubDocument {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  category: string;
  sortOrder: number;
}

export interface AnnouncementStats {
  totalPosts: number;
  totalReactions: number;
  pinnedPosts: number;
  newSubmissions: number;
}
