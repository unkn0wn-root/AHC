export interface PostModel {
	content: string;
	tags?: string[];
	images?:
		{
			uuid?: string;
			position?: number;
		}[] | never[] & {length: 0}[];
	nsfw: boolean;
	type: string;
	community: string;
}

export interface PostImageModel {
	uuid: string
}

export interface PostApiModel {
	type: string;
	title: string;
	slug: string;
	content: string;
	content_plain: string;
	excerpt: string;
	status: string;
	hot: boolean;
	images: Image[];
	tags: Tag[];
	author: Author;
	community: Community;
	community_topic: CommunityTopic;
	nsfw: boolean;
	controversial: boolean;
	sponsored: number;
	poll: Poll;
	num_likes: number;
	num_comments: number;
	num_favorites: number;
	is_liked: boolean;
	is_commented: boolean;
	is_favorited: boolean;
	comments_enabled: boolean;
	favorites_enabled: boolean;
	likes_enabled: boolean;
	promoted: number;
	reports_enabled: boolean;
	shares_enabled: boolean;
	created_at: Date;
	updated_at: Date;
	_links: PostObjectModelLinks;
}

export interface PostObjectModelLinks {
	self: Comments;
	comments: Comments;
	likes: Comments;
	favorites: Comments;
}

export interface Comments {
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
	self: Comments;
	follows: Comments;
}

export interface Avatar {
	alt: string;
	uuid: string;
}

export interface Community {
	name: string;
	slug: string;
	avatar: Avatar;
	background: Avatar;
}

export interface CommunityTopic {
	name: string;
	slug: string;
}

export interface Image {
	alt: string;
	uuid: string;
	position: number;
}

export interface Poll {
	title: string;
	options: Option[];
	num_votes: number;
	user_vote: number;
	uuid: string;
}

export interface Option {
	title: string;
	num: number;
	num_votes: number;
}

export interface Tag {
	name: string;
	_links: TagLinks;
}

export interface TagLinks {
	self: Comments;
	follows: Comments;
	blocks: Comments;
}

/** POST COMMENTS */
export interface PostComments {
	page: number;
	limit: number;
	pages: number;
	total: number;
	_embedded: Embedded;
}

export interface Embedded {
	items: Item[];
}

export interface Item {
	status: string;
	post: Post;
	author: Author;
}

export interface Author {
	username: string;
	sex: string;
	status: string;
	current_rank: string;
	current_color: string;
}
export interface Post {
	type: string;
	title: string;
	slug: string;
}

export interface ArchivePost {
	type: string;
	title: string;
	slug: string;
	content: string;
	status: string;
	images: Image[];
	tags: Tag[];
	author: Author;
	community: Community;
	nsfw: boolean;
	num_likes: number;
	num_comments: number;
	created_at: Date;
	updated_at: Date;
	links: PostObjectModelLinks;
}
