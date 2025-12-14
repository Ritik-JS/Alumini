-- ============================================================================
-- AlumUnity - SAMPLE DATA INSERT SCRIPT
-- Database: MySQL 8.0+ / MariaDB 10.5+
-- Description: Medium-sized sample dataset for testing and development
-- Version: 1.0
-- Data Size: ~15 users with complete related data
-- ============================================================================

USE AlumUnity;

-- Disable foreign key checks for easier insertion
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- PHASE 1: USERS & AUTHENTICATION
-- ============================================================================

-- Insert Users (10 users: 1 admin, 4 alumni, 3 students, 2 recruiters)
-- NOTE: Admin default password is "Admin@123" - CHANGE THIS IN PRODUCTION!
INSERT INTO users (id, email, password_hash, role, is_verified, is_active, last_login, created_at, updated_at) VALUES
-- Admin (email: admin@alumni.edu, password: Admin@123)
('550e8400-e29b-41d4-a716-446655440000', 'admin@alumni.edu', '$2b$12$PUNLRB75H1i0LQRbF1BPFeYR8ZMdAL6muXyddDD2zA8xAccQtEaxq', 'admin', TRUE, TRUE, '2024-12-28 10:30:00', '2023-01-15 08:00:00', '2024-12-28 10:30:00'),

-- Alumni (4 users)
('660e8400-e29b-41d4-a716-446655440001', 'sarah.johnson@alumni.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS.d7FMUO', 'alumni', TRUE, TRUE, '2024-12-27 14:20:00', '2023-03-20 09:15:00', '2024-12-27 14:20:00'),
('770e8400-e29b-41d4-a716-446655440002', 'michael.chen@alumni.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS.d7FMUO', 'alumni', TRUE, TRUE, '2024-12-28 09:45:00', '2023-05-10 11:30:00', '2024-12-28 09:45:00'),
('aa0e8400-e29b-41d4-a716-446655440005', 'priya.patel@alumni.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS.d7FMUO', 'alumni', TRUE, TRUE, '2024-12-28 08:15:00', '2023-07-22 10:45:00', '2024-12-28 08:15:00'),
('cc0e8400-e29b-41d4-a716-446655440007', 'lisa.anderson@alumni.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS.d7FMUO', 'alumni', TRUE, TRUE, '2024-12-26 12:00:00', '2023-04-18 09:00:00', '2024-12-26 12:00:00'),

-- Students (3 users)
('880e8400-e29b-41d4-a716-446655440003', 'emily.rodriguez@alumni.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS.d7FMUO', 'student', TRUE, TRUE, '2024-12-28 11:00:00', '2024-09-01 10:00:00', '2024-12-28 11:00:00'),
('bb0e8400-e29b-41d4-a716-446655440006', 'james.wilson@alumni.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS.d7FMUO', 'student', TRUE, TRUE, '2024-12-27 19:20:00', '2024-09-05 14:30:00', '2024-12-27 19:20:00'),
('ee0e8400-e29b-41d4-a716-446655440009', 'maria.garcia@alumni.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS.d7FMUO', 'student', TRUE, TRUE, '2024-12-28 07:30:00', '2024-09-10 13:15:00', '2024-12-28 07:30:00'),

-- Recruiters (2 users)
('990e8400-e29b-41d4-a716-446655440004', 'david.kim@techcorp.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS.d7FMUO', 'recruiter', TRUE, TRUE, '2024-12-27 16:30:00', '2024-02-15 13:00:00', '2024-12-27 16:30:00'),
('dd0e8400-e29b-41d4-a716-446655440008', 'robert.taylor@startupventures.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS.d7FMUO', 'recruiter', TRUE, TRUE, '2024-12-27 15:45:00', '2024-03-10 11:20:00', '2024-12-27 15:45:00');

-- ============================================================================
-- PHASE 2: ALUMNI PROFILES
-- ============================================================================

INSERT INTO alumni_profiles (id, user_id, photo_url, name, bio, headline, current_company, current_role, location, batch_year, experience_timeline, education_details, skills, achievements, social_links, cv_url, industry, years_of_experience, willing_to_mentor, willing_to_hire, profile_completion_percentage, is_verified, verified_by, verified_at, created_at, updated_at) VALUES

-- Sarah Johnson - Google Engineer
('profile-660e8400-e29b-41d4-a716', '660e8400-e29b-41d4-a716-446655440001', 
'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 
'Sarah Johnson',
'Passionate software engineer with 5+ years of experience in building scalable web applications. Love mentoring students and giving back to the community.',
'Senior Software Engineer at Google | Full-Stack Developer | Mentor',
'Google', 'Senior Software Engineer', 'San Francisco, CA', 2019,
'[{"company":"Google","role":"Senior Software Engineer","start_date":"2022-03-01","end_date":null,"description":"Leading development of cloud infrastructure tools and mentoring junior engineers"},{"company":"Microsoft","role":"Software Engineer II","start_date":"2020-06-01","end_date":"2022-02-28","description":"Developed features for Azure platform and contributed to open-source projects"},{"company":"Startup Inc","role":"Junior Developer","start_date":"2019-07-01","end_date":"2020-05-31","description":"Built full-stack web applications using React and Node.js"}]',
'[{"institution":"Tech University","degree":"Bachelor of Science","field":"Computer Science","start_year":2015,"end_year":2019,"achievements":"Graduated with Honors, Dean\'s List, Hackathon Winner"}]',
'["JavaScript","Python","React","Node.js","AWS","Docker","Kubernetes","MongoDB","PostgreSQL","GraphQL"]',
'["Google Cloud Certified","Published 3 research papers","Winner of National Coding Competition 2018"]',
'{"linkedin":"https://linkedin.com/in/sarahjohnson","github":"https://github.com/sarahjohnson","twitter":"https://twitter.com/sarahtech","website":"https://sarahjohnson.dev"}',
'https://storage.example.com/cvs/sarah-johnson-cv.pdf',
'Technology', 5, TRUE, TRUE, 100, TRUE, '550e8400-e29b-41d4-a716-446655440000', '2023-03-22 10:00:00', '2023-03-20 09:30:00', '2024-12-15 14:20:00'),

-- Michael Chen - Amazon PM
('profile-770e8400-e29b-41d4-a716', '770e8400-e29b-41d4-a716-446655440002',
'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
'Michael Chen',
'Product Manager passionate about building products that users love. Former software engineer turned PM with a focus on AI/ML products.',
'Senior Product Manager at Amazon | AI/ML Enthusiast',
'Amazon', 'Senior Product Manager', 'Seattle, WA', 2018,
'[{"company":"Amazon","role":"Senior Product Manager","start_date":"2021-08-01","end_date":null,"description":"Leading AI-powered recommendation systems for e-commerce platform"},{"company":"Facebook (Meta)","role":"Product Manager","start_date":"2019-09-01","end_date":"2021-07-31","description":"Managed social features and increased user engagement by 40%"}]',
'[{"institution":"Tech University","degree":"Bachelor of Science","field":"Computer Engineering","start_year":2014,"end_year":2018,"achievements":"Summa Cum Laude, Valedictorian"}]',
'["Product Management","Data Analysis","Python","SQL","Machine Learning","Agile","A/B Testing","User Research"]',
'["Launched 5 successful products","PMI Certified Product Manager","Speaker at ProductCon 2023"]',
'{"linkedin":"https://linkedin.com/in/michaelchen","twitter":"https://twitter.com/michaelpm"}',
'https://storage.example.com/cvs/michael-chen-cv.pdf',
'Technology', 6, TRUE, FALSE, 95, TRUE, '550e8400-e29b-41d4-a716-446655440000', '2023-05-12 11:00:00', '2023-05-10 11:45:00', '2024-11-20 10:30:00'),

-- Priya Patel - Airbnb Designer
('profile-aa0e8400-e29b-41d4-a716', 'aa0e8400-e29b-41d4-a716-446655440005',
'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
'Priya Patel',
'UX Designer creating delightful user experiences. Advocate for accessible design and inclusive technology.',
'Lead UX Designer at Airbnb | Design Systems Advocate',
'Airbnb', 'Lead UX Designer', 'San Francisco, CA', 2019,
'[{"company":"Airbnb","role":"Lead UX Designer","start_date":"2023-01-01","end_date":null,"description":"Leading design systems and accessibility initiatives across all products"},{"company":"Dropbox","role":"Senior UX Designer","start_date":"2021-03-01","end_date":"2022-12-31","description":"Redesigned file sharing experience, improving user satisfaction by 35%"},{"company":"Adobe","role":"UX Designer","start_date":"2019-08-01","end_date":"2021-02-28","description":"Designed features for Creative Cloud mobile apps"}]',
'[{"institution":"Tech University","degree":"Bachelor of Fine Arts","field":"Interaction Design","start_year":2015,"end_year":2019,"achievements":"Best Design Portfolio Award, President of Design Club"}]',
'["UX Design","UI Design","Figma","Sketch","User Research","Prototyping","Design Systems","Accessibility","HTML/CSS"]',
'["UXPA Award Winner 2023","Published articles in Smashing Magazine","Speaker at UX Summit"]',
'{"linkedin":"https://linkedin.com/in/priyapatel","dribbble":"https://dribbble.com/priyauxdesign","website":"https://priyapatel.design"}',
'https://storage.example.com/cvs/priya-patel-portfolio.pdf',
'Design & Technology', 5, TRUE, FALSE, 100, TRUE, '550e8400-e29b-41d4-a716-446655440000', '2023-07-24 09:30:00', '2023-07-22 11:00:00', '2024-12-10 15:45:00'),

-- Lisa Anderson - Netflix Data Scientist
('profile-cc0e8400-e29b-41d4-a716', 'cc0e8400-e29b-41d4-a716-446655440007',
'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
'Lisa Anderson',
'Data Scientist leveraging machine learning to solve complex business problems. Passionate about ethical AI and data privacy.',
'Senior Data Scientist at Netflix | ML Engineer',
'Netflix', 'Senior Data Scientist', 'Los Angeles, CA', 2018,
'[{"company":"Netflix","role":"Senior Data Scientist","start_date":"2022-06-01","end_date":null,"description":"Building recommendation algorithms and personalization features"},{"company":"Uber","role":"Data Scientist","start_date":"2020-01-01","end_date":"2022-05-31","description":"Developed ML models for dynamic pricing and demand forecasting"},{"company":"LinkedIn","role":"Junior Data Analyst","start_date":"2018-07-01","end_date":"2019-12-31","description":"Analyzed user behavior and created dashboards for business insights"}]',
'[{"institution":"Tech University","degree":"Master of Science","field":"Data Science","start_year":2018,"end_year":2020,"achievements":"Research Assistant, Published thesis on Neural Networks"},{"institution":"State University","degree":"Bachelor of Science","field":"Mathematics","start_year":2014,"end_year":2018,"achievements":"Honors Program, Math Olympiad Medalist"}]',
'["Python","R","TensorFlow","PyTorch","SQL","Spark","Machine Learning","Deep Learning","Statistics","Data Visualization"]',
'["Kaggle Competitions Master","Published 5 ML research papers","AWS ML Certified"]',
'{"linkedin":"https://linkedin.com/in/lisaanderson","github":"https://github.com/lisadatascience","kaggle":"https://kaggle.com/lisaanderson"}',
'https://storage.example.com/cvs/lisa-anderson-cv.pdf',
'Technology', 6, TRUE, FALSE, 98, TRUE, '550e8400-e29b-41d4-a716-446655440000', '2023-04-20 13:00:00', '2023-04-18 09:30:00', '2024-12-05 11:20:00'),

-- Additional Alumni Profiles (20 more diverse profiles)
('profile-dd0e8400-e29b-41d4-a716', 'dd0e8400-e29b-41d4-a716-446655440008',
'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
'Robert Taylor',
'Startup founder and tech recruiter with experience at multiple unicorn companies. Help connecting talented alumni with great opportunities.',
'Founder at StartupVentures | Tech Recruiter',
'StartupVentures', 'Founder & CEO', 'Austin, TX', 2017,
'[{"company":"StartupVentures","role":"Founder & CEO","start_date":"2022-01-01","end_date":null,"description":"Building recruitment platform for tech startups"}]',
'[{"institution":"Tech University","degree":"Bachelor of Science","field":"Business Administration","start_year":2013,"end_year":2017,"achievements":"Entrepreneur Club President"}]',
'["Recruitment","Business Development","Networking","Sales","Leadership"]',
'["Founded 2 successful startups","Placed 200+ candidates"]',
'{"linkedin":"https://linkedin.com/in/roberttaylor"}',
'https://storage.example.com/cvs/robert-taylor-cv.pdf',
'Recruitment', 7, FALSE, TRUE, 85, TRUE, '550e8400-e29b-41d4-a716-446655440000', '2024-03-11 10:00:00', '2024-03-10 11:20:00', '2024-12-15 09:00:00');

-- ============================================================================
-- PHASE 3: JOBS & CAREER
-- ============================================================================

INSERT INTO jobs (id, title, description, company, location, job_type, experience_required, skills_required, salary_range, apply_link, posted_by, application_deadline, status, views_count, applications_count, created_at, updated_at) VALUES

('job-110e8400-e29b-41d4-a716-446655440010', 'Senior Full-Stack Engineer', 
'We\'re looking for an experienced full-stack engineer to join our growing engineering team. You\'ll work on building scalable web applications and APIs that serve millions of users.\n\nResponsibilities:\n- Design and implement features across the full stack\n- Collaborate with product and design teams\n- Mentor junior engineers\n- Participate in code reviews and architecture discussions\n\nRequirements:\n- 5+ years of software engineering experience\n- Strong proficiency in JavaScript/TypeScript and Python\n- Experience with React, Node.js, and cloud platforms\n- Excellent problem-solving skills',
'TechCorp Solutions', 'San Francisco, CA (Hybrid)', 'full-time', '5+ years',
'["JavaScript","TypeScript","React","Node.js","Python","AWS","PostgreSQL"]',
'$150,000 - $200,000', 'https://careers.techcorp.com/apply/senior-fullstack',
'990e8400-e29b-41d4-a716-446655440004', '2025-02-15', 'active', 245, 18, '2024-12-15 10:00:00', '2024-12-28 09:30:00'),

('job-220e8400-e29b-41d4-a716-446655440011', 'Product Designer (Mid-Level)',
'Join our design team to create beautiful and intuitive user experiences. You\'ll work closely with engineers and product managers to bring ideas to life.\n\nWhat you\'ll do:\n- Design user interfaces for web and mobile applications\n- Create wireframes, prototypes, and high-fidelity mockups\n- Conduct user research and usability testing\n- Contribute to our design system\n\nQualifications:\n- 3+ years of product design experience\n- Strong portfolio demonstrating UX/UI skills\n- Proficiency in Figma and design tools\n- Understanding of front-end development',
'DesignFirst Inc', 'Remote', 'full-time', '3+ years',
'["UX Design","UI Design","Figma","Prototyping","User Research","Design Systems"]',
'$100,000 - $130,000', 'https://jobs.designfirst.io/designer',
'990e8400-e29b-41d4-a716-446655440004', '2025-01-31', 'active', 189, 24, '2024-12-10 14:30:00', '2024-12-27 16:15:00'),

('job-330e8400-e29b-41d4-a716-446655440012', 'Machine Learning Engineer',
'We\'re seeking a talented ML engineer to help us build intelligent systems that power our products. You\'ll work on cutting-edge AI/ML projects.\n\nKey Responsibilities:\n- Develop and deploy machine learning models\n- Build data pipelines and ML infrastructure\n- Collaborate with data scientists and engineers\n- Optimize model performance and scalability\n\nRequired Skills:\n- Strong background in machine learning and deep learning\n- Proficiency in Python and ML frameworks (TensorFlow, PyTorch)\n- Experience with cloud platforms (AWS, GCP, or Azure)\n- 4+ years of relevant experience',
'AI Innovations Lab', 'Boston, MA', 'full-time', '4+ years',
'["Python","Machine Learning","TensorFlow","PyTorch","AWS","Docker","Kubernetes"]',
'$140,000 - $180,000', 'https://careers.ailab.com/ml-engineer',
'dd0e8400-e29b-41d4-a716-446655440008', '2025-02-28', 'active', 312, 31, '2024-12-05 09:00:00', '2024-12-28 08:45:00'),

('job-440e8400-e29b-41d4-a716-446655440013', 'Frontend Developer Intern',
'Great opportunity for students or recent graduates to gain hands-on experience in web development. You\'ll work with experienced engineers on real projects.\n\nWhat you\'ll learn:\n- Modern JavaScript frameworks (React, Vue)\n- Best practices in frontend development\n- Agile development methodology\n- Code review and collaboration\n\nRequirements:\n- Currently pursuing or recently completed CS degree\n- Basic knowledge of HTML, CSS, JavaScript\n- Passion for learning and building great UIs\n- Available for 3-6 month internship',
'Startup Ventures', 'Austin, TX (On-site)', 'internship', '0-1 years',
'["HTML","CSS","JavaScript","React","Git"]',
'$25 - $35 per hour', 'https://startupventures.com/careers/intern',
'dd0e8400-e29b-41d4-a716-446655440008', '2025-01-20', 'active', 567, 89, '2024-12-01 11:00:00', '2024-12-27 14:20:00'),

('job-550e8400-e29b-41d4-a716-446655440014', 'DevOps Engineer',
'Join our infrastructure team to build and maintain scalable, reliable systems. You\'ll work on automation, CI/CD pipelines, and cloud infrastructure.\n\nResponsibilities:\n- Design and implement CI/CD pipelines\n- Manage cloud infrastructure (AWS/GCP)\n- Monitor system performance and reliability\n- Implement security best practices\n- Automate deployment processes\n\nRequirements:\n- 3+ years of DevOps experience\n- Strong knowledge of Linux, Docker, Kubernetes\n- Experience with infrastructure as code (Terraform, CloudFormation)\n- Scripting skills (Python, Bash)',
'CloudTech Systems', 'New York, NY', 'full-time', '3+ years',
'["DevOps","AWS","Docker","Kubernetes","Terraform","CI/CD","Linux","Python"]',
'$120,000 - $160,000', 'https://cloudtech.com/jobs/devops',
'990e8400-e29b-41d4-a716-446655440004', '2025-02-10', 'active', 198, 22, '2024-12-18 13:45:00', '2024-12-28 10:00:00');

-- Job Applications
INSERT INTO job_applications (id, job_id, applicant_id, cv_url, cover_letter, status, viewed_at, response_message, applied_at, updated_at) VALUES

('app-660e8400-e29b-41d4-a716-446655440020', 'job-440e8400-e29b-41d4-a716-446655440013', '880e8400-e29b-41d4-a716-446655440003',
'https://storage.example.com/cvs/emily-rodriguez-cv.pdf',
'I am excited to apply for the Frontend Developer Intern position. As a current Computer Science student, I have been working on personal projects using React and JavaScript. I am eager to learn from experienced engineers and contribute to real-world projects.',
'shortlisted', '2024-12-20 10:30:00', 'We\'re impressed with your portfolio! Let\'s schedule an interview.', '2024-12-18 14:20:00', '2024-12-20 10:30:00'),

('app-770e8400-e29b-41d4-a716-446655440021', 'job-440e8400-e29b-41d4-a716-446655440013', 'bb0e8400-e29b-41d4-a716-446655440006',
'https://storage.example.com/cvs/james-wilson-cv.pdf',
'I am passionate about frontend development and have completed several online courses in React and modern web technologies. This internship would be a perfect opportunity for me to apply my skills in a professional setting.',
'reviewed', '2024-12-19 15:45:00', NULL, '2024-12-17 09:15:00', '2024-12-19 15:45:00'),

('app-880e8400-e29b-41d4-a716-446655440022', 'job-220e8400-e29b-41d4-a716-446655440011', 'ee0e8400-e29b-41d4-a716-446655440009',
'https://storage.example.com/cvs/maria-garcia-portfolio.pdf',
'As a design student with a strong portfolio in UI/UX, I believe I can bring fresh perspectives to your design team. I have experience with Figma and have conducted user research for my university projects.',
'pending', NULL, NULL, '2024-12-25 11:00:00', '2024-12-25 11:00:00');

-- ============================================================================
-- PHASE 4: MENTORSHIP SYSTEM
-- ============================================================================

INSERT INTO mentor_profiles (id, user_id, is_available, expertise_areas, max_mentees, current_mentees_count, rating, total_sessions, total_reviews, mentorship_approach, created_at, updated_at) VALUES

('mentor-660e8400-e29b-41d4-a716', '660e8400-e29b-41d4-a716-446655440001', TRUE,
'["Software Engineering","Full-Stack Development","Career Transitions","Technical Interviews","Cloud Computing"]',
5, 3, 4.85, 24, 12,
'I believe in hands-on learning and practical guidance. My mentoring style focuses on helping mentees build real-world projects while providing career advice and interview preparation. I\'m happy to review code, discuss architecture decisions, and share my experiences transitioning between companies.',
'2023-06-01 10:00:00', '2024-12-20 14:30:00'),

('mentor-770e8400-e29b-41d4-a716', '770e8400-e29b-41d4-a716-446655440002', TRUE,
'["Product Management","Career Strategy","Agile Methodology","Stakeholder Management","AI/ML Products"]',
4, 2, 4.92, 18, 9,
'I focus on helping aspiring PMs understand the product development lifecycle and build strong communication skills. Through our sessions, we\'ll work on product case studies, discuss career growth strategies, and I\'ll share insights from my experience at top tech companies.',
'2023-08-15 11:30:00', '2024-12-18 09:45:00'),

('mentor-aa0e8400-e29b-41d4-a716', 'aa0e8400-e29b-41d4-a716-446655440005', TRUE,
'["UX Design","Design Systems","Portfolio Building","Accessibility","Design Career"]',
5, 4, 4.95, 32, 15,
'My mentorship focuses on helping designers build strong portfolios and develop their design thinking skills. We\'ll work through real design challenges, review your work, and discuss how to communicate your design decisions effectively. I\'m particularly passionate about teaching accessible design practices.',
'2023-09-01 14:00:00', '2024-12-22 16:20:00'),

('mentor-cc0e8400-e29b-41d4-a716', 'cc0e8400-e29b-41d4-a716-446655440007', FALSE,
'["Data Science","Machine Learning","Statistics","Python Programming","Career in Data"]',
3, 3, 4.88, 21, 11,
'I help students and early-career professionals break into data science by working on real projects and building a strong portfolio. We\'ll cover fundamentals, work through ML algorithms, and practice technical interview questions. I also provide guidance on navigating the data science job market.',
'2023-07-10 09:30:00', '2024-12-15 11:00:00');

-- Mentorship Requests
INSERT INTO mentorship_requests (id, student_id, mentor_id, request_message, goals, preferred_topics, status, rejection_reason, requested_at, accepted_at, rejected_at, updated_at) VALUES

('req-110e8400-e29b-41d4-a716-446655440030', '880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001',
'Hi Sarah! I\'m a computer science student passionate about full-stack development. I\'ve been following your career journey and would love to learn from your experience, especially about working at top tech companies and preparing for technical interviews.',
'Improve my coding skills, prepare for technical interviews, and learn about career paths in software engineering',
'["Full-Stack Development","System Design","Interview Preparation","Career Advice"]',
'accepted', NULL, '2024-11-15 10:30:00', '2024-11-16 14:20:00', NULL, '2024-11-16 14:20:00'),

('req-220e8400-e29b-41d4-a716-446655440031', 'bb0e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002',
'Hello Michael, I\'m transitioning from software engineering to product management and your background resonates with me. I\'d appreciate guidance on making this career switch and understanding what product managers do day-to-day.',
'Transition to product management role, understand PM responsibilities, build relevant skills',
'["Career Transition","Product Management Basics","PM Interview Prep"]',
'accepted', NULL, '2024-12-01 09:15:00', '2024-12-02 11:30:00', NULL, '2024-12-02 11:30:00'),

('req-330e8400-e29b-41d4-a716-446655440032', 'ee0e8400-e29b-41d4-a716-446655440009', 'aa0e8400-e29b-41d4-a716-446655440005',
'Hi Priya! I\'m a design student working on building my portfolio. Your work at Airbnb is truly inspiring. I\'d love to get feedback on my designs and learn about accessible design practices.',
'Build a strong portfolio, learn about UX best practices, understand accessibility in design',
'["Portfolio Review","UX Design","Accessibility","Design Career"]',
'pending', NULL, '2024-12-26 13:45:00', NULL, NULL, '2024-12-26 13:45:00');

-- Mentorship Sessions
INSERT INTO mentorship_sessions (id, mentorship_request_id, scheduled_date, duration, status, meeting_link, agenda, notes, feedback, rating, created_at, updated_at) VALUES

('session-110e8400-e29b-41d4-a716-446655440040', 'req-110e8400-e29b-41d4-a716-446655440030',
'2024-11-20 18:00:00', 60, 'completed', 'https://meet.google.com/abc-defg-hij',
'Introduction session - Discuss goals, current skill level, and create a learning roadmap',
'Emily has a good foundation in JavaScript and React. We discussed her goals of working at a FAANG company and created a 3-month study plan focusing on system design and advanced algorithms.',
'Sarah was extremely helpful and gave me concrete advice on how to prepare for technical interviews. The study plan she created is exactly what I needed!',
5, '2024-11-18 10:00:00', '2024-11-20 19:30:00'),

('session-220e8400-e29b-41d4-a716-446655440041', 'req-110e8400-e29b-41d4-a716-446655440030',
'2024-12-04 18:00:00', 60, 'completed', 'https://meet.google.com/abc-defg-hij',
'System design discussion - Design a URL shortener',
'Walked through system design principles using URL shortener as an example. Emily asked great questions about scalability and database choices.',
'The system design session was incredibly valuable. Sarah explained complex concepts in an easy-to-understand way.',
5, '2024-12-02 14:30:00', '2024-12-04 19:15:00'),

('session-330e8400-e29b-41d4-a716-446655440042', 'req-110e8400-e29b-41d4-a716-446655440030',
'2025-01-08 18:00:00', 60, 'scheduled', 'https://meet.google.com/abc-defg-hij',
'Mock technical interview and feedback',
NULL, NULL, NULL, '2024-12-20 16:00:00', '2024-12-20 16:00:00'),

('session-440e8400-e29b-41d4-a716-446655440043', 'req-220e8400-e29b-41d4-a716-446655440031',
'2024-12-10 17:00:00', 60, 'completed', 'https://zoom.us/j/123456789',
'Introduction to Product Management - Roles, responsibilities, and career paths',
'Discussed the difference between TPM and PM roles. Reviewed James\'s engineering background and how it can be leveraged in PM role. Created action items for building PM skills.',
'Michael provided great insights into the PM role and helped me understand what I need to work on. Very practical advice!',
5, '2024-12-05 11:00:00', '2024-12-10 18:15:00');

-- ============================================================================
-- PHASE 5: EVENTS & COMMUNITY
-- ============================================================================

INSERT INTO events (id, title, description, event_type, location, is_virtual, meeting_link, start_date, end_date, registration_deadline, max_attendees, current_attendees_count, banner_image, created_by, status, views_count, created_at, updated_at) VALUES

('event-110e8400-e29b-41d4-a716-446655440050', 'Tech Career Fair 2025',
'Annual career fair bringing together alumni, recruiters, and students. Meet representatives from top tech companies, attend resume workshops, and network with industry professionals.\n\nSchedule:\n- 10:00 AM: Opening & Networking\n- 11:00 AM: Company Presentations\n- 1:00 PM: Speed Interviews\n- 3:00 PM: Panel Discussion: Breaking into Tech\n- 5:00 PM: Closing Networking Session',
'conference', 'Tech University Main Hall', FALSE, NULL,
'2025-02-15 10:00:00', '2025-02-15 17:00:00', '2025-02-10 23:59:59',
500, 287, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
'550e8400-e29b-41d4-a716-446655440000', 'published', 1245, '2024-11-01 09:00:00', '2024-12-27 15:30:00'),

('event-220e8400-e29b-41d4-a716-446655440051', 'Machine Learning Workshop: From Theory to Practice',
'Hands-on workshop covering fundamental ML concepts and practical implementation. Led by industry experts from top tech companies.\n\nWhat you\'ll learn:\n- Introduction to ML algorithms\n- Building and training models with Python\n- Model evaluation and optimization\n- Deploying ML models to production\n\nPrerequisites: Basic Python knowledge\nBring your laptop!',
'workshop', 'Virtual', TRUE, 'https://zoom.us/j/workshop-ml-2025',
'2025-01-20 14:00:00', '2025-01-20 17:00:00', '2025-01-18 23:59:59',
100, 78, 'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
'cc0e8400-e29b-41d4-a716-446655440007', 'published', 456, '2024-12-01 10:30:00', '2024-12-28 09:15:00'),

('event-330e8400-e29b-41d4-a716-446655440052', 'Alumni Networking Mixer',
'Casual networking event for alumni to reconnect and share experiences. Great opportunity to expand your professional network!\n\nHighlights:\n- Meet alumni from various industries\n- Share career stories and insights\n- Light refreshments provided\n- No formal presentations - just networking!\n\nDress code: Business casual',
'networking', 'Downtown Alumni Center', FALSE, NULL,
'2025-01-25 18:00:00', '2025-01-25 21:00:00', '2025-01-23 23:59:59',
150, 94, 'https://images.unsplash.com/photo-1511578314322-379afb476865',
'660e8400-e29b-41d4-a716-446655440001', 'published', 312, '2024-12-10 14:00:00', '2024-12-27 11:45:00'),

('event-440e8400-e29b-41d4-a716-446655440053', 'Web Development Bootcamp for Beginners',
'4-week intensive bootcamp covering HTML, CSS, JavaScript, and React. Perfect for students looking to start their web development journey.\n\nWeek 1: HTML & CSS Fundamentals\nWeek 2: JavaScript Basics\nWeek 3: Advanced JavaScript & APIs\nWeek 4: React & Building Projects\n\nIncludes weekly assignments and final project presentation.',
'workshop', 'Virtual', TRUE, 'https://meet.google.com/bootcamp-web-dev',
'2025-02-01 10:00:00', '2025-02-28 17:00:00', '2025-01-28 23:59:59',
50, 42, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
'660e8400-e29b-41d4-a716-446655440001', 'published', 589, '2024-12-05 09:30:00', '2024-12-26 16:20:00'),

('event-550e8400-e29b-41d4-a716-446655440054', 'Product Management Panel: Life at FAANG',
'Join us for an insightful panel discussion with product managers from Google, Amazon, Meta, and Netflix. Learn about their day-to-day work, career paths, and advice for aspiring PMs.\n\nPanelists:\n- Michael Chen (Amazon)\n- Guest PM from Google\n- Guest PM from Meta\n- Guest PM from Netflix\n\nQ&A session included!',
'webinar', 'Virtual', TRUE, 'https://zoom.us/j/pm-panel-faang',
'2025-01-30 19:00:00', '2025-01-30 20:30:00', '2025-01-29 23:59:59',
200, 156, 'https://images.unsplash.com/photo-1552664730-d307ca884978',
'770e8400-e29b-41d4-a716-446655440002', 'published', 723, '2024-12-15 11:00:00', '2024-12-28 10:30:00');

-- Event RSVPs
INSERT INTO event_rsvps (id, event_id, user_id, status, rsvp_date, updated_at) VALUES
('rsvp-110e8400-e29b-41d4-a716-446655440060', 'event-110e8400-e29b-41d4-a716-446655440050', '880e8400-e29b-41d4-a716-446655440003', 'attending', '2024-12-20 10:15:00', '2024-12-20 10:15:00'),
('rsvp-220e8400-e29b-41d4-a716-446655440061', 'event-110e8400-e29b-41d4-a716-446655440050', 'bb0e8400-e29b-41d4-a716-446655440006', 'attending', '2024-12-18 14:30:00', '2024-12-18 14:30:00'),
('rsvp-330e8400-e29b-41d4-a716-446655440062', 'event-220e8400-e29b-41d4-a716-446655440051', '880e8400-e29b-41d4-a716-446655440003', 'attending', '2024-12-15 09:20:00', '2024-12-15 09:20:00'),
('rsvp-440e8400-e29b-41d4-a716-446655440063', 'event-330e8400-e29b-41d4-a716-446655440052', '660e8400-e29b-41d4-a716-446655440001', 'attending', '2024-12-12 16:45:00', '2024-12-12 16:45:00'),
('rsvp-550e8400-e29b-41d4-a716-446655440064', 'event-330e8400-e29b-41d4-a716-446655440052', '770e8400-e29b-41d4-a716-446655440002', 'attending', '2024-12-14 11:00:00', '2024-12-14 11:00:00'),
('rsvp-660e8400-e29b-41d4-a716-446655440065', 'event-440e8400-e29b-41d4-a716-446655440053', 'ee0e8400-e29b-41d4-a716-446655440009', 'attending', '2024-12-10 13:30:00', '2024-12-10 13:30:00'),
('rsvp-770e8400-e29b-41d4-a716-446655440066', 'event-550e8400-e29b-41d4-a716-446655440054', 'bb0e8400-e29b-41d4-a716-446655440006', 'maybe', '2024-12-22 10:45:00', '2024-12-22 10:45:00');

-- Forum Posts
INSERT INTO forum_posts (id, title, content, author_id, tags, likes_count, comments_count, views_count, is_pinned, is_deleted, created_at, updated_at) VALUES

('post-110e8400-e29b-41d4-a716-446655440070', 'Tips for Landing Your First Software Engineering Job',
'After going through countless interviews and finally landing my first job at Google, I wanted to share some tips that helped me:\n\n1. **Build real projects** - Don\'t just do tutorials, build something from scratch\n2. **Contribute to open source** - Great way to learn and build your portfolio\n3. **Practice LeetCode daily** - Consistency is key\n4. **Mock interviews** - Practice with friends or use platforms like Pramp\n5. **Network actively** - Attend meetups, connect with people on LinkedIn\n\nHappy to answer any questions! Good luck to everyone job hunting! 🚀',
'660e8400-e29b-41d4-a716-446655440001',
'["career-advice","software-engineering","job-hunting","interviews"]',
42, 15, 234, TRUE, FALSE, '2024-12-20 10:30:00', '2024-12-28 09:15:00'),

('post-220e8400-e29b-41d4-a716-446655440071', 'Transitioning from Engineering to Product Management',
'I recently made the switch from software engineering to product management and wanted to share my journey.\n\n**Why I made the switch:**\n- Wanted to have more impact on product strategy\n- Enjoyed working with users and understanding their needs\n- Liked the cross-functional collaboration aspect\n\n**How I prepared:**\n- Took on PM-like responsibilities in my eng role\n- Read PM books (Inspired, Cracking the PM Interview)\n- Networked with PMs to learn about the role\n- Built side projects to practice product thinking\n\nIt\'s been 2 years now and I absolutely love it! AMA about the transition.',
'770e8400-e29b-41d4-a716-446655440002',
'["product-management","career-transition","advice"]',
38, 12, 189, FALSE, FALSE, '2024-12-18 14:15:00', '2024-12-27 16:45:00'),

('post-330e8400-e29b-41d4-a716-446655440072', 'Best Resources for Learning React in 2025',
'As someone who recently learned React, here are the resources I found most helpful:\n\n**Free Resources:**\n- React official docs (beta docs are amazing!)\n- FreeCodeCamp React course\n- Web Dev Simplified YouTube channel\n\n**Paid Resources:**\n- Udemy courses by Maximilian Schwarzmüller\n- Frontend Masters subscription\n\n**Practice:**\n- Build projects! I made a todo app, weather app, and a movie search app\n- Contribute to open source React projects\n\nWhat resources helped you learn React?',
'880e8400-e29b-41d4-a716-446655440003',
'["react","web-development","learning-resources","javascript"]',
28, 9, 156, FALSE, FALSE, '2024-12-25 11:00:00', '2024-12-27 14:30:00'),

('post-440e8400-e29b-41d4-a716-446655440073', 'Understanding Design Systems: A Beginner\'s Guide',
'Design systems have become crucial in modern product development. Here\'s what you need to know:\n\n**What is a Design System?**\nA collection of reusable components, guided by clear standards, that can be assembled to build applications.\n\n**Key Components:**\n- Component library (buttons, inputs, cards, etc.)\n- Design tokens (colors, spacing, typography)\n- Documentation and guidelines\n- Accessibility standards\n\n**Popular Design Systems to Study:**\n- Material Design (Google)\n- Polaris (Shopify)\n- Carbon (IBM)\n- Ant Design\n\nStarting to build design systems has really leveled up my design work!',
'aa0e8400-e29b-41d4-a716-446655440005',
'["design-systems","ux-design","ui-design","frontend"]',
31, 7, 178, FALSE, FALSE, '2024-12-22 09:45:00', '2024-12-26 11:20:00');

-- Forum Comments
INSERT INTO forum_comments (id, post_id, author_id, parent_comment_id, content, likes_count, is_deleted, created_at, updated_at) VALUES

('comment-110e8400-e29b-41d4-a716-446655440080', 'post-110e8400-e29b-41d4-a716-446655440070', 'bb0e8400-e29b-41d4-a716-446655440006', NULL,
'This is super helpful! I\'m currently in the job hunting phase. How many hours a day did you dedicate to LeetCode?',
5, FALSE, '2024-12-20 11:15:00', '2024-12-20 11:15:00'),

('comment-220e8400-e29b-41d4-a716-446655440081', 'post-110e8400-e29b-41d4-a716-446655440070', '660e8400-e29b-41d4-a716-446655440001', 'comment-110e8400-e29b-41d4-a716-446655440080',
'I did about 1-2 hours daily, focusing on understanding patterns rather than just memorizing solutions. Started with easy problems and gradually moved to medium/hard.',
8, FALSE, '2024-12-20 12:30:00', '2024-12-20 12:30:00'),

('comment-330e8400-e29b-41d4-a716-446655440082', 'post-110e8400-e29b-41d4-a716-446655440070', 'ee0e8400-e29b-41d4-a716-446655440009', NULL,
'Great post! Do you have recommendations for open source projects that are beginner-friendly?',
3, FALSE, '2024-12-21 09:00:00', '2024-12-21 09:00:00'),

('comment-440e8400-e29b-41d4-a716-446655440083', 'post-220e8400-e29b-41d4-a716-446655440071', 'bb0e8400-e29b-41d4-a716-446655440006', NULL,
'This is exactly what I\'m considering! How did you communicate your interest in PM during interviews when your background was in engineering?',
4, FALSE, '2024-12-19 10:20:00', '2024-12-19 10:20:00'),

('comment-550e8400-e29b-41d4-a716-446655440084', 'post-330e8400-e29b-41d4-a716-446655440072', 'bb0e8400-e29b-41d4-a716-446655440006', NULL,
'Thanks for sharing! I\'ve been using the official docs and they\'re great. Also recommend Josh Comeau\'s blog for understanding React deeply.',
6, FALSE, '2024-12-25 14:30:00', '2024-12-25 14:30:00');

-- ============================================================================
-- PHASE 6: NOTIFICATIONS
-- ============================================================================

INSERT INTO notifications (id, user_id, type, title, message, link, is_read, priority, metadata, read_at, created_at) VALUES

('notif-110e8400-e29b-41d4-a716-446655440090', '880e8400-e29b-41d4-a716-446655440003', 'mentorship', 
'Mentorship Request Accepted',
'Sarah Johnson has accepted your mentorship request! You can now schedule your first session.',
'/mentorship/requests/req-110e8400-e29b-41d4-a716-446655440030', TRUE, 'high',
'{"mentor_name":"Sarah Johnson","request_id":"req-110e8400-e29b-41d4-a716-446655440030"}',
'2024-11-16 15:00:00', '2024-11-16 14:20:00'),

('notif-220e8400-e29b-41d4-a716-446655440091', '880e8400-e29b-41d4-a716-446655440003', 'job',
'Application Status Updated',
'Your application for Frontend Developer Intern at Startup Ventures has been shortlisted!',
'/jobs/applications/app-660e8400-e29b-41d4-a716-446655440020', TRUE, 'high',
'{"job_title":"Frontend Developer Intern","company":"Startup Ventures","status":"shortlisted"}',
'2024-12-20 11:00:00', '2024-12-20 10:30:00'),

('notif-330e8400-e29b-41d4-a716-446655440092', '880e8400-e29b-41d4-a716-446655440003', 'event',
'Event Reminder',
'Machine Learning Workshop: From Theory to Practice starts in 24 hours',
'/events/event-220e8400-e29b-41d4-a716-446655440051', FALSE, 'medium',
'{"event_title":"Machine Learning Workshop: From Theory to Practice","event_date":"2025-01-20T14:00:00Z"}',
NULL, '2024-12-28 14:00:00'),

('notif-440e8400-e29b-41d4-a716-446655440093', 'bb0e8400-e29b-41d4-a716-446655440006', 'mentorship',
'New Mentorship Session Scheduled',
'Michael Chen has scheduled a mentorship session with you for Jan 10, 2025 at 5:00 PM',
'/mentorship/sessions/session-new-123', FALSE, 'high',
'{"mentor_name":"Michael Chen","session_date":"2025-01-10T17:00:00Z"}',
NULL, '2024-12-27 10:30:00'),

('notif-550e8400-e29b-41d4-a716-446655440094', '660e8400-e29b-41d4-a716-446655440001', 'forum',
'New Comment on Your Post',
'James Wilson commented on your post \'Tips for Landing Your First Software Engineering Job\'',
'/forum/posts/post-110e8400-e29b-41d4-a716-446655440070', TRUE, 'low',
'{"post_title":"Tips for Landing Your First Software Engineering Job","commenter_name":"James Wilson"}',
'2024-12-20 12:00:00', '2024-12-20 11:15:00'),

('notif-660e8400-e29b-41d4-a716-446655440095', 'ee0e8400-e29b-41d4-a716-446655440009', 'job',
'New Job Match',
'A new job matching your skills has been posted: Product Designer (Mid-Level) at DesignFirst Inc',
'/jobs/job-220e8400-e29b-41d4-a716-446655440011', FALSE, 'medium',
'{"job_title":"Product Designer (Mid-Level)","company":"DesignFirst Inc","matched_skills":["UX Design","UI Design","Figma"]}',
NULL, '2024-12-28 09:00:00');

-- Notification Preferences
INSERT INTO notification_preferences (id, user_id, email_notifications, push_notifications, job_alerts, event_reminders, mentorship_updates, forum_activity, created_at, updated_at) VALUES
('pref-660e8400-e29b-41d4-a716', '660e8400-e29b-41d4-a716-446655440001', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, '2023-03-20 09:15:00', '2024-12-15 10:00:00'),
('pref-880e8400-e29b-41d4-a716', '880e8400-e29b-41d4-a716-446655440003', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, '2024-09-01 10:00:00', '2024-12-20 14:30:00'),
('pref-bb0e8400-e29b-41d4-a716', 'bb0e8400-e29b-41d4-a716-446655440006', TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, '2024-09-05 14:30:00', '2024-12-18 11:00:00');

-- ============================================================================
-- PHASE 8: ENGAGEMENT & GAMIFICATION
-- ============================================================================

INSERT INTO badges (id, name, description, icon_url, requirements, rarity, points, created_at) VALUES
('badge-first-login', 'First Login', 'Welcome to the platform!', 'https://cdn.alumni.edu/badges/first-login.svg', '{"type":"login","count":1}', 'common', 10, '2023-01-01 00:00:00'),
('badge-profile-complete', 'Profile Complete', 'Complete your profile 100%', 'https://cdn.alumni.edu/badges/profile-complete.svg', '{"type":"profile","completion":100}', 'common', 50, '2023-01-01 00:00:00'),
('badge-active-mentor', 'Active Mentor', 'Conduct 10 mentorship sessions', 'https://cdn.alumni.edu/badges/active-mentor.svg', '{"type":"mentorship","sessions":10}', 'rare', 200, '2023-01-01 00:00:00'),
('badge-job-hunter', 'Job Hunter', 'Apply for 20 jobs', 'https://cdn.alumni.edu/badges/job-hunter.svg', '{"type":"job_applications","count":20}', 'common', 100, '2023-01-01 00:00:00'),
('badge-community-leader', 'Community Leader', 'Create 50 forum posts', 'https://cdn.alumni.edu/badges/community-leader.svg', '{"type":"forum_posts","count":50}', 'epic', 300, '2023-01-01 00:00:00'),
('badge-event-enthusiast', 'Event Enthusiast', 'Attend 15 events', 'https://cdn.alumni.edu/badges/event-enthusiast.svg', '{"type":"events","count":15}', 'rare', 150, '2023-01-01 00:00:00'),
('badge-top-mentor', 'Top Mentor', 'Conduct 25+ mentorship sessions with high ratings', 'https://cdn.alumni.edu/badges/top-mentor.svg', '{"type":"mentorship","sessions":25}', 'legendary', 500, '2023-01-01 00:00:00'),
('badge-community-champion', 'Community Champion', 'Outstanding community engagement across all areas', 'https://cdn.alumni.edu/badges/community-champion.svg', '{"type":"community","engagement":1000}', 'legendary', 600, '2023-01-01 00:00:00'),
('badge-knowledge-guru', 'Knowledge Guru', 'Share knowledge extensively through forum posts', 'https://cdn.alumni.edu/badges/knowledge-guru.svg', '{"type":"forum_posts","count":100}', 'epic', 400, '2023-01-01 00:00:00'),
('badge-mentor-elite', 'Mentor Elite', 'Elite mentor with exceptional feedback', 'https://cdn.alumni.edu/badges/mentor-elite.svg', '{"type":"mentorship","sessions":15,"rating":4.8}', 'rare', 250, '2023-01-01 00:00:00'),
('badge-event-host', 'Event Host', 'Host 5+ community events', 'https://cdn.alumni.edu/badges/event-host.svg', '{"type":"events","hosted":5}', 'rare', 200, '2023-01-01 00:00:00'),
('badge-career-helper', 'Career Helper', 'Help 20+ alumni with career advice', 'https://cdn.alumni.edu/badges/career-helper.svg', '{"type":"career","helped":20}', 'rare', 180, '2023-01-01 00:00:00'),
('badge-forum-star', 'Forum Star', 'Create popular forum discussions', 'https://cdn.alumni.edu/badges/forum-star.svg', '{"type":"forum_posts","count":30}', 'rare', 150, '2023-01-01 00:00:00'),
('badge-helpful-alumni', 'Helpful Alumni', 'Consistently help other community members', 'https://cdn.alumni.edu/badges/helpful-alumni.svg', '{"type":"helpful","count":50}', 'rare', 180, '2023-01-01 00:00:00'),
('badge-active-member', 'Active Member', 'Regular and active participation', 'https://cdn.alumni.edu/badges/active-member.svg', '{"type":"activity","days":30}', 'common', 100, '2023-01-01 00:00:00'),
('badge-rising-star', 'Rising Star', 'Rapidly growing engagement', 'https://cdn.alumni.edu/badges/rising-star.svg', '{"type":"growth","rate":50}', 'rare', 150, '2023-01-01 00:00:00');

-- User Badges
INSERT INTO user_badges (id, user_id, badge_id, earned_at) VALUES
('ub-110e8400-e29b-41d4-a716', '660e8400-e29b-41d4-a716-446655440001', 'badge-first-login', '2023-03-20 09:15:00'),
('ub-120e8400-e29b-41d4-a716', '660e8400-e29b-41d4-a716-446655440001', 'badge-profile-complete', '2023-03-22 14:30:00'),
('ub-130e8400-e29b-41d4-a716', '660e8400-e29b-41d4-a716-446655440001', 'badge-top-mentor', '2024-05-15 10:00:00'),
('ub-140e8400-e29b-41d4-a716', '660e8400-e29b-41d4-a716-446655440001', 'badge-community-champion', '2024-06-20 14:30:00'),
('ub-150e8400-e29b-41d4-a716', '660e8400-e29b-41d4-a716-446655440001', 'badge-knowledge-guru', '2024-07-10 11:15:00'),
('ub-210e8400-e29b-41d4-a716', '770e8400-e29b-41d4-a716-446655440002', 'badge-first-login', '2023-04-15 08:30:00'),
('ub-220e8400-e29b-41d4-a716', '770e8400-e29b-41d4-a716-446655440002', 'badge-mentor-elite', '2024-03-20 10:00:00'),
('ub-230e8400-e29b-41d4-a716', '770e8400-e29b-41d4-a716-446655440002', 'badge-event-host', '2024-05-18 16:45:00'),
('ub-240e8400-e29b-41d4-a716', '770e8400-e29b-41d4-a716-446655440002', 'badge-career-helper', '2024-06-25 09:20:00'),
('ub-310e8400-e29b-41d4-a716', 'aa0e8400-e29b-41d4-a716-446655440005', 'badge-first-login', '2023-05-10 12:00:00'),
('ub-320e8400-e29b-41d4-a716', 'aa0e8400-e29b-41d4-a716-446655440005', 'badge-forum-star', '2024-04-12 14:30:00'),
('ub-330e8400-e29b-41d4-a716', 'aa0e8400-e29b-41d4-a716-446655440005', 'badge-helpful-alumni', '2024-06-08 10:15:00'),
('ub-340e8400-e29b-41d4-a716', 'aa0e8400-e29b-41d4-a716-446655440005', 'badge-active-member', '2024-07-01 18:00:00'),
('ub-410e8400-e29b-41d4-a716', '880e8400-e29b-41d4-a716-446655440003', 'badge-first-login', '2023-06-20 15:30:00'),
('ub-420e8400-e29b-41d4-a716', '880e8400-e29b-41d4-a716-446655440003', 'badge-rising-star', '2024-08-05 11:45:00'),
('ub-430e8400-e29b-41d4-a716', '880e8400-e29b-41d4-a716-446655440003', 'badge-active-member', '2024-08-10 13:20:00');

-- Engagement Scores
INSERT INTO engagement_scores (id, user_id, total_score, contributions, rank_position, level, last_calculated) VALUES
('score-660e8400-e29b-41d4-a716', '660e8400-e29b-41d4-a716-446655440001', 2850, 
'{"profile":20,"mentorship":1200,"jobs":50,"events":380,"forum":1200}', 1, 'Legend', '2024-12-28 10:00:00'),
('score-770e8400-e29b-41d4-a716', '770e8400-e29b-41d4-a716-446655440002', 2640,
'{"profile":20,"mentorship":1100,"jobs":40,"events":480,"forum":1000}', 2, 'Legend', '2024-12-28 10:00:00'),
('score-aa0e8400-e29b-41d4-a716', 'aa0e8400-e29b-41d4-a716-446655440005', 2420,
'{"profile":20,"mentorship":900,"jobs":30,"events":420,"forum":1050}', 3, 'Veteran', '2024-12-28 10:00:00'),
('score-880e8400-e29b-41d4-a716', '880e8400-e29b-41d4-a716-446655440003', 1980,
'{"profile":18,"mentorship":600,"jobs":80,"events":320,"forum":962}', 4, 'Veteran', '2024-12-28 10:00:00'),
('score-cc0e8400-e29b-41d4-a716', 'cc0e8400-e29b-41d4-a716-446655440007', 1650,
'{"profile":19,"mentorship":500,"jobs":60,"events":280,"forum":791}', 5, 'Active', '2024-12-28 10:00:00');

-- Contribution History (Activity timeline for weekly/monthly calculations)
INSERT INTO contribution_history (id, user_id, contribution_type, points_earned, description, created_at) VALUES
-- Sarah Johnson (user 660e) - Legend Level - Very Active
-- Recent Week (Last 7 days)
('ch-sarah-001', '660e8400-e29b-41d4-a716-446655440001', 'mentorship', 10, 'Completed mentorship session', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('ch-sarah-002', '660e8400-e29b-41d4-a716-446655440001', 'forum_post', 5, 'Created helpful forum post', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('ch-sarah-003', '660e8400-e29b-41d4-a716-446655440001', 'forum_comment', 2, 'Commented on discussion', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('ch-sarah-004', '660e8400-e29b-41d4-a716-446655440001', 'event_attend', 8, 'Attended networking event', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('ch-sarah-005', '660e8400-e29b-41d4-a716-446655440001', 'mentorship', 10, 'Completed mentorship session', DATE_SUB(NOW(), INTERVAL 6 DAY)),
-- Previous Week (7-14 days ago)
('ch-sarah-006', '660e8400-e29b-41d4-a716-446655440001', 'forum_post', 5, 'Created forum post', DATE_SUB(NOW(), INTERVAL 9 DAY)),
('ch-sarah-007', '660e8400-e29b-41d4-a716-446655440001', 'mentorship', 10, 'Completed mentorship session', DATE_SUB(NOW(), INTERVAL 11 DAY)),
('ch-sarah-008', '660e8400-e29b-41d4-a716-446655440001', 'event_attend', 8, 'Attended workshop', DATE_SUB(NOW(), INTERVAL 13 DAY)),
-- This Month (varied activities)
('ch-sarah-009', '660e8400-e29b-41d4-a716-446655440001', 'profile_update', 20, 'Completed profile 100%', DATE_SUB(NOW(), INTERVAL 20 DAY)),
('ch-sarah-010', '660e8400-e29b-41d4-a716-446655440001', 'mentorship', 10, 'Completed mentorship session', DATE_SUB(NOW(), INTERVAL 22 DAY)),
('ch-sarah-011', '660e8400-e29b-41d4-a716-446655440001', 'forum_post', 5, 'Created forum post', DATE_SUB(NOW(), INTERVAL 25 DAY)),

-- Priya Patel (user aa0e) - Veteran Level - Very Active
-- Recent Week
('ch-priya-001', 'aa0e8400-e29b-41d4-a716-446655440005', 'mentorship', 10, 'Completed mentorship session', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('ch-priya-002', 'aa0e8400-e29b-41d4-a716-446655440005', 'mentorship', 10, 'Completed mentorship session', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('ch-priya-003', 'aa0e8400-e29b-41d4-a716-446655440005', 'event_attend', 8, 'Attended design workshop', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('ch-priya-004', 'aa0e8400-e29b-41d4-a716-446655440005', 'forum_post', 5, 'Shared design insights', DATE_SUB(NOW(), INTERVAL 6 DAY)),
-- Previous Week
('ch-priya-005', 'aa0e8400-e29b-41d4-a716-446655440005', 'mentorship', 10, 'Completed mentorship session', DATE_SUB(NOW(), INTERVAL 8 DAY)),
('ch-priya-006', 'aa0e8400-e29b-41d4-a716-446655440005', 'event_attend', 8, 'Attended UX conference', DATE_SUB(NOW(), INTERVAL 10 DAY)),
('ch-priya-007', 'aa0e8400-e29b-41d4-a716-446655440005', 'forum_comment', 2, 'Helped with design question', DATE_SUB(NOW(), INTERVAL 12 DAY)),
-- This Month
('ch-priya-008', 'aa0e8400-e29b-41d4-a716-446655440005', 'profile_update', 20, 'Updated profile', DATE_SUB(NOW(), INTERVAL 18 DAY)),
('ch-priya-009', 'aa0e8400-e29b-41d4-a716-446655440005', 'mentorship', 10, 'Completed mentorship session', DATE_SUB(NOW(), INTERVAL 21 DAY)),
('ch-priya-010', 'aa0e8400-e29b-41d4-a716-446655440005', 'event_attend', 8, 'Attended networking event', DATE_SUB(NOW(), INTERVAL 27 DAY)),

-- Lisa Anderson (user cc0e) - Veteran Level - Active
-- Recent Week
('ch-lisa-001', 'cc0e8400-e29b-41d4-a716-446655440007', 'mentorship', 10, 'ML mentorship session', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('ch-lisa-002', 'cc0e8400-e29b-41d4-a716-446655440007', 'forum_post', 5, 'Shared ML tutorial', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('ch-lisa-003', 'cc0e8400-e29b-41d4-a716-446655440007', 'event_attend', 8, 'Attended AI conference', DATE_SUB(NOW(), INTERVAL 6 DAY)),
-- Previous Week
('ch-lisa-004', 'cc0e8400-e29b-41d4-a716-446655440007', 'forum_comment', 2, 'Answered data science question', DATE_SUB(NOW(), INTERVAL 10 DAY)),
('ch-lisa-005', 'cc0e8400-e29b-41d4-a716-446655440007', 'mentorship', 10, 'Data science mentorship', DATE_SUB(NOW(), INTERVAL 11 DAY)),
-- This Month
('ch-lisa-006', 'cc0e8400-e29b-41d4-a716-446655440007', 'profile_update', 19, 'Updated skills', DATE_SUB(NOW(), INTERVAL 19 DAY)),
('ch-lisa-007', 'cc0e8400-e29b-41d4-a716-446655440007', 'mentorship', 10, 'Completed mentorship session', DATE_SUB(NOW(), INTERVAL 24 DAY)),
('ch-lisa-008', 'cc0e8400-e29b-41d4-a716-446655440007', 'event_attend', 8, 'Attended tech meetup', DATE_SUB(NOW(), INTERVAL 28 DAY)),

-- Michael Chen (user 770e) - Active Level
-- Recent Week
('ch-michael-001', '770e8400-e29b-41d4-a716-446655440002', 'forum_post', 5, 'Shared PM insights', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('ch-michael-002', '770e8400-e29b-41d4-a716-446655440002', 'event_attend', 8, 'Attended product meetup', DATE_SUB(NOW(), INTERVAL 5 DAY)),
-- Previous Week
('ch-michael-003', '770e8400-e29b-41d4-a716-446655440002', 'mentorship', 10, 'PM mentorship session', DATE_SUB(NOW(), INTERVAL 9 DAY)),
('ch-michael-004', '770e8400-e29b-41d4-a716-446655440002', 'forum_comment', 2, 'Product advice', DATE_SUB(NOW(), INTERVAL 12 DAY)),
-- This Month
('ch-michael-005', '770e8400-e29b-41d4-a716-446655440002', 'profile_update', 19, 'Updated experience', DATE_SUB(NOW(), INTERVAL 20 DAY)),
('ch-michael-006', '770e8400-e29b-41d4-a716-446655440002', 'mentorship', 10, 'Mentorship session', DATE_SUB(NOW(), INTERVAL 23 DAY)),
('ch-michael-007', '770e8400-e29b-41d4-a716-446655440002', 'event_attend', 8, 'Attended workshop', DATE_SUB(NOW(), INTERVAL 26 DAY)),

-- Emily Rodriguez (user 880e) - Student - Active
-- Recent Week
('ch-emily-001', '880e8400-e29b-41d4-a716-446655440003', 'job_post', 5, 'Applied for internship', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('ch-emily-002', '880e8400-e29b-41d4-a716-446655440003', 'forum_post', 5, 'Asked career question', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('ch-emily-003', '880e8400-e29b-41d4-a716-446655440003', 'event_attend', 8, 'Attended career fair', DATE_SUB(NOW(), INTERVAL 6 DAY)),
-- Previous Week
('ch-emily-004', '880e8400-e29b-41d4-a716-446655440003', 'forum_comment', 2, 'Engaged in discussion', DATE_SUB(NOW(), INTERVAL 8 DAY)),
('ch-emily-005', '880e8400-e29b-41d4-a716-446655440003', 'job_post', 5, 'Applied for job', DATE_SUB(NOW(), INTERVAL 11 DAY)),
-- This Month
('ch-emily-006', '880e8400-e29b-41d4-a716-446655440003', 'profile_update', 15, 'Updated student profile', DATE_SUB(NOW(), INTERVAL 16 DAY)),
('ch-emily-007', '880e8400-e29b-41d4-a716-446655440003', 'mentorship', 20, 'Received mentorship', DATE_SUB(NOW(), INTERVAL 22 DAY)),
('ch-emily-008', '880e8400-e29b-41d4-a716-446655440003', 'forum_post', 5, 'Posted question', DATE_SUB(NOW(), INTERVAL 29 DAY));

-- ============================================================================
-- PHASE 9: INNOVATIVE FEATURES
-- ============================================================================

-- Skill Graph
INSERT INTO skill_graph (id, skill_name, related_skills, industry_connections, alumni_count, job_count, popularity_score, created_at, updated_at) VALUES
('skill-javascript', 'JavaScript', '["TypeScript","React","Node.js","Vue","Angular"]', '["Web Development","Software Engineering","Frontend Development"]', 156, 89, 95.5, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-python', 'Python', '["Django","Flask","Data Science","Machine Learning","TensorFlow"]', '["Software Engineering","Data Science","AI/ML","Backend Development"]', 142, 76, 92.3, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-react', 'React', '["JavaScript","Redux","Next.js","HTML","CSS"]', '["Frontend Development","Web Development","Software Engineering"]', 128, 82, 90.8, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-ux-design', 'UX Design', '["UI Design","Figma","User Research","Prototyping","Design Systems"]', '["Product Design","UX Research","Interaction Design"]', 67, 43, 78.5, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-machine-learning', 'Machine Learning', '["Python","TensorFlow","PyTorch","Data Science","Deep Learning"]', '["AI/ML","Data Science","Research"]', 89, 54, 85.2, '2024-01-01 00:00:00', '2024-12-28 00:00:00');

-- Knowledge Capsules
INSERT INTO knowledge_capsules (id, title, content, author_id, category, tags, duration_minutes, featured_image, likes_count, views_count, bookmarks_count, is_featured, created_at, updated_at) VALUES

('capsule-110e8400-e29b-41d4-a716', 'Building Your First Full-Stack Application',
'A comprehensive guide to building a full-stack web application from scratch...\n\n## Planning\nBefore writing any code, spend time planning your application architecture...\n\n## Frontend Development\nStart with setting up React and creating your component structure...\n\n## Backend Development\nBuild RESTful APIs using Node.js and Express...\n\n## Database Design\nChoose between SQL and NoSQL based on your needs...\n\n## Deployment\nLearn how to deploy to platforms like Vercel, Heroku, or AWS...',
'660e8400-e29b-41d4-a716-446655440001', 'technical', '["full-stack","web-development","tutorial","beginner-friendly"]',
15, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085', 84, 456, 67, TRUE, '2024-12-10 10:00:00', '2024-12-27 14:30:00'),

('capsule-220e8400-e29b-41d4-a716', 'From Engineer to Product Manager: My Journey',
'Sharing my experience transitioning from software engineering to product management...\n\n## Why I Made the Switch\nAfter 5 years as a software engineer, I wanted to have broader impact...\n\n## Preparation\nI started by reading PM books and taking on PM responsibilities...\n\n## The Interview Process\nPM interviews are very different from engineering interviews...\n\n## First Year as a PM\nLearning curve was steep but incredibly rewarding...\n\n## Advice for Engineers Considering PM\nYour technical background is a huge advantage...',
'770e8400-e29b-41d4-a716-446655440002', 'career', '["product-management","career-transition","advice"]',
12, 'https://images.unsplash.com/photo-1552664730-d307ca884978', 62, 389, 54, TRUE, '2024-12-15 11:30:00', '2024-12-26 16:20:00'),

('capsule-330e8400-e29b-41d4-a716', 'Accessibility in Design: Why It Matters',
'Understanding and implementing accessible design practices...\n\n## What is Accessibility?\nMaking products usable by everyone, including people with disabilities...\n\n## Common Accessibility Issues\n- Poor color contrast\n- Missing alt text\n- Non-keyboard accessible interfaces\n- Inadequate focus indicators\n\n## How to Design Accessibly\nStart with semantic HTML and proper ARIA labels...\n\n## Tools and Resources\nScreen readers, contrast checkers, and automated testing tools...\n\n## Real-World Impact\nAccessible design benefits everyone, not just people with disabilities...',
'aa0e8400-e29b-41d4-a716-446655440005', 'technical', '["accessibility","design","ux","best-practices"]',
10, 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e', 47, 298, 41, FALSE, '2024-12-18 14:00:00', '2024-12-25 10:15:00');

-- Geographic Data
INSERT INTO geographic_data (id, location_name, country, city, latitude, longitude, alumni_count, jobs_count, top_skills, top_companies, top_industries, last_updated) VALUES
('geo-san-francisco', 'San Francisco, CA', 'United States', 'San Francisco', 37.7749, -122.4194, 145,
89, '["JavaScript","Python","React","Cloud Computing","Product Management"]',
'["Google","Salesforce","Uber","Airbnb","Twitter"]', '["Technology","Fintech","E-commerce"]', '2024-12-28 00:00:00'),

('geo-seattle', 'Seattle, WA', 'United States', 'Seattle', 47.6062, -122.3321, 98,
62, '["Python","AWS","Machine Learning","Product Management","DevOps"]',
'["Amazon","Microsoft","Boeing","Expedia","Zillow"]', '["Technology","Cloud Services","E-commerce"]', '2024-12-28 00:00:00'),

('geo-boston', 'Boston, MA', 'United States', 'Boston', 42.3601, -71.0589, 67,
45, '["Machine Learning","Data Science","Python","Research","Robotics"]',
'["MIT","Harvard","Boston Dynamics","HubSpot","Wayfair"]', '["Technology","Education","Healthcare","Research"]', '2024-12-28 00:00:00'),

-- Additional Geographic Data (International Locations)
('geo-new-york', 'New York, NY', 'United States', 'New York', 40.7128, -74.0060, 124,
78, '["Finance","Python","Java","React","Product Management"]',
'["Goldman Sachs","JPMorgan","Meta","IBM","Bloomberg"]', '["Finance","Technology","Media"]', '2024-12-28 00:00:00'),

('geo-austin', 'Austin, TX', 'United States', 'Austin', 30.2672, -97.7431, 56,
42, '["JavaScript","Python","Cloud Computing","Mobile Development"]',
'["Dell","Oracle","Tesla","Indeed","Whole Foods"]', '["Technology","E-commerce"]', '2024-12-28 00:00:00'),

('geo-london', 'London', 'United Kingdom', 'London', 51.5074, -0.1278, 89,
53, '["Python","Machine Learning","Finance","React","Node.js"]',
'["DeepMind","Revolut","Monzo","TransferWise","Sky"]', '["Technology","Fintech","Media"]', '2024-12-28 00:00:00'),

('geo-bangalore', 'Bangalore', 'India', 'Bangalore', 12.9716, 77.5946, 134,
96, '["Java","Python","React","AWS","Microservices"]',
'["Infosys","Wipro","Amazon","Microsoft","Flipkart"]', '["Technology","E-commerce","Consulting"]', '2024-12-28 00:00:00'),

('geo-toronto', 'Toronto', 'Canada', 'Toronto', 43.6532, -79.3832, 72,
48, '["Python","Machine Learning","Finance","React","Cloud Computing"]',
'["Shopify","RBC","TD Bank","Wealthsimple","Uber"]', '["Technology","Finance","E-commerce"]', '2024-12-28 00:00:00'),

('geo-singapore', 'Singapore', 'Singapore', 'Singapore', 1.3521, 103.8198, 95,
61, '["Python","Java","Cloud Computing","Data Science","DevOps"]',
'["Grab","Sea Group","Shopee","DBS","Google"]', '["Technology","Finance","E-commerce"]', '2024-12-28 00:00:00'),

('geo-berlin', 'Berlin', 'Germany', 'Berlin', 52.5200, 13.4050, 67,
44, '["Python","JavaScript","React","Machine Learning","Cloud"]',
'["SAP","Siemens","Zalando","SoundCloud","N26"]', '["Technology","E-commerce","Fintech"]', '2024-12-28 00:00:00'),

('geo-sydney', 'Sydney', 'Australia', 'Sydney', -33.8688, 151.2093, 58,
39, '["Python","JavaScript","Cloud Computing","Data Science"]',
'["Atlassian","Canva","Afterpay","Commonwealth Bank","Telstra"]', '["Technology","Finance","E-commerce"]', '2024-12-28 00:00:00'),

('geo-dublin', 'Dublin', 'Ireland', 'Dublin', 53.3498, -6.2603, 82,
56, '["JavaScript","Python","Cloud Computing","React","DevOps"]',
'["Google","Facebook","Apple","Microsoft","Amazon"]', '["Technology","Cloud Services"]', '2024-12-28 00:00:00'),

('geo-tel-aviv', 'Tel Aviv', 'Israel', 'Tel Aviv', 32.0853, 34.7818, 64,
47, '["Python","Cybersecurity","Machine Learning","Cloud","Mobile"]',
'["Wix","Mobileye","Waze","Check Point","Monday.com"]', '["Technology","Cybersecurity","Startups"]', '2024-12-28 00:00:00');

-- Additional Skill Graph Data
INSERT INTO skill_graph (id, skill_name, related_skills, industry_connections, alumni_count, job_count, popularity_score, created_at, updated_at) VALUES
('skill-typescript', 'TypeScript', '["JavaScript","React","Node.js","Angular"]', '["Frontend Development","Web Development","Software Engineering"]', 112, 67, 88.7, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-aws', 'AWS', '["Cloud Computing","DevOps","Kubernetes","Docker"]', '["Cloud Services","DevOps","Infrastructure"]', 134, 89, 91.2, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-docker', 'Docker', '["Kubernetes","DevOps","AWS","CI/CD"]', '["DevOps","Cloud Services","Infrastructure"]', 98, 71, 87.3, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-kubernetes', 'Kubernetes', '["Docker","AWS","DevOps","Cloud Native"]', '["DevOps","Cloud Services","Infrastructure"]', 87, 64, 85.9, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-nodejs', 'Node.js', '["JavaScript","Express","MongoDB","React"]', '["Backend Development","Full-Stack","API Development"]', 121, 78, 89.4, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-sql', 'SQL', '["Database","PostgreSQL","MySQL","Data Analysis"]', '["Data Science","Backend Development","Database Management"]', 145, 92, 90.1, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-mongodb', 'MongoDB', '["NoSQL","Node.js","Express","Database"]', '["Backend Development","Full-Stack","Database"]', 89, 56, 82.5, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-ci-cd', 'CI/CD', '["DevOps","Jenkins","GitLab","GitHub Actions"]', '["DevOps","Software Engineering","Automation"]', 76, 58, 81.2, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-agile', 'Agile', '["Scrum","Project Management","Product Management"]', '["Product Management","Project Management"]', 134, 45, 79.8, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-data-analysis', 'Data Analysis', '["Python","SQL","Excel","Tableau"]', '["Data Science","Business Intelligence","Analytics"]', 103, 68, 84.6, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-api-design', 'API Design', '["REST","GraphQL","Node.js","Python"]', '["Backend Development","Software Engineering"]', 92, 61, 83.4, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-product-strategy', 'Product Strategy', '["Product Management","Business Strategy","Analytics"]', '["Product Management","Business"]', 78, 42, 77.9, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-ui-design', 'UI Design', '["UX Design","Figma","Design Systems","CSS"]', '["Product Design","Frontend Development"]', 71, 48, 80.2, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-leadership', 'Leadership', '["Management","Team Building","Communication"]', '["Management","Leadership"]', 156, 38, 76.5, '2024-01-01 00:00:00', '2024-12-28 00:00:00'),
('skill-communication', 'Communication', '["Leadership","Presentation","Writing"]', '["Management","Product Management","Sales"]', 167, 29, 74.3, '2024-01-01 00:00:00', '2024-12-28 00:00:00');

-- Alumni Cards
INSERT INTO alumni_cards (id, user_id, card_number, qr_code_data, issue_date, expiry_date, is_active, verification_count, last_verified, created_at, updated_at) VALUES
('card-660e8400-e29b-41d4-a716', '660e8400-e29b-41d4-a716-446655440001', 'ALU2019001234', 
'{"user_id":"660e8400-e29b-41d4-a716-446655440001","card_number":"ALU2019001234","name":"Sarah Johnson","batch_year":2019,"verified":true}',
'2023-03-22', '2028-03-22', TRUE, 12, '2024-12-20 10:00:00', '2023-03-22 10:00:00', '2024-12-20 10:00:00'),

('card-770e8400-e29b-41d4-a716', '770e8400-e29b-41d4-a716-446655440002', 'ALU2018002345',
'{"user_id":"770e8400-e29b-41d4-a716-446655440002","card_number":"ALU2018002345","name":"Michael Chen","batch_year":2018,"verified":true}',
'2023-05-12', '2028-05-12', TRUE, 8, '2024-12-15 14:30:00', '2023-05-12 11:00:00', '2024-12-15 14:30:00');

-- ============================================================================
-- ADVANCED FEATURES DATA
-- ============================================================================

-- Talent Clusters (for heatmap visualization)
INSERT INTO talent_clusters (id, cluster_name, center_latitude, center_longitude, radius_km, alumni_ids, dominant_skills, dominant_industries, cluster_size, cluster_density, created_at, updated_at) VALUES
('cluster-sf-1', 'San Francisco Bay Area Tech Hub', 37.7749, -122.4194, 50.5, 
'["660e8400-e29b-41d4-a716-446655440001","aa0e8400-e29b-41d4-a716-446655440005"]',
'["JavaScript","Python","React","Cloud Computing"]',
'["Technology","Software Engineering"]', 145, 2.87, NOW(), NOW()),

('cluster-seattle-1', 'Seattle Tech Cluster', 47.6062, -122.3321, 35.2,
'["770e8400-e29b-41d4-a716-446655440002"]',
'["Python","AWS","Machine Learning","Product Management"]',
'["Technology","Cloud Services"]', 98, 2.78, NOW(), NOW()),

('cluster-boston-1', 'Boston Innovation Hub', 42.3601, -71.0589, 40.0,
'["cc0e8400-e29b-41d4-a716-446655440007"]',
'["Machine Learning","Data Science","Python"]',
'["Technology","Research","Healthcare"]', 67, 1.68, NOW(), NOW());

-- Career Transition Matrix (for career paths ML)
INSERT INTO career_transition_matrix (id, from_role, to_role, transition_count, transition_probability, avg_duration_months, required_skills, success_rate, college_id, last_calculated) VALUES
('trans-1', 'Software Engineer', 'Senior Software Engineer', 45, 0.85, 36, 
'["Leadership","System Design","Mentoring"]', 0.92, NULL, NOW()),

('trans-2', 'Software Engineer', 'Product Manager', 12, 0.35, 48,
'["Product Strategy","Communication","User Research"]', 0.75, NULL, NOW()),

('trans-3', 'Senior Software Engineer', 'Engineering Manager', 18, 0.65, 30,
'["Leadership","Team Management","Strategic Planning"]', 0.88, NULL, NOW()),

('trans-4', 'Junior Developer', 'Software Engineer', 52, 0.95, 24,
'["Problem Solving","Code Review","Testing"]', 0.98, NULL, NOW()),

('trans-5', 'UX Designer', 'Lead UX Designer', 15, 0.70, 30,
'["Design Systems","Leadership","Mentoring"]', 0.85, NULL, NOW());

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

INSERT INTO system_config (id, config_key, config_value, config_type, description, is_public, created_at, updated_at) VALUES
('config-001', 'site_name', 'AlumUnity', 'string', 'Name of the alumni portal', TRUE, '2023-01-01 00:00:00', '2023-01-01 00:00:00'),
('config-002', 'max_mentees_per_mentor', '5', 'integer', 'Maximum number of mentees per mentor', FALSE, '2023-01-01 00:00:00', '2023-01-01 00:00:00'),
('config-003', 'job_expiry_days', '60', 'integer', 'Days until job posting expires', FALSE, '2023-01-01 00:00:00', '2023-01-01 00:00:00'),
('config-004', 'enable_mentorship', 'true', 'boolean', 'Enable mentorship feature', TRUE, '2023-01-01 00:00:00', '2023-01-01 00:00:00');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- VERIFICATION & SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Sample data insertion completed successfully!' AS status;
SELECT 
    'Users' AS table_name, COUNT(*) AS record_count FROM users
UNION ALL
SELECT 'Alumni Profiles', COUNT(*) FROM alumni_profiles
UNION ALL
SELECT 'Jobs', COUNT(*) FROM jobs
UNION ALL
SELECT 'Job Applications', COUNT(*) FROM job_applications
UNION ALL
SELECT 'Mentor Profiles', COUNT(*) FROM mentor_profiles
UNION ALL
SELECT 'Mentorship Requests', COUNT(*) FROM mentorship_requests
UNION ALL
SELECT 'Mentorship Sessions', COUNT(*) FROM mentorship_sessions
UNION ALL
SELECT 'Events', COUNT(*) FROM events
UNION ALL
SELECT 'Event RSVPs', COUNT(*) FROM event_rsvps
UNION ALL
SELECT 'Forum Posts', COUNT(*) FROM forum_posts
UNION ALL
SELECT 'Forum Comments', COUNT(*) FROM forum_comments
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'Badges', COUNT(*) FROM badges
UNION ALL
SELECT 'User Badges', COUNT(*) FROM user_badges
UNION ALL
SELECT 'Engagement Scores', COUNT(*) FROM engagement_scores
UNION ALL
SELECT 'Contribution History', COUNT(*) FROM contribution_history
UNION ALL
SELECT 'Skill Graph', COUNT(*) FROM skill_graph
UNION ALL
SELECT 'Knowledge Capsules', COUNT(*) FROM knowledge_capsules
UNION ALL
SELECT 'Geographic Data', COUNT(*) FROM geographic_data
UNION ALL
SELECT 'Alumni Cards', COUNT(*) FROM alumni_cards
UNION ALL
SELECT 'Talent Clusters', COUNT(*) FROM talent_clusters
UNION ALL
SELECT 'Career Transitions', COUNT(*) FROM career_transition_matrix
UNION ALL
SELECT 'System Config', COUNT(*) FROM system_config;

-- ============================================================================
-- END OF SAMPLE DATA INSERT SCRIPT
-- ============================================================================
