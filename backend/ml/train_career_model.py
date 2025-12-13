#!/usr/bin/env python3
"""
Standalone Career Path ML Model Training Script
Run this to train the career prediction model manually

Usage:
    python ml/train_career_model.py

Requirements:
    - Database connection configured in .env
    - Minimum 50 career transitions in career_paths table
    - Sufficient memory for model training
"""

import asyncio
import sys
import logging
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from database.connection import get_db_pool, close_db_pool
from ml.career_model_trainer import CareerModelTrainer, train_model_from_cli

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def check_prerequisites(conn):
    """
    Check if system has sufficient data for training
    """
    logger.info("=" * 70)
    logger.info("CHECKING TRAINING PREREQUISITES")
    logger.info("=" * 70)
    
    async with conn.cursor() as cursor:
        # Check career_paths table
        await cursor.execute("""
            SELECT COUNT(*) FROM career_paths 
            WHERE from_role IS NOT NULL AND to_role IS NOT NULL
        """)
        transitions = (await cursor.fetchone())[0]
        
        # Check unique roles
        await cursor.execute("""
            SELECT COUNT(DISTINCT from_role) FROM career_paths
            WHERE from_role IS NOT NULL
        """)
        unique_from_roles = (await cursor.fetchone())[0]
        
        await cursor.execute("""
            SELECT COUNT(DISTINCT to_role) FROM career_paths
            WHERE to_role IS NOT NULL
        """)
        unique_to_roles = (await cursor.fetchone())[0]
        
        # Check transition matrix
        await cursor.execute("SELECT COUNT(*) FROM career_transition_matrix")
        matrix_entries = (await cursor.fetchone())[0]
        
        # Check alumni profiles
        await cursor.execute("""
            SELECT COUNT(*) FROM alumni_profiles 
            WHERE skills IS NOT NULL
        """)
        alumni_with_skills = (await cursor.fetchone())[0]
    
    # Display results
    logger.info("")
    logger.info("DATABASE STATUS:")
    logger.info(f"  Career Transitions: {transitions}")
    logger.info(f"  Unique Source Roles: {unique_from_roles}")
    logger.info(f"  Unique Target Roles: {unique_to_roles}")
    logger.info(f"  Transition Matrix Entries: {matrix_entries}")
    logger.info(f"  Alumni with Skills: {alumni_with_skills}")
    logger.info("")
    
    # Check if sufficient data
    if transitions >= 50:
        logger.info("✅ Sufficient data for ML training (≥50 transitions)")
        return True
    else:
        logger.warning(f"⚠️  Insufficient data. Need {50 - transitions} more transitions")
        logger.warning("   Recommendation: Use rule-based predictions until more data is available")
        logger.warning("   You can still try training, but accuracy may be low")
        return False


async def train_model(conn, min_samples: int = 50):
    """
    Train the ML model
    """
    logger.info("=" * 70)
    logger.info("STARTING ML MODEL TRAINING")
    logger.info("=" * 70)
    logger.info("")
    
    try:
        trainer = CareerModelTrainer()
        
        # Step 1: Calculate transition matrix
        logger.info("Step 1/2: Calculating career transition matrix...")
        matrix_result = await trainer.calculate_transition_matrix(conn)
        
        if matrix_result.get('success'):
            logger.info(f"  ✅ Matrix calculated: {matrix_result.get('transitions_calculated')} transitions")
            logger.info(f"  ✅ Unique roles: {matrix_result.get('unique_from_roles')}")
        else:
            logger.error(f"  ❌ Matrix calculation failed: {matrix_result.get('message')}")
            return False
        
        logger.info("")
        
        # Step 2: Train ML model
        logger.info("Step 2/2: Training ML model...")
        logger.info(f"  Minimum samples: {min_samples}")
        
        training_result = await trainer.train_from_database(conn, min_samples=min_samples)
        
        if training_result.get('success'):
            logger.info("")
            logger.info("=" * 70)
            logger.info("✅ MODEL TRAINING COMPLETED SUCCESSFULLY")
            logger.info("=" * 70)
            logger.info(f"  Model Path: {training_result.get('model_path')}")
            logger.info(f"  Training Samples: {training_result.get('training_samples')}")
            logger.info(f"  Test Samples: {training_result.get('test_samples')}")
            logger.info("")
            
            metrics = training_result.get('metrics', {})
            logger.info("  Performance Metrics:")
            logger.info(f"    Accuracy:  {metrics.get('accuracy', 0):.3f}")
            logger.info(f"    Precision: {metrics.get('precision', 0):.3f}")
            logger.info(f"    Recall:    {metrics.get('recall', 0):.3f}")
            logger.info(f"    F1-Score:  {metrics.get('f1_score', 0):.3f}")
            logger.info("")
            
            logger.info("  Top Important Features:")
            for feat in metrics.get('top_features', [])[:5]:
                logger.info(f"    {feat['feature']}: {feat['importance']:.4f}")
            
            logger.info("")
            logger.info(f"  Trained at: {training_result.get('trained_at')}")
            logger.info("=" * 70)
            return True
        else:
            logger.error("")
            logger.error("=" * 70)
            logger.error("❌ MODEL TRAINING FAILED")
            logger.error("=" * 70)
            logger.error(f"  Reason: {training_result.get('message')}")
            logger.error(f"  Current Samples: {training_result.get('current_samples', 0)}")
            logger.error(f"  Required Samples: {min_samples}")
            logger.error("")
            logger.error("  Suggestions:")
            logger.error("    1. Add more career path data to the database")
            logger.error("    2. Use admin dashboard to upload alumni datasets")
            logger.error("    3. Lower min_samples parameter (not recommended)")
            logger.error("=" * 70)
            return False
    
    except Exception as e:
        logger.error("")
        logger.error("=" * 70)
        logger.error("❌ TRAINING ERROR")
        logger.error("=" * 70)
        logger.error(f"  Error: {str(e)}")
        logger.error("")
        logger.error("  Common causes:")
        logger.error("    1. Database connection issues")
        logger.error("    2. Insufficient memory")
        logger.error("    3. Missing Python dependencies")
        logger.error("    4. Invalid data in career_paths table")
        logger.error("=" * 70)
        return False


async def main():
    """
    Main training function
    """
    start_time = datetime.now()
    
    logger.info("")
    logger.info("=" * 70)
    logger.info("CAREER PATH ML MODEL TRAINING")
    logger.info("=" * 70)
    logger.info(f"Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 70)
    logger.info("")
    
    pool = None
    success = False
    
    try:
        # Get database connection
        logger.info("Connecting to database...")
        pool = await get_db_pool()
        logger.info("✅ Database connected")
        logger.info("")
        
        async with pool.acquire() as conn:
            # Check prerequisites
            has_sufficient_data = await check_prerequisites(conn)
            logger.info("")
            
            # Ask for confirmation if insufficient data
            if not has_sufficient_data:
                logger.info("")
                logger.info("=" * 70)
                logger.info("RECOMMENDATION")
                logger.info("=" * 70)
                logger.info("The rule-based career prediction system is currently active and")
                logger.info("working well. ML training requires at least 50 career transitions")
                logger.info("for accurate predictions.")
                logger.info("")
                logger.info("Options:")
                logger.info("  1. Continue using rule-based predictions (recommended)")
                logger.info("  2. Collect more career data via admin dashboard")
                logger.info("  3. Load sample data: mysql < /app/sample_data_insert.sql")
                logger.info("  4. Proceed with training anyway (low accuracy expected)")
                logger.info("=" * 70)
                logger.info("")
                
                response = input("Proceed with training anyway? (yes/no): ").lower().strip()
                if response not in ['yes', 'y']:
                    logger.info("")
                    logger.info("=" * 70)
                    logger.info("Training cancelled - Rule-based system continues to work")
                    logger.info("=" * 70)
                    logger.info("")
                    logger.info("Next steps:")
                    logger.info("  1. Collect career transition data via admin panel")
                    logger.info("  2. Run this script again when you have 50+ transitions")
                    logger.info("  3. See: /app/ADMIN_CAREER_DATA_COLLECTION.md")
                    logger.info("=" * 70)
                    return
                logger.info("")
            
            # Train model
            success = await train_model(conn, min_samples=50)
    
    except KeyboardInterrupt:
        logger.info("\n\nTraining interrupted by user (Ctrl+C)")
    
    except Exception as e:
        logger.error(f"\n\n❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Close database connection
        if pool:
            try:
                await close_db_pool()
                logger.info("\n✅ Database connection closed")
            except Exception as e:
                logger.error(f"\n⚠️  Error closing database: {str(e)}")
        
        # Print summary
        end_time = datetime.now()
        duration = end_time - start_time
        
        logger.info("")
        logger.info("=" * 70)
        logger.info("TRAINING SUMMARY")
        logger.info("=" * 70)
        logger.info(f"  Status: {'✅ SUCCESS' if success else '❌ FAILED'}")
        logger.info(f"  Duration: {duration}")
        logger.info(f"  Ended at: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)
        logger.info("")
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    # Run the training
    try:
        asyncio.run(main())
    except Exception as e:
        logger.error(f"Failed to start training: {str(e)}")
        sys.exit(1)
