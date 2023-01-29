export interface UserProfileModel {
    username: string;
    sex: string;
    description: string;
    city: string;
    avatar: Avatar;
    background: Avatar;
    status: string;
    achievements: AchievementElement[];
    stats: Stats;
    interactions: Interactions;
    current_rank: string;
    current_color: string;
    verified: boolean;
    sponsor: boolean;
    created_at: Date;
    _links: UserLinks;
}

export interface UserLinks {
    self: Follows;
    follows: Follows;
}

export interface Follows {
    href: string;
}

export interface AchievementElement {
    achievement: AchievementAchievement;
    created_at: Date;
}

export interface AchievementAchievement {
    name: string;
    slug: string;
    description: string;
    icon: Avatar;
    created_at: Date;
    _links: AchievementLinks;
}

export interface AchievementLinks {
    self: Follows;
}

export interface Avatar {
    alt: string;
    uuid: string;
}

export interface Interactions {
    is_followed: boolean;
    is_blocked: boolean;
}

export interface Stats {
    num_follows: number;
    num_posts: number;
    num_comments: number;
    num_community_members: number;
}
