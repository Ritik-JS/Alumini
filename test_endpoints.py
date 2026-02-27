#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test script to verify all 'View Details' button endpoints"""
import sys
import io
import requests
import json
from datetime import datetime
import uuid

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:8001"

# Generate valid UUIDs for testing
test_job_id = str(uuid.uuid4())
test_event_id = str(uuid.uuid4())
test_session_id = str(uuid.uuid4())
test_user_id = str(uuid.uuid4())

# Test endpoints that View Details buttons call
test_cases = [
    # Jobs endpoints
    ("GET", "/api/jobs", "Get all jobs"),
    ("GET", f"/api/jobs/{test_job_id}", "Get single job details"),
    
    # Heatmap endpoints
    ("GET", "/api/heatmap/geographic", "Get geographic/heatmap data"),
    ("GET", "/api/heatmap/clusters", "Get talent clusters"),
    ("GET", "/api/heatmap/emerging-hubs", "Get emerging hubs"),
    ("GET", "/api/heatmap/industries", "Get industries"),
    ("GET", "/api/heatmap/skills", "Get skills"),
    
    # Recommendations endpoints
    ("GET", f"/api/recommendations/skills/{test_user_id}", "Get skill recommendations"),
    ("GET", "/api/recommendations/skill-trends/top?limit=10", "Get skill trends"),
    
    # Mentorship/Sessions endpoints
    ("GET", f"/api/mentorship/sessions/{test_session_id}", "Get session details"),
    
    # Events endpoints
    ("GET", f"/api/events/{test_event_id}", "Get event details"),
    
    # Career paths endpoints
    ("GET", "/api/career-paths", "Get career paths"),
    ("GET", "/api/career-paths/roles", "Get career path roles"),
    
    # Engagement endpoints  
    ("GET", "/api/engagement/badges", "Get badges"),
    ("GET", "/api/engagement/leaderboard?role=all", "Get leaderboard"),
    ("GET", f"/api/engagement/insights/{test_user_id}", "Get engagement insights"),
]

def test_endpoint(method, path, description):
    """Test a single endpoint"""
    url = f"{BASE_URL}{path}"
    headers = {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.request(method, url, headers=headers, timeout=5)
        status = response.status_code
        
        # Check if endpoint exists (not 404)
        if status == 404:
            return f"[NOT FOUND] 404 - {description}"
        elif status == 401 or status == 403:
            return f"[AUTH] {status} - {description} (endpoint exists but needs auth)"
        elif 200 <= status < 300:
            return f"[OK] {status} - {description}"
        elif status >= 500:
            return f"[ERROR] {status} - {description}"
        else:
            return f"[WARN] {status} - {description}"
    except requests.exceptions.ConnectionError:
        return f"[CONN ERROR] - {description} (backend not running?)"
    except requests.exceptions.Timeout:
        return f"[TIMEOUT] - {description}"
    except Exception as e:
        return f"[ERROR] - {description}: {str(e)}"

def main():
    print("=" * 80)
    print("Testing 'View Details' Button Endpoints")
    print(f"Backend URL: {BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print()
    
    results = []
    for method, path, description in test_cases:
        result = test_endpoint(method, path, description)
        results.append(result)
        print(result)
    
    print()
    print("=" * 80)
    print("Summary:")
    ok_count = sum(1 for r in results if "✅" in r)
    not_found_count = sum(1 for r in results if "❌ 404" in r)
    error_count = sum(1 for r in results if "❌" in r and "404" not in r)
    auth_count = sum(1 for r in results if "⚠️  " in r and "Auth" in r)
    other_warn = sum(1 for r in results if "⚠️" in r and "Auth" not in r)
    
    print(f"  ✅ Working: {ok_count}")
    print(f"  ❌ Missing (404): {not_found_count}")
    print(f"  ❌ Other Errors: {error_count}")
    print(f"  ⚠️  Auth Issues: {auth_count}")
    print(f"  ⚠️  Other Warnings: {other_warn}")
    print("=" * 80)
    
    if not_found_count > 0:
        print("\n⚠️  MISSING ENDPOINTS DETECTED!")
        print("These View Details buttons will not work:\n")
        for r in results:
            if "❌ 404" in r:
                print(f"  {r}")
    
    return not_found_count == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
