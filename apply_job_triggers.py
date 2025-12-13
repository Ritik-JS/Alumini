#!/usr/bin/env python3
"""
Apply job application triggers to maintain applications_count
Run this script once to set up triggers and fix existing counts
"""
import asyncio
import aiomysql
from database.connection import get_db_pool

async def apply_triggers():
    """Apply database triggers for job applications"""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            print("Applying job application triggers...")
            
            # Drop existing triggers
            print("1. Dropping existing triggers if they exist...")
            try:
                await cursor.execute("DROP TRIGGER IF EXISTS increment_applications_count")
                await cursor.execute("DROP TRIGGER IF EXISTS decrement_applications_count")
                print("   ✓ Old triggers dropped")
            except Exception as e:
                print(f"   Note: {e}")
            
            # Create increment trigger
            print("2. Creating increment trigger...")
            trigger_sql = """
            CREATE TRIGGER increment_applications_count
            AFTER INSERT ON job_applications
            FOR EACH ROW
            BEGIN
                UPDATE jobs 
                SET applications_count = applications_count + 1
                WHERE id = NEW.job_id;
            END
            """
            try:
                await cursor.execute(trigger_sql)
                print("   ✓ Increment trigger created")
            except Exception as e:
                print(f"   Error creating increment trigger: {e}")
            
            # Create decrement trigger
            print("3. Creating decrement trigger...")
            trigger_sql = """
            CREATE TRIGGER decrement_applications_count
            AFTER DELETE ON job_applications
            FOR EACH ROW
            BEGIN
                UPDATE jobs 
                SET applications_count = GREATEST(0, applications_count - 1)
                WHERE id = OLD.job_id;
            END
            """
            try:
                await cursor.execute(trigger_sql)
                print("   ✓ Decrement trigger created")
            except Exception as e:
                print(f"   Error creating decrement trigger: {e}")
            
            # Fix existing counts
            print("4. Fixing existing application counts...")
            fix_sql = """
            UPDATE jobs j
            SET applications_count = (
                SELECT COUNT(*) 
                FROM job_applications ja 
                WHERE ja.job_id = j.id
            )
            """
            await cursor.execute(fix_sql)
            affected = cursor.rowcount
            await conn.commit()
            print(f"   ✓ Updated {affected} job(s)")
            
            # Verify
            print("5. Verifying counts...")
            verify_sql = """
            SELECT 
                j.id,
                j.title,
                j.applications_count as stored_count,
                COUNT(ja.id) as actual_count
            FROM jobs j
            LEFT JOIN job_applications ja ON j.id = ja.job_id
            GROUP BY j.id, j.title, j.applications_count
            HAVING j.applications_count != COUNT(ja.id)
            """
            await cursor.execute(verify_sql)
            mismatches = await cursor.fetchall()
            
            if mismatches:
                print(f"   ⚠ Found {len(mismatches)} mismatches:")
                for row in mismatches:
                    print(f"     - Job '{row[1]}': stored={row[2]}, actual={row[3]}")
            else:
                print("   ✓ All counts are accurate!")
            
            print("\n✅ Trigger setup complete!")
            
    pool.close()
    await pool.wait_closed()

if __name__ == "__main__":
    print("=" * 60)
    print("Job Application Triggers Setup")
    print("=" * 60)
    asyncio.run(apply_triggers())
