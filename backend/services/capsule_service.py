"""
Knowledge Capsules Service
Handles all business logic for knowledge capsules system
"""
import logging
import json
import uuid
from typing import Optional
from datetime import datetime
from database.connection import get_db_pool

logger = logging.getLogger(__name__)


class CapsuleService:
    """Service for managing knowledge capsules"""
    
    @staticmethod
    async def create_capsule(
        author_id: str,
        title: str,
        content: str,
        category: str,
        tags: list,
        duration_minutes: Optional[int] = None,
        featured_image: Optional[str] = None
    ) -> dict:
        """Create a new knowledge capsule"""
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    # Generate UUID for the capsule
                    capsule_id = str(uuid.uuid4())
                    
                    query = """
                        INSERT INTO knowledge_capsules 
                        (id, title, content, author_id, category, tags, duration_minutes, featured_image)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    await cursor.execute(
                        query,
                        (capsule_id, title, content, author_id, category, json.dumps(tags), duration_minutes, featured_image)
                    )
                    await conn.commit()
                    
                    # Fetch the created capsule
                    return await CapsuleService.get_capsule_by_id(capsule_id, author_id)
                    
        except Exception as e:
            logger.error(f"Error creating capsule: {str(e)}")
            raise
    
    
    @staticmethod
    async def get_capsule_by_id(capsule_id: str, user_id: Optional[str] = None) -> Optional[dict]:
        """Get capsule by ID with author details"""
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    # Update view count
                    await cursor.execute(
                        "UPDATE knowledge_capsules SET views_count = views_count + 1 WHERE id = %s",
                        (capsule_id,)
                    )
                    await conn.commit()
                    
                    # Fetch capsule with author details
                    query = """
                        SELECT 
                            kc.*,
                            ap.name as author_name,
                            ap.photo_url as author_photo
                        FROM knowledge_capsules kc
                        LEFT JOIN alumni_profiles ap ON kc.author_id = ap.user_id
                        WHERE kc.id = %s
                    """
                    await cursor.execute(query, (capsule_id,))
                    capsule = await cursor.fetchone()
                    
                    if not capsule:
                        return None
                    
                    # Parse JSON fields
                    if capsule.get('tags'):
                        capsule['tags'] = json.loads(capsule['tags'])
                    
                    # Check if user has liked/bookmarked
                    if user_id:
                        await cursor.execute(
                            "SELECT 1 FROM capsule_likes WHERE capsule_id = %s AND user_id = %s",
                            (capsule_id, user_id)
                        )
                        capsule['is_liked_by_user'] = await cursor.fetchone() is not None
                        
                        await cursor.execute(
                            "SELECT 1 FROM capsule_bookmarks WHERE capsule_id = %s AND user_id = %s",
                            (capsule_id, user_id)
                        )
                        capsule['is_bookmarked_by_user'] = await cursor.fetchone() is not None
                    
                    return capsule
                    
        except Exception as e:
            logger.error(f"Error getting capsule by ID: {str(e)}")
            raise
    
    
    @staticmethod
    async def list_capsules(
        page: int = 1,
        limit: int = 20,
        category: Optional[str] = None,
        tags: Optional[list] = None,
        featured_only: bool = False,
        author_id: Optional[str] = None,
        search: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> dict:
        """List capsules with filters and pagination"""
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    # Build query
                    where_clauses = []
                    params = []
                    
                    if category:
                        where_clauses.append("kc.category = %s")
                        params.append(category)
                    
                    if featured_only:
                        where_clauses.append("kc.is_featured = TRUE")
                    
                    if author_id:
                        where_clauses.append("kc.author_id = %s")
                        params.append(author_id)
                    
                    if search:
                        where_clauses.append("(kc.title LIKE %s OR kc.content LIKE %s)")
                        search_term = f"%{search}%"
                        params.extend([search_term, search_term])
                    
                    if tags:
                        # Filter by tags (at least one tag match)
                        for tag in tags:
                            where_clauses.append("JSON_CONTAINS(kc.tags, %s)")
                            params.append(json.dumps(tag))
                    
                    where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
                    
                    # Count total
                    count_query = f"""
                        SELECT COUNT(*) as total
                        FROM knowledge_capsules kc
                        WHERE {where_clause}
                    """
                    await cursor.execute(count_query, params)
                    total_result = await cursor.fetchone()
                    total = total_result['total'] if total_result else 0
                    
                    # Fetch capsules
                    offset = (page - 1) * limit
                    query = f"""
                        SELECT 
                            kc.*,
                            ap.name as author_name,
                            ap.photo_url as author_photo
                        FROM knowledge_capsules kc
                        LEFT JOIN alumni_profiles ap ON kc.author_id = ap.user_id
                        WHERE {where_clause}
                        ORDER BY kc.created_at DESC
                        LIMIT %s OFFSET %s
                    """
                    params.extend([limit, offset])
                    
                    await cursor.execute(query, params)
                    capsules = await cursor.fetchall()
                    
                    # Process capsules
                    for capsule in capsules:
                        if capsule.get('tags'):
                            capsule['tags'] = json.loads(capsule['tags'])
                        
                        # Check if user has liked/bookmarked
                        if user_id:
                            await cursor.execute(
                                "SELECT 1 FROM capsule_likes WHERE capsule_id = %s AND user_id = %s",
                                (capsule['id'], user_id)
                            )
                            capsule['is_liked_by_user'] = await cursor.fetchone() is not None
                            
                            await cursor.execute(
                                "SELECT 1 FROM capsule_bookmarks WHERE capsule_id = %s AND user_id = %s",
                                (capsule['id'], user_id)
                            )
                            capsule['is_bookmarked_by_user'] = await cursor.fetchone() is not None
                    
                    return {
                        'data': capsules,
                        'total': total,
                        'page': page,
                        'limit': limit,
                        'has_more': (page * limit) < total
                    }
                    
        except Exception as e:
            logger.error(f"Error listing capsules: {str(e)}")
            raise
    
    
    @staticmethod
    async def update_capsule(capsule_id: str, author_id: str, update_data: dict) -> Optional[dict]:
        """Update a capsule (only by author)"""
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    # Check if user is the author
                    await cursor.execute(
                        "SELECT author_id FROM knowledge_capsules WHERE id = %s",
                        (capsule_id,)
                    )
                    result = await cursor.fetchone()
                    
                    if not result or result['author_id'] != author_id:
                        return None
                    
                    # Build update query
                    update_fields = []
                    params = []
                    
                    for field, value in update_data.items():
                        if value is not None:
                            if field == 'tags':
                                update_fields.append(f"{field} = %s")
                                params.append(json.dumps(value))
                            else:
                                update_fields.append(f"{field} = %s")
                                params.append(value)
                    
                    if not update_fields:
                        return await CapsuleService.get_capsule_by_id(capsule_id, author_id)
                    
                    update_query = f"""
                        UPDATE knowledge_capsules 
                        SET {', '.join(update_fields)}, updated_at = NOW()
                        WHERE id = %s
                    """
                    params.append(capsule_id)
                    
                    await cursor.execute(update_query, params)
                    await conn.commit()
                    
                    return await CapsuleService.get_capsule_by_id(capsule_id, author_id)
                    
        except Exception as e:
            logger.error(f"Error updating capsule: {str(e)}")
            raise
    
    
    @staticmethod
    async def delete_capsule(capsule_id: str, user_id: str, is_admin: bool = False) -> bool:
        """Delete a capsule (author or admin only)"""
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    # Check if user is the author or admin
                    await cursor.execute(
                        "SELECT author_id FROM knowledge_capsules WHERE id = %s",
                        (capsule_id,)
                    )
                    result = await cursor.fetchone()
                    
                    if not result:
                        return False
                    
                    if not is_admin and result['author_id'] != user_id:
                        return False
                    
                    # Delete the capsule
                    await cursor.execute(
                        "DELETE FROM knowledge_capsules WHERE id = %s",
                        (capsule_id,)
                    )
                    await conn.commit()
                    
                    return True
                    
        except Exception as e:
            logger.error(f"Error deleting capsule: {str(e)}")
            raise
    
    
    @staticmethod
    async def toggle_like(capsule_id: str, user_id: str) -> dict:
        """Like or unlike a capsule"""
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    # Check if already liked
                    await cursor.execute(
                        "SELECT id FROM capsule_likes WHERE capsule_id = %s AND user_id = %s",
                        (capsule_id, user_id)
                    )
                    existing_like = await cursor.fetchone()
                    
                    if existing_like:
                        # Unlike
                        await cursor.execute(
                            "DELETE FROM capsule_likes WHERE capsule_id = %s AND user_id = %s",
                            (capsule_id, user_id)
                        )
                        is_liked = False
                    else:
                        # Like
                        await cursor.execute(
                            "INSERT INTO capsule_likes (capsule_id, user_id) VALUES (%s, %s)",
                            (capsule_id, user_id)
                        )
                        is_liked = True
                    
                    await conn.commit()
                    
                    # Get updated likes count
                    await cursor.execute(
                        "SELECT likes_count FROM knowledge_capsules WHERE id = %s",
                        (capsule_id,)
                    )
                    result = await cursor.fetchone()
                    likes_count = result['likes_count'] if result else 0
                    
                    return {
                        'capsule_id': capsule_id,
                        'is_liked': is_liked,
                        'likes_count': likes_count
                    }
                    
        except Exception as e:
            logger.error(f"Error toggling like: {str(e)}")
            raise
    
    
    @staticmethod
    async def toggle_bookmark(capsule_id: str, user_id: str) -> dict:
        """Bookmark or unbookmark a capsule"""
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    # Check if already bookmarked
                    await cursor.execute(
                        "SELECT id FROM capsule_bookmarks WHERE capsule_id = %s AND user_id = %s",
                        (capsule_id, user_id)
                    )
                    existing_bookmark = await cursor.fetchone()
                    
                    if existing_bookmark:
                        # Remove bookmark
                        await cursor.execute(
                            "DELETE FROM capsule_bookmarks WHERE capsule_id = %s AND user_id = %s",
                            (capsule_id, user_id)
                        )
                        is_bookmarked = False
                    else:
                        # Add bookmark
                        await cursor.execute(
                            "INSERT INTO capsule_bookmarks (capsule_id, user_id) VALUES (%s, %s)",
                            (capsule_id, user_id)
                        )
                        is_bookmarked = True
                    
                    await conn.commit()
                    
                    # Get updated bookmarks count
                    await cursor.execute(
                        "SELECT bookmarks_count FROM knowledge_capsules WHERE id = %s",
                        (capsule_id,)
                    )
                    result = await cursor.fetchone()
                    bookmarks_count = result['bookmarks_count'] if result else 0
                    
                    return {
                        'capsule_id': capsule_id,
                        'is_bookmarked': is_bookmarked,
                        'bookmarks_count': bookmarks_count
                    }
                    
        except Exception as e:
            logger.error(f"Error toggling bookmark: {str(e)}")
            raise
    
    
    @staticmethod
    async def get_trending_capsules(limit: int = 10, user_id: Optional[str] = None) -> list:
        """Get trending capsules based on views and likes"""
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    query = """
                        SELECT 
                            kc.*,
                            ap.name as author_name,
                            ap.photo_url as author_photo,
                            (kc.views_count * 0.3 + kc.likes_count * 0.5 + kc.bookmarks_count * 0.2) as trending_score
                        FROM knowledge_capsules kc
                        LEFT JOIN alumni_profiles ap ON kc.author_id = ap.user_id
                        WHERE kc.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                        ORDER BY trending_score DESC
                        LIMIT %s
                    """
                    await cursor.execute(query, (limit,))
                    capsules = await cursor.fetchall()
                    
                    # Process capsules
                    for capsule in capsules:
                        if capsule.get('tags'):
                            capsule['tags'] = json.loads(capsule['tags'])
                        
                        # Check if user has liked/bookmarked
                        if user_id:
                            await cursor.execute(
                                "SELECT 1 FROM capsule_likes WHERE capsule_id = %s AND user_id = %s",
                                (capsule['id'], user_id)
                            )
                            capsule['is_liked_by_user'] = await cursor.fetchone() is not None
                            
                            await cursor.execute(
                                "SELECT 1 FROM capsule_bookmarks WHERE capsule_id = %s AND user_id = %s",
                                (capsule['id'], user_id)
                            )
                            capsule['is_bookmarked_by_user'] = await cursor.fetchone() is not None
                    
                    return capsules
                    
        except Exception as e:
            logger.error(f"Error getting trending capsules: {str(e)}")
            raise
    
    
    @staticmethod
    async def get_user_bookmarks(user_id: str, page: int = 1, limit: int = 20) -> dict:
        """Get user's bookmarked capsules"""
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    # Count total bookmarks
                    await cursor.execute(
                        "SELECT COUNT(*) as total FROM capsule_bookmarks WHERE user_id = %s",
                        (user_id,)
                    )
                    total_result = await cursor.fetchone()
                    total = total_result['total'] if total_result else 0
                    
                    # Fetch bookmarked capsules
                    offset = (page - 1) * limit
                    query = """
                        SELECT 
                            kc.*,
                            ap.name as author_name,
                            ap.photo_url as author_photo,
                            cb.created_at as bookmarked_at
                        FROM capsule_bookmarks cb
                        JOIN knowledge_capsules kc ON cb.capsule_id = kc.id
                        LEFT JOIN alumni_profiles ap ON kc.author_id = ap.user_id
                        WHERE cb.user_id = %s
                        ORDER BY cb.created_at DESC
                        LIMIT %s OFFSET %s
                    """
                    await cursor.execute(query, (user_id, limit, offset))
                    capsules = await cursor.fetchall()
                    
                    # Process capsules
                    for capsule in capsules:
                        if capsule.get('tags'):
                            capsule['tags'] = json.loads(capsule['tags'])
                        capsule['is_bookmarked_by_user'] = True
                        
                        # Check if liked
                        await cursor.execute(
                            "SELECT 1 FROM capsule_likes WHERE capsule_id = %s AND user_id = %s",
                            (capsule['id'], user_id)
                        )
                        capsule['is_liked_by_user'] = await cursor.fetchone() is not None
                    
                    return {
                        'data': capsules,
                        'total': total,
                        'page': page,
                        'limit': limit,
                        'has_more': (page * limit) < total
                    }
                    
        except Exception as e:
            logger.error(f"Error getting user bookmarks: {str(e)}")
            raise


# Fix: Import aiomysql.DictCursor properly
import aiomysql
