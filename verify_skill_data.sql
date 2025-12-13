-- ============================================================================
-- Skill Graph Data Verification Script
-- Run this to check if you have enough data for AI/ML to work
-- ============================================================================

USE AlumUnity;

SELECT '========================================' as '';
SELECT '📊 SKILL GRAPH DATA VERIFICATION' as '';
SELECT '========================================' as '';

-- 1. Check skill_graph table
SELECT '' as '';
SELECT '1️⃣ SKILL GRAPH TABLE' as '';
SELECT '----------------------------------------' as '';
SELECT COUNT(*) as total_skills FROM skill_graph;
SELECT skill_name, alumni_count, job_count, popularity_score 
FROM skill_graph 
ORDER BY popularity_score DESC 
LIMIT 10;

-- 2. Check alumni_profiles with skills
SELECT '' as '';
SELECT '2️⃣ ALUMNI PROFILES WITH SKILLS' as '';
SELECT '----------------------------------------' as '';
SELECT COUNT(*) as profiles_with_skills 
FROM alumni_profiles 
WHERE skills IS NOT NULL AND skills != 'null' AND JSON_LENGTH(skills) > 0;

-- Sample skills from profiles
SELECT name, JSON_EXTRACT(skills, '$') as skills 
FROM alumni_profiles 
WHERE skills IS NOT NULL 
LIMIT 5;

-- 3. Check jobs with required skills
SELECT '' as '';
SELECT '3️⃣ JOBS WITH SKILL REQUIREMENTS' as '';
SELECT '----------------------------------------' as '';
SELECT COUNT(*) as jobs_with_skills 
FROM jobs 
WHERE skills_required IS NOT NULL AND skills_required != 'null' AND JSON_LENGTH(skills_required) > 0;

-- Sample job skills
SELECT title, company, JSON_EXTRACT(skills_required, '$') as skills_required 
FROM jobs 
WHERE skills_required IS NOT NULL 
LIMIT 5;

-- 4. Check skill_embeddings (should be 0 before AI build)
SELECT '' as '';
SELECT '4️⃣ SKILL EMBEDDINGS (AI/ML)' as '';
SELECT '----------------------------------------' as '';
SELECT COUNT(*) as skills_with_embeddings FROM skill_embeddings;

-- 5. Check skill_similarities (should be 0 before AI build)
SELECT '' as '';
SELECT '5️⃣ SKILL SIMILARITIES (AI/ML)' as '';
SELECT '----------------------------------------' as '';
SELECT COUNT(*) as precomputed_similarities FROM skill_similarities;

-- 6. Summary
SELECT '' as '';
SELECT '========================================' as '';
SELECT '📋 SUMMARY' as '';
SELECT '========================================' as '';

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM skill_graph) >= 20 THEN '✅'
        ELSE '❌'
    END as skill_graph_status,
    'Skill Graph has enough data (need 20+)' as check_name,
    (SELECT COUNT(*) FROM skill_graph) as current_count;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM alumni_profiles WHERE skills IS NOT NULL) >= 5 THEN '✅'
        ELSE '❌'
    END as alumni_status,
    'Alumni with skills (need 5+)' as check_name,
    (SELECT COUNT(*) FROM alumni_profiles WHERE skills IS NOT NULL) as current_count;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM jobs WHERE skills_required IS NOT NULL) >= 3 THEN '✅'
        ELSE '❌'
    END as jobs_status,
    'Jobs with skills (need 3+)' as check_name,
    (SELECT COUNT(*) FROM jobs WHERE skills_required IS NOT NULL) as current_count;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM skill_embeddings) = 0 THEN '⏳'
        ELSE '✅'
    END as embeddings_status,
    'Embeddings (0 = not generated yet, >0 = AI active)' as check_name,
    (SELECT COUNT(*) FROM skill_embeddings) as current_count;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM skill_similarities) = 0 THEN '⏳'
        ELSE '✅'
    END as similarities_status,
    'Similarities (0 = not calculated yet, >0 = AI active)' as check_name,
    (SELECT COUNT(*) FROM skill_similarities) as current_count;

SELECT '' as '';
SELECT '========================================' as '';
SELECT '🎯 NEXT STEPS' as '';
SELECT '========================================' as '';
SELECT 'If skill_graph has 20+ entries: ✅ Ready for AI build' as instruction;
SELECT 'If embeddings = 0: ⏳ Run build_skill_graph_ai.py' as instruction;
SELECT 'If similarities = 0: ⏳ Run build_skill_graph_ai.py' as instruction;
SELECT 'If embeddings > 0: ✅ AI/ML is active!' as instruction;
SELECT '' as '';
