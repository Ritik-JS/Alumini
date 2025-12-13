-- ============================================================================
-- Forum Database Triggers Fix
-- Fixes missing triggers for unlike operations and soft delete count updates
-- ============================================================================

USE AlumUnity;

-- ============================================================================
-- DROP EXISTING TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS after_post_like_insert;
DROP TRIGGER IF EXISTS after_post_like_delete;
DROP TRIGGER IF EXISTS after_comment_like_insert;
DROP TRIGGER IF EXISTS after_comment_like_delete;
DROP TRIGGER IF EXISTS after_comment_soft_delete;

-- ============================================================================
-- POST LIKES TRIGGERS
-- ============================================================================

-- Trigger for post like insert (increment likes_count)
DELIMITER //
CREATE TRIGGER after_post_like_insert
AFTER INSERT ON post_likes
FOR EACH ROW
BEGIN
    UPDATE forum_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
END //
DELIMITER ;

-- Trigger for post like delete/unlike (decrement likes_count)
DELIMITER //
CREATE TRIGGER after_post_like_delete
AFTER DELETE ON post_likes
FOR EACH ROW
BEGIN
    UPDATE forum_posts 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
END //
DELIMITER ;

-- ============================================================================
-- COMMENT LIKES TRIGGERS
-- ============================================================================

-- Trigger for comment like insert (increment likes_count)
DELIMITER //
CREATE TRIGGER after_comment_like_insert
AFTER INSERT ON comment_likes
FOR EACH ROW
BEGIN
    UPDATE forum_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
END //
DELIMITER ;

-- Trigger for comment like delete/unlike (decrement likes_count)
DELIMITER //
CREATE TRIGGER after_comment_like_delete
AFTER DELETE ON comment_likes
FOR EACH ROW
BEGIN
    UPDATE forum_comments 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
END //
DELIMITER ;

-- ============================================================================
-- COMMENT TRIGGERS
-- ============================================================================

-- Trigger for comment insert (increment comments_count on post)
DELIMITER //
CREATE TRIGGER after_comment_insert
AFTER INSERT ON forum_comments
FOR EACH ROW
BEGIN
    UPDATE forum_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
END //
DELIMITER ;

-- Trigger for comment soft delete (decrement comments_count on post)
DELIMITER //
CREATE TRIGGER after_comment_soft_delete
AFTER UPDATE ON forum_comments
FOR EACH ROW
BEGIN
    IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
        UPDATE forum_posts 
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = NEW.post_id;
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- VERIFY TRIGGERS
-- ============================================================================

-- Show all forum-related triggers
SHOW TRIGGERS WHERE `Table` IN ('post_likes', 'comment_likes', 'forum_comments');

-- ============================================================================
-- RECALCULATE EXISTING COUNTS (OPTIONAL - RUN IF DATA IS INCONSISTENT)
-- ============================================================================

-- Uncomment and run these if you need to fix existing inconsistent counts

-- Fix post likes counts
-- UPDATE forum_posts p
-- SET likes_count = (
--     SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id
-- );

-- Fix comment likes counts
-- UPDATE forum_comments c
-- SET likes_count = (
--     SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id
-- );

-- Fix post comments counts
-- UPDATE forum_posts p
-- SET comments_count = (
--     SELECT COUNT(*) FROM forum_comments c 
--     WHERE c.post_id = p.id AND c.is_deleted = FALSE
-- );

-- ============================================================================
-- END OF TRIGGERS FIX
-- ============================================================================

SELECT 'Forum triggers successfully updated!' as Status;
