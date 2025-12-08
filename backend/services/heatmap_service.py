"""
Talent & Opportunity Heatmap Service
Provides geographic analytics for alumni distribution and job opportunities
"""
import logging
import json
from typing import Dict, List, Optional
from collections import Counter

logger = logging.getLogger(__name__)


class HeatmapService:
    """Service for talent and opportunity heatmap analytics"""
    
    async def get_talent_distribution(
        self,
        db_conn,
        min_alumni_count: int = 1
    ) -> List[Dict]:
        """
        Get talent distribution by location with coordinates
        Returns geographic data for heatmap visualization
        """
        try:
            # Get data from geographic_data table
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        location_name, country, city, latitude, longitude,
                        alumni_count, jobs_count, top_skills, top_companies, top_industries,
                        last_updated
                    FROM geographic_data
                    WHERE alumni_count >= %s
                    ORDER BY alumni_count DESC
                """, (min_alumni_count,))
                locations = await cursor.fetchall()
            
            talent_data = []
            for loc in locations:
                # Parse JSON fields
                top_skills = self._parse_json(loc[7])
                top_companies = self._parse_json(loc[8])
                top_industries = self._parse_json(loc[9])
                
                talent_data.append({
                    "location": loc[0],
                    "country": loc[1],
                    "city": loc[2],
                    "coordinates": {
                        "latitude": float(loc[3]) if loc[3] else None,
                        "longitude": float(loc[4]) if loc[4] else None
                    },
                    "alumni_count": loc[5],
                    "jobs_count": loc[6],
                    "top_skills": top_skills[:10] if top_skills else [],
                    "top_companies": top_companies[:10] if top_companies else [],
                    "top_industries": top_industries[:5] if top_industries else [],
                    "density_score": self._calculate_density_score(loc[5], loc[6]),
                    "last_updated": loc[10].isoformat() if loc[10] else None
                })
            
            return talent_data
        
        except Exception as e:
            logger.error(f"Error getting talent distribution: {str(e)}")
            raise
    
    async def get_opportunity_heatmap(
        self,
        db_conn,
        min_jobs_count: int = 1
    ) -> List[Dict]:
        """
        Get job opportunities distribution by location
        Shows where most jobs are available
        """
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        location_name, country, city, latitude, longitude,
                        alumni_count, jobs_count, top_skills, top_industries
                    FROM geographic_data
                    WHERE jobs_count >= %s
                    ORDER BY jobs_count DESC
                """, (min_jobs_count,))
                locations = await cursor.fetchall()
            
            opportunity_data = []
            for loc in locations:
                top_skills = self._parse_json(loc[7])
                top_industries = self._parse_json(loc[8])
                
                opportunity_data.append({
                    "location": loc[0],
                    "country": loc[1],
                    "city": loc[2],
                    "coordinates": {
                        "latitude": float(loc[3]) if loc[3] else None,
                        "longitude": float(loc[4]) if loc[4] else None
                    },
                    "jobs_available": loc[6],
                    "alumni_nearby": loc[5],
                    "competition_ratio": round(loc[5] / loc[6], 2) if loc[6] > 0 else 0,
                    "in_demand_skills": top_skills[:10] if top_skills else [],
                    "hiring_industries": top_industries[:5] if top_industries else [],
                    "opportunity_score": self._calculate_opportunity_score(loc[5], loc[6])
                })
            
            return opportunity_data
        
        except Exception as e:
            logger.error(f"Error getting opportunity heatmap: {str(e)}")
            raise
    
    async def get_industry_distribution(
        self,
        db_conn
    ) -> List[Dict]:
        """
        Get industry distribution across locations
        Shows which industries dominate in each location
        """
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        location_name, country, city, latitude, longitude,
                        alumni_count, top_industries
                    FROM geographic_data
                    WHERE top_industries IS NOT NULL
                    ORDER BY alumni_count DESC
                """)
                locations = await cursor.fetchall()
            
            industry_data = []
            all_industries = Counter()
            
            for loc in locations:
                top_industries = self._parse_json(loc[6])
                
                if top_industries:
                    # Count industries globally
                    all_industries.update(top_industries)
                    
                    industry_data.append({
                        "location": loc[0],
                        "country": loc[1],
                        "city": loc[2],
                        "coordinates": {
                            "latitude": float(loc[3]) if loc[3] else None,
                            "longitude": float(loc[4]) if loc[4] else None
                        },
                        "alumni_count": loc[5],
                        "industries": top_industries
                    })
            
            # Get top industries overall
            top_industries_global = [
                {"industry": ind, "count": count}
                for ind, count in all_industries.most_common(20)
            ]
            
            return {
                "by_location": industry_data,
                "top_industries_global": top_industries_global
            }
        
        except Exception as e:
            logger.error(f"Error getting industry distribution: {str(e)}")
            raise
    
    async def refresh_geographic_data(
        self,
        db_conn
    ) -> Dict:
        """
        Refresh geographic data from current alumni profiles and jobs
        Admin function to update heatmap data
        """
        try:
            # Get alumni distribution by location
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        location,
                        COUNT(*) as alumni_count,
                        JSON_ARRAYAGG(skills) as all_skills,
                        JSON_ARRAYAGG(current_company) as companies,
                        JSON_ARRAYAGG(industry) as industries
                    FROM alumni_profiles
                    WHERE location IS NOT NULL AND location != ''
                    GROUP BY location
                """)
                alumni_locations = await cursor.fetchall()
            
            # Get job distribution by location
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        location,
                        COUNT(*) as jobs_count,
                        JSON_ARRAYAGG(skills_required) as required_skills,
                        JSON_ARRAYAGG(company) as companies
                    FROM jobs
                    WHERE location IS NOT NULL 
                    AND location != ''
                    AND status = 'active'
                    GROUP BY location
                """)
                job_locations = await cursor.fetchall()
            
            # Combine data
            location_data = {}
            
            # Process alumni data
            for loc in alumni_locations:
                location = loc[0]
                if location not in location_data:
                    location_data[location] = {
                        'alumni_count': 0,
                        'jobs_count': 0,
                        'skills': [],
                        'companies': [],
                        'industries': []
                    }
                
                location_data[location]['alumni_count'] = loc[1]
                
                # Parse and flatten skills
                if loc[2]:
                    skills = self._flatten_json_array(loc[2])
                    location_data[location]['skills'].extend(skills)
                
                # Parse companies
                if loc[3]:
                    companies = self._parse_json(loc[3])
                    location_data[location]['companies'].extend(
                        [c for c in companies if c]
                    )
                
                # Parse industries
                if loc[4]:
                    industries = self._parse_json(loc[4])
                    location_data[location]['industries'].extend(
                        [i for i in industries if i]
                    )
            
            # Process job data
            for loc in job_locations:
                location = loc[0]
                if location not in location_data:
                    location_data[location] = {
                        'alumni_count': 0,
                        'jobs_count': 0,
                        'skills': [],
                        'companies': [],
                        'industries': []
                    }
                
                location_data[location]['jobs_count'] = loc[1]
                
                # Parse required skills
                if loc[2]:
                    skills = self._flatten_json_array(loc[2])
                    location_data[location]['skills'].extend(skills)
                
                # Parse companies
                if loc[3]:
                    companies = self._parse_json(loc[3])
                    location_data[location]['companies'].extend(
                        [c for c in companies if c]
                    )
            
            # Update database
            updated_count = 0
            for location, data in location_data.items():
                # Get top items
                top_skills = Counter(data['skills']).most_common(20)
                top_companies = Counter(data['companies']).most_common(20)
                top_industries = Counter(data['industries']).most_common(10)
                
                # Extract location parts (city, country)
                city, country = self._parse_location_string(location)
                
                # Get coordinates (placeholder - would need geocoding API in production)
                lat, lon = await self._get_coordinates(location)
                
                # Insert or update
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        INSERT INTO geographic_data
                        (location_name, country, city, latitude, longitude,
                         alumni_count, jobs_count, top_skills, top_companies, top_industries, last_updated)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                        ON DUPLICATE KEY UPDATE
                            alumni_count = VALUES(alumni_count),
                            jobs_count = VALUES(jobs_count),
                            top_skills = VALUES(top_skills),
                            top_companies = VALUES(top_companies),
                            top_industries = VALUES(top_industries),
                            last_updated = NOW()
                    """, (
                        location,
                        country,
                        city,
                        lat,
                        lon,
                        data['alumni_count'],
                        data['jobs_count'],
                        json.dumps([s for s, _ in top_skills]),
                        json.dumps([c for c, _ in top_companies]),
                        json.dumps([i for i, _ in top_industries])
                    ))
                
                updated_count += 1
            
            await db_conn.commit()
            
            return {
                "locations_updated": updated_count,
                "total_alumni_locations": len([l for l in location_data.values() if l['alumni_count'] > 0]),
                "total_job_locations": len([l for l in location_data.values() if l['jobs_count'] > 0]),
                "message": "Geographic data refreshed successfully"
            }
        
        except Exception as e:
            logger.error(f"Error refreshing geographic data: {str(e)}")
            raise
    
    def _parse_json(self, json_data):
        """Safely parse JSON data"""
        if not json_data:
            return []
        try:
            if isinstance(json_data, str):
                return json.loads(json_data)
            return json_data if isinstance(json_data, list) else []
        except (json.JSONDecodeError, TypeError):
            return []
    
    def _flatten_json_array(self, json_array_str):
        """Flatten nested JSON arrays (for skills)"""
        try:
            data = json.loads(json_array_str) if isinstance(json_array_str, str) else json_array_str
            flattened = []
            for item in data:
                if isinstance(item, list):
                    flattened.extend(item)
                elif isinstance(item, str):
                    try:
                        nested = json.loads(item)
                        if isinstance(nested, list):
                            flattened.extend(nested)
                    except:
                        pass
            return flattened
        except:
            return []
    
    def _calculate_density_score(self, alumni_count: int, jobs_count: int) -> float:
        """
        Calculate talent density score (0-100)
        Higher score means more talent concentration
        """
        if alumni_count == 0:
            return 0.0
        
        # Base score from alumni count
        score = min(alumni_count / 100 * 50, 50)
        
        # Bonus from job availability
        if jobs_count > 0:
            job_score = min(jobs_count / 50 * 50, 50)
            score += job_score
        
        return round(score, 2)
    
    def _calculate_opportunity_score(self, alumni_count: int, jobs_count: int) -> float:
        """
        Calculate opportunity score (0-100)
        Higher score means better job opportunities
        """
        if jobs_count == 0:
            return 0.0
        
        # Base score from jobs
        score = min(jobs_count / 50 * 60, 60)
        
        # Adjust for competition (lower competition = higher score)
        if alumni_count > 0:
            competition_ratio = alumni_count / jobs_count
            if competition_ratio < 1:
                score += 40  # Low competition
            elif competition_ratio < 3:
                score += 25  # Medium competition
            else:
                score += 10  # High competition
        else:
            score += 40  # No competition
        
        return round(score, 2)
    
    def _parse_location_string(self, location: str) -> tuple:
        """
        Parse location string into city and country
        Handles formats like "City, Country" or "City, State, Country"
        """
        parts = [p.strip() for p in location.split(',')]
        
        if len(parts) >= 2:
            city = parts[0]
            country = parts[-1]
        else:
            city = location
            country = None
        
        return city, country
    
    async def _get_coordinates(self, location: str) -> tuple:
        """
        Get latitude and longitude for location
        Placeholder - should use geocoding API in production
        """
        # TODO: Integrate with geocoding API (Google Maps, Mapbox, etc.)
        # For now, return None
        return None, None
