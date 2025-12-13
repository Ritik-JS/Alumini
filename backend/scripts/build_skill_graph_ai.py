#!/usr/bin/env python3
"""
Build Skill Graph with AI/ML Embeddings
This script initializes and populates the skill graph with AI-powered semantic similarity
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from database.connection import get_db_pool
from services.skill_graph_service import SkillGraphService
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def check_current_state(conn):
    """Check current state of skill graph data"""
    logger.info("🔍 Checking current skill graph state...")
    
    async with conn.cursor() as cursor:
        # Check skill_graph table
        await cursor.execute("SELECT COUNT(*) FROM skill_graph")
        total_skills = (await cursor.fetchone())[0]
        
        # Check skill_embeddings table
        await cursor.execute("SELECT COUNT(*) FROM skill_embeddings")
        skills_with_embeddings = (await cursor.fetchone())[0]
        
        # Check skill_similarities table
        await cursor.execute("SELECT COUNT(*) FROM skill_similarities")
        precomputed_similarities = (await cursor.fetchone())[0]
        
        logger.info(f"📊 Current State:")
        logger.info(f"   - Total skills in graph: {total_skills}")
        logger.info(f"   - Skills with embeddings: {skills_with_embeddings}")
        logger.info(f"   - Precomputed similarities: {precomputed_similarities}")
        
        return {
            'total_skills': total_skills,
            'skills_with_embeddings': skills_with_embeddings,
            'precomputed_similarities': precomputed_similarities
        }


async def verify_results(conn):
    """Verify the build was successful"""
    logger.info("✅ Verifying results...")
    
    async with conn.cursor() as cursor:
        # Check embeddings
        await cursor.execute("""
            SELECT skill_name, 
                   SUBSTRING(embedding_vector, 1, 50) as sample_vector
            FROM skill_embeddings 
            LIMIT 5
        """)
        embeddings_sample = await cursor.fetchall()
        
        if embeddings_sample:
            logger.info(f"✅ Embeddings generated successfully!")
            logger.info(f"   Sample skills with embeddings:")
            for skill, vector_sample in embeddings_sample:
                logger.info(f"   - {skill}: {vector_sample}...")
        
        # Check similarities
        await cursor.execute("""
            SELECT skill_1, skill_2, similarity_score 
            FROM skill_similarities 
            WHERE similarity_score > 0.7
            ORDER BY similarity_score DESC 
            LIMIT 10
        """)
        similarities_sample = await cursor.fetchall()
        
        if similarities_sample:
            logger.info(f"✅ Similarities calculated successfully!")
            logger.info(f"   Top similar skill pairs:")
            for skill1, skill2, score in similarities_sample:
                logger.info(f"   - {skill1} ↔ {skill2}: {score:.3f}")
        
        # Check skill graph
        await cursor.execute("""
            SELECT skill_name, related_skills, popularity_score
            FROM skill_graph
            ORDER BY popularity_score DESC
            LIMIT 5
        """)
        graph_sample = await cursor.fetchall()
        
        if graph_sample:
            logger.info(f"✅ Skill graph updated successfully!")
            logger.info(f"   Top skills:")
            for skill, related, score in graph_sample:
                logger.info(f"   - {skill} (popularity: {score:.1f})")


async def main():
    """Main execution function"""
    logger.info("🚀 Starting AI/ML Skill Graph Build...")
    logger.info("=" * 60)
    
    try:
        # Initialize service
        service = SkillGraphService()
        logger.info("✅ SkillGraphService initialized")
        
        # Get database connection
        pool = await get_db_pool()
        logger.info("✅ Database connection established")
        
        async with pool.acquire() as conn:
            # Check current state
            initial_state = await check_current_state(conn)
            
            logger.info("=" * 60)
            logger.info("🔨 Building skill graph with AI/ML...")
            logger.info("   This may take 45-70 seconds on first run (model download)")
            logger.info("   Subsequent runs will be faster (~10 seconds)")
            logger.info("=" * 60)
            
            # Build skill graph
            result = await service.build_skill_graph(conn)
            
            logger.info("=" * 60)
            logger.info("✅ Skill graph build completed!")
            logger.info(f"📊 Build Results:")
            logger.info(f"   - Total skills processed: {result['total_skills']}")
            logger.info(f"   - Skill relationships mapped: {result['relationships_mapped']}")
            logger.info(f"   - Embeddings generated: {result['embeddings_generated']}")
            logger.info(f"   - Similarities calculated: {result['similarities_calculated']}")
            logger.info(f"   - AI/ML enabled: {result['ai_enabled']}")
            logger.info("=" * 60)
            
            # Verify results
            await verify_results(conn)
            
            logger.info("=" * 60)
            logger.info("🎉 SUCCESS! AI/ML Skill Graph is now active!")
            logger.info("=" * 60)
            logger.info("Next steps:")
            logger.info("1. Restart backend if needed: sudo supervisorctl restart backend")
            logger.info("2. Test frontend at /skills/graph")
            logger.info("3. Verify recommendations at /api/skill-recommendations/recommendations/{user_id}")
            logger.info("=" * 60)
            
    except Exception as e:
        logger.error("=" * 60)
        logger.error(f"❌ Error building skill graph: {str(e)}")
        logger.error("=" * 60)
        logger.exception("Full traceback:")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
