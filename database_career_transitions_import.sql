-- ============================================================================
-- Career Transition Matrix Data Import
-- Complete SQL for MySQL 8.0+
-- Source: career_transitions_ml_training.csv
-- ============================================================================

USE AlumUnity;

-- Optional: Clear old CSV imports (remove comment to enable)
-- DELETE FROM career_transition_matrix WHERE id LIKE 'trans-csv-%';

-- Insert all career transitions from CSV
INSERT INTO career_transition_matrix 
(id, from_role, to_role, transition_count, transition_probability, 
 avg_duration_months, required_skills, success_rate, college_id, last_calculated)
VALUES

-- Junior to Mid Level Transitions
('trans-csv-001', 'Intern', 'Junior Developer', 1, 0.40, 12,
'["HTML","CSS","JavaScript","Python"]', 0.60, NULL, NOW()),

('trans-csv-002', 'Intern', 'Software Engineer', 1, 0.40, 12,
'["Java","Data Structures","Algorithms","System Design"]', 0.80, NULL, NOW()),

('trans-csv-003', 'Design Intern', 'UX Designer', 1, 0.40, 12,
'["Sketch","Wireframing","User Research","Prototyping"]', 0.60, NULL, NOW()),

('trans-csv-004', 'Junior Analyst', 'Data Analyst', 1, 0.40, 12,
'["Excel","SQL","Data Visualization","Tableau"]', 0.80, NULL, NOW()),

('trans-csv-005', 'Junior Developer', 'Software Engineer', 2, 0.55, 24,
'["JavaScript","React","Git","Code Review","Node.js","MongoDB","REST APIs"]', 0.80, NULL, NOW()),

('trans-csv-006', 'Junior Frontend Developer', 'Frontend Developer', 1, 0.40, 22,
'["React","TypeScript","CSS","Responsive Design"]', 0.80, NULL, NOW()),

('trans-csv-007', 'Junior Backend Developer', 'Backend Developer', 1, 0.40, 23,
'["Python","Django","PostgreSQL","REST APIs"]', 0.80, NULL, NOW()),

('trans-csv-008', 'Junior Product Manager', 'Product Manager', 1, 0.40, 19,
'["Agile","User Stories","Roadmapping","Prioritization"]', 0.80, NULL, NOW()),

('trans-csv-009', 'Junior DevOps Engineer', 'DevOps Engineer', 1, 0.40, 12,
'["Linux","Docker","Kubernetes","CI/CD"]', 0.80, NULL, NOW()),

('trans-csv-010', 'Junior ML Engineer', 'ML Engineer', 1, 0.40, 9,
'["Python","TensorFlow","PyTorch","Deep Learning"]', 0.80, NULL, NOW()),

('trans-csv-011', 'Junior Designer', 'UI/UX Designer', 1, 0.40, 12,
'["Figma","Prototyping","Visual Design","Design Systems"]', 0.80, NULL, NOW()),

('trans-csv-012', 'Junior Security Engineer', 'Security Engineer', 1, 0.40, 12,
'["Network Security","Penetration Testing","Security Audits"]', 0.80, NULL, NOW()),

('trans-csv-013', 'Junior Data Engineer', 'Data Engineer', 1, 0.40, 12,
'["SQL","Python","ETL","Data Pipelines"]', 0.80, NULL, NOW()),

('trans-csv-014', 'Junior Product Designer', 'Product Designer', 1, 0.40, 12,
'["UI Design","Prototyping","User Flows","Design Systems"]', 0.80, NULL, NOW()),

('trans-csv-015', 'Junior System Administrator', 'System Administrator', 1, 0.40, 12,
'["Linux","Networking","System Management","Troubleshooting"]', 0.60, NULL, NOW()),

('trans-csv-016', 'Junior Business Analyst', 'Business Analyst', 1, 0.40, 12,
'["Requirements Gathering","Stakeholder Management","Process Mapping"]', 0.80, NULL, NOW()),

('trans-csv-017', 'Junior Software Engineer', 'Software Engineer', 1, 0.40, 12,
'["Python","Go","Distributed Systems","APIs"]', 0.80, NULL, NOW()),

('trans-csv-018', 'Junior Recruiter', 'Technical Recruiter', 1, 0.40, 12,
'["Sourcing","Interviewing","Candidate Management","ATS"]', 0.60, NULL, NOW()),

('trans-csv-019', 'Junior Game Developer', 'Game Developer', 1, 0.40, 12,
'["Unity","C#","Game Design","3D Graphics"]', 0.80, NULL, NOW()),

('trans-csv-020', 'Junior Marketing Analyst', 'Marketing Analyst', 1, 0.40, 12,
'["Google Analytics","Marketing Campaigns","A/B Testing","SQL"]', 0.60, NULL, NOW()),

-- Mid to Senior Level Transitions
('trans-csv-021', 'Software Engineer', 'Senior Software Engineer', 4, 0.85, 30,
'["System Design","Leadership","Kubernetes","Mentoring","Microservices","Docker","CI/CD","Scalability","Architecture","Performance Optimization"]', 0.88, NULL, NOW()),

('trans-csv-022', 'Frontend Developer', 'Senior Frontend Developer', 1, 0.40, 30,
'["Performance","Accessibility","Testing","Webpack"]', 1.00, NULL, NOW()),

('trans-csv-023', 'Backend Developer', 'Senior Backend Developer', 1, 0.40, 33,
'["Distributed Systems","Apache Spark","Data Engineering"]', 1.00, NULL, NOW()),

('trans-csv-024', 'UX Designer', 'Senior UX Designer', 1, 0.40, 12,
'["User Research","Prototyping","Design Systems","Figma"]', 0.80, NULL, NOW()),

('trans-csv-025', 'Data Analyst', 'Senior Data Analyst', 1, 0.40, 12,
'["SQL","Python","Data Visualization","Business Intelligence"]', 0.80, NULL, NOW()),

('trans-csv-026', 'Data Scientist', 'Senior Data Scientist', 2, 0.55, 33,
'["Deep Learning","MLOps","TensorFlow","Recommendation Systems","NLP","Time Series","Production ML"]', 0.90, NULL, NOW()),

('trans-csv-027', 'Product Manager', 'Senior Product Manager', 2, 0.55, 27,
'["Product Vision","Go-to-Market","Cross-functional Leadership","OKRs","Data-Driven Decisions"]', 0.90, NULL, NOW()),

('trans-csv-028', 'QA Engineer', 'Senior QA Engineer', 1, 0.40, 30,
'["Performance Testing","Security Testing","Test Strategy"]', 0.80, NULL, NOW()),

('trans-csv-029', 'DevOps Engineer', 'Senior DevOps Engineer', 1, 0.40, 32,
'["Infrastructure as Code","Terraform","AWS","Monitoring"]', 1.00, NULL, NOW()),

('trans-csv-030', 'Mobile Developer', 'Senior Mobile Developer', 1, 0.40, 24,
'["iOS","Swift","Mobile Architecture","Performance"]', 0.80, NULL, NOW()),

('trans-csv-031', 'Security Engineer', 'Senior Security Engineer', 1, 0.40, 33,
'["Threat Detection","Incident Response","Security Architecture"]', 1.00, NULL, NOW()),

('trans-csv-032', 'UI/UX Designer', 'Senior UI/UX Designer', 1, 0.40, 30,
'["User Research","Interaction Design","Mobile Design","A/B Testing"]', 1.00, NULL, NOW()),

('trans-csv-033', 'ML Engineer', 'Senior ML Engineer', 1, 0.40, 33,
'["LLM Training","Model Optimization","Research","Production ML"]', 1.00, NULL, NOW()),

('trans-csv-034', 'Technical Writer', 'Senior Technical Writer', 1, 0.40, 12,
'["Documentation","API Documentation","Markdown","Git"]', 0.60, NULL, NOW()),

('trans-csv-035', 'Sales Engineer', 'Senior Sales Engineer', 1, 0.40, 12,
'["Technical Demos","Solution Architecture","Customer Success"]', 0.80, NULL, NOW()),

('trans-csv-036', 'Customer Success Manager', 'Senior Customer Success Manager', 1, 0.40, 28,
'["Account Management","Upselling","Customer Strategy"]', 0.80, NULL, NOW()),

('trans-csv-037', 'Data Engineer', 'Senior Data Engineer', 1, 0.40, 31,
'["Apache Spark","Data Warehousing","Data Modeling","Optimization"]', 1.00, NULL, NOW()),

('trans-csv-038', 'Product Designer', 'Senior Product Designer', 1, 0.40, 27,
'["Design Leadership","Product Thinking","Cross-functional Collaboration"]', 1.00, NULL, NOW()),

('trans-csv-039', 'System Administrator', 'Senior System Administrator', 1, 0.40, 30,
'["Enterprise Systems","Automation","Security","Cloud Infrastructure"]', 0.80, NULL, NOW()),

('trans-csv-040', 'Business Analyst', 'Senior Business Analyst', 1, 0.40, 29,
'["Strategic Analysis","Business Strategy","Data Analytics","Presentation"]', 1.00, NULL, NOW()),

('trans-csv-041', 'Software Engineer', 'Staff Software Engineer', 1, 0.40, 30,
'["Technical Leadership","Architecture","Innovation","Cross-team Collaboration"]', 1.00, NULL, NOW()),

('trans-csv-042', 'Technical Recruiter', 'Senior Technical Recruiter', 1, 0.40, 30,
'["Hiring Strategy","Employer Branding","Pipeline Building","Negotiation"]', 0.80, NULL, NOW()),

('trans-csv-043', 'Game Developer', 'Senior Game Developer', 1, 0.40, 31,
'["Unreal Engine","Gameplay Programming","Performance Optimization"]', 1.00, NULL, NOW()),

('trans-csv-044', 'Marketing Analyst', 'Senior Marketing Analyst', 1, 0.40, 29,
'["Growth Strategy","Attribution Modeling","Data-Driven Marketing"]', 0.80, NULL, NOW()),

-- Senior to Lead/Manager Transitions
('trans-csv-045', 'Senior Software Engineer', 'Tech Lead', 1, 0.40, 27,
'["Architecture","Team Management","Strategic Planning","Mentoring"]', 1.00, NULL, NOW()),

('trans-csv-046', 'Senior Software Engineer', 'Engineering Manager', 1, 0.40, 29,
'["Leadership","Team Building","Hiring","Project Management"]', 0.80, NULL, NOW()),

('trans-csv-047', 'Senior Software Engineer', 'Product Manager', 1, 0.40, 23,
'["Product Strategy","Stakeholder Management","Agile","Data Analysis"]', 1.00, NULL, NOW()),

('trans-csv-048', 'Senior Frontend Developer', 'Frontend Lead', 1, 0.40, 30,
'["Team Leadership","Architecture","Mentoring","Code Review"]', 1.00, NULL, NOW()),

('trans-csv-049', 'Senior Backend Developer', 'Staff Engineer', 1, 0.40, 29,
'["Technical Leadership","Architecture","Mentoring","Innovation"]', 1.00, NULL, NOW()),

('trans-csv-050', 'Senior UX Designer', 'Lead UX Designer', 1, 0.40, 42,
'["Team Leadership","Design Strategy","Accessibility","Mentoring"]', 1.00, NULL, NOW()),

('trans-csv-051', 'Senior Data Scientist', 'ML Engineer', 1, 0.40, 27,
'["MLOps","Model Deployment","Kubernetes","Production ML"]', 0.80, NULL, NOW()),

('trans-csv-052', 'Senior QA Engineer', 'QA Manager', 1, 0.40, 29,
'["Team Management","Process Improvement","Test Planning"]', 1.00, NULL, NOW()),

('trans-csv-053', 'Senior DevOps Engineer', 'Platform Engineer', 1, 0.40, 26,
'["Platform Architecture","SRE","Observability","Automation"]', 1.00, NULL, NOW()),

('trans-csv-054', 'Senior Mobile Developer', 'Mobile Tech Lead', 1, 0.40, 34,
'["Team Leadership","Cross-platform","Mobile Strategy"]', 1.00, NULL, NOW()),

('trans-csv-055', 'Senior Security Engineer', 'Security Architect', 1, 0.40, 26,
'["Zero Trust","Cloud Security","Security Strategy","Compliance"]', 1.00, NULL, NOW()),

('trans-csv-056', 'Senior UI/UX Designer', 'Design Lead', 1, 0.40, 29,
'["Design Leadership","Team Management","Design Operations"]', 1.00, NULL, NOW()),

('trans-csv-057', 'Senior ML Engineer', 'ML Research Scientist', 1, 0.40, 23,
'["AI Research","Model Architecture","Safety","Ethics"]', 1.00, NULL, NOW()),

('trans-csv-058', 'Senior Technical Writer', 'Documentation Lead', 1, 0.40, 32,
'["Content Strategy","Team Leadership","Developer Relations"]', 0.80, NULL, NOW()),

('trans-csv-059', 'Senior Sales Engineer', 'Solutions Architect', 1, 0.40, 31,
'["Cloud Architecture","Enterprise Solutions","Technical Strategy"]', 1.00, NULL, NOW()),

('trans-csv-060', 'Senior Customer Success Manager', 'Director of Customer Success', 1, 0.40, 26,
'["Team Leadership","Strategy","Customer Experience","Data Analysis"]', 1.00, NULL, NOW()),

('trans-csv-061', 'Senior Data Engineer', 'Staff Data Engineer', 1, 0.40, 25,
'["Platform Architecture","Technical Leadership","Data Strategy"]', 1.00, NULL, NOW()),

('trans-csv-062', 'Senior Product Designer', 'Design Manager', 1, 0.40, 26,
'["People Management","Design Operations","Strategy","Hiring"]', 1.00, NULL, NOW()),

('trans-csv-063', 'Senior System Administrator', 'Infrastructure Architect', 1, 0.40, 27,
'["Architecture Design","Cloud Strategy","Migration Planning","Team Leadership"]', 1.00, NULL, NOW()),

('trans-csv-064', 'Senior Business Analyst', 'Management Consultant', 1, 0.40, 26,
'["Leadership","Client Management","Strategy","Executive Communication"]', 1.00, NULL, NOW()),

('trans-csv-065', 'Senior Product Manager', 'Director of Product', 1, 0.40, 28,
'["Leadership","Strategy","Team Building","Executive Communication"]', 1.00, NULL, NOW()),

('trans-csv-066', 'Senior Technical Recruiter', 'Recruiting Manager', 1, 0.40, 25,
'["Team Management","Recruiting Operations","Strategy","Leadership"]', 1.00, NULL, NOW()),

('trans-csv-067', 'Senior Game Developer', 'Lead Game Developer', 1, 0.40, 28,
'["Technical Leadership","Game Architecture","Team Coordination"]', 1.00, NULL, NOW()),

('trans-csv-068', 'Senior Marketing Analyst', 'Marketing Manager', 1, 0.40, 23,
'["Team Management","Marketing Strategy","Budget Management","Leadership"]', 1.00, NULL, NOW()),

-- Lead/Manager to Executive/Principal Transitions
('trans-csv-069', 'Lead UX Designer', 'Design Manager', 1, 0.40, 19,
'["People Management","Hiring","Design Operations","Strategy"]', 1.00, NULL, NOW()),

('trans-csv-070', 'Mobile Tech Lead', 'Engineering Manager', 1, 0.40, 29,
'["People Management","Hiring","Technical Direction","Roadmapping"]', 0.80, NULL, NOW()),

('trans-csv-071', 'Documentation Lead', 'Developer Advocate', 1, 0.40, 23,
'["Public Speaking","Community Building","Technical Marketing"]', 1.00, NULL, NOW()),

('trans-csv-072', 'Solutions Architect', 'Principal Solutions Architect', 1, 0.40, 29,
'["Enterprise Architecture","Strategic Consulting","Thought Leadership"]', 1.00, NULL, NOW()),

-- Cross-functional Transitions
('trans-csv-073', 'Business Analyst', 'Product Manager', 1, 0.40, 36,
'["Product Strategy","Agile","User Stories","Roadmapping"]', 0.80, NULL, NOW()),

('trans-csv-074', 'Data Analyst', 'Data Scientist', 1, 0.40, 12,
'["Python","Machine Learning","Statistics","SQL"]', 0.80, NULL, NOW()),

('trans-csv-075', 'Senior Data Analyst', 'Data Scientist', 1, 0.40, 29,
'["Machine Learning","Statistical Analysis","Feature Engineering"]', 1.00, NULL, NOW()),

('trans-csv-076', 'QA Tester', 'QA Engineer', 1, 0.40, 29,
'["Test Automation","Selenium","CI/CD","Bug Tracking"]', 0.60, NULL, NOW()),

('trans-csv-077', 'Customer Support', 'Customer Success Manager', 1, 0.40, 30,
'["Customer Relations","Product Knowledge","Communication"]', 0.60, NULL, NOW());

-- ============================================================================
-- Verification Queries
-- ============================================================================

SELECT '========================================' as '';
SELECT '✅ Data Import Complete!' as '';
SELECT '========================================' as '';

-- Show total count
SELECT 
    COUNT(*) as 'Total Career Transitions',
    COUNT(DISTINCT from_role) as 'Unique Starting Roles',
    COUNT(DISTINCT to_role) as 'Unique Target Roles'
FROM career_transition_matrix;

-- Show all unique roles (for dropdown)
SELECT '========================================' as '';
SELECT 'All Unique Roles (for dropdowns):' as '';
SELECT '========================================' as '';

SELECT DISTINCT role as 'Career Roles'
FROM (
    SELECT from_role as role FROM career_transition_matrix
    UNION
    SELECT to_role as role FROM career_transition_matrix
) AS all_roles
ORDER BY role;

-- Show top 10 most common transitions
SELECT '========================================' as '';
SELECT 'Top 10 Most Common Career Paths:' as '';
SELECT '========================================' as '';

SELECT 
    from_role as 'From Role',
    to_role as 'To Role',
    transition_count as 'Count',
    CONCAT(ROUND(transition_probability * 100, 1), '%') as 'Probability'
FROM career_transition_matrix
ORDER BY transition_count DESC
LIMIT 10;

SELECT '========================================' as '';
SELECT 'You can now restart backend and test!' as '';
SELECT 'sudo supervisorctl restart backend' as '';
SELECT '========================================' as '';
