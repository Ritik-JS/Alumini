"""
Talent & Opportunity Heatmap Routes
Provides endpoints for geographic talent and job analytics
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from middleware.auth_middleware import get_current_user, require_role
from database.connection import get_db_pool
from services.heatmap_service import HeatmapService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/heatmap", tags=["Heatmap"])

heatmap_service = HeatmapService()


@router.get("/geographic")
async def get_geographic_data(
    min_alumni_count: int = Query(1, ge=1),
    min_jobs_count: int = Query(1, ge=1),
    current_user: dict = Depends(get_current_user)
):
    """
    Get combined geographic data (wrapper for /combined endpoint)
    Shows both alumni distribution and job availability
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            talent_data = await heatmap_service.get_talent_distribution(
                conn,
                min_alumni_count=min_alumni_count
            )
            
            opportunity_data = await heatmap_service.get_opportunity_heatmap(
                conn,
                min_jobs_count=min_jobs_count
            )
            
            # Combine data
            all_locations = {}
            
            for loc in talent_data:
                # Use location_name field (primary) with fallback to location for backward compatibility
                location_name = loc.get('location_name') or loc.get('location', 'Unknown')
                all_locations[location_name] = {
                    **loc,
                    'type': 'talent'
                }
            
            for loc in opportunity_data:
                # Use location_name field (primary) with fallback to location for backward compatibility
                location_name = loc.get('location_name') or loc.get('location', 'Unknown')
                if location_name in all_locations:
                    # Merge data
                    all_locations[location_name].update({
                        'jobs_available': loc['jobs_available'],
                        'competition_ratio': loc['competition_ratio'],
                        'opportunity_score': loc['opportunity_score'],
                        'type': 'both'
                    })
                else:
                    all_locations[location_name] = {
                        **loc,
                        'type': 'opportunity'
                    }
            
            combined_data = list(all_locations.values())
            
            return {
                "success": True,
                "data": combined_data,
                "total_locations": len(combined_data)
            }
    
    except Exception as e:
        logger.error(f"Error getting geographic data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch geographic data: {str(e)}"
        )


@router.get("/alumni-distribution")
async def get_alumni_distribution(
    min_alumni_count: int = Query(1, ge=1),
    current_user: dict = Depends(get_current_user)
):
    """
    Get alumni distribution by location (wrapper for /talent endpoint)
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            talent_data = await heatmap_service.get_talent_distribution(
                conn,
                min_alumni_count=min_alumni_count
            )
            
            return {
                "success": True,
                "data": talent_data,
                "total_locations": len(talent_data),
                "total_alumni": sum(loc['alumni_count'] for loc in talent_data)
            }
    
    except Exception as e:
        logger.error(f"Error getting alumni distribution: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch alumni distribution: {str(e)}"
        )


@router.get("/job-distribution")
async def get_job_distribution(
    min_jobs_count: int = Query(1, ge=1),
    current_user: dict = Depends(get_current_user)
):
    """
    Get job distribution by location (wrapper for /opportunities endpoint)
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            opportunity_data = await heatmap_service.get_opportunity_heatmap(
                conn,
                min_jobs_count=min_jobs_count
            )
            
            return {
                "success": True,
                "data": opportunity_data,
                "total_locations": len(opportunity_data),
                "total_jobs": sum(loc['jobs_available'] for loc in opportunity_data)
            }
    
    except Exception as e:
        logger.error(f"Error getting job distribution: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch job distribution: {str(e)}"
        )


@router.get("/talent")
async def get_talent_heatmap(
    min_alumni_count: int = Query(1, ge=1, description="Minimum alumni count to include location"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get talent distribution heatmap
    Shows where alumni are located globally with coordinates for map visualization
    
    Returns:
        - Location coordinates (latitude, longitude)
        - Alumni count per location
        - Top skills in each location
        - Top companies where alumni work
        - Density scores
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            talent_data = await heatmap_service.get_talent_distribution(
                conn,
                min_alumni_count=min_alumni_count
            )
            
            return {
                "success": True,
                "data": {
                    "locations": talent_data,
                    "total_locations": len(talent_data),
                    "total_alumni": sum(loc['alumni_count'] for loc in talent_data)
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting talent heatmap: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch talent heatmap: {str(e)}"
        )


@router.get("/opportunities")
async def get_opportunity_heatmap(
    min_jobs_count: int = Query(1, ge=1, description="Minimum jobs count to include location"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get job opportunities heatmap
    Shows where most jobs are available with demand insights
    
    Returns:
        - Location coordinates
        - Job counts per location
        - In-demand skills
        - Hiring industries
        - Competition ratios (alumni vs jobs)
        - Opportunity scores
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            opportunity_data = await heatmap_service.get_opportunity_heatmap(
                conn,
                min_jobs_count=min_jobs_count
            )
            
            return {
                "success": True,
                "data": {
                    "locations": opportunity_data,
                    "total_locations": len(opportunity_data),
                    "total_jobs": sum(loc['jobs_available'] for loc in opportunity_data)
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting opportunity heatmap: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch opportunity heatmap: {str(e)}"
        )


@router.get("/industries")
async def get_industry_distribution(
    current_user: dict = Depends(get_current_user)
):
    """
    Get industry distribution across locations
    Shows which industries dominate in each geographic area
    
    Returns:
        - Industries by location
        - Top industries globally
        - Alumni count per industry/location combination
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            industry_data = await heatmap_service.get_industry_distribution(conn)
            
            return {
                "success": True,
                "data": industry_data
            }
    
    except Exception as e:
        logger.error(f"Error getting industry distribution: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch industry distribution: {str(e)}"
        )


@router.get("/combined")
async def get_combined_heatmap(
    min_alumni_count: int = Query(1, ge=1),
    min_jobs_count: int = Query(1, ge=1),
    current_user: dict = Depends(get_current_user)
):
    """
    Get combined talent and opportunity heatmap
    Shows both alumni distribution and job availability on same map
    
    Useful for identifying:
        - Hot zones (high talent + high opportunities)
        - Talent pools (high alumni, fewer jobs)
        - Opportunity zones (more jobs, fewer alumni)
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            talent_data = await heatmap_service.get_talent_distribution(
                conn,
                min_alumni_count=min_alumni_count
            )
            
            opportunity_data = await heatmap_service.get_opportunity_heatmap(
                conn,
                min_jobs_count=min_jobs_count
            )
            
            # Combine data
            all_locations = {}
            
            for loc in talent_data:
                # Use location_name field (primary) with fallback to location for backward compatibility
                location_name = loc.get('location_name') or loc.get('location', 'Unknown')
                all_locations[location_name] = {
                    **loc,
                    'type': 'talent'
                }
            
            for loc in opportunity_data:
                # Use location_name field (primary) with fallback to location for backward compatibility
                location_name = loc.get('location_name') or loc.get('location', 'Unknown')
                if location_name in all_locations:
                    # Merge data
                    all_locations[location_name].update({
                        'jobs_available': loc['jobs_available'],
                        'competition_ratio': loc['competition_ratio'],
                        'opportunity_score': loc['opportunity_score'],
                        'type': 'both'
                    })
                else:
                    all_locations[location_name] = {
                        **loc,
                        'type': 'opportunity'
                    }
            
            combined_data = list(all_locations.values())
            
            return {
                "success": True,
                "data": {
                    "locations": combined_data,
                    "total_locations": len(combined_data),
                    "statistics": {
                        "total_alumni": sum(loc.get('alumni_count', 0) for loc in combined_data),
                        "total_jobs": sum(loc.get('jobs_available', 0) for loc in combined_data),
                        "talent_only_locations": len([l for l in combined_data if l['type'] == 'talent']),
                        "opportunity_only_locations": len([l for l in combined_data if l['type'] == 'opportunity']),
                        "both_locations": len([l for l in combined_data if l['type'] == 'both'])
                    }
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting combined heatmap: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch combined heatmap: {str(e)}"
        )


@router.post("/refresh")
async def refresh_geographic_data(
    current_user: dict = Depends(require_role(['admin']))
):
    """
    Refresh geographic data from current database
    Admin only - Updates heatmap data from latest alumni profiles and jobs
    
    Should be run periodically to keep heatmap data current
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            result = await heatmap_service.refresh_geographic_data(conn)
            
            return {
                "success": True,
                "message": "Geographic data refreshed successfully",
                "data": result
            }
    
    except Exception as e:
        logger.error(f"Error refreshing geographic data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh geographic data: {str(e)}"
        )


@router.get("/location/{location_identifier}")
async def get_location_details(
    location_identifier: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific location
    Shows full breakdown of talent, jobs, skills, companies, and industries
    Accepts both location name and location ID
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Try to find by location_name or by matching partial identifier
                await cursor.execute("""
                    SELECT 
                        location_name, country, city, latitude, longitude,
                        alumni_count, jobs_count, top_skills, top_companies,
                        top_industries, last_updated
                    FROM geographic_data
                    WHERE location_name = %s 
                       OR LOWER(location_name) LIKE LOWER(%s)
                       OR LOWER(city) = LOWER(%s)
                       OR LOWER(country) = LOWER(%s)
                    LIMIT 1
                """, (location_identifier, f"%{location_identifier}%", location_identifier, location_identifier))
                location = await cursor.fetchone()
            
            if not location:
                raise HTTPException(
                    status_code=404,
                    detail=f"Location '{location_identifier}' not found in heatmap data"
                )
            
            import json
            
            top_skills = json.loads(location[7]) if location[7] else []
            top_companies = json.loads(location[8]) if location[8] else []
            top_industries = json.loads(location[9]) if location[9] else []
            
            return {
                "success": True,
                "data": {
                    "location": location[0],
                    "country": location[1],
                    "city": location[2],
                    "coordinates": {
                        "latitude": float(location[3]) if location[3] else None,
                        "longitude": float(location[4]) if location[4] else None
                    },
                    "alumni_count": location[5],
                    "jobs_count": location[6],
                    "top_skills": top_skills,
                    "top_companies": top_companies,
                    "top_industries": top_industries,
                    "competition_ratio": round(location[5] / location[6], 2) if location[6] > 0 else 0,
                    "last_updated": location[10].isoformat() if location[10] else None
                }
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting location details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch location details: {str(e)}"
        )


# ============================================================================
# PHASE 10.5: TALENT CLUSTERING ENDPOINTS
# ============================================================================

@router.post("/clusters/generate")
async def generate_talent_clusters(
    eps_km: float = Query(50.0, ge=1.0, le=500.0, description="Maximum distance (km) between points in same cluster"),
    min_samples: int = Query(5, ge=2, le=50, description="Minimum alumni to form a cluster"),
    current_user: dict = Depends(require_role(['admin']))
):
    """
    Generate talent clusters using DBSCAN algorithm
    Admin only - Analyzes alumni geographic distribution and creates clusters
    
    Args:
        eps_km: Maximum distance (in km) between alumni to be in same cluster
        min_samples: Minimum number of alumni required to form a cluster
        
    Returns:
        Clustering results with cluster statistics
        
    Note: This operation may take time for large datasets.
    Existing clusters will be replaced with new analysis.
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Clear existing clusters
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM talent_clusters")
                await conn.commit()
            
            # Generate new clusters
            result = await heatmap_service.cluster_alumni_by_location(
                conn,
                eps_km=eps_km,
                min_samples=min_samples
            )
            
            return {
                "success": True,
                "message": "Talent clustering completed successfully",
                "data": result
            }
    
    except Exception as e:
        logger.error(f"Error generating talent clusters: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate talent clusters: {str(e)}"
        )


@router.get("/clusters")
async def get_talent_clusters(
    min_cluster_size: int = Query(1, ge=1, description="Minimum alumni count in cluster"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all talent clusters
    Returns geographic clusters of alumni with statistics
    
    Useful for:
        - Identifying talent concentration areas
        - Finding emerging tech hubs
        - Planning events/meetups in high-density areas
        - Understanding skill distribution by region
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            clusters = await heatmap_service.get_talent_clusters(
                conn,
                min_cluster_size=min_cluster_size
            )
            
            return {
                "success": True,
                "data": {
                    "clusters": clusters,
                    "total_clusters": len(clusters),
                    "total_alumni_clustered": sum(c['alumni_count'] for c in clusters)
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting talent clusters: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch talent clusters: {str(e)}"
        )


@router.get("/clusters/{cluster_id}")
async def get_cluster_details(
    cluster_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific cluster
    Returns cluster statistics and individual alumni profiles in the cluster
    
    Useful for:
        - Viewing all alumni in a geographic area
        - Understanding skill composition of a region
        - Identifying potential connections within a cluster
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            cluster_data = await heatmap_service.get_cluster_details(
                conn,
                cluster_id=cluster_id
            )
            
            return {
                "success": True,
                "data": cluster_data
            }
    
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting cluster details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch cluster details: {str(e)}"
        )


@router.get("/skills")
async def get_all_skills(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all unique skills from geographic data
    Extracts skills from top_skills field across all locations
    
    Useful for:
        - Skill-based filtering on heatmap
        - Understanding global skill distribution
        - Identifying in-demand skills across locations
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Get all unique skills from geographic_data.top_skills
                await cursor.execute("""
                    SELECT DISTINCT skill_name, COUNT(DISTINCT location_name) as location_count
                    FROM (
                        SELECT 
                            location_name,
                            JSON_UNQUOTE(JSON_EXTRACT(top_skills, CONCAT('$[', idx, ']'))) as skill_name
                        FROM geographic_data
                        CROSS JOIN (
                            SELECT 0 AS idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                            UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
                        ) AS indices
                        WHERE top_skills IS NOT NULL 
                        AND JSON_LENGTH(top_skills) > idx
                    ) skills_by_location
                    WHERE skill_name IS NOT NULL
                    GROUP BY skill_name
                    ORDER BY location_count DESC, skill_name ASC
                """)
                results = await cursor.fetchall()
                
                skills = [
                    {
                        "name": row[0],
                        "location_count": row[1]
                    }
                    for row in results
                ]
                
                return {
                    "success": True,
                    "data": skills,
                    "total": len(skills)
                }
    
    except Exception as e:
        logger.error(f"Error getting skills: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch skills: {str(e)}"
        )


@router.get("/emerging-hubs")
async def get_emerging_hubs(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """
    Get emerging tech hubs - locations with fastest growth potential
    Identifies locations with high job opportunities and growing alumni presence
    
    Emerging hubs are identified by:
        - High opportunity score (more jobs than alumni)
        - Growing alumni count
        - Presence of in-demand skills
        - Strong industry diversity
    
    Useful for:
        - Identifying new markets
        - Career relocation planning
        - Understanding emerging tech ecosystems
    """
    try:
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Find locations with high opportunity scores and growth potential
                await cursor.execute("""
                    SELECT 
                        location_name,
                        country,
                        city,
                        latitude,
                        longitude,
                        alumni_count,
                        jobs_count,
                        top_skills,
                        top_companies,
                        top_industries,
                        CASE 
                            WHEN alumni_count > 0 THEN ROUND(jobs_count / alumni_count, 2)
                            ELSE jobs_count
                        END as opportunity_ratio,
                        ROUND((jobs_count * 0.6 + alumni_count * 0.4) / 100, 2) as growth_score
                    FROM geographic_data
                    WHERE jobs_count > 0 
                    AND alumni_count > 0
                    ORDER BY 
                        opportunity_ratio DESC,
                        growth_score DESC,
                        jobs_count DESC
                    LIMIT %s
                """, (limit,))
                results = await cursor.fetchall()
                
                import json
                
                emerging_hubs = [
                    {
                        "location": row[0],
                        "country": row[1],
                        "city": row[2],
                        "coordinates": {
                            "latitude": float(row[3]) if row[3] else None,
                            "longitude": float(row[4]) if row[4] else None
                        },
                        "alumni_count": row[5],
                        "jobs_count": row[6],
                        "top_skills": json.loads(row[7]) if row[7] else [],
                        "top_companies": json.loads(row[8]) if row[8] else [],
                        "top_industries": json.loads(row[9]) if row[9] else [],
                        "opportunity_ratio": float(row[10]),
                        "growth_score": float(row[11]),
                        "is_emerging": True
                    }
                    for row in results
                ]
                
                return {
                    "success": True,
                    "data": emerging_hubs,
                    "total": len(emerging_hubs)
                }
    
    except Exception as e:
        logger.error(f"Error getting emerging hubs: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch emerging hubs: {str(e)}"
        )
