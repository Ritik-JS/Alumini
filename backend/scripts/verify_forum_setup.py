"""Verification script for forum database setup and counts"""
import asyncio
import sys
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))


from database.connection import get_db_pool, close_db_pool


async def verify_forum_setup():
    """Verify forum database setup and check data consistency"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                print("=" * 60)
                print("FORUM DATABASE VERIFICATION")
                print("=" * 60)
                
                # Check if triggers exist
                print("\n1. Checking Database Triggers...")
                await cursor.execute("""
                    SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
                    FROM information_schema.TRIGGERS
                    WHERE TRIGGER_SCHEMA = DATABASE()
                    AND EVENT_OBJECT_TABLE IN ('post_likes', 'comment_likes', 'forum_comments')
                    ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME
                """)
                triggers = await cursor.fetchall()
                
                if triggers:
                    print(f"   ✅ Found {len(triggers)} triggers:")
                    for trigger in triggers:
                        print(f"      - {trigger[0]}: {trigger[1]} on {trigger[2]}")
                else:
                    print("   ❌ No triggers found! Please apply database_forum_triggers_fix.sql")
                
                # Check forum_posts table
                print("\n2. Checking forum_posts table...")
                await cursor.execute("SELECT COUNT(*) FROM forum_posts WHERE is_deleted = FALSE")
                post_count = (await cursor.fetchone())[0]
                print(f"   📊 Total active posts: {post_count}")
                
                # Check post likes consistency
                print("\n3. Verifying post likes counts...")
                await cursor.execute("""
                    SELECT 
                        p.id,
                        p.title,
                        p.likes_count as cached_count,
                        COUNT(pl.id) as actual_count,
                        (p.likes_count - COUNT(pl.id)) as difference
                    FROM forum_posts p
                    LEFT JOIN post_likes pl ON p.id = pl.post_id
                    WHERE p.is_deleted = FALSE
                    GROUP BY p.id
                    HAVING difference != 0
                """)
                inconsistent_posts = await cursor.fetchall()
                
                if inconsistent_posts:
                    print(f"   ⚠️  Found {len(inconsistent_posts)} posts with inconsistent like counts:")
                    for post in inconsistent_posts[:5]:  # Show first 5
                        title = post[1][:40] + "..." if post[1] and len(post[1]) > 40 else (post[1] or "Untitled")
                        print(f"      - Post '{title}': cached={post[2]}, actual={post[3]}, diff={post[4]}")
                    if len(inconsistent_posts) > 5:
                        print(f"      ... and {len(inconsistent_posts) - 5} more")
                else:
                    print("   ✅ All post like counts are consistent")
                
                # Check comments consistency
                print("\n4. Verifying comment likes counts...")
                await cursor.execute("""
                    SELECT 
                        c.id,
                        c.content,
                        c.likes_count as cached_count,
                        COUNT(cl.id) as actual_count,
                        (c.likes_count - COUNT(cl.id)) as difference
                    FROM forum_comments c
                    LEFT JOIN comment_likes cl ON c.id = cl.comment_id
                    WHERE c.is_deleted = FALSE
                    GROUP BY c.id
                    HAVING difference != 0
                """)
                inconsistent_comments = await cursor.fetchall()
                
                if inconsistent_comments:
                    print(f"   ⚠️  Found {len(inconsistent_comments)} comments with inconsistent like counts:")
                    for comment in inconsistent_comments[:5]:
                        content = comment[1][:40] + "..." if len(comment[1]) > 40 else comment[1]
                        print(f"      - Comment '{content}': cached={comment[2]}, actual={comment[3]}, diff={comment[4]}")
                    if len(inconsistent_comments) > 5:
                        print(f"      ... and {len(inconsistent_comments) - 5} more")
                else:
                    print("   ✅ All comment like counts are consistent")
                
                # Check post comments count consistency
                print("\n5. Verifying post comments counts...")
                await cursor.execute("""
                    SELECT 
                        p.id,
                        p.title,
                        p.comments_count as cached_count,
                        COUNT(c.id) as actual_count,
                        (p.comments_count - COUNT(c.id)) as difference
                    FROM forum_posts p
                    LEFT JOIN forum_comments c ON p.id = c.post_id AND c.is_deleted = FALSE
                    WHERE p.is_deleted = FALSE
                    GROUP BY p.id
                    HAVING difference != 0
                """)
                inconsistent_post_comments = await cursor.fetchall()
                
                if inconsistent_post_comments:
                    print(f"   ⚠️  Found {len(inconsistent_post_comments)} posts with inconsistent comment counts:")
                    for post in inconsistent_post_comments[:5]:
                        title = post[1][:40] + "..." if post[1] and len(post[1]) > 40 else (post[1] or "Untitled")
                        print(f"      - Post '{title}': cached={post[2]}, actual={post[3]}, diff={post[4]}")
                else:
                    print("   ✅ All post comment counts are consistent")
                
                # Summary
                print("\n" + "=" * 60)
                print("VERIFICATION SUMMARY")
                print("=" * 60)
                
                all_good = (
                    len(triggers) >= 5 and 
                    len(inconsistent_posts) == 0 and 
                    len(inconsistent_comments) == 0 and 
                    len(inconsistent_post_comments) == 0
                )
                
                if all_good:
                    print("✅ All checks passed! Forum is properly configured.")
                else:
                    print("⚠️  Some issues found. Run fix_forum_counts.py to repair.")
                
                print("=" * 60)
    finally:
        # Always close the database pool to prevent event loop errors
        await close_db_pool()


async def fix_forum_counts():
    """Recalculate and fix all forum counts"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                print("\n" + "=" * 60)
                print("FIXING FORUM COUNTS")
                print("=" * 60)
                
                print("\n1. Fixing post likes counts...")
                await cursor.execute("""
                    UPDATE forum_posts p
                    SET likes_count = (
                        SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id
                    )
                """)
                print(f"   ✅ Updated {cursor.rowcount} posts")
                
                print("\n2. Fixing comment likes counts...")
                await cursor.execute("""
                    UPDATE forum_comments c
                    SET likes_count = (
                        SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id
                    )
                """)
                print(f"   ✅ Updated {cursor.rowcount} comments")
                
                print("\n3. Fixing post comments counts...")
                await cursor.execute("""
                    UPDATE forum_posts p
                    SET comments_count = (
                        SELECT COUNT(*) FROM forum_comments c 
                        WHERE c.post_id = p.id AND c.is_deleted = FALSE
                    )
                """)
                print(f"   ✅ Updated {cursor.rowcount} posts")
                
                await conn.commit()
                print("\n" + "=" * 60)
                print("✅ All counts fixed successfully!")
                print("=" * 60)
    finally:
        # Always close the database pool to prevent event loop errors
        await close_db_pool()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--fix":
        print("Running in FIX mode...")
        asyncio.run(fix_forum_counts())
        print("\nRunning verification after fix...")
        asyncio.run(verify_forum_setup())
    else:
        asyncio.run(verify_forum_setup())
        print("\nTip: Run with --fix flag to automatically repair counts")
