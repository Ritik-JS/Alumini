# 📊 AlumUnity Sample Data Guide

## Overview
This guide explains how to use the sample data insert script to quickly populate your AlumUnity database with realistic test data.

## 📁 Files
- **`/app/sample_data_insert.sql`** - Main sample data insertion script
- **`/app/database_schema.sql`** - Database schema (run this first)

## 🚀 Quick Start

### Step 1: Create the Database Schema
First, ensure your database schema is set up:

```bash
# Login to MySQL
mysql -u root -p

# Run the schema creation script
source /app/database_schema.sql
```

Or from command line:
```bash
mysql -u root -p < /app/database_schema.sql
```

### Step 2: Insert Sample Data
After the schema is created, insert the sample data:

```bash
# Login to MySQL
mysql -u root -p

# Run the sample data script
source /app/sample_data_insert.sql
```

Or from command line:
```bash
mysql -u root -p < /app/sample_data_insert.sql
```

### Step 3: Verify Installation
The script automatically displays a summary of inserted records. You should see:

```
✅ Sample data insertion completed successfully!

table_name              | record_count
------------------------|-------------
Users                   | 10
Alumni Profiles         | 4
Jobs                    | 5
Job Applications        | 3
Mentor Profiles         | 4
Mentorship Requests     | 3
Mentorship Sessions     | 4
Events                  | 5
Event RSVPs             | 7
Forum Posts             | 4
Forum Comments          | 5
Notifications           | 6
Badges                  | 6
User Badges             | 4
Engagement Scores       | 5
Skill Graph             | 5
Knowledge Capsules      | 3
Geographic Data         | 3
Alumni Cards            | 2
System Config           | 4
```

## 📋 What's Included

### Users (10 total)
| Role      | Count | Email Examples |
|-----------|-------|----------------|
| Admin     | 1     | admin@alumni.edu |
| Alumni    | 4     | sarah.johnson@alumni.edu, michael.chen@alumni.edu, priya.patel@alumni.edu, lisa.anderson@alumni.edu |
| Students  | 3     | emily.rodriguez@alumni.edu, james.wilson@alumni.edu, maria.garcia@alumni.edu |
| Recruiters| 2     | david.kim@techcorp.com, robert.taylor@startupventures.com |

**Default Password for All Users:** The password hash corresponds to `password123` (already hashed with bcrypt)

### Alumni Profiles (4 complete profiles)
1. **Sarah Johnson** - Senior Software Engineer at Google
   - 5 years experience, Full-Stack Development
   - 100% profile completion, Verified mentor
   
2. **Michael Chen** - Senior Product Manager at Amazon
   - 6 years experience, AI/ML Products
   - 95% profile completion, Verified mentor
   
3. **Priya Patel** - Lead UX Designer at Airbnb
   - 5 years experience, Design Systems
   - 100% profile completion, Verified mentor
   
4. **Lisa Anderson** - Senior Data Scientist at Netflix
   - 6 years experience, Machine Learning
   - 98% profile completion, Verified mentor

### Jobs (5 positions)
- Senior Full-Stack Engineer at TechCorp Solutions ($150K-$200K)
- Product Designer at DesignFirst Inc ($100K-$130K)
- Machine Learning Engineer at AI Innovations Lab ($140K-$180K)
- Frontend Developer Intern at Startup Ventures ($25-$35/hr)
- DevOps Engineer at CloudTech Systems ($120K-$160K)

### Mentorship (4 active mentors)
- Total: 4 mentor profiles
- Active mentorship requests: 3
- Completed sessions: 4

### Events (5 events)
- Tech Career Fair 2025 (Conference)
- Machine Learning Workshop (Workshop)
- Alumni Networking Mixer (Networking)
- Web Development Bootcamp (Workshop)
- Product Management Panel (Webinar)

### Community Features
- Forum posts: 4 active discussions
- Forum comments: 5 comments (including threaded replies)
- Notifications: 6 sample notifications
- Badges: 6 achievement badges
- Knowledge Capsules: 3 educational articles

### Engagement System
- 5 users with engagement scores and rankings
- Gamification levels: Legend, Veteran, Active
- Leaderboard data included

### Additional Data
- Skill Graph: 5 popular skills with relationships
- Geographic Data: 3 tech hub locations
- Alumni Cards: 2 digital ID cards
- System Configuration: 4 config settings

## 🔐 Test Login Credentials

All users have the same password for testing purposes:
- **Password:** `password123`

### Sample Login Accounts

**Admin:**
```
Email: admin@alumni.edu
Password: password123
```

**Alumni (Mentor):**
```
Email: sarah.johnson@alumni.edu
Password: password123
```

**Student:**
```
Email: emily.rodriguez@alumni.edu
Password: password123
```

**Recruiter:**
```
Email: david.kim@techcorp.com
Password: password123
```

## 🔄 Resetting Data

If you need to clear all data and start fresh:

```sql
-- Warning: This will delete ALL data!
USE AlumUnity;

SET FOREIGN_KEY_CHECKS = 0;

-- Truncate all tables
TRUNCATE TABLE alumni_cards;
TRUNCATE TABLE geographic_data;
TRUNCATE TABLE knowledge_capsules;
TRUNCATE TABLE capsule_bookmarks;
TRUNCATE TABLE capsule_likes;
TRUNCATE TABLE skill_graph;
TRUNCATE TABLE engagement_scores;
TRUNCATE TABLE user_badges;
TRUNCATE TABLE badges;
TRUNCATE TABLE notifications;
TRUNCATE TABLE notification_preferences;
TRUNCATE TABLE comment_likes;
TRUNCATE TABLE post_likes;
TRUNCATE TABLE forum_comments;
TRUNCATE TABLE forum_posts;
TRUNCATE TABLE event_rsvps;
TRUNCATE TABLE events;
TRUNCATE TABLE mentorship_sessions;
TRUNCATE TABLE mentorship_requests;
TRUNCATE TABLE mentor_profiles;
TRUNCATE TABLE job_applications;
TRUNCATE TABLE jobs;
TRUNCATE TABLE profile_verification_requests;
TRUNCATE TABLE alumni_profiles;
TRUNCATE TABLE password_resets;
TRUNCATE TABLE email_verifications;
TRUNCATE TABLE users;
TRUNCATE TABLE system_config;

SET FOREIGN_KEY_CHECKS = 1;

-- Now you can re-run the sample data insert script
```

Or simply drop and recreate the database:
```sql
DROP DATABASE AlumUnity;
-- Then run database_schema.sql and sample_data_insert.sql again
```

## 📊 Database Structure

The sample data follows the complete database schema with these major phases:

### Phase 1: Authentication
- Users and authentication tables
- Email verifications and password resets

### Phase 2: Profiles
- Alumni profiles with complete information
- Profile verification system

### Phase 3: Jobs & Career
- Job postings and applications
- Application tracking with statuses

### Phase 4: Mentorship
- Mentor profiles and availability
- Mentorship requests and sessions
- Feedback and ratings

### Phase 5: Events & Community
- Event management and RSVPs
- Forum posts and comments
- Community engagement

### Phase 6: Notifications
- User notifications across all features
- Notification preferences

### Phase 8: Engagement & Gamification
- Achievement badges
- Engagement scoring system
- Leaderboards

### Phase 9: Innovative Features
- Skill graph and relationships
- Knowledge capsules (learning content)
- Geographic data for heatmaps
- Digital alumni ID cards

## 🛠️ Customizing Sample Data

### Adding More Users
To add additional users, follow this pattern:

```sql
INSERT INTO users (id, email, password_hash, role, is_verified, is_active) VALUES
('your-uuid-here', 'newemail@example.com', '$2b$12$...', 'alumni', TRUE, TRUE);

-- Then add corresponding profile if alumni
INSERT INTO alumni_profiles (id, user_id, name, ...) VALUES
('profile-uuid', 'user-uuid', 'Full Name', ...);
```

### Modifying Existing Data
You can update any data using standard SQL UPDATE statements:

```sql
UPDATE users SET email = 'newemail@alumni.edu' WHERE id = 'user-id';
UPDATE jobs SET status = 'closed' WHERE id = 'job-id';
```

## 🧪 Testing Scenarios

### Test Case 1: Student Job Application Flow
1. Login as Emily (emily.rodriguez@alumni.edu)
2. Browse jobs
3. Apply for internship position
4. Check application status (already shortlisted in sample data)

### Test Case 2: Mentorship Session
1. Login as Emily (student)
2. View mentorship requests (accepted request exists)
3. Check scheduled sessions with Sarah Johnson
4. View session details and feedback

### Test Case 3: Recruiter Dashboard
1. Login as David Kim (recruiter)
2. View posted jobs
3. Check applications for jobs
4. Review applicant profiles

### Test Case 4: Alumni Networking
1. Login as Sarah (alumni)
2. View upcoming events
3. RSVP to Alumni Networking Mixer
4. Check forum posts and add comments

### Test Case 5: Admin Management
1. Login as admin
2. View all users
3. Manage profiles and verifications
4. View system-wide statistics

## 📈 Database Relationships

The sample data maintains proper foreign key relationships:

```
users (1) ←→ (1) alumni_profiles
users (1) ←→ (1) mentor_profiles
users (1) ←→ (many) job_applications
users (1) ←→ (many) mentorship_requests
users (1) ←→ (many) event_rsvps
users (1) ←→ (many) forum_posts
users (1) ←→ (many) notifications

jobs (1) ←→ (many) job_applications
events (1) ←→ (many) event_rsvps
forum_posts (1) ←→ (many) forum_comments
mentorship_requests (1) ←→ (many) mentorship_sessions
```

## 🔍 Useful Queries

### View all active mentors with their ratings:
```sql
SELECT u.email, ap.name, mp.rating, mp.total_sessions, mp.is_available
FROM mentor_profiles mp
JOIN alumni_profiles ap ON mp.user_id = ap.user_id
JOIN users u ON mp.user_id = u.id
WHERE mp.is_available = TRUE
ORDER BY mp.rating DESC;
```

### Get job applications by status:
```sql
SELECT j.title, j.company, u.email, ja.status, ja.applied_at
FROM job_applications ja
JOIN jobs j ON ja.job_id = j.id
JOIN users u ON ja.applicant_id = u.id
ORDER BY ja.applied_at DESC;
```

### View engagement leaderboard:
```sql
SELECT u.email, ap.name, es.total_score, es.level, es.rank_position
FROM engagement_scores es
JOIN users u ON es.user_id = u.id
LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
ORDER BY es.rank_position;
```

### Get upcoming events with RSVP counts:
```sql
SELECT e.title, e.event_type, e.start_date, e.current_attendees_count, e.max_attendees
FROM events e
WHERE e.start_date > NOW()
ORDER BY e.start_date;
```

## 🐛 Troubleshooting

### Issue: Foreign key constraint errors
**Solution:** Make sure you run `database_schema.sql` before `sample_data_insert.sql`

### Issue: Duplicate key errors
**Solution:** Your database already has data. Clear it first using the reset instructions above.

### Issue: UUID() function not working
**Solution:** 
- For MySQL 8.0+: Use UUID() (default in script)
- For MariaDB < 10.7: Replace UUID() with UUID_SHORT() or generate UUIDs in application

### Issue: Cannot import file
**Solution:** Ensure you have proper permissions and the MySQL user has INSERT privileges:
```sql
GRANT ALL PRIVILEGES ON AlumUnity.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

## 📚 Additional Resources

- **Main Documentation:** See `/app/DATABASE_README.md`
- **Mock Data JSON:** See `/app/mockdata.json` for frontend reference
- **API Workflows:** See `/app/BACKEND_WORKFLOW.md`

## ✅ Verification Checklist

After running the script, verify:
- [ ] All 10 users created successfully
- [ ] 4 alumni profiles with complete information
- [ ] 5 jobs posted and 3 applications submitted
- [ ] 4 mentor profiles and 3 mentorship requests
- [ ] 5 events created with 7 RSVPs
- [ ] Forum posts and comments visible
- [ ] Badges and engagement scores populated
- [ ] Can login with test credentials
- [ ] Foreign key relationships intact

## 🎯 Next Steps

1. **Test the Backend API:**
   ```bash
   # Start your FastAPI server
   cd /app/backend
   python server.py
   
   # Test user login
   curl -X POST http://localhost:8001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@alumni.edu","password":"password123"}'
   ```

2. **Test the Frontend:**
   ```bash
   # Start your React app
   cd /app/frontend
   yarn start
   
   # Login with any test credentials
   ```

3. **Explore the Data:**
   - Browse jobs and apply as a student
   - View mentorship opportunities
   - Check upcoming events
   - Read forum discussions
   - View alumni profiles

## 📞 Support

For issues or questions:
1. Check the main `DATABASE_README.md` file
2. Verify your MySQL/MariaDB version compatibility
3. Ensure all required permissions are granted
4. Review the sample data structure in the SQL file

---

**Last Updated:** January 2025  
**Data Version:** 1.0  
**Compatible With:** MySQL 8.0+, MariaDB 10.5+

Happy Testing! 🚀
