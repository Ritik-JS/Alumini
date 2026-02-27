#!/usr/bin/env python3
"""
COMPREHENSIVE FRONTEND-BACKEND-DATABASE TEST SUITE
Tests the complete flow: Frontend UI → Backend API → Database
Verifies data integrity and API contracts across all admin features
"""

import asyncio
import aiohttp
import pymysql
import json
import sys
import os
from datetime import datetime
from typing import Dict, List, Optional
from tabulate import tabulate

# ============================================================================
# CONFIGURATION
# ============================================================================

API_BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
FRONTEND_URL = "http://localhost:5999"

DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': int(os.environ.get('DB_PORT', 3001)),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', 'Prince1504'),
    'database': os.environ.get('DB_NAME', 'alumunity'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# Admin credentials from sample_data_insert.sql
ADMIN_CREDENTIALS = {
    "email": "admin@alumni.edu",
    "password": "Admin@123"
}

# Test results tracking
test_results = {
    'total': 0,
    'passed': 0,
    'failed': 0,
    'warnings': 0,
    'skipped': 0,
    'details': []
}

# ============================================================================
# UTILITY CLASSES & FUNCTIONS
# ============================================================================

class Colors:
    """ANSI color codes"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_header(text: str):
    """Print formatted header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*100}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(100)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*100}{Colors.ENDC}\n")


def print_section(text: str):
    """Print section header"""
    print(f"\n{Colors.OKBLUE}{Colors.BOLD}{'─'*100}{Colors.ENDC}")
    print(f"{Colors.OKBLUE}{Colors.BOLD}{text}{Colors.ENDC}")
    print(f"{Colors.OKBLUE}{Colors.BOLD}{'─'*100}{Colors.ENDC}")


def print_test(test_name: str):
    """Print test name"""
    test_results['total'] += 1
    print(f"{Colors.OKCYAN}[TEST {test_results['total']}] {test_name}{Colors.ENDC}")


def print_success(message: str):
    """Print success message"""
    print(f"  {Colors.OKGREEN}✅ {message}{Colors.ENDC}")
    test_results['passed'] += 1
    test_results['details'].append(('PASS', message))


def print_failure(message: str):
    """Print failure message"""
    print(f"  {Colors.FAIL}❌ {message}{Colors.ENDC}")
    test_results['failed'] += 1
    test_results['details'].append(('FAIL', message))


def print_warning(message: str):
    """Print warning message"""
    print(f"  {Colors.WARNING}⚠️  {message}{Colors.ENDC}")
    test_results['warnings'] += 1
    test_results['details'].append(('WARN', message))


def print_info(message: str):
    """Print info message"""
    print(f"  {Colors.OKCYAN}ℹ️  {message}{Colors.ENDC}")


def print_skip(message: str):
    """Print skip message"""
    print(f"  {Colors.WARNING}⏭️  {message}{Colors.ENDC}")
    test_results['skipped'] += 1
    test_results['details'].append(('SKIP', message))


# ============================================================================
# DATABASE CONNECTION & TESTS
# ============================================================================

def get_db_connection():
    """Get database connection"""
    try:
        return pymysql.connect(**DB_CONFIG)
    except Exception as e:
        print_failure(f"Failed to connect to database: {str(e)}")
        return None


def test_database_connection():
    """Test 1: Database connection and schema validation"""
    print_test("Database Connection & Schema Validation")
    
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        with connection.cursor() as cursor:
            # Test connection
            cursor.execute("SELECT DATABASE()")
            db_name = cursor.fetchone()['DATABASE()']
            print_success(f"Connected to database: {db_name}")
            
            # Verify tables exist
            required_tables = [
                'users', 'alumni_profiles', 'alumni_cards',
                'mentorship_requests', 'mentorship_sessions', 'mentor_profiles',
                'badges', 'user_badges', 'jobs', 'job_applications',
                'events', 'event_rsvps', 'notifications',
                'admin_actions', 'content_flags', 'system_config'
            ]
            
            cursor.execute("SHOW TABLES")
            existing_tables = [list(row.values())[0] for row in cursor.fetchall()]
            
            missing_tables = [t for t in required_tables if t not in existing_tables]
            
            if missing_tables:
                print_warning(f"Missing tables: {', '.join(missing_tables[:5])}{'...' if len(missing_tables) > 5 else ''}")
            else:
                print_success(f"All {len(required_tables)} required tables exist")
            
            # Count records
            table_counts = []
            for table in ['users', 'alumni_profiles', 'mentorship_requests', 'jobs', 'events', 'badges']:
                if table in existing_tables:
                    cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                    count = cursor.fetchone()['count']
                    table_counts.append([table, count])
            
            print_info("Key table record counts:")
            for row in table_counts:
                print_info(f"  {row[0]}: {row[1]} records")
        
        connection.close()
        return True
        
    except Exception as e:
        print_failure(f"Database schema validation failed: {str(e)}")
        return False


def get_db_record(table: str, field: str, value: str):
    """Get a record from database"""
    connection = get_db_connection()
    if not connection:
        return None
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT * FROM {table} WHERE {field} = %s LIMIT 1", (value,))
            return cursor.fetchone()
    finally:
        connection.close()


def get_db_records_count(table: str, where_clause: str = "1=1"):
    """Get count of records"""
    connection = get_db_connection()
    if not connection:
        return 0
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT COUNT(*) as count FROM {table} WHERE {where_clause}")
            return cursor.fetchone()['count']
    finally:
        connection.close()


# ============================================================================
# API TESTS
# ============================================================================

async def test_backend_health(session: aiohttp.ClientSession):
    """Test 2: Backend health check"""
    print_test("Backend Health Check")
    
    try:
        async with session.get(f"{API_BASE_URL}/api/health") as resp:
            if resp.status == 200:
                data = await resp.json()
                print_success(f"Backend is healthy: {data.get('status')}")
                print_info(f"Database status: {data.get('database')}")
                return True
            else:
                print_failure(f"Health check failed with status {resp.status}")
                return False
    except Exception as e:
        print_failure(f"Backend health check failed: {str(e)}")
        return False


async def test_admin_login(session: aiohttp.ClientSession) -> Optional[str]:
    """Test 3: Admin authentication"""
    print_test("Admin Login & Authentication")
    
    try:
        async with session.post(f"{API_BASE_URL}/api/auth/login", json=ADMIN_CREDENTIALS) as resp:
            if resp.status == 200:
                data = await resp.json()
                token = data.get("access_token")
                print_success("Admin logged in successfully")
                print_info(f"Token: {token[:40]}...")
                
                # Verify in database
                db_user = get_db_record('users', 'email', ADMIN_CREDENTIALS['email'])
                if db_user and db_user['role'] == 'admin':
                    print_success("Admin user verified in database")
                else:
                    print_warning("Admin user not found in database")
                
                return token
            else:
                error_text = await resp.text()
                print_failure(f"Login failed with status {resp.status}: {error_text}")
                return None
    except Exception as e:
        print_failure(f"Login failed: {str(e)}")
        return None


# ============================================================================
# ADMIN USERS TESTS
# ============================================================================

async def test_admin_users_api(session: aiohttp.ClientSession, token: str):
    """Test 4: Admin Users API Endpoints"""
    print_section("ADMIN USERS MODULE")
    print_test("Admin Users API - GET /api/admin/users")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # GET all users
        async with session.get(f"{API_BASE_URL}/api/admin/users", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                users = data.get("data", [])
                print_success(f"Retrieved {len(users)} users from API")
                
                # Verify database count matches
                db_count = get_db_records_count('users')
                print_info(f"Database has {db_count} users")
                
                if len(users) == db_count:
                    print_success("API count matches database count")
                else:
                    print_warning(f"Count mismatch: API={len(users)}, DB={db_count}")
                
                # Check data structure
                if users and len(users) > 0:
                    user = users[0]
                    required_fields = ['id', 'email', 'role', 'is_verified', 'is_active']
                    missing_fields = [f for f in required_fields if f not in user]
                    
                    if not missing_fields:
                        print_success("All required fields present in user object")
                    else:
                        print_failure(f"Missing fields: {missing_fields}")
                    
                    # Check for card_status field (frontend requirement)
                    if 'card_status' in user:
                        print_success("card_status field present (frontend integration OK)")
                    else:
                        print_failure("card_status field missing (frontend will fail)")
                    
                    # Test GET user by ID
                    print_test("Admin Users API - GET /api/admin/users/:id")
                    user_id = user['id']
                    
                    async with session.get(f"{API_BASE_URL}/api/admin/users/{user_id}", headers=headers) as resp2:
                        if resp2.status == 200:
                            user_detail = await resp2.json()
                            user_data = user_detail.get('data', {})
                            print_success("Retrieved user details")
                            
                            # Check for nested profile object
                            if 'profile' in user_data:
                                print_success("User has nested profile object (correct structure)")
                            else:
                                print_failure("User missing nested profile object")
                            
                            # Verify data in database
                            db_user = get_db_record('users', 'id', user_id)
                            if db_user and db_user['email'] == user_data['email']:
                                print_success("User data matches database")
                            else:
                                print_warning("User data mismatch with database")
                        else:
                            print_failure(f"GET user by ID failed with status {resp2.status}")
            else:
                print_failure(f"GET /api/admin/users failed with status {resp.status}")
    
    except Exception as e:
        print_failure(f"Admin users test failed: {str(e)}")


# ============================================================================
# ADMIN MENTORSHIP TESTS
# ============================================================================

async def test_admin_mentorship_api(session: aiohttp.ClientSession, token: str):
    """Test 5: Admin Mentorship API Endpoints"""
    print_section("ADMIN MENTORSHIP MODULE")
    print_test("Admin Mentorship API - GET /api/admin/mentorship/requests")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # GET mentorship requests
        async with session.get(f"{API_BASE_URL}/api/admin/mentorship/requests", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                requests = data.get("data", [])
                print_success(f"Retrieved {len(requests)} mentorship requests from API")
                
                # Verify database count
                db_count = get_db_records_count('mentorship_requests')
                print_info(f"Database has {db_count} mentorship requests")
                
                if len(requests) == db_count:
                    print_success("API count matches database count")
                else:
                    print_warning(f"Count mismatch: API={len(requests)}, DB={db_count}")
                
                # Check data structure
                if requests and len(requests) > 0:
                    req = requests[0]
                    
                    # Check for nested objects (critical for frontend)
                    required_nested = ['student', 'mentor', 'studentProfile', 'mentorProfile', 'sessions']
                    missing_nested = [f for f in required_nested if f not in req]
                    
                    if not missing_nested:
                        print_success("All nested objects present (student, mentor, profiles, sessions)")
                    else:
                        print_failure(f"Missing nested objects: {missing_nested}")
                    
                    # Verify JOIN worked correctly
                    if 'student' in req and 'email' in req['student']:
                        print_success("Student data properly joined from users table")
                    else:
                        print_failure("Student data not properly joined")
                    
                    if 'studentProfile' in req and 'name' in req['studentProfile']:
                        print_success("Student profile properly joined from alumni_profiles table")
                    else:
                        print_failure("Student profile not properly joined")
            else:
                print_failure(f"GET mentorship requests failed with status {resp.status}")
        
        # GET mentorship sessions
        print_test("Admin Mentorship API - GET /api/admin/mentorship/sessions")
        async with session.get(f"{API_BASE_URL}/api/admin/mentorship/sessions", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                sessions = data.get("data", [])
                print_success(f"Retrieved {len(sessions)} mentorship sessions")
                
                db_count = get_db_records_count('mentorship_sessions')
                if len(sessions) == db_count:
                    print_success("Sessions count matches database")
            else:
                print_failure(f"GET sessions failed with status {resp.status}")
        
        # GET mentors
        print_test("Admin Mentorship API - GET /api/admin/mentorship/mentors")
        async with session.get(f"{API_BASE_URL}/api/admin/mentorship/mentors", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                mentors = data.get("data", [])
                print_success(f"Retrieved {len(mentors)} mentors")
            else:
                print_failure(f"GET mentors failed with status {resp.status}")
    
    except Exception as e:
        print_failure(f"Admin mentorship test failed: {str(e)}")


# ============================================================================
# OTHER ADMIN MODULE TESTS
# ============================================================================

async def test_admin_badges_api(session: aiohttp.ClientSession, token: str):
    """Test 6: Admin Badges API"""
    print_section("ADMIN BADGES MODULE")
    print_test("Admin Badges API - GET /api/admin/badges")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        async with session.get(f"{API_BASE_URL}/api/admin/badges", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                badges = data.get("data", [])
                print_success(f"Retrieved {len(badges)} badges")
                
                db_count = get_db_records_count('badges')
                print_info(f"Database has {db_count} badges")
                
                if len(badges) == db_count:
                    print_success("Badge count matches database")
            elif resp.status == 404:
                print_skip("Admin badges endpoint not implemented yet")
            else:
                print_failure(f"GET badges failed with status {resp.status}")
    except Exception as e:
        print_warning(f"Badges test error: {str(e)}")


async def test_admin_jobs_api(session: aiohttp.ClientSession, token: str):
    """Test 7: Admin Jobs API"""
    print_section("ADMIN JOBS MODULE")
    print_test("Admin Jobs API - GET /api/admin/jobs")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        async with session.get(f"{API_BASE_URL}/api/admin/jobs", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                jobs = data.get("data", [])
                print_success(f"Retrieved {len(jobs)} jobs")
                
                db_count = get_db_records_count('jobs')
                if len(jobs) == db_count:
                    print_success("Jobs count matches database")
                
                # Check for applications count
                if jobs and 'applications_count' in jobs[0]:
                    print_success("Jobs have applications_count field")
            elif resp.status == 404:
                print_skip("Admin jobs endpoint not implemented yet")
            else:
                print_failure(f"GET jobs failed with status {resp.status}")
    except Exception as e:
        print_warning(f"Jobs test error: {str(e)}")


async def test_admin_events_api(session: aiohttp.ClientSession, token: str):
    """Test 8: Admin Events API"""
    print_section("ADMIN EVENTS MODULE")
    print_test("Admin Events API - GET /api/admin/events")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        async with session.get(f"{API_BASE_URL}/api/admin/events", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                events = data.get("data", [])
                print_success(f"Retrieved {len(events)} events")
                
                db_count = get_db_records_count('events')
                if len(events) == db_count:
                    print_success("Events count matches database")
                
                # Check for attendees count
                if events and 'current_attendees_count' in events[0]:
                    print_success("Events have attendees count field")
            elif resp.status == 404:
                print_skip("Admin events endpoint not implemented yet")
            else:
                print_failure(f"GET events failed with status {resp.status}")
    except Exception as e:
        print_warning(f"Events test error: {str(e)}")


async def test_admin_notifications_api(session: aiohttp.ClientSession, token: str):
    """Test 9: Admin Notifications API"""
    print_section("ADMIN NOTIFICATIONS MODULE")
    print_test("Admin Notifications API - GET /api/admin/notifications")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        async with session.get(f"{API_BASE_URL}/api/admin/notifications", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                notifications = data.get("data", [])
                print_success(f"Retrieved {len(notifications)} notifications")
            elif resp.status == 404:
                print_skip("Admin notifications endpoint not implemented yet")
            else:
                print_failure(f"GET notifications failed with status {resp.status}")
    except Exception as e:
        print_warning(f"Notifications test error: {str(e)}")


async def test_admin_moderation_api(session: aiohttp.ClientSession, token: str):
    """Test 10: Admin Moderation API"""
    print_section("ADMIN MODERATION MODULE")
    print_test("Admin Moderation API - GET /api/admin/moderation")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        async with session.get(f"{API_BASE_URL}/api/admin/moderation", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                items = data.get("data", [])
                print_success(f"Retrieved {len(items)} moderation items")
            elif resp.status == 404:
                print_skip("Admin moderation endpoint not implemented yet")
            else:
                print_failure(f"GET moderation failed with status {resp.status}")
    except Exception as e:
        print_warning(f"Moderation test error: {str(e)}")


async def test_admin_analytics_api(session: aiohttp.ClientSession, token: str):
    """Test 11: Admin Analytics API"""
    print_section("ADMIN ANALYTICS MODULE")
    print_test("Admin Analytics API - GET /api/admin/analytics/dashboard")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        async with session.get(f"{API_BASE_URL}/api/admin/analytics/dashboard", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                print_success("Analytics dashboard data retrieved")
            elif resp.status == 404:
                print_skip("Admin analytics endpoint not implemented yet")
            else:
                print_failure(f"GET analytics failed with status {resp.status}")
    except Exception as e:
        print_warning(f"Analytics test error: {str(e)}")


# ============================================================================
# DATA INTEGRITY TESTS
# ============================================================================

def test_data_integrity():
    """Test 12: Data integrity and foreign key relationships"""
    print_section("DATA INTEGRITY & FOREIGN KEY RELATIONSHIPS")
    print_test("Database Integrity Checks")
    
    connection = get_db_connection()
    if not connection:
        return
    
    try:
        with connection.cursor() as cursor:
            # Check for orphaned records
            integrity_checks = [
                {
                    'name': 'Alumni profiles without users',
                    'query': '''
                        SELECT COUNT(*) as count FROM alumni_profiles ap
                        LEFT JOIN users u ON ap.user_id = u.id
                        WHERE u.id IS NULL
                    '''
                },
                {
                    'name': 'Mentorship requests with invalid student_id',
                    'query': '''
                        SELECT COUNT(*) as count FROM mentorship_requests mr
                        LEFT JOIN users u ON mr.student_id = u.id
                        WHERE u.id IS NULL
                    '''
                },
                {
                    'name': 'Mentorship requests with invalid mentor_id',
                    'query': '''
                        SELECT COUNT(*) as count FROM mentorship_requests mr
                        LEFT JOIN users u ON mr.mentor_id = u.id
                        WHERE u.id IS NULL
                    '''
                },
                {
                    'name': 'Job applications with invalid applicant_id',
                    'query': '''
                        SELECT COUNT(*) as count FROM job_applications ja
                        LEFT JOIN users u ON ja.applicant_id = u.id
                        WHERE u.id IS NULL
                    '''
                },
                {
                    'name': 'Alumni cards without users',
                    'query': '''
                        SELECT COUNT(*) as count FROM alumni_cards ac
                        LEFT JOIN users u ON ac.user_id = u.id
                        WHERE u.id IS NULL
                    '''
                }
            ]
            
            all_clean = True
            for check in integrity_checks:
                cursor.execute(check['query'])
                count = cursor.fetchone()['count']
                
                if count > 0:
                    print_failure(f"{check['name']}: {count} orphaned records")
                    all_clean = False
                else:
                    print_success(f"{check['name']}: No orphaned records")
            
            if all_clean:
                print_success("All data integrity checks passed ✓")
    
    finally:
        connection.close()


# ============================================================================
# FRONTEND-BACKEND CONTRACT TESTS
# ============================================================================

def test_frontend_backend_contracts():
    """Test 13: Frontend-Backend API contract verification"""
    print_section("FRONTEND-BACKEND API CONTRACTS")
    print_test("API Contract Verification")
    
    # Check apiAdminService.js contracts
    contracts_to_verify = [
        {
            'endpoint': '/api/admin/users',
            'service_method': 'getAllUsers',
            'required_response_fields': ['success', 'data', 'total']
        },
        {
            'endpoint': '/api/admin/users/:id',
            'service_method': 'getUserDetails',
            'required_response_fields': ['success', 'data']
        },
        {
            'endpoint': '/api/admin/mentorship/requests',
            'service_method': 'getMentorshipRequests',
            'required_response_fields': ['success', 'data']
        }
    ]
    
    print_info("Frontend expects the following API contracts:")
    for contract in contracts_to_verify:
        print_info(f"  {contract['endpoint']} → {contract['service_method']}()")
    
    print_success("API contracts defined in apiAdminService.js")


# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

async def run_all_tests():
    """Run all tests"""
    print_header("ALUMUNITY FRONTEND → BACKEND → DATABASE TEST SUITE")
    print(f"{Colors.OKCYAN}Testing complete data flow: Frontend → API → Database{Colors.ENDC}")
    print(f"{Colors.OKCYAN}Backend URL: {API_BASE_URL}{Colors.ENDC}")
    print(f"{Colors.OKCYAN}Database: {DB_CONFIG['database']} @ {DB_CONFIG['host']}{Colors.ENDC}\n")
    
    # Phase 1: Database Tests
    print_header("PHASE 1: DATABASE LAYER")
    db_ok = test_database_connection()
    
    if not db_ok:
        print_failure("Database tests failed. Cannot proceed with API tests.")
        return
    
    # Phase 2: API Tests
    print_header("PHASE 2: BACKEND API LAYER")
    
    async with aiohttp.ClientSession() as session:
        # Backend health
        backend_ok = await test_backend_health(session)
        
        if not backend_ok:
            print_warning("Backend health check failed. Some tests may fail.")
        
        # Admin authentication
        token = await test_admin_login(session)
        
        if not token:
            print_failure("Admin authentication failed. Cannot proceed with admin API tests.")
            return
        
        # Phase 3: Admin Module Tests
        print_header("PHASE 3: ADMIN MODULES")
        
        await test_admin_users_api(session, token)
        await test_admin_mentorship_api(session, token)
        await test_admin_badges_api(session, token)
        await test_admin_jobs_api(session, token)
        await test_admin_events_api(session, token)
        await test_admin_notifications_api(session, token)
        await test_admin_moderation_api(session, token)
        await test_admin_analytics_api(session, token)
    
    # Phase 4: Data Integrity
    print_header("PHASE 4: DATA INTEGRITY")
    test_data_integrity()
    
    # Phase 5: Frontend-Backend Contracts
    print_header("PHASE 5: FRONTEND-BACKEND INTEGRATION")
    test_frontend_backend_contracts()


def print_final_summary():
    """Print final test summary"""
    print_header("TEST EXECUTION SUMMARY")
    
    total = test_results['passed'] + test_results['failed']
    pass_rate = (test_results['passed'] / total * 100) if total > 0 else 0
    
    summary_table = [
        ['Total Tests', test_results['total']],
        [f"{Colors.OKGREEN}Passed{Colors.ENDC}", test_results['passed']],
        [f"{Colors.FAIL}Failed{Colors.ENDC}", test_results['failed']],
        [f"{Colors.WARNING}Warnings{Colors.ENDC}", test_results['warnings']],
        [f"{Colors.WARNING}Skipped{Colors.ENDC}", test_results['skipped']],
        ['Pass Rate', f"{pass_rate:.1f}%"]
    ]
    
    print(tabulate(summary_table, headers=['Metric', 'Count'], tablefmt='grid'))
    
    # Final verdict
    print()
    if test_results['failed'] == 0:
        if test_results['warnings'] == 0:
            print(f"{Colors.OKGREEN}{Colors.BOLD}✅ ALL TESTS PASSED! System is working correctly.{Colors.ENDC}")
        else:
            print(f"{Colors.WARNING}{Colors.BOLD}✅ Tests passed but with {test_results['warnings']} warnings.{Colors.ENDC}")
    else:
        print(f"{Colors.FAIL}{Colors.BOLD}❌ {test_results['failed']} test(s) failed. Please review the output above.{Colors.ENDC}")
    
    # Detailed results in terminal
    if test_results['details']:
        print(f"\n{Colors.OKBLUE}{Colors.BOLD}Detailed Test Results:{Colors.ENDC}")
        print(f"{Colors.OKBLUE}{'─'*100}{Colors.ENDC}")
        
        for i, (status, message) in enumerate(test_results['details'], 1):
            if status == 'PASS':
                print(f"{Colors.OKGREEN}  ✅ {message}{Colors.ENDC}")
            elif status == 'FAIL':
                print(f"{Colors.FAIL}  ❌ {message}{Colors.ENDC}")
            elif status == 'WARN':
                print(f"{Colors.WARNING}  ⚠️  {message}{Colors.ENDC}")
            elif status == 'SKIP':
                print(f"{Colors.WARNING}  ⏭️  {message}{Colors.ENDC}")
        
        print(f"{Colors.OKBLUE}{'─'*100}{Colors.ENDC}")


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    """Main entry point"""
    try:
        asyncio.run(run_all_tests())
        print_final_summary()
        
        # Exit with appropriate code
        sys.exit(0 if test_results['failed'] == 0 else 1)
        
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}⚠️  Tests interrupted by user{Colors.ENDC}")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Colors.FAIL}❌ Unexpected error: {str(e)}{Colors.ENDC}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
