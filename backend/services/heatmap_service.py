"""
Talent & Opportunity Heatmap Service
Provides geographic analytics for alumni distribution and job opportunities
"""
import logging
import json
from typing import Dict, List, Optional
from collections import Counter
import numpy as np
from sklearn.cluster import DBSCAN
from datetime import datetime

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
                    "id": f"loc-{loc[0].lower().replace(' ', '-').replace(',', '')}",
                    "location_name": loc[0],  # Fixed: use location_name not location
                    "country": loc[1],
                    "city": loc[2],
                    "latitude": float(loc[3]) if loc[3] else None,
                    "longitude": float(loc[4]) if loc[4] else None,
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
                    "id": f"loc-{loc[0].lower().replace(' ', '-').replace(',', '')}",
                    "location_name": loc[0],  # Fixed: use location_name not location
                    "location": loc[0],  # Keep for backward compatibility
                    "country": loc[1],
                    "city": loc[2],
                    "latitude": float(loc[3]) if loc[3] else None,
                    "longitude": float(loc[4]) if loc[4] else None,
                    "coordinates": {
                        "latitude": float(loc[3]) if loc[3] else None,
                        "longitude": float(loc[4]) if loc[4] else None
                    },
                    "jobs_available": loc[6],
                    "jobs_count": loc[6],  # Fixed: add jobs_count field
                    "alumni_nearby": loc[5],
                    "alumni_count": loc[5],  # Fixed: add alumni_count field
                    "competition_ratio": round(loc[5] / loc[6], 2) if loc[6] > 0 else 0,
                    "in_demand_skills": top_skills[:10] if top_skills else [],
                    "top_skills": top_skills[:10] if top_skills else [],  # Fixed: add top_skills field
                    "hiring_industries": top_industries[:5] if top_industries else [],
                    "top_industries": top_industries[:5] if top_industries else [],  # Fixed: add top_industries field
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
    
    # ========================================================================
    # PHASE 10.5: TALENT CLUSTERING FUNCTIONALITY
    # ========================================================================
    
    async def cluster_alumni_by_location(
        self,
        db_conn,
        eps_km: float = 50.0,
        min_samples: int = 5
    ) -> Dict:
        """
        Cluster alumni based on geographic proximity using DBSCAN algorithm
        
        Args:
            db_conn: Database connection
            eps_km: Maximum distance (in km) between points in same cluster
            min_samples: Minimum number of alumni to form a cluster
            
        Returns:
            Dictionary with clustering results and statistics
        """
        try:
            # Get all alumni with valid coordinates
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        user_id, location, latitude, longitude,
                        name, current_company, industry, skills
                    FROM alumni_profiles
                    WHERE latitude IS NOT NULL 
                    AND longitude IS NOT NULL
                    AND is_verified = TRUE
                """)
                alumni_data = await cursor.fetchall()
            
            if not alumni_data or len(alumni_data) < min_samples:
                return {
                    "success": False,
                    "message": f"Insufficient data for clustering. Need at least {min_samples} alumni with coordinates.",
                    "alumni_count": len(alumni_data) if alumni_data else 0
                }
            
            # Extract coordinates and metadata
            alumni_list = []
            coords = []
            
            for alum in alumni_data:
                alumni_list.append({
                    'user_id': alum[0],
                    'location': alum[1],
                    'latitude': float(alum[2]),
                    'longitude': float(alum[3]),
                    'name': alum[4],
                    'current_company': alum[5],
                    'industry': alum[6],
                    'skills': self._parse_json(alum[7])
                })
                coords.append([float(alum[2]), float(alum[3])])
            
            coords_array = np.array(coords)
            
            # Convert km to degrees (approximate)
            # 1 degree latitude ≈ 111 km
            eps_degrees = eps_km / 111.0
            
            # Convert coordinates to radians for haversine distance
            coords_rad = np.radians(coords_array)
            
            # Perform DBSCAN clustering
            clustering = DBSCAN(
                eps=eps_degrees,
                min_samples=min_samples,
                metric='haversine'
            )
            
            labels = clustering.fit_predict(coords_rad)
            
            # Process clustering results
            clusters = {}
            noise_points = []
            
            for idx, label in enumerate(labels):
                if label == -1:
                    # Noise point (doesn't belong to any cluster)
                    noise_points.append(alumni_list[idx])
                else:
                    # Add to cluster
                    if label not in clusters:
                        clusters[label] = []
                    clusters[label].append(alumni_list[idx])
            
            # Calculate cluster statistics and store in database
            cluster_records = []
            
            for cluster_id, cluster_alumni in clusters.items():
                # Calculate cluster center
                cluster_coords = [
                    [a['latitude'], a['longitude']] 
                    for a in cluster_alumni
                ]
                center_lat = np.mean([c[0] for c in cluster_coords])
                center_lng = np.mean([c[1] for c in cluster_coords])
                
                # Calculate radius (max distance from center)
                max_distance = 0
                for coord in cluster_coords:
                    distance = self._haversine_distance(
                        center_lat, center_lng,
                        coord[0], coord[1]
                    )
                    max_distance = max(max_distance, distance)
                
                # Aggregate skills and industries
                all_skills = []
                all_industries = []
                companies = []
                
                for alum in cluster_alumni:
                    if alum['skills']:
                        all_skills.extend(alum['skills'])
                    if alum['industry']:
                        all_industries.append(alum['industry'])
                    if alum['current_company']:
                        companies.append(alum['current_company'])
                
                # Get top skills and industries
                top_skills = [s for s, _ in Counter(all_skills).most_common(10)]
                top_industries = [i for i, _ in Counter(all_industries).most_common(5)]
                
                # Calculate density (alumni per sq km)
                cluster_area = np.pi * (max_distance ** 2) if max_distance > 0 else 1
                density = len(cluster_alumni) / cluster_area
                
                # Generate cluster name
                primary_location = cluster_alumni[0]['location']
                cluster_name = f"Cluster {cluster_id + 1}: {primary_location}"
                
                cluster_record = {
                    'cluster_id': cluster_id,
                    'cluster_name': cluster_name,
                    'center_latitude': center_lat,
                    'center_longitude': center_lng,
                    'radius_km': round(max_distance, 2),
                    'alumni_count': len(cluster_alumni),
                    'density': round(density, 2),
                    'dominant_skills': top_skills,
                    'dominant_industries': top_industries,
                    'alumni_ids': [a['user_id'] for a in cluster_alumni]
                }
                
                cluster_records.append(cluster_record)
                
                # Store in database
                await self._store_cluster(db_conn, cluster_record)
            
            await db_conn.commit()
            
            # Return clustering results
            return {
                "success": True,
                "total_alumni": len(alumni_data),
                "clusters_found": len(clusters),
                "noise_points": len(noise_points),
                "clusters": cluster_records,
                "parameters": {
                    "eps_km": eps_km,
                    "min_samples": min_samples
                },
                "message": f"Successfully clustered {len(alumni_data)} alumni into {len(clusters)} clusters"
            }
        
        except Exception as e:
            logger.error(f"Error clustering alumni: {str(e)}")
            raise
    
    async def _store_cluster(self, db_conn, cluster_record: Dict):
        """Store cluster data in talent_clusters table"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    INSERT INTO talent_clusters
                    (cluster_name, center_latitude, center_longitude, radius_km,
                     alumni_ids, dominant_skills, dominant_industries, 
                     cluster_size, cluster_density, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                """, (
                    cluster_record['cluster_name'],
                    cluster_record['center_latitude'],
                    cluster_record['center_longitude'],
                    cluster_record['radius_km'],
                    json.dumps(cluster_record['alumni_ids']),
                    json.dumps(cluster_record['dominant_skills']),
                    json.dumps(cluster_record['dominant_industries']),
                    cluster_record['alumni_count'],
                    cluster_record['density']
                ))
        except Exception as e:
            logger.error(f"Error storing cluster: {str(e)}")
            raise
    
    async def get_talent_clusters(
        self,
        db_conn,
        min_cluster_size: int = 1
    ) -> List[Dict]:
        """
        Get all talent clusters from database
        
        Args:
            db_conn: Database connection
            min_cluster_size: Minimum number of alumni in cluster
            
        Returns:
            List of cluster data with statistics
        """
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, cluster_name, center_latitude, center_longitude,
                        radius_km, alumni_ids, dominant_skills, dominant_industries,
                        cluster_size, cluster_density, created_at, updated_at
                    FROM talent_clusters
                    WHERE cluster_size >= %s
                    ORDER BY cluster_size DESC
                """, (min_cluster_size,))
                
                clusters = await cursor.fetchall()
            
            cluster_data = []
            for cluster in clusters:
                cluster_data.append({
                    "id": cluster[0],  # Fixed: add id field
                    "cluster_id": cluster[0],
                    "cluster_name": cluster[1],
                    "center_latitude": float(cluster[2]),  # Fixed: add flat fields
                    "center_longitude": float(cluster[3]),  # Fixed: add flat fields
                    "center": {
                        "latitude": float(cluster[2]),
                        "longitude": float(cluster[3])
                    },
                    "center_location": {  # Fixed: add center_location for UI
                        "city": cluster[1].split(' ')[0] if cluster[1] else "Unknown",
                        "country": "United States"  # Default, can be enhanced
                    },
                    "radius_km": float(cluster[4]),
                    "alumni_ids": self._parse_json(cluster[5]),
                    "dominant_skills": self._parse_json(cluster[6]),
                    "dominant_industries": self._parse_json(cluster[7]),
                    "alumni_count": cluster[8],
                    "cluster_size": cluster[8],  # Fixed: alias for frontend
                    "density": float(cluster[9]),
                    "cluster_density": float(cluster[9]),  # Fixed: alias for frontend
                    "created_at": cluster[10].isoformat() if cluster[10] else None,
                    "updated_at": cluster[11].isoformat() if cluster[11] else None
                })
            
            return cluster_data
        
        except Exception as e:
            logger.error(f"Error getting talent clusters: {str(e)}")
            raise
    
    async def get_cluster_details(
        self,
        db_conn,
        cluster_id: str
    ) -> Dict:
        """
        Get detailed information about a specific cluster
        
        Args:
            db_conn: Database connection
            cluster_id: Cluster identifier
            
        Returns:
            Detailed cluster information with alumni profiles
        """
        try:
            # Get cluster data
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, cluster_name, center_latitude, center_longitude,
                        radius_km, alumni_ids, dominant_skills, dominant_industries,
                        cluster_size, cluster_density
                    FROM talent_clusters
                    WHERE id = %s
                """, (cluster_id,))
                
                cluster = await cursor.fetchone()
            
            if not cluster:
                raise ValueError(f"Cluster {cluster_id} not found")
            
            alumni_ids = self._parse_json(cluster[5])
            
            # Get alumni profiles in this cluster
            if alumni_ids:
                placeholders = ','.join(['%s'] * len(alumni_ids))
                async with db_conn.cursor() as cursor:
                    await cursor.execute(f"""
                        SELECT 
                            user_id, name, photo_url, current_company, 
                            current_role, location, skills, industry
                        FROM alumni_profiles
                        WHERE user_id IN ({placeholders})
                    """, alumni_ids)
                    
                    alumni_profiles = await cursor.fetchall()
            else:
                alumni_profiles = []
            
            # Format alumni data
            alumni_data = []
            for alum in alumni_profiles:
                alumni_data.append({
                    "user_id": alum[0],
                    "name": alum[1],
                    "photo_url": alum[2],
                    "current_company": alum[3],
                    "current_role": alum[4],
                    "location": alum[5],
                    "skills": self._parse_json(alum[6]),
                    "industry": alum[7]
                })
            
            return {
                "cluster_id": cluster[0],
                "cluster_name": cluster[1],
                "center": {
                    "latitude": float(cluster[2]),
                    "longitude": float(cluster[3])
                },
                "radius_km": float(cluster[4]),
                "dominant_skills": self._parse_json(cluster[6]),
                "dominant_industries": self._parse_json(cluster[7]),
                "alumni_count": cluster[8],
                "density": float(cluster[9]),
                "alumni_profiles": alumni_data
            }
        
        except Exception as e:
            logger.error(f"Error getting cluster details: {str(e)}")
            raise
    
    def _haversine_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculate the great circle distance between two points 
        on the earth (specified in decimal degrees)
        Returns distance in kilometers
        """
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        c = 2 * np.arcsin(np.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r
