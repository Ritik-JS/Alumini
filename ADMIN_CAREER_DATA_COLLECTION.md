# 📊 Admin Guide: Career Data Collection for ML Training

## Overview

This guide explains how administrators can collect career transition data to enable ML-powered career predictions.

---

## 🎯 Goal

Collect **50+ career transition records** to train the Machine Learning model for accurate career path predictions.

---

## 📋 Data Collection Methods

### Method 1: Alumni Profile Form (Recommended)

**Add to Alumni Profile Page**:

```jsx
// Frontend: AlumniProfile.jsx

<section className="career-history">
  <h3>📈 Career Journey</h3>
  <p>Help future alumni by sharing your career progression</p>
  
  <form onSubmit={handleCareerHistorySubmit}>
    {/* Previous Role */}
    <div>
      <label>Previous Role</label>
      <input type="text" placeholder="e.g., Software Engineer" />
    </div>
    
    {/* Previous Company */}
    <div>
      <label>Previous Company</label>
      <input type="text" placeholder="e.g., Microsoft" />
    </div>
    
    {/* Current Role */}
    <div>
      <label>Current Role</label>
      <input type="text" placeholder="e.g., Senior Software Engineer" />
    </div>
    
    {/* Current Company */}
    <div>
      <label>Current Company</label>
      <input type="text" placeholder="e.g., Google" />
    </div>
    
    {/* Transition Date */}
    <div>
      <label>When did you transition?</label>
      <input type="date" />
    </div>
    
    {/* Skills Acquired */}
    <div>
      <label>Key Skills You Developed</label>
      <MultiSelect 
        options={['Leadership', 'System Design', 'Cloud Computing', ...]}
      />
    </div>
    
    {/* Success Rating */}
    <div>
      <label>How successful was this transition?</label>
      <StarRating value={successRating} onChange={setSuccessRating} />
      <span>(1=Difficult, 5=Smooth)</span>
    </div>
    
    <button type="submit">Add Career Transition</button>
  </form>
</section>
```

**Backend API**:
```python
# POST /api/career-paths
@router.post("/career-paths")
async def add_career_transition(
    career_data: CareerTransitionInput,
    current_user: dict = Depends(get_current_user),
    db_conn = Depends(get_db)
):
    async with db_conn.cursor() as cursor:
        await cursor.execute("""
            INSERT INTO career_paths
            (user_id, from_role, to_role, from_company, to_company,
             transition_date, transition_duration_months, skills_acquired, success_rating)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            current_user['id'],
            career_data.from_role,
            career_data.to_role,
            career_data.from_company,
            career_data.to_company,
            career_data.transition_date,
            career_data.calculate_duration(),
            json.dumps(career_data.skills_acquired),
            career_data.success_rating
        ))
        await db_conn.commit()
    
    return {"message": "Career transition added successfully"}
```

---

### Method 2: CSV Bulk Upload

**Step 1: Create CSV Template**

Provide alumni with this template: `career_transitions.csv`

```csv
email,from_role,to_role,from_company,to_company,transition_date,skills_acquired,success_rating
sarah@alumni.edu,Software Engineer,Senior Software Engineer,Microsoft,Google,2022-03-01,"System Design|Leadership|Kubernetes",4
michael@alumni.edu,Software Engineer,Product Manager,Meta,Amazon,2021-08-01,"Product Strategy|Stakeholder Management",5
priya@alumni.edu,UX Designer,Lead UX Designer,Dropbox,Airbnb,2023-01-01,"Design Systems|Team Leadership",5
```

**Step 2: Admin Upload Interface**

```jsx
// Frontend: AdminCareerDataUpload.jsx

<div className="admin-upload-section">
  <h2>Upload Career Transition Data</h2>
  
  <div className="upload-stats">
    <div className="stat-card">
      <span className="stat-label">Current Transitions</span>
      <span className="stat-value">{currentTransitions}</span>
    </div>
    <div className="stat-card">
      <span className="stat-label">Target for ML</span>
      <span className="stat-value">50</span>
    </div>
    <div className="stat-card">
      <span className="stat-label">Progress</span>
      <ProgressBar value={currentTransitions} max={50} />
    </div>
  </div>
  
  <div className="upload-section">
    <a href="/templates/career_transitions.csv" download>
      📥 Download CSV Template
    </a>
    
    <FileUpload
      accept=".csv"
      onUpload={handleCSVUpload}
      maxSize="5MB"
    />
    
    {uploadResults && (
      <div className="upload-results">
        <p>✅ {uploadResults.success} records imported</p>
        <p>❌ {uploadResults.failed} records failed</p>
        {uploadResults.errors.length > 0 && (
          <details>
            <summary>View Errors</summary>
            <ul>
              {uploadResults.errors.map(err => <li>{err}</li>)}
            </ul>
          </details>
        )}
      </div>
    )}
  </div>
</div>
```

**Step 3: Backend CSV Parser**

```python
# POST /api/admin/career-data/upload
@router.post("/admin/career-data/upload")
async def upload_career_data(
    file: UploadFile,
    current_user: dict = Depends(require_admin),
    db_conn = Depends(get_db)
):
    import csv
    import io
    
    # Read CSV
    content = await file.read()
    csv_file = io.StringIO(content.decode('utf-8'))
    reader = csv.DictReader(csv_file)
    
    success_count = 0
    error_count = 0
    errors = []
    
    for row in reader:
        try:
            # Get user_id from email
            async with db_conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id FROM users WHERE email = %s",
                    (row['email'],)
                )
                user = await cursor.fetchone()
                
                if not user:
                    errors.append(f"User not found: {row['email']}")
                    error_count += 1
                    continue
                
                user_id = user[0]
                
                # Parse skills
                skills = row['skills_acquired'].split('|') if row['skills_acquired'] else []
                
                # Calculate duration
                transition_date = datetime.strptime(row['transition_date'], '%Y-%m-%d')
                duration_months = 24  # Default or calculate from dates
                
                # Insert career path
                await cursor.execute("""
                    INSERT INTO career_paths
                    (user_id, from_role, to_role, from_company, to_company,
                     transition_date, transition_duration_months, skills_acquired, success_rating)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id,
                    row['from_role'],
                    row['to_role'],
                    row['from_company'],
                    row['to_company'],
                    transition_date,
                    duration_months,
                    json.dumps(skills),
                    int(row['success_rating'])
                ))
                
                success_count += 1
        
        except Exception as e:
            errors.append(f"Row error: {str(e)}")
            error_count += 1
    
    await db_conn.commit()
    
    return {
        "success": success_count,
        "failed": error_count,
        "errors": errors
    }
```

---

### Method 3: LinkedIn Import (Future)

**Planned Feature**: Import career history from LinkedIn

```python
# POST /api/career-paths/import-linkedin
async def import_from_linkedin(
    linkedin_profile_url: str,
    current_user: dict = Depends(get_current_user)
):
    # Use LinkedIn API to fetch work history
    # Parse and insert career transitions
    # Return imported data
    pass
```

---

## 📊 Monitoring Data Collection

### Admin Dashboard Widget

```jsx
<DashboardCard title="ML Training Data Status">
  <div className="ml-data-status">
    <div className="status-header">
      <span className="status-icon">
        {transitions >= 50 ? '✅' : '⏳'}
      </span>
      <span className="status-text">
        {transitions >= 50 
          ? 'Ready for ML Training!' 
          : `${50 - transitions} more transitions needed`
        }
      </span>
    </div>
    
    <div className="progress-section">
      <ProgressBar 
        value={transitions} 
        max={50} 
        color={transitions >= 50 ? 'green' : 'blue'}
      />
      <span className="progress-text">{transitions} / 50</span>
    </div>
    
    <div className="data-breakdown">
      <div className="breakdown-item">
        <span>Career Transitions</span>
        <span className="value">{transitions}</span>
      </div>
      <div className="breakdown-item">
        <span>Unique Roles</span>
        <span className="value">{uniqueRoles}</span>
      </div>
      <div className="breakdown-item">
        <span>Alumni Contributing</span>
        <span className="value">{contributingAlumni}</span>
      </div>
    </div>
    
    {transitions >= 50 && (
      <button onClick={handleTrainModel} className="btn-primary">
        🤖 Train ML Model Now
      </button>
    )}
  </div>
</DashboardCard>
```

### API Endpoint for Stats

```python
# GET /api/admin/career-data/stats
@router.get("/admin/career-data/stats")
async def get_career_data_stats(
    current_user: dict = Depends(require_admin),
    db_conn = Depends(get_db)
):
    async with db_conn.cursor() as cursor:
        # Total transitions
        await cursor.execute(
            "SELECT COUNT(*) FROM career_paths WHERE from_role IS NOT NULL"
        )
        total_transitions = (await cursor.fetchone())[0]
        
        # Unique roles
        await cursor.execute(
            "SELECT COUNT(DISTINCT from_role) FROM career_paths"
        )
        unique_from_roles = (await cursor.fetchone())[0]
        
        await cursor.execute(
            "SELECT COUNT(DISTINCT to_role) FROM career_paths"
        )
        unique_to_roles = (await cursor.fetchone())[0]
        
        # Contributing alumni
        await cursor.execute(
            "SELECT COUNT(DISTINCT user_id) FROM career_paths"
        )
        contributing_alumni = (await cursor.fetchone())[0]
        
        # Recent additions (last 7 days)
        await cursor.execute("""
            SELECT COUNT(*) FROM career_paths
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        """)
        recent_additions = (await cursor.fetchone())[0]
    
    return {
        "total_transitions": total_transitions,
        "unique_from_roles": unique_from_roles,
        "unique_to_roles": unique_to_roles,
        "contributing_alumni": contributing_alumni,
        "recent_additions": recent_additions,
        "ml_ready": total_transitions >= 50,
        "progress_percentage": min(100, (total_transitions / 50) * 100)
    }
```

---

## 🎯 Incentivize Data Collection

### Gamification Ideas

1. **Badge System**
   - "Career Storyteller" badge for adding career history
   - "Community Contributor" for 5+ transitions
   - "ML Pioneer" for early contributors

2. **Leaderboard**
   - Recognize top contributors
   - Display in admin dashboard

3. **Benefits**
   - Better career predictions for contributors
   - Priority mentorship matching
   - Featured alumni profile

4. **Notifications**
   ```
   🎯 Help Build Our AI!
   Share your career journey to enable ML-powered predictions.
   Your experience can guide 100+ future alumni.
   [Add Career History] →
   ```

---

## ✅ Data Quality Guidelines

### What Makes Good Training Data

**✅ Good Examples**:
```
From: Junior Developer → To: Software Engineer
Duration: 18 months
Skills: JavaScript, React, Git, Code Review
Rating: 4/5
```

**❌ Poor Examples**:
```
From: Employee → To: Worker  ❌ Too vague
Duration: 0 months  ❌ Invalid duration
Skills: []  ❌ No skills listed
```

### Validation Rules

```python
def validate_career_transition(data):
    errors = []
    
    # Required fields
    if not data.from_role or len(data.from_role) < 3:
        errors.append("From role must be at least 3 characters")
    
    if not data.to_role or len(data.to_role) < 3:
        errors.append("To role must be at least 3 characters")
    
    # Duration check
    if data.duration_months < 1 or data.duration_months > 120:
        errors.append("Duration must be between 1-120 months")
    
    # Skills check
    if not data.skills_acquired or len(data.skills_acquired) == 0:
        errors.append("At least one skill must be listed")
    
    # Rating check
    if data.success_rating < 1 or data.success_rating > 5:
        errors.append("Success rating must be between 1-5")
    
    return errors
```

---

## 🚀 Launch Campaign

### Email Template

**Subject**: Help Build Our AI-Powered Career Advisor 🤖

```
Dear [Alumni Name],

We're building an AI-powered career prediction system to help future 
alumni make better career decisions. Your career journey can help us 
train this system!

🎯 What we need: Your past career transitions
⏱️ Time required: 5 minutes
🎁 Impact: Guide 100+ future alumni

[Share My Career Journey] →

Examples of transitions we're looking for:
• Junior Developer → Senior Developer
• Analyst → Data Scientist  
• Designer → Lead Designer

Thank you for giving back to our community!

Best regards,
AlumUnity Team
```

### In-App Banner

```jsx
<Banner 
  type="info" 
  dismissible
  icon="🤖"
>
  <strong>Help Us Build AI Career Predictions!</strong>
  <p>Share your career journey to enable ML-powered career advice.</p>
  <button onClick={goToCareerForm}>Add My Transitions</button>
  <span className="progress-note">{currentCount}/50 collected</span>
</Banner>
```

---

## 📈 Tracking Progress

### Weekly Report

Send to admin team:

```
📊 Weekly Career Data Collection Report

Week of: Jan 8-14, 2025

📈 Progress:
• Career Transitions: 15 / 50 (30%)
• New This Week: +5
• Contributing Alumni: 12

🎯 Goal Status:
• On track to reach 50 by: Feb 15, 2025
• Need: 7 transitions/week

🏆 Top Contributors:
1. John Doe - 3 transitions
2. Jane Smith - 2 transitions
3. Bob Johnson - 2 transitions

💡 Recommendations:
• Send reminder email to 2019 batch
• Feature success stories in newsletter
• Add career form to profile wizard
```

---

## ✅ Summary Checklist

**Setup Tasks**:
- [ ] Add career journey form to alumni profiles
- [ ] Create CSV upload in admin panel  
- [ ] Add ML data status widget to dashboard
- [ ] Set up tracking endpoint
- [ ] Create email campaign templates

**Launch Tasks**:
- [ ] Send launch email to alumni
- [ ] Add in-app banner
- [ ] Announce in newsletter
- [ ] Post on LinkedIn/social media
- [ ] Offer incentives (badges, recognition)

**Monitoring Tasks**:
- [ ] Weekly progress check
- [ ] Send reminder emails
- [ ] Recognize top contributors
- [ ] Validate data quality
- [ ] Update admin dashboard

**Training Tasks** (once 50+ transitions):
- [ ] Run training script
- [ ] Review model accuracy
- [ ] Deploy ML model
- [ ] Announce to community
- [ ] Monitor prediction quality

---

**Questions?** Check `/app/CAREER_ML_IMPLEMENTATION_GUIDE.md` for complete technical details.
