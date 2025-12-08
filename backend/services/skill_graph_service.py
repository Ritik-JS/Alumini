"""
Skill Graph Service - Manage skill relationships and analytics
Auto-populates from alumni profiles and job postings
"""
import logging
import json
from typing import Dict, List, Optional, Set
from collections import Counter

logger = logging.getLogger(__name__)


class SkillGraphService:
    """Service for skill graph network and analytics"""
    
    async def build_skill_graph(self, db_conn) -> Dict:
        """
        Build skill graph from alumni profiles and job postings
        Updates skill_graph table with relationships
        """
        try:
            # Extract all skills from alumni profiles
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT skills FROM alumni_profiles
                    WHERE skills IS NOT NULL AND skills != 'null'
                """)
                profile_skills = await cursor.fetchall()
            
            # Extract all skills from job postings
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT skills_required FROM jobs
                    WHERE skills_required IS NOT NULL 
                    AND skills_required != 'null'
                    AND status = 'active'
                """)
                job_skills = await cursor.fetchall()
            
            # Parse skills and build co-occurrence matrix
            all_skills = set()
            skill_pairs = []
            
            # Process alumni profiles
            for (skills_json,) in profile_skills:
                if skills_json:
                    try:
                        skills = json.loads(skills_json) if isinstance(skills_json, str) else skills_json
                        if isinstance(skills, list):
                            skills = [s.strip() for s in skills if s and s.strip()]
                            all_skills.update(skills)
                            # Create pairs for co-occurrence
                            for i, skill1 in enumerate(skills):
                                for skill2 in skills[i+1:]:
                                    skill_pairs.append((skill1, skill2))
                    except (json.JSONDecodeError, TypeError):
                        continue
            
            # Process job postings
            for (skills_json,) in job_skills:
                if skills_json:
                    try:
                        skills = json.loads(skills_json) if isinstance(skills_json, str) else skills_json
                        if isinstance(skills, list):
                            skills = [s.strip() for s in skills if s and s.strip()]
                            all_skills.update(skills)
                            for i, skill1 in enumerate(skills):
                                for skill2 in skills[i+1:]:
                                    skill_pairs.append((skill1, skill2))
                    except (json.JSONDecodeError, TypeError):
                        continue
            
            # Count co-occurrences
            pair_counts = Counter(skill_pairs)
            
            # Build skill relationships
            skill_relations = {}
            for skill in all_skills:
                related = {}
                for (s1, s2), count in pair_counts.items():
                    if s1 == skill:
                        related[s2] = count
                    elif s2 == skill:
                        related[s1] = count
                
                # Sort by frequency and take top 10
                top_related = sorted(related.items(), key=lambda x: x[1], reverse=True)[:10]
                skill_relations[skill] = [s for s, _ in top_related]
            
            # Update skill_graph table
            for skill, related_skills in skill_relations.items():
                # Count alumni with this skill
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT COUNT(*) FROM alumni_profiles
                        WHERE JSON_CONTAINS(skills, %s)
                    """, (json.dumps(skill),))
                    result = await cursor.fetchone()
                    alumni_count = result[0] if result else 0
                
                # Count jobs requiring this skill
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT COUNT(*) FROM jobs
                        WHERE JSON_CONTAINS(skills_required, %s)
                        AND status = 'active'
                    """, (json.dumps(skill),))
                    result = await cursor.fetchone()
                    job_count = result[0] if result else 0
                
                # Calculate popularity score (normalized)
                popularity = (alumni_count * 0.6 + job_count * 0.4) / 10.0
                popularity = min(popularity, 100.0)  # Cap at 100
                
                # Insert or update skill in graph
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        INSERT INTO skill_graph 
                        (skill_name, related_skills, alumni_count, job_count, popularity_score)
                        VALUES (%s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            related_skills = VALUES(related_skills),
                            alumni_count = VALUES(alumni_count),
                            job_count = VALUES(job_count),
                            popularity_score = VALUES(popularity_score),
                            updated_at = NOW()
                    """, (
                        skill,
                        json.dumps(related_skills),
                        alumni_count,
                        job_count,
                        popularity
                    ))
                
                await db_conn.commit()
            
            return {
                "total_skills": len(all_skills),
                "relationships_mapped": len(skill_relations),
                "message": "Skill graph built successfully"
            }
        
        except Exception as e:
            logger.error(f"Error building skill graph: {str(e)}")
            raise
    
    async def get_skill_network(
        self,
        db_conn,
        min_popularity: float = 0.0,
        limit: int = 100
    ) -> Dict:
        """
        Get skill network data for visualization
        Returns nodes and edges for graph visualization
        """
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, skill_name, related_skills, industry_connections,
                        alumni_count, job_count, popularity_score
                    FROM skill_graph
                    WHERE popularity_score >= %s
                    ORDER BY popularity_score DESC
                    LIMIT %s
                """, (min_popularity, limit))
                skills = await cursor.fetchall()
            
            nodes = []
            edges = []
            
            for skill in skills:
                # Add node
                nodes.append({
                    'id': skill[1],  # skill_name
                    'label': skill[1],
                    'alumni_count': skill[4],
                    'job_count': skill[5],
                    'popularity': float(skill[6]) if skill[6] else 0.0,
                    'size': float(skill[6]) * 2 if skill[6] else 1.0
                })
                
                # Add edges for relationships
                related_skills = skill[2]
                if related_skills:
                    try:
                        related = json.loads(related_skills) if isinstance(related_skills, str) else related_skills
                        if isinstance(related, list):
                            for related_skill in related[:5]:  # Top 5 relationships
                                edges.append({
                                    'source': skill[1],
                                    'target': related_skill,
                                    'weight': 1.0
                                })
                    except (json.JSONDecodeError, TypeError):
                        continue
            
            # Identify skill clusters (simple grouping by high connectivity)
            clusters = self._identify_clusters(nodes, edges)
            
            return {
                'nodes': nodes,
                'edges': edges,
                'clusters': clusters,
                'total_skills': len(nodes)
            }
        
        except Exception as e:
            logger.error(f"Error getting skill network: {str(e)}")
            raise
    
    def _identify_clusters(self, nodes: List[Dict], edges: List[Dict]) -> List[Dict]:
        """Simple clustering based on connectivity"""
        # Group skills with strong connections
        clusters = []
        skill_connections = {}
        
        for edge in edges:
            source = edge['source']
            target = edge['target']
            
            if source not in skill_connections:
                skill_connections[source] = set()
            if target not in skill_connections:
                skill_connections[target] = set()
            
            skill_connections[source].add(target)
            skill_connections[target].add(source)
        
        # Find highly connected groups
        processed = set()
        cluster_id = 0
        
        for skill, connections in sorted(
            skill_connections.items(),
            key=lambda x: len(x[1]),
            reverse=True
        ):
            if skill in processed:
                continue
            
            if len(connections) >= 3:  # Minimum 3 connections for cluster
                cluster_skills = [skill] + list(connections)[:5]
                clusters.append({
                    'cluster_id': cluster_id,
                    'name': f"{skill} Ecosystem",
                    'skills': cluster_skills,
                    'size': len(cluster_skills)
                })
                processed.update(cluster_skills)
                cluster_id += 1
        
        return clusters[:10]  # Top 10 clusters
    
    async def get_skill_details(
        self,
        db_conn,
        skill_name: str
    ) -> Optional[Dict]:
        """Get detailed information about a specific skill"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, skill_name, related_skills, industry_connections,
                        alumni_count, job_count, popularity_score, created_at, updated_at
                    FROM skill_graph
                    WHERE skill_name = %s
                """, (skill_name,))
                skill = await cursor.fetchone()
            
            if not skill:
                return None
            
            related_skills = skill[2]
            if related_skills:
                try:
                    related_skills = json.loads(related_skills) if isinstance(related_skills, str) else related_skills
                except (json.JSONDecodeError, TypeError):
                    related_skills = []
            
            industry_connections = skill[3]
            if industry_connections:
                try:
                    industry_connections = json.loads(industry_connections) if isinstance(industry_connections, str) else industry_connections
                except (json.JSONDecodeError, TypeError):
                    industry_connections = []
            
            return {
                'skill_name': skill[1],
                'related_skills': related_skills if related_skills else [],
                'industry_connections': industry_connections if industry_connections else [],
                'alumni_count': skill[4],
                'job_count': skill[5],
                'popularity_score': float(skill[6]) if skill[6] else 0.0,
                'created_at': skill[7],
                'updated_at': skill[8]
            }
        
        except Exception as e:
            logger.error(f"Error getting skill details: {str(e)}")
            raise
    
    async def find_career_paths_by_skill(
        self,
        db_conn,
        skill_name: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Find common career paths for alumni with a specific skill
        """
        try:
            # Find alumni with this skill
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        ap.user_id, ap.current_role, ap.current_company,
                        ap.batch_year, ap.years_of_experience
                    FROM alumni_profiles ap
                    WHERE JSON_CONTAINS(ap.skills, %s)
                    AND ap.current_role IS NOT NULL
                    ORDER BY ap.years_of_experience DESC
                    LIMIT %s
                """, (json.dumps(skill_name), limit * 2))
                alumni = await cursor.fetchall()
            
            # Group by role
            role_distribution = {}
            for alum in alumni:
                role = alum[1]
                if role:
                    if role not in role_distribution:
                        role_distribution[role] = {
                            'count': 0,
                            'companies': [],
                            'avg_experience': 0,
                            'total_experience': 0
                        }
                    role_distribution[role]['count'] += 1
                    if alum[2]:  # company
                        role_distribution[role]['companies'].append(alum[2])
                    if alum[4]:  # years_of_experience
                        role_distribution[role]['total_experience'] += alum[4]
            
            # Calculate averages and format response
            paths = []
            for role, data in sorted(
                role_distribution.items(),
                key=lambda x: x[1]['count'],
                reverse=True
            )[:limit]:
                avg_exp = data['total_experience'] / data['count'] if data['count'] > 0 else 0
                top_companies = Counter(data['companies']).most_common(5)
                
                paths.append({
                    'role': role,
                    'alumni_count': data['count'],
                    'average_experience_years': round(avg_exp, 1),
                    'top_companies': [comp for comp, _ in top_companies]
                })
            
            return paths
        
        except Exception as e:
            logger.error(f"Error finding career paths by skill: {str(e)}")
            raise
    
    async def get_trending_skills(
        self,
        db_conn,
        limit: int = 20
    ) -> List[Dict]:
        """Get trending skills based on recent job postings"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        sg.skill_name, sg.alumni_count, sg.job_count,
                        sg.popularity_score
                    FROM skill_graph sg
                    WHERE sg.job_count > 0
                    ORDER BY sg.popularity_score DESC, sg.job_count DESC
                    LIMIT %s
                """, (limit,))
                skills = await cursor.fetchall()
            
            return [
                {
                    'skill_name': s[0],
                    'alumni_count': s[1],
                    'job_demand': s[2],
                    'popularity_score': float(s[3]) if s[3] else 0.0,
                    'trend': 'high' if s[2] > s[1] else 'stable'
                }
                for s in skills
            ]
        
        except Exception as e:
            logger.error(f"Error getting trending skills: {str(e)}")
            raise
