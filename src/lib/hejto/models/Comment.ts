export interface CommentModel {
	content: string;
	images?: [
		Uint32List,
		{
			uuid: string;
			position: number;
		}
	];
}

export interface PostAPIComment {
    content: string;
    content_plain: string;
    status: string;
    post: Post;
    author: Author;
    images: Image[];
    num_likes: number;
    num_reports: number;
    is_liked: boolean;
    is_reported: boolean;
    promoted: number;
    created_at: Date;
    updated_at: Date;
    uuid: string;
    _links: PostAPICommentLinks;
}

export interface PostAPICommentLinks {
    self: Likes;
    likes: Likes;
}

export interface Likes {
    href: string;
}

export interface Author {
    username: string;
    sex: string;
    avatar: Avatar;
    background: Avatar;
    status: string;
    current_rank: string;
    current_color: string;
    verified: boolean;
    sponsor: boolean;
    created_at: Date;
    _links: AuthorLinks;
}

export interface AuthorLinks {
    self: Likes;
    follows: Likes;
}

export interface Avatar {
    alt: string;
    uuid: string;
}

export interface Image {
    alt: string;
    uuid: string;
    position: number;
}

export interface Post {
    type: string;
    title: string;
    excerpt: string;
    _links: PostLinks;
}

export interface PostLinks {
    self: Likes;
    comments: Likes;
    likes: Likes;
    favorites: Likes;
}

export interface ArchiveComment {
    content: string;
    content_plain: string;
    status: string;
    post: Post;
    author: string;
    images: Image[];
    num_likes: number;
    num_reports: number;
    created_at: Date;
    updated_at: Date;
    comment_uuid: string;
    links: PostAPICommentLinks;
}
