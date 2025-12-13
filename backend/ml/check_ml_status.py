#!/usr/bin/env python3
"""
Quick status check for Career ML System
Run this to see current system status and data availability
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from database.connection import get_db_pool, close_db_pool
from ml.model_loader import get_model_loader


async def check_system_status():
    """Check ML system status"""
    print("\n" + "=" * 70)
    print("  CAREER PREDICTION SYSTEM STATUS CHECK")
    print("=" * 70 + "\n")
    
    pool = None
    
    try:
        # Connect to database
        print("\u23f3 Connecting to database...")
        pool = await get_db_pool()
        print("\u2705 Database connected\n")
        
        async with pool.acquire() as conn:
            # Check career paths data
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT COUNT(*) FROM career_paths 
                    WHERE from_role IS NOT NULL AND to_role IS NOT NULL
                """)
                transitions = (await cursor.fetchone())[0]
                
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
                
                await cursor.execute("SELECT COUNT(*) FROM career_transition_matrix")
                matrix_entries = (await cursor.fetchone())[0]
                
                await cursor.execute("""
                    SELECT COUNT(*) FROM alumni_profiles 
                    WHERE skills IS NOT NULL
                """)
                alumni_with_skills = (await cursor.fetchone())[0]
        
        # Check ML model status
        print("\ud83e\udd16 Checking ML model status...")
        model_loader = get_model_loader()
        ml_available = model_loader.is_loaded()
        
        if ml_available:
            model_info = model_loader.get_model_info()
            print("\u2705 ML Model: LOADED")
            print(f"   Model Type: {model_info.get('model_type', 'Unknown')}")
            print(f"   Loaded At: {model_info.get('loaded_at', 'Unknown')}")
        else:
            print("\u274c ML Model: NOT LOADED (using rule-based)")
        
        print("\n" + "-" * 70)
        print("  DATABASE STATUS")
        print("-" * 70)
        status_icon = "✅" if transitions >= 50 else f"⏳ (need {50 - transitions} more)"
        print(f"  Career Transitions: {transitions}  {status_icon}")

        print(f"  Unique Source Roles: {unique_from_roles}")
        print(f"  Unique Target Roles: {unique_to_roles}")
        print(f"  Transition Matrix Entries: {matrix_entries}")
        print(f"  Alumni with Skills: {alumni_with_skills}")
        print("-" * 70)
        
        # Determine system mode
        print("\n" + "-" * 70)
        print("  SYSTEM MODE")
        print("-" * 70)
        
        if ml_available:
            print("  \ud83e\udd16 AI-POWERED MODE")
            print("     Using trained ML model for predictions")
            print("     Confidence: HIGH")
        elif transitions >= 50:
            print("  \u23f3 READY FOR ML TRAINING")
            print("     Sufficient data available")
            print("     Run: python ml/train_career_model.py")
        elif transitions >= 20:
            print("  \ud83d\udcc8 DATA COLLECTION IN PROGRESS")
            print("     Using rule-based predictions (working well)")
            print(f"     Progress: {transitions}/50 ({int(transitions/50*100)}%)")
            print("     Continue collecting career data")
        else:
            print("  \u2699\ufe0f RULE-BASED MODE (ACTIVE)")
            print("     Using pattern-based predictions")
            print("     Confidence: MEDIUM")
            print(f"     ML Training available at 50+ transitions (currently {transitions})")
        
        print("-" * 70)
        
        # Recommendations
        print("\n" + "-" * 70)
        print("  RECOMMENDATIONS")
        print("-" * 70)
        
        if ml_available:
            print("  \u2705 System is optimized and using ML predictions")
            print("  \u2022 Monitor prediction accuracy")
            print("  \u2022 Retrain model quarterly with new data")
        elif transitions >= 50:
            print("  \ud83c\udf93 Ready to train ML model!")
            print("  \u2022 Run: python ml/train_career_model.py")
            print("  \u2022 This will enable AI-powered predictions")
        elif transitions >= 20:
            print("  \ud83d\udcc8 Continue collecting career data")
            print(f"  \u2022 Need {50 - transitions} more career transitions")
            print("  \u2022 Use admin dashboard to upload career data")
            print("  \u2022 See: /app/ADMIN_CAREER_DATA_COLLECTION.md")
        else:
            print("  \ud83d\ude80 Start collecting career data")
            print("  \u2022 Add career journey form to alumni profiles")
            print("  \u2022 Import existing career data via CSV")
            print("  \u2022 See: /app/ADMIN_CAREER_DATA_COLLECTION.md")
            print("  \u2022 Current rule-based system works well!")
        
        print("-" * 70)
        
        # Quick stats
        if transitions > 0:
            print("\n" + "-" * 70)
            print("  TOP CAREER TRANSITIONS")
            print("-" * 70)
            
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT from_role, to_role, COUNT(*) as count
                        FROM career_paths
                        WHERE from_role IS NOT NULL AND to_role IS NOT NULL
                        GROUP BY from_role, to_role
                        ORDER BY count DESC
                        LIMIT 5
                    """)
                    top_transitions = await cursor.fetchall()
            
            if top_transitions:
                for trans in top_transitions:
                    print(f"  {trans[0]:25} \u2192 {trans[1]:25} ({trans[2]}x)")
            print("-" * 70)
        
        print("\n" + "=" * 70)
        print("  STATUS CHECK COMPLETE")
        print("=" * 70 + "\n")
    
    except Exception as e:
        print(f"\n\u274c Error: {str(e)}\n")
        import traceback
        traceback.print_exc()
    
    finally:
        if pool:
            await close_db_pool()


if __name__ == "__main__":
    try:
        asyncio.run(check_system_status())
    except KeyboardInterrupt:
        print("\n\nStatus check interrupted\n")
        sys.exit(0)
    except Exception as e:
        print(f"\nFailed to run status check: {str(e)}\n")
        sys.exit(1)
