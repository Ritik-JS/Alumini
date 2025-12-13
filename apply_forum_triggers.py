#!/usr/bin/env python3
"""
Apply Forum Database Triggers Fix
This script applies the database trigger fixes for the forum functionality
"""

import asyncio
import aiomysql
import os
import sys

async def apply_triggers():
    """Apply the database triggers from the SQL file"""
    
    # Parse database URL
    db_url = os.getenv('MYSQL_URL', 'mysql://alumni_user:alumni_pass_123@localhost:3306/alumni_portal')
    
    # Extract connection details
    # Format: mysql://user:pass@host:port/database
    parts = db_url.replace('mysql://', '').split('@')
    user_pass = parts[0].split(':')
    host_port_db = parts[1].split('/')
    host_port = host_port_db[0].split(':')
    
    user = user_pass[0]
    password = user_pass[1]
    host = host_port[0]
    port = int(host_port[1]) if len(host_port) > 1 else 3306
    database = host_port_db[1]
    
    print(f"🔌 Connecting to database: {host}:{port}/{database}")
    
    try:
        # Connect to database
        connection = await aiomysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            db=database,
            autocommit=True
        )
        
        print("✅ Connected to database")
        
        async with connection.cursor() as cursor:
            # Read the SQL file
            print("\n📖 Reading SQL file...")
            with open('/app/database_forum_triggers_fix.sql', 'r') as f:
                sql_content = f.read()
            
            # Split by delimiter and execute each statement
            statements = []
            current_statement = []
            current_delimiter = ';'
            
            for line in sql_content.split('\n'):
                line = line.strip()
                
                # Skip comments and empty lines
                if not line or line.startswith('--'):
                    continue
                
                # Check for delimiter change
                if line.startswith('DELIMITER'):
                    new_delimiter = line.split()[1]
                    if new_delimiter != ';':
                        current_delimiter = new_delimiter
                    else:
                        current_delimiter = ';'
                    continue
                
                current_statement.append(line)
                
                # Check if statement is complete
                if line.endswith(current_delimiter):
                    stmt = ' '.join(current_statement).rstrip(current_delimiter)
                    if stmt.strip():
                        statements.append(stmt.strip())
                    current_statement = []
            
            # Execute each statement
            print(f"\n🔨 Executing {len(statements)} SQL statements...\n")
            
            for i, statement in enumerate(statements, 1):
                try:
                    # Print statement type
                    stmt_preview = statement[:80] + "..." if len(statement) > 80 else statement
                    print(f"{i}. Executing: {stmt_preview}")
                    
                    await cursor.execute(statement)
                    print(f"   ✅ Success")
                    
                except Exception as e:
                    error_msg = str(e)
                    # Ignore "trigger already exists" errors
                    if "already exists" in error_msg.lower():
                        print(f"   ⚠️  Trigger already exists, skipping")
                    else:
                        print(f"   ❌ Error: {error_msg}")
            
            # Verify triggers were created
            print("\n🔍 Verifying triggers...")
            await cursor.execute("""
                SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE 
                FROM information_schema.TRIGGERS 
                WHERE TRIGGER_SCHEMA = %s 
                AND EVENT_OBJECT_TABLE IN ('post_likes', 'comment_likes', 'forum_comments')
                ORDER BY EVENT_OBJECT_TABLE, EVENT_MANIPULATION
            """, (database,))
            
            triggers = await cursor.fetchall()
            
            if triggers:
                print("\n✅ Forum triggers created successfully:\n")
                for trigger in triggers:
                    print(f"   • {trigger[0]} - {trigger[1]} on {trigger[2]}")
            else:
                print("\n⚠️  No triggers found - they may need to be created manually")
            
            print("\n" + "="*60)
            print("✅ Forum database triggers fix completed!")
            print("="*60)
            
        connection.close()
        
    except Exception as e:
        print(f"\n❌ Error applying triggers: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    print("="*60)
    print("Forum Database Triggers Fix")
    print("="*60 + "\n")
    
    asyncio.run(apply_triggers())
