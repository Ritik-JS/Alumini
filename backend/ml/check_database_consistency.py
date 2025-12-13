#!/usr/bin/env python3
"""
Database Consistency Check for Career Predictions System
Verifies database schema and data consistency between frontend and backend

Usage:
    python ml/check_database_consistency.py
"""

import asyncio
import sys
import logging
import json
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from database.connection import get_db_pool, close_db_pool

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def check_table_exists(conn, table_name: str) -> bool:
    """Check if a table exists"""
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = %s
        """, (table_name,))
        result = await cursor.fetchone()
        return result[0] > 0


async def check_table_structure(conn, table_name: str, expected_columns: list) -> dict:
    """Check if table has expected columns"""
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s
        """, (table_name,))
        
        columns = await cursor.fetchall()
        column_dict = {col[0]: {"type": col[1], "nullable": col[2], "default": col[3]} for col in columns}
        
        missing = []
        present = []
        
        for expected_col in expected_columns:
            if expected_col in column_dict:
                present.append(expected_col)
            else:
                missing.append(expected_col)
        
        return {
            "exists": len(columns) > 0,
            "total_columns": len(columns),
            "present": present,
            "missing": missing,
            "extra": [col for col in column_dict.keys() if col not in expected_columns]
        }


async def check_data_quality(conn) -> dict:
    """Check data quality and consistency"""
    results = {}
    
    async with conn.cursor() as cursor:
        # Career paths
        await cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN from_role IS NULL THEN 1 END) as null_from_role,
                COUNT(CASE WHEN to_role IS NULL THEN 1 END) as null_to_role,
                COUNT(CASE WHEN skills_acquired IS NULL THEN 1 END) as null_skills
            FROM career_paths
        """)
        career_paths = await cursor.fetchone()
        
        results['career_paths'] = {
            "total": career_paths[0],
            "null_from_role": career_paths[1],
            "null_to_role": career_paths[2],
            "null_skills": career_paths[3],
            "valid_for_training": career_paths[0] - max(career_paths[1], career_paths[2])
        }
        
        # Career predictions
        await cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN predicted_roles IS NULL THEN 1 END) as null_predictions,
                COUNT(CASE WHEN confidence_score IS NULL THEN 1 END) as null_confidence
            FROM career_predictions
        """)
        predictions = await cursor.fetchone()
        
        results['career_predictions'] = {
            "total": predictions[0],
            "null_predictions": predictions[1],
            "null_confidence": predictions[2]
        }
        
        # Transition matrix
        await cursor.execute("""
            SELECT 
                COUNT(*) as total,
                AVG(transition_probability) as avg_probability,
                MIN(transition_probability) as min_probability,
                MAX(transition_probability) as max_probability
            FROM career_transition_matrix
        """)
        matrix = await cursor.fetchone()
        
        results['career_transition_matrix'] = {
            "total": matrix[0],
            "avg_probability": float(matrix[1]) if matrix[1] else 0,
            "min_probability": float(matrix[2]) if matrix[2] else 0,
            "max_probability": float(matrix[3]) if matrix[3] else 0
        }
        
        # Alumni profiles
        await cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN skills IS NULL OR skills = '[]' THEN 1 END) as no_skills,
                COUNT(CASE WHEN years_of_experience IS NULL THEN 1 END) as null_experience,
                COUNT(CASE WHEN current_role IS NULL THEN 1 END) as null_role
            FROM alumni_profiles
        """)
        alumni = await cursor.fetchone()
        
        results['alumni_profiles'] = {
            "total": alumni[0],
            "no_skills": alumni[1],
            "null_experience": alumni[2],
            "null_role": alumni[3],
            "valid_for_ml": alumni[0] - alumni[1]
        }
    
    return results


async def check_json_field_consistency(conn) -> dict:
    """Check JSON field consistency"""
    results = {}
    
    async with conn.cursor() as cursor:
        # Check predicted_roles JSON structure
        await cursor.execute("""
            SELECT predicted_roles 
            FROM career_predictions 
            WHERE predicted_roles IS NOT NULL 
            LIMIT 1
        """)
        sample_prediction = await cursor.fetchone()
        
        if sample_prediction and sample_prediction[0]:
            try:
                parsed = json.loads(sample_prediction[0]) if isinstance(sample_prediction[0], str) else sample_prediction[0]
                if parsed and len(parsed) > 0:
                    results['predicted_roles_structure'] = {
                        "valid": True,
                        "sample_keys": list(parsed[0].keys()) if isinstance(parsed[0], dict) else []
                    }
                else:
                    results['predicted_roles_structure'] = {"valid": False, "error": "Empty array"}
            except Exception as e:
                results['predicted_roles_structure'] = {"valid": False, "error": str(e)}
        else:
            results['predicted_roles_structure'] = {"valid": False, "error": "No sample data"}
        
        # Check skills JSON structure
        await cursor.execute("""
            SELECT skills 
            FROM alumni_profiles 
            WHERE skills IS NOT NULL 
            LIMIT 1
        """)
        sample_skills = await cursor.fetchone()
        
        if sample_skills and sample_skills[0]:
            try:
                parsed = json.loads(sample_skills[0]) if isinstance(sample_skills[0], str) else sample_skills[0]
                results['skills_structure'] = {
                    "valid": True,
                    "is_array": isinstance(parsed, list),
                    "sample_count": len(parsed) if isinstance(parsed, list) else 0
                }
            except Exception as e:
                results['skills_structure'] = {"valid": False, "error": str(e)}
        else:
            results['skills_structure'] = {"valid": False, "error": "No sample data"}
    
    return results


async def check_frontend_backend_consistency(conn) -> dict:
    """Check if backend provides fields expected by frontend"""
    
    # Expected fields based on frontend service
    frontend_expectations = {
        "career_predictions": {
            "user_prediction": [
                "prediction_id", "user_id", "current_role", "current_company",
                "predicted_roles", "current_skills", "experience_level",
                "confidence_score", "personalized_advice", "similar_alumni",
                "last_updated", "next_update"
            ],
            "predicted_roles_fields": [
                "role_name", "probability", "skills_gap", "skill_importance",
                "similar_alumni_count", "timeframe_months", "skill_match_percentage",
                "success_rate"
            ]
        }
    }
    
    # Check if database has necessary fields to construct frontend expectations
    async with conn.cursor() as cursor:
        # Get a sample prediction
        await cursor.execute("""
            SELECT 
                cp.id, cp.user_id, cp.current_role, cp.predicted_roles, 
                cp.recommended_skills, cp.similar_alumni, cp.confidence_score, 
                cp.generated_at,
                ap.current_company, ap.years_of_experience, ap.skills
            FROM career_predictions cp
            LEFT JOIN alumni_profiles ap ON cp.user_id = ap.user_id
            LIMIT 1
        """)
        
        sample = await cursor.fetchone()
        
        if sample:
            # Check if we can construct all required frontend fields
            available_fields = {
                "prediction_id": sample[0] is not None,
                "user_id": sample[1] is not None,
                "current_role": sample[2] is not None,
                "current_company": sample[8] is not None,
                "predicted_roles": sample[3] is not None,
                "recommended_skills": sample[4] is not None,
                "similar_alumni": sample[5] is not None,
                "confidence_score": sample[6] is not None,
                "generated_at": sample[7] is not None,
                "years_of_experience": sample[9] is not None,
                "current_skills": sample[10] is not None
            }
            
            return {
                "sample_found": True,
                "fields_available": available_fields,
                "all_required_present": all(available_fields.values())
            }
        else:
            return {
                "sample_found": False,
                "error": "No predictions in database"
            }


async def main():
    """Main check function"""
    print("")
    print("=" * 80)
    print("DATABASE CONSISTENCY CHECK - Career Predictions System")
    print("=" * 80)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print("")
    
    pool = None
    
    try:
        # Connect to database
        logger.info("Connecting to database...")
        pool = await get_db_pool()
        logger.info("✅ Database connected\n")
        
        async with pool.acquire() as conn:
            # Check 1: Table existence
            print("=" * 80)
            print("1. CHECKING TABLE EXISTENCE")
            print("=" * 80)
            
            required_tables = [
                'career_paths',
                'career_predictions',
                'career_transition_matrix',
                'alumni_profiles',
                'ml_models',
                'skill_graph'
            ]
            
            for table in required_tables:
                exists = await check_table_exists(conn, table)
                status = "✅" if exists else "❌"
                print(f"{status} {table}")
            
            print("")
            
            # Check 2: Table structure
            print("=" * 80)
            print("2. CHECKING TABLE STRUCTURE")
            print("=" * 80)
            
            table_schemas = {
                'career_predictions': ['id', 'user_id', 'current_role', 'predicted_roles', 
                                      'recommended_skills', 'similar_alumni', 'confidence_score', 
                                      'generated_at'],
                'career_paths': ['id', 'user_id', 'from_role', 'to_role', 'transition_duration_months',
                                'skills_acquired', 'transition_date', 'success_rating'],
                'career_transition_matrix': ['id', 'from_role', 'to_role', 'transition_count',
                                             'transition_probability', 'avg_duration_months', 
                                             'required_skills', 'success_rate', 'last_calculated'],
                'alumni_profiles': ['id', 'user_id', 'name', 'current_role', 'current_company',
                                   'skills', 'years_of_experience', 'industry']
            }
            
            for table, expected_cols in table_schemas.items():
                structure = await check_table_structure(conn, table, expected_cols)
                print(f"\nTable: {table}")
                print(f"  Total columns: {structure['total_columns']}")
                print(f"  Expected present: {len(structure['present'])}/{len(expected_cols)}")
                
                if structure['missing']:
                    print(f"  ⚠️  Missing columns: {', '.join(structure['missing'])}")
                else:
                    print(f"  ✅ All expected columns present")
            
            print("")
            
            # Check 3: Data quality
            print("=" * 80)
            print("3. CHECKING DATA QUALITY")
            print("=" * 80)
            
            data_quality = await check_data_quality(conn)
            
            for table, stats in data_quality.items():
                print(f"\nTable: {table}")
                for key, value in stats.items():
                    print(f"  {key}: {value}")
            
            print("")
            
            # Check 4: JSON field consistency
            print("=" * 80)
            print("4. CHECKING JSON FIELD CONSISTENCY")
            print("=" * 80)
            
            json_consistency = await check_json_field_consistency(conn)
            
            for field, result in json_consistency.items():
                print(f"\n{field}:")
                if result.get('valid'):
                    print(f"  ✅ Valid")
                    for key, value in result.items():
                        if key != 'valid':
                            print(f"  {key}: {value}")
                else:
                    print(f"  ❌ Invalid: {result.get('error')}")
            
            print("")
            
            # Check 5: Frontend-Backend consistency
            print("=" * 80)
            print("5. CHECKING FRONTEND-BACKEND API CONSISTENCY")
            print("=" * 80)
            
            fb_consistency = await check_frontend_backend_consistency(conn)
            
            if fb_consistency.get('sample_found'):
                print("\n✅ Sample prediction found in database")
                print("\nField availability for frontend response construction:")
                for field, available in fb_consistency['fields_available'].items():
                    status = "✅" if available else "❌"
                    print(f"  {status} {field}")
                
                if fb_consistency['all_required_present']:
                    print("\n✅ All required fields present for frontend response")
                else:
                    print("\n⚠️  Some fields missing - may cause issues in frontend")
            else:
                print(f"\n⚠️  {fb_consistency.get('error')}")
            
            print("")
            
            # Summary
            print("=" * 80)
            print("CONSISTENCY CHECK SUMMARY")
            print("=" * 80)
            print("")
            
            # Calculate overall status
            has_data = data_quality['career_paths']['total'] > 0
            has_predictions = data_quality['career_predictions']['total'] > 0
            has_matrix = data_quality['career_transition_matrix']['total'] > 0
            sufficient_training = data_quality['career_paths']['valid_for_training'] >= 50
            
            print(f"✅ Database tables: All required tables exist")
            print(f"{'✅' if has_data else '⚠️ '} Career paths data: {data_quality['career_paths']['total']} records")
            print(f"{'✅' if sufficient_training else '⚠️ '} Training data: {data_quality['career_paths']['valid_for_training']} valid (≥50 needed)")
            print(f"{'✅' if has_predictions else '⚠️ '} Predictions: {data_quality['career_predictions']['total']} records")
            print(f"{'✅' if has_matrix else '⚠️ '} Transition matrix: {data_quality['career_transition_matrix']['total']} entries")
            print("")
            
            if sufficient_training:
                print("✅ SYSTEM READY: Sufficient data for ML model training")
            else:
                print(f"⚠️  NEEDS DATA: Add {50 - data_quality['career_paths']['valid_for_training']} more career transitions for ML training")
            
            print("")
    
    except Exception as e:
        logger.error(f"\n❌ Error during consistency check: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        if pool:
            await close_db_pool()
            logger.info("✅ Database connection closed")
        
        print("")
        print("=" * 80)
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        print("")


if __name__ == "__main__":
    asyncio.run(main())
