export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface FamilyWithMembers extends Family {
  members: Member[];
}

export interface Member {
  id: string;
  user_id: string;
  family_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile?: {
    display_name: string;
    avatar_url: string | null;
    email: string;
  };
}
