# AlumUnity Database Schema Documentation

## 📌 Overview
This document provides a comprehensive guide to the MySQL 8.0 / MariaDB 10.5+ database schema for the AlumUnity System.

## 📁 Files Updated
1. **`/app/database_schema.sql`** - Complete MySQL database schema (NEW)
2. **`/app/BACKEND_WORKFLOW.md`** - Updated with database references
3. **`/app/FRONTEND_WORKFLOW.md`** - Updated with API integration guidelines

## 🗄️ Database Schema Highlights

### Database Information
- **Database Name**: `alumni_portal`
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`
- **Compatible With**: MySQL 8.0+ and MariaDB 10.5+

### Schema Components
✅ **40+ Tables** covering all system features
✅ **4 Views** for common complex queries
✅ **3 Stored Procedures** for business logic
✅ **6 Triggers** for automatic data updates
✅ **Foreign Keys** with proper cascading
✅ **Indexes** optimized for performance
✅ **JSON Columns** for flexible data storage
✅ **FULLTEXT Indexes** for powerful search
✅ **Initial Data** seeding for badges and config

## 📊 Table Categories

### Phase 1: Authentication (3 tables)
- `users` - User accounts and authentication
- `email_verifications` - Email verification OTPs
- `password_resets` - Password reset tokens

### Phase 2: Profiles (2 tables)
- `alumni_profiles` - Comprehensive alumni profiles
- `profile_verification_requests` - Admin verification workflow

### Phase 3: Jobs & Career (2 tables)
- `jobs` - Job postings
- `job_applications` - Application tracking

### Phase 4: Mentorship (3 tables)
- `mentor_profiles` - Mentor information
- `mentorship_requests` - Mentorship requests
- `mentorship_sessions` - Session scheduling and feedback

### Phase 5: Events & Community (6 tables)
- `events` - Event management
- `event_rsvps` - Event attendance tracking
- `forum_posts` - Community discussions
- `forum_comments` - Post comments with threading
- `post_likes` - Post likes
- `comment_likes` - Comment likes

### Phase 6: Notifications (3 tables)
- `notifications` - User notifications
- `notification_preferences` - User preferences
- `email_queue` - Async email processing

### Phase 7: Admin & Analytics (4 tables)
- `admin_actions` - Audit log of admin operations
- `system_metrics` - Time-series metrics data
- `content_flags` - Content moderation
- `system_config` - System configuration

### Phase 8: Engagement & Algorithms (5 tables)
- `user_interests` - User preferences and history
- `engagement_scores` - Gamification scores
- `contribution_history` - Activity tracking
- `badges` - Achievement badges
- `user_badges` - User-earned badges

### Phase 9: Innovative Features (8 tables)
- `skill_graph` - Skill relationships network
- `career_paths` - Career transition history
- `career_predictions` - AI-powered predictions
- `alumni_cards` - Digital ID cards with QR codes
- `geographic_data` - Location-based analytics
- `knowledge_capsules` - Knowledge sharing platform
- `capsule_bookmarks` - Capsule bookmarks
- `capsule_likes` - Capsule likes

### Additional Utility Tables (3 tables)
- `file_uploads` - File upload tracking
- `email_queue` - Email sending queue
- `system_config` - System settings

## 🔧 Stored Procedures

### 1. `calculate_profile_completion(user_id)`
Calculates and updates profile completion percentage based on:
- Photo (15 points)
- Bio (15 points)
- Experience (25 points)
- Education (15 points)
- Skills (20 points)
- CV (10 points)

**Usage**:
```sql
CALL calculate_profile_completion('user-uuid-here');
```

### 2. `update_engagement_score(user_id)`
Calculates engagement score from various activities:
- Profile completion (20% weight)
- Mentorship sessions (10 points each)
- Job applications (5 points each)
- Event attendance (8 points each)
- Forum activity (5 points per post, 2 per comment)

**Usage**:
```sql
CALL update_engagement_score('user-uuid-here');
```

### 3. `send_notification(user_id, type, title, message, link, priority)`
Creates a notification for a user.

**Usage**:
```sql
CALL send_notification(
    'user-uuid',
    'mentorship',
    'New Mentorship Request',
    'You have a new mentorship request from John Doe',
    '/mentorship/requests/123',
    'high'
);
```

## 📈 Database Views

### 1. `active_alumni`
Shows active verified alumni with complete profiles (≥70% completion).

### 2. `job_statistics`
Aggregates job performance metrics including views and application counts.

### 3. `mentor_statistics`
Shows mentor stats including ratings, sessions, and request counts.

### 4. `engagement_leaderboard`
Ranked list of users by engagement score.

## ⚡ Automatic Triggers

### 1. `after_job_application_insert`
Auto-increments `jobs.applications_count` when new application is submitted.

### 2. `after_mentorship_accept`
Increments `mentor_profiles.current_mentees_count` when request is accepted.

### 3. `after_event_rsvp`
Updates `events.current_attendees_count` on RSVP.

### 4. `after_post_like_insert`
Updates `forum_posts.likes_count` when post is liked.

### 5. `after_comment_insert`
Updates `forum_posts.comments_count` when comment is added.

### 6. `after_session_feedback`
Recalculates mentor rating when session feedback is submitted.

## 🚀 Setup Instructions

### Option 1: MySQL 8.0
```bash
# Login to MySQL
mysql -u root -p

# Import the schema
source /app/database_schema.sql

# Or from command line
mysql -u root -p < /app/database_schema.sql
```

### Option 2: MariaDB 10.5+
```bash
# Login to MariaDB
mariadb -u root -p

# Import the schema
source /app/database_schema.sql

# Or from command line
mariadb -u root -p < /app/database_schema.sql
```

### Backend Configuration
Update your backend `.env` file:
```env
# For MySQL
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=alumni_app
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=alumni_portal

# Connection string format
DATABASE_URL=mysql://alumni_app:your_secure_password@localhost:3306/alumni_portal
```

## 🔐 Security Considerations

### Recommended User Setup
```sql
-- Create application user
CREATE USER 'alumni_app'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON alumni_portal.* TO 'alumni_app'@'localhost';
GRANT EXECUTE ON alumni_portal.* TO 'alumni_app'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;
```

### Password Hashing
- Passwords stored using bcrypt hashing
- Minimum 60-character hash length
- Never store plain text passwords

### JWT Tokens
- Use secure secret key
- Set appropriate expiration times
- Store securely in frontend (httpOnly cookies recommended)

## 📝 Key Features

### UUID Primary Keys
All tables use UUID format for primary keys:
- Better distribution in distributed systems
- No sequential ID guessing
- 36 characters with hyphens (e.g., `550e8400-e29b-41d4-a716-446655440000`)

### JSON Columns
Flexible data storage for:
- Skills arrays
- Experience timelines
- Metadata
- Preferences
- Compatible with both MySQL and MariaDB

### FULLTEXT Indexes
Powerful search capabilities on:
- Alumni profiles (name, bio, headline)
- Jobs (title, description)
- Forum posts (title, content)
- Knowledge capsules (title, content)

### Cascade Deletes
Foreign keys configured to:
- CASCADE delete related records (most cases)
- SET NULL for audit trail preservation (admin actions, reviews)

## 🎯 Integration with Backend

### Python FastAPI Example
```python
import aiomysql
import os
from typing import Optional

# Database connection pool
async def get_db_pool():
    pool = await aiomysql.create_pool(
        host=os.getenv('MYSQL_HOST'),
        port=int(os.getenv('MYSQL_PORT', 3306)),
        user=os.getenv('MYSQL_USER'),
        password=os.getenv('MYSQL_PASSWORD'),
        db=os.getenv('MYSQL_DATABASE'),
        charset='utf8mb4',
        autocommit=False
    )
    return pool

# Example query
async def get_user_by_email(email: str):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                "SELECT * FROM users WHERE email = %s",
                (email,)
            )
            return await cursor.fetchone()

# Example with stored procedure
async def update_user_engagement(user_id: str):
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.callproc('update_engagement_score', (user_id,))
            await conn.commit()
```

### Node.js Example
```javascript
const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Example query
async function getUserByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
}

// Example with stored procedure
async function updateEngagement(userId) {
  await pool.query(
    'CALL update_engagement_score(?)',
    [userId]
  );
}
```

## 📊 Performance Optimization

### Indexed Columns
All frequently queried columns have indexes:
- User email, role, verification status
- Job company, location, status
- Event start date, status
- Profile company, location, batch year
- Notification user_id, is_read

### Query Optimization Tips
1. Use prepared statements to prevent SQL injection
2. Leverage stored procedures for complex operations
3. Use views for frequently accessed joined data
4. Monitor slow query log
5. Analyze and optimize with EXPLAIN
6. Consider partitioning for very large tables

### Maintenance
```sql
-- Analyze tables for optimization
ANALYZE TABLE users, jobs, events;

-- Check table status
SHOW TABLE STATUS;

-- Optimize tables
OPTIMIZE TABLE forum_posts, notifications;
```

## 🔄 Migration from MongoDB

If migrating from MongoDB to MySQL:

### Data Type Mappings
- MongoDB ObjectId → MySQL VARCHAR(36) UUID
- MongoDB Document → MySQL JSON column
- MongoDB Array → MySQL JSON column
- MongoDB Date → MySQL TIMESTAMP

### Example Migration Script
```python
import pymongo
import aiomysql
import json
from datetime import datetime

async def migrate_users():
    # MongoDB connection
    mongo_client = pymongo.MongoClient('mongodb://localhost:27017/')
    mongo_db = mongo_client['alumni_portal']
    
    # MySQL connection
    mysql_conn = await aiomysql.connect(...)
    
    async with mysql_conn.cursor() as cursor:
        for user in mongo_db.users.find():
            await cursor.execute(
                """INSERT INTO users 
                   (id, email, password_hash, role, is_verified, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (
                    str(user['_id']),
                    user['email'],
                    user['password_hash'],
                    user['role'],
                    user.get('is_verified', False),
                    user.get('created_at', datetime.now())
                )
            )
        await mysql_conn.commit()
```

## 📚 Additional Resources

### MySQL 8.0 Documentation
- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- [JSON Functions](https://dev.mysql.com/doc/refman/8.0/en/json-functions.html)
- [Full-Text Search](https://dev.mysql.com/doc/refman/8.0/en/fulltext-search.html)

### MariaDB Documentation
- [MariaDB Knowledge Base](https://mariadb.com/kb/en/)
- [JSON Data Type](https://mariadb.com/kb/en/json-data-type/)

## 🐛 Troubleshooting

### Common Issues

**Issue**: UUID() function not recognized
```sql
-- For MariaDB < 10.7, use:
UUID_SHORT() 
-- Or generate UUIDs in application code
```

**Issue**: JSON functions not working
```sql
-- Check MySQL version
SELECT VERSION();
-- Requires MySQL 5.7.8+ or MariaDB 10.2+
```

**Issue**: Foreign key constraints failing
```sql
-- Temporarily disable for data import
SET FOREIGN_KEY_CHECKS = 0;
-- ... import data ...
SET FOREIGN_KEY_CHECKS = 1;
```

## ✅ Validation Checklist

After importing the schema:

- [ ] All tables created successfully
- [ ] Foreign keys established
- [ ] Indexes created
- [ ] Triggers working
- [ ] Stored procedures callable
- [ ] Views accessible
- [ ] Initial data seeded (badges, config)
- [ ] Test user creation
- [ ] Test cascading deletes
- [ ] Test stored procedures
- [ ] Verify JSON column operations

## 📞 Support

For questions or issues:
1. Check the workflow files (BACKEND_WORKFLOW.md, FRONTEND_WORKFLOW.md)
2. Review MySQL/MariaDB documentation
3. Verify database version compatibility
4. Check connection string configuration

---

**Last Updated**: 2025
**Schema Version**: 1.0
**Compatible With**: MySQL 8.0+, MariaDB 10.5+
