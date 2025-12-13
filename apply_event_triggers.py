"""
Script to apply event RSVP triggers to the database
"""
import asyncio
import aiomysql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

async def apply_triggers():
    """Apply the event RSVP triggers to the database"""
    
    # Parse MySQL URL
    mysql_url = os.getenv('MYSQL_URL', 'mysql://alumni_user:alumni_pass_123@localhost:3306/alumni_portal')
    
    # Extract connection details
    # Format: mysql://user:password@host:port/database
    import re
    match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', mysql_url)
    if not match:
        print("❌ Invalid MySQL URL format")
        return
    
    user, password, host, port, database = match.groups()
    
    print(f"📊 Connecting to database: {database} at {host}:{port}")
    
    try:
        # Connect to MySQL
        conn = await aiomysql.connect(
            host=host,
            port=int(port),
            user=user,
            password=password,
            db=database,
            charset='utf8mb4'
        )
        
        print("✅ Connected to database")
        
        async with conn.cursor() as cursor:
            print("\n🔧 Dropping existing triggers...")
            
            # Drop existing triggers
            drop_triggers = [
                "DROP TRIGGER IF EXISTS after_event_rsvp",
                "DROP TRIGGER IF EXISTS after_event_rsvp_insert",
                "DROP TRIGGER IF EXISTS after_event_rsvp_update",
                "DROP TRIGGER IF EXISTS after_event_rsvp_delete"
            ]
            
            for trigger_sql in drop_triggers:
                await cursor.execute(trigger_sql)
                print(f"  ✓ Dropped: {trigger_sql.split()[-1]}")
            
            await conn.commit()
            
            print("\n🔧 Creating new triggers...")
            
            # Create INSERT trigger
            insert_trigger = """
            CREATE TRIGGER after_event_rsvp_insert
            AFTER INSERT ON event_rsvps
            FOR EACH ROW
            BEGIN
                IF NEW.status = 'attending' THEN
                    UPDATE events 
                    SET current_attendees_count = current_attendees_count + 1 
                    WHERE id = NEW.event_id;
                END IF;
            END
            """
            await cursor.execute(insert_trigger)
            print("  ✓ Created: after_event_rsvp_insert")
            
            # Create UPDATE trigger
            update_trigger = """
            CREATE TRIGGER after_event_rsvp_update
            AFTER UPDATE ON event_rsvps
            FOR EACH ROW
            BEGIN
                IF OLD.status = 'attending' AND NEW.status != 'attending' THEN
                    UPDATE events 
                    SET current_attendees_count = GREATEST(current_attendees_count - 1, 0)
                    WHERE id = NEW.event_id;
                END IF;
                
                IF OLD.status != 'attending' AND NEW.status = 'attending' THEN
                    UPDATE events 
                    SET current_attendees_count = current_attendees_count + 1 
                    WHERE id = NEW.event_id;
                END IF;
            END
            """
            await cursor.execute(update_trigger)
            print("  ✓ Created: after_event_rsvp_update")
            
            # Create DELETE trigger
            delete_trigger = """
            CREATE TRIGGER after_event_rsvp_delete
            AFTER DELETE ON event_rsvps
            FOR EACH ROW
            BEGIN
                IF OLD.status = 'attending' THEN
                    UPDATE events 
                    SET current_attendees_count = GREATEST(current_attendees_count - 1, 0)
                    WHERE id = OLD.event_id;
                END IF;
            END
            """
            await cursor.execute(delete_trigger)
            print("  ✓ Created: after_event_rsvp_delete")
            
            await conn.commit()
            
            print("\n🔧 Recalculating attendee counts for existing events...")
            
            # Fix existing data
            fix_counts_sql = """
            UPDATE events e
            SET current_attendees_count = (
                SELECT COUNT(*)
                FROM event_rsvps r
                WHERE r.event_id = e.id AND r.status = 'attending'
            )
            """
            await cursor.execute(fix_counts_sql)
            affected_rows = cursor.rowcount
            await conn.commit()
            print(f"  ✓ Updated {affected_rows} events")
            
            print("\n✅ Verifying triggers...")
            
            # Verify triggers exist
            verify_sql = """
            SELECT 
                TRIGGER_NAME, 
                EVENT_MANIPULATION, 
                ACTION_TIMING
            FROM information_schema.TRIGGERS 
            WHERE TRIGGER_SCHEMA = %s
              AND EVENT_OBJECT_TABLE = 'event_rsvps'
            ORDER BY TRIGGER_NAME
            """
            await cursor.execute(verify_sql, (database,))
            triggers = await cursor.fetchall()
            
            if triggers:
                print(f"\n📋 Active Triggers ({len(triggers)}):")
                for trigger in triggers:
                    print(f"  • {trigger[0]}: {trigger[2]} {trigger[1]}")
            else:
                print("⚠️  No triggers found!")
            
            print("\n✅ Verifying event counts...")
            
            # Verify counts
            verify_counts_sql = """
            SELECT 
                e.id,
                e.title,
                e.current_attendees_count AS stored_count,
                (SELECT COUNT(*) FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'attending') AS actual_count
            FROM events e
            ORDER BY e.created_at DESC
            LIMIT 5
            """
            await cursor.execute(verify_counts_sql)
            events = await cursor.fetchall()
            
            if events:
                print(f"\n📊 Sample Events (showing {len(events)}):")
                for event in events:
                    event_id, title, stored, actual = event
                    status = "✅ OK" if stored == actual else "❌ MISMATCH"
                    print(f"  {status} {title[:50]}: stored={stored}, actual={actual}")
            else:
                print("  ℹ️  No events found in database")
        
        conn.close()
        print("\n✅ All triggers applied successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(apply_triggers())
