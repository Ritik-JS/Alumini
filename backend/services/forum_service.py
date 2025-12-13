"""Forum service for handling forum posts, comments, and likes"""
import logging
import uuid
from typing import Optional
import json

from database.connection import get_db_pool
from database.models import (
    ForumPostCreate, ForumPostUpdate, ForumPostResponse,
    ForumPostWithAuthor, ForumCommentCreate, ForumCommentUpdate,
    ForumCommentResponse, ForumCommentWithAuthor, LikeToggleResponse
)

logger = logging.getLogger(__name__)


class ForumService:
    """Service for forum operations"""
    
    # ========== Forum Post Methods ==========
    
    @staticmethod
    async def create_post(post_data: ForumPostCreate, author_id: str) -> ForumPostResponse:
        """Create a new forum post"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Generate UUID for the post
                post_id = str(uuid.uuid4())
                tags_json = json.dumps(post_data.tags) if post_data.tags else None
                
                query = """
                INSERT INTO forum_posts (id, title, content, author_id, tags)
                VALUES (%s, %s, %s, %s, %s)
                """
                await cursor.execute(query, (
                    post_id,
                    post_data.title,
                    post_data.content,
                    author_id,
                    tags_json
                ))
                await conn.commit()
                
                await cursor.execute("SELECT * FROM forum_posts WHERE id = %s", (post_id,))
                post_row = await cursor.fetchone()
                
                if post_row:
                    return ForumService._post_from_row(post_row, cursor)
                
        raise ValueError("Failed to create post")
    
    @staticmethod
    async def get_post_by_id(post_id: str, user_id: Optional[str] = None) -> Optional[ForumPostWithAuthor]:
        """Get forum post by ID with author details"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Increment views count
                await cursor.execute(
                    "UPDATE forum_posts SET views_count = views_count + 1 WHERE id = %s",
                    (post_id,)
                )
                await conn.commit()
                
                query = """
                SELECT 
                    p.id, p.title, p.content, p.author_id, p.tags,
                    p.likes_count, p.comments_count, p.views_count,
                    p.is_pinned, p.is_deleted, p.created_at, p.updated_at,
                    u.email as author_email,
                    COALESCE(ap.name, u.email) as author_name,
                    ap.photo_url as author_photo_url,
                    u.role as author_role
                FROM forum_posts p
                INNER JOIN users u ON p.author_id = u.id
                LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                WHERE p.id = %s AND p.is_deleted = FALSE
                """
                await cursor.execute(query, (post_id,))
                row = await cursor.fetchone()
                
                if row:
                    # Check if user has liked the post
                    user_has_liked = False
                    if user_id:
                        await cursor.execute(
                            "SELECT id FROM post_likes WHERE post_id = %s AND user_id = %s",
                            (post_id, user_id)
                        )
                        user_has_liked = await cursor.fetchone() is not None
                    
                    # Parse tags
                    tags = json.loads(row[4]) if row[4] else []
                    
                    return ForumPostWithAuthor(
                        id=row[0],
                        title=row[1],
                        content=row[2],
                        author_id=row[3],
                        tags=tags,
                        likes_count=row[5],
                        comments_count=row[6],
                        views_count=row[7],
                        is_pinned=row[8],
                        is_deleted=row[9],
                        created_at=row[10],
                        updated_at=row[11],
                        author_email=row[12],
                        author_name=row[13],
                        author_photo_url=row[14],
                        author_role=row[15],
                        user_has_liked=user_has_liked
                    )
                
        return None
    
    @staticmethod
    async def get_all_posts(
        search: Optional[str] = None,
        tags: Optional[list[str]] = None,
        sort_by: str = "recent",
        limit: int = 50,
        offset: int = 0,
        user_id: Optional[str] = None
    ) -> list[ForumPostWithAuthor]:
        """Get all forum posts with filters"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                query = """
                SELECT 
                    p.id, p.title, p.content, p.author_id, p.tags,
                    p.likes_count, p.comments_count, p.views_count,
                    p.is_pinned, p.is_deleted, p.created_at, p.updated_at,
                    u.email as author_email,
                    COALESCE(ap.name, u.email) as author_name,
                    ap.photo_url as author_photo_url,
                    u.role as author_role
                FROM forum_posts p
                INNER JOIN users u ON p.author_id = u.id
                LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                WHERE p.is_deleted = FALSE
                """
                params = []
                
                if search:
                    query += " AND (p.title LIKE %s OR p.content LIKE %s)"
                    search_param = f"%{search}%"
                    params.extend([search_param, search_param])
                
                if tags:
                    # Search for posts containing any of the tags
                    tag_conditions = []
                    for tag in tags:
                        query += " AND p.tags LIKE %s"
                        params.append(f"%{tag}%")
                
                # Sort
                if sort_by == "popular":
                    query += " ORDER BY p.likes_count DESC, p.created_at DESC"
                elif sort_by == "trending":
                    query += " ORDER BY (p.likes_count + p.comments_count) DESC, p.created_at DESC"
                else:  # recent
                    query += " ORDER BY p.is_pinned DESC, p.created_at DESC"
                
                query += " LIMIT %s OFFSET %s"
                params.extend([limit, offset])
                
                await cursor.execute(query, tuple(params))
                rows = await cursor.fetchall()
                
                posts = []
                for row in rows:
                    # Check if user has liked the post
                    user_has_liked = False
                    if user_id:
                        await cursor.execute(
                            "SELECT id FROM post_likes WHERE post_id = %s AND user_id = %s",
                            (row[0], user_id)
                        )
                        user_has_liked = await cursor.fetchone() is not None
                    
                    # Parse tags
                    tags = json.loads(row[4]) if row[4] else []
                    
                    posts.append(ForumPostWithAuthor(
                        id=row[0],
                        title=row[1],
                        content=row[2],
                        author_id=row[3],
                        tags=tags,
                        likes_count=row[5],
                        comments_count=row[6],
                        views_count=row[7],
                        is_pinned=row[8],
                        is_deleted=row[9],
                        created_at=row[10],
                        updated_at=row[11],
                        author_email=row[12],
                        author_name=row[13],
                        author_photo_url=row[14],
                        author_role=row[15],
                        user_has_liked=user_has_liked
                    ))
                
                return posts
    
    @staticmethod
    async def get_posts_by_author(author_id: str) -> list[ForumPostWithAuthor]:
        """Get all posts by a specific author"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                query = """
                SELECT 
                    p.id, p.title, p.content, p.author_id, p.tags,
                    p.likes_count, p.comments_count, p.views_count,
                    p.is_pinned, p.is_deleted, p.created_at, p.updated_at,
                    u.email as author_email,
                    COALESCE(ap.name, u.email) as author_name,
                    ap.photo_url as author_photo_url,
                    u.role as author_role
                FROM forum_posts p
                INNER JOIN users u ON p.author_id = u.id
                LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                WHERE p.author_id = %s AND p.is_deleted = FALSE
                ORDER BY p.created_at DESC
                """
                await cursor.execute(query, (author_id,))
                rows = await cursor.fetchall()
                
                posts = []
                for row in rows:
                    tags = json.loads(row[4]) if row[4] else []
                    posts.append(ForumPostWithAuthor(
                        id=row[0],
                        title=row[1],
                        content=row[2],
                        author_id=row[3],
                        tags=tags,
                        likes_count=row[5],
                        comments_count=row[6],
                        views_count=row[7],
                        is_pinned=row[8],
                        is_deleted=row[9],
                        created_at=row[10],
                        updated_at=row[11],
                        author_email=row[12],
                        author_name=row[13],
                        author_photo_url=row[14],
                        author_role=row[15],
                        user_has_liked=False  # Not needed for own posts
                    ))
                
                return posts
    
    @staticmethod
    async def get_all_tags() -> list[str]:
        """Get all unique tags from all posts"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                query = """
                SELECT DISTINCT tags 
                FROM forum_posts 
                WHERE tags IS NOT NULL 
                AND tags != 'null' 
                AND tags != '[]'
                AND is_deleted = FALSE
                """
                await cursor.execute(query)
                rows = await cursor.fetchall()
                
                # Extract all unique tags
                all_tags = set()
                for row in rows:
                    if row[0]:
                        try:
                            tags_list = json.loads(row[0])
                            if isinstance(tags_list, list):
                                all_tags.update(tags_list)
                        except:
                            pass
                
                return sorted(list(all_tags))
    
    @staticmethod
    async def update_post(post_id: str, post_data: ForumPostUpdate) -> Optional[ForumPostResponse]:
        """Update a forum post"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                update_fields = []
                params = []
                
                if post_data.title is not None:
                    update_fields.append("title = %s")
                    params.append(post_data.title)
                
                if post_data.content is not None:
                    update_fields.append("content = %s")
                    params.append(post_data.content)
                
                if post_data.tags is not None:
                    update_fields.append("tags = %s")
                    params.append(json.dumps(post_data.tags))
                
                if post_data.is_pinned is not None:
                    update_fields.append("is_pinned = %s")
                    params.append(post_data.is_pinned)
                
                if not update_fields:
                    await cursor.execute("SELECT * FROM forum_posts WHERE id = %s", (post_id,))
                    row = await cursor.fetchone()
                    if row:
                        return ForumService._post_from_row(row, cursor)
                    return None
                
                query = f"UPDATE forum_posts SET {', '.join(update_fields)} WHERE id = %s"
                params.append(post_id)
                
                await cursor.execute(query, tuple(params))
                await conn.commit()
                
                await cursor.execute("SELECT * FROM forum_posts WHERE id = %s", (post_id,))
                row = await cursor.fetchone()
                if row:
                    return ForumService._post_from_row(row, cursor)
                
        return None
    
    @staticmethod
    async def delete_post(post_id: str) -> bool:
        """Soft delete a forum post"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE forum_posts SET is_deleted = TRUE WHERE id = %s",
                    (post_id,)
                )
                await conn.commit()
                return cursor.rowcount > 0
    
    @staticmethod
    async def toggle_post_like(post_id: str, user_id: str) -> LikeToggleResponse:
        """Toggle like on a post"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Check if already liked
                await cursor.execute(
                    "SELECT id FROM post_likes WHERE post_id = %s AND user_id = %s",
                    (post_id, user_id)
                )
                existing_like = await cursor.fetchone()
                
                if existing_like:
                    # Unlike
                    await cursor.execute(
                        "DELETE FROM post_likes WHERE post_id = %s AND user_id = %s",
                        (post_id, user_id)
                    )
                    liked = False
                else:
                    # Like - Generate UUID for the like
                    like_id = str(uuid.uuid4())
                    await cursor.execute(
                        "INSERT INTO post_likes (id, post_id, user_id) VALUES (%s, %s, %s)",
                        (like_id, post_id, user_id)
                    )
                    liked = True
                
                await conn.commit()
                
                # Get updated likes count
                await cursor.execute(
                    "SELECT likes_count FROM forum_posts WHERE id = %s",
                    (post_id,)
                )
                row = await cursor.fetchone()
                likes_count = row[0] if row else 0
                
                return LikeToggleResponse(liked=liked, likes_count=likes_count)
    
    # ========== Forum Comment Methods ==========
    
    @staticmethod
    async def create_comment(post_id: str, comment_data: ForumCommentCreate, author_id: str) -> ForumCommentResponse:
        """Create a new comment on a post"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Generate UUID for the comment
                comment_id = str(uuid.uuid4())
                
                query = """
                INSERT INTO forum_comments (id, post_id, author_id, parent_comment_id, content)
                VALUES (%s, %s, %s, %s, %s)
                """
                await cursor.execute(query, (
                    comment_id,
                    post_id,
                    author_id,
                    comment_data.parent_comment_id,
                    comment_data.content
                ))
                await conn.commit()
                
                await cursor.execute("SELECT * FROM forum_comments WHERE id = %s", (comment_id,))
                comment_row = await cursor.fetchone()
                
                if comment_row:
                    return ForumService._comment_from_row(comment_row, cursor)
                
        raise ValueError("Failed to create comment")
    
    @staticmethod
    async def get_post_comments(post_id: str, user_id: Optional[str] = None) -> list[ForumCommentWithAuthor]:
        """Get all comments for a post with nested replies"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                query = """
                SELECT 
                    c.id, c.post_id, c.author_id, c.parent_comment_id, c.content,
                    c.likes_count, c.is_deleted, c.created_at, c.updated_at,
                    u.email as author_email,
                    COALESCE(ap.name, u.email) as author_name,
                    ap.photo_url as author_photo_url,
                    u.role as author_role
                FROM forum_comments c
                INNER JOIN users u ON c.author_id = u.id
                LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
                WHERE c.post_id = %s AND c.is_deleted = FALSE
                ORDER BY c.created_at ASC
                """
                await cursor.execute(query, (post_id,))
                rows = await cursor.fetchall()
                
                # Build comments with author details
                all_comments = {}
                root_comments = []
                
                for row in rows:
                    comment_id = row[0]
                    parent_id = row[3]
                    
                    # Check if user has liked the comment
                    user_has_liked = False
                    if user_id:
                        await cursor.execute(
                            "SELECT id FROM comment_likes WHERE comment_id = %s AND user_id = %s",
                            (comment_id, user_id)
                        )
                        user_has_liked = await cursor.fetchone() is not None
                    
                    comment = ForumCommentWithAuthor(
                        id=comment_id,
                        post_id=row[1],
                        author_id=row[2],
                        parent_comment_id=parent_id,
                        content=row[4],
                        likes_count=row[5],
                        is_deleted=row[6],
                        created_at=row[7],
                        updated_at=row[8],
                        author_email=row[9],
                        author_name=row[10],
                        author_photo_url=row[11],
                        author_role=row[12],
                        user_has_liked=user_has_liked,
                        replies=[]
                    )
                    
                    all_comments[comment_id] = comment
                    
                    if parent_id is None:
                        root_comments.append(comment)
                
                # Build nested structure
                for comment in all_comments.values():
                    if comment.parent_comment_id and comment.parent_comment_id in all_comments:
                        all_comments[comment.parent_comment_id].replies.append(comment)
                
                return root_comments
    
    @staticmethod
    async def update_comment(comment_id: str, comment_data: ForumCommentUpdate) -> Optional[ForumCommentResponse]:
        """Update a comment"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE forum_comments SET content = %s WHERE id = %s",
                    (comment_data.content, comment_id)
                )
                await conn.commit()
                
                await cursor.execute("SELECT * FROM forum_comments WHERE id = %s", (comment_id,))
                row = await cursor.fetchone()
                if row:
                    return ForumService._comment_from_row(row, cursor)
                
        return None
    
    @staticmethod
    async def get_comment_by_id(comment_id: str) -> Optional[ForumCommentResponse]:
        """Get comment by ID"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT * FROM forum_comments WHERE id = %s AND is_deleted = FALSE",
                    (comment_id,)
                )
                row = await cursor.fetchone()
                if row:
                    return ForumService._comment_from_row(row, cursor)
        return None
    
    @staticmethod
    async def delete_comment(comment_id: str, user_id: Optional[str] = None, is_admin: bool = False) -> bool:
        """Soft delete a comment with optional author verification"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Check comment exists and get author
                await cursor.execute(
                    "SELECT author_id FROM forum_comments WHERE id = %s AND is_deleted = FALSE",
                    (comment_id,)
                )
                row = await cursor.fetchone()
                
                if not row:
                    return False
                
                # Verify authorization if user_id provided
                if user_id and row[0] != user_id and not is_admin:
                    raise ValueError("Not authorized to delete this comment")
                
                await cursor.execute(
                    "UPDATE forum_comments SET is_deleted = TRUE WHERE id = %s",
                    (comment_id,)
                )
                await conn.commit()
                return cursor.rowcount > 0
    
    @staticmethod
    async def toggle_comment_like(comment_id: str, user_id: str) -> LikeToggleResponse:
        """Toggle like on a comment"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Check if already liked
                await cursor.execute(
                    "SELECT id FROM comment_likes WHERE comment_id = %s AND user_id = %s",
                    (comment_id, user_id)
                )
                existing_like = await cursor.fetchone()
                
                if existing_like:
                    # Unlike
                    await cursor.execute(
                        "DELETE FROM comment_likes WHERE comment_id = %s AND user_id = %s",
                        (comment_id, user_id)
                    )
                    liked = False
                else:
                    # Like - Generate UUID for the like
                    like_id = str(uuid.uuid4())
                    await cursor.execute(
                        "INSERT INTO comment_likes (id, comment_id, user_id) VALUES (%s, %s, %s)",
                        (like_id, comment_id, user_id)
                    )
                    liked = True
                
                await conn.commit()
                
                # Get updated likes count
                await cursor.execute(
                    "SELECT likes_count FROM forum_comments WHERE id = %s",
                    (comment_id,)
                )
                row = await cursor.fetchone()
                likes_count = row[0] if row else 0
                
                return LikeToggleResponse(liked=liked, likes_count=likes_count)
    
    # ========== Helper Methods ==========
    
    @staticmethod
    def _post_from_row(row: tuple, cursor) -> ForumPostResponse:
        """Convert database row to ForumPostResponse"""
        columns = [desc[0] for desc in cursor.description]
        post_dict = dict(zip(columns, row))
        # Parse tags JSON
        if post_dict.get('tags'):
            post_dict['tags'] = json.loads(post_dict['tags'])
        return ForumPostResponse(**post_dict)
    
    @staticmethod
    def _comment_from_row(row: tuple, cursor) -> ForumCommentResponse:
        """Convert database row to ForumCommentResponse"""
        columns = [desc[0] for desc in cursor.description]
        comment_dict = dict(zip(columns, row))
        return ForumCommentResponse(**comment_dict)
