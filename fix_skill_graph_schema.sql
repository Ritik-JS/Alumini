-- ============================================================================
-- FIX SKILL GRAPH AI/ML SCHEMA ISSUES
-- ============================================================================
-- This file fixes the database schema issues preventing AI/ML from working
-- Run this before executing build_skill_graph_ai.py
--
-- Issues Fixed:
-- 1. popularity_score DECIMAL(5,2) -> DECIMAL(6,2) to prevent data truncation
-- 2. Deprecated VALUES() function in ON DUPLICATE KEY UPDATE
-- ============================================================================

USE alumni_network;

-- Fix 1: Update popularity_score column to allow larger values
-- Current: DECIMAL(5,2) = max 999.99
-- New: DECIMAL(6,2) = max 9999.99
ALTER TABLE skill_graph 
  MODIFY COLUMN popularity_score DECIMAL(6,2) DEFAULT 0.00;

SELECT 'Schema fix applied: popularity_score now DECIMAL(6,2)' as status;

-- Verify the change
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'alumni_network'
  AND TABLE_NAME = 'skill_graph'
  AND COLUMN_NAME = 'popularity_score';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check current state of skill graph
SELECT 
    COUNT(*) as total_skills,
    COUNT(DISTINCT skill_name) as unique_skills,
    MAX(popularity_score) as max_popularity,
    AVG(popularity_score) as avg_popularity
FROM skill_graph;

-- Check embeddings table
SELECT COUNT(*) as embeddings_count FROM skill_embeddings;

-- Check similarities table
SELECT COUNT(*) as similarities_count FROM skill_similarities;

-- Show top skills
SELECT 
    skill_name,
    alumni_count,
    job_count,
    popularity_score
FROM skill_graph
ORDER BY popularity_score DESC
LIMIT 10;

SELECT '✅ Schema fixes completed. Ready for AI/ML implementation.' as final_status;
