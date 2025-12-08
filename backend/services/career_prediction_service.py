"""
Career Path Prediction Service
Provides rule-based career path predictions with ML model placeholder
"""
import logging
import json
from typing import Dict, List, Optional
from collections import Counter
from datetime import datetime

logger = logging.getLogger(__name__)


class CareerPredictionService:
    """Service for career path predictions and analysis"""
    
    async def predict_career_path(
        self,
        db_conn,
        user_id: str
    ) -> Dict:
        """
        Predict career trajectory for a user based on current role and skills
        Uses rule-based logic with ML model placeholder
        """
        try:
            # Get user's current profile
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        current_role, current_company, skills, 
                        years_of_experience, batch_year, industry
                    FROM alumni_profiles
                    WHERE user_id = %s
                """, (user_id,))
                profile = await cursor.fetchone()
            
            if not profile:
                raise ValueError("User profile not found")
            
            current_role = profile[0] or "Unknown"
            current_company = profile[1]
            skills = profile[2]
            years_exp = profile[3] or 0
            batch_year = profile[4]
            industry = profile[5]
            
            # Parse skills
            user_skills = []
            if skills:
                try:
                    user_skills = json.loads(skills) if isinstance(skills, str) else skills
                    if not isinstance(user_skills, list):
                        user_skills = []
                except (json.JSONDecodeError, TypeError):
                    user_skills = []
            
            # Get career transitions from database
            predicted_roles = await self._get_predicted_roles(
                db_conn, current_role, user_skills, years_exp
            )
            
            # Get recommended skills
            recommended_skills = await self._get_recommended_skills(
                db_conn, current_role, predicted_roles
            )
            
            # Find similar alumni
            similar_alumni = await self._find_similar_alumni(
                db_conn, user_id, current_role, user_skills, years_exp
            )
            
            # Calculate confidence score (rule-based)
            confidence_score = await self._calculate_confidence(
                db_conn, current_role, len(user_skills), years_exp
            )
            
            # Store prediction
            prediction_id = await self._store_prediction(
                db_conn,
                user_id,
                current_role,
                predicted_roles,
                recommended_skills,
                similar_alumni,
                confidence_score
            )
            
            return {
                "prediction_id": prediction_id,
                "current_role": current_role,
                "current_company": current_company,
                "years_of_experience": years_exp,
                "predicted_roles": predicted_roles,
                "recommended_skills": recommended_skills,
                "similar_alumni": similar_alumni,
                "confidence_score": confidence_score,
                "prediction_date": datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error predicting career path: {str(e)}")
            raise
    
    async def _get_predicted_roles(
        self,
        db_conn,
        current_role: str,
        user_skills: List[str],
        years_exp: int
    ) -> List[Dict]:
        """
        Get predicted next roles based on career transition matrix
        Rule-based logic - can be replaced with ML model
        """
        # Query career transition matrix
        async with db_conn.cursor() as cursor:
            await cursor.execute("""
                SELECT 
                    to_role, 
                    transition_probability,
                    avg_duration_months,
                    required_skills,
                    success_rate
                FROM career_transition_matrix
                WHERE from_role = %s
                ORDER BY transition_probability DESC
                LIMIT 5
            """, (current_role,))
            transitions = await cursor.fetchall()
        
        predicted_roles = []
        
        if transitions:
            # Use database transitions
            for trans in transitions:
                to_role = trans[0]
                probability = float(trans[1]) if trans[1] else 0.5
                duration_months = trans[2] or 24
                required_skills = trans[3]
                success_rate = float(trans[4]) if trans[4] else 0.7
                
                # Parse required skills
                req_skills = []
                if required_skills:
                    try:
                        req_skills = json.loads(required_skills) if isinstance(required_skills, str) else required_skills
                        if not isinstance(req_skills, list):
                            req_skills = []
                    except (json.JSONDecodeError, TypeError):
                        req_skills = []
                
                # Calculate skill match
                if req_skills and user_skills:
                    matching_skills = set(req_skills) & set(user_skills)
                    skill_match_ratio = len(matching_skills) / len(req_skills)
                else:
                    skill_match_ratio = 0.5
                
                # Adjust probability based on skill match
                adjusted_probability = probability * (0.5 + 0.5 * skill_match_ratio)
                
                predicted_roles.append({
                    "role": to_role,
                    "probability": round(adjusted_probability, 3),
                    "timeframe_months": duration_months,
                    "required_skills": req_skills,
                    "skill_match_percentage": round(skill_match_ratio * 100, 1),
                    "success_rate": round(success_rate, 3)
                })
        else:
            # Fallback: Rule-based predictions
            predicted_roles = await self._rule_based_predictions(
                db_conn, current_role, user_skills, years_exp
            )
        
        return predicted_roles
    
    async def _rule_based_predictions(
        self,
        db_conn,
        current_role: str,
        user_skills: List[str],
        years_exp: int
    ) -> List[Dict]:
        """
        Fallback rule-based prediction when no historical data exists
        """
        # Common career progressions (rules)
        role_progressions = {
            "Software Engineer": ["Senior Software Engineer", "Tech Lead", "Engineering Manager"],
            "Senior Software Engineer": ["Tech Lead", "Engineering Manager", "Principal Engineer"],
            "Product Manager": ["Senior Product Manager", "Product Lead", "Director of Product"],
            "Data Analyst": ["Senior Data Analyst", "Data Scientist", "Analytics Manager"],
            "Marketing Manager": ["Senior Marketing Manager", "Marketing Director", "VP Marketing"],
        }
        
        # Get next roles
        next_roles = []
        for key in role_progressions:
            if key.lower() in current_role.lower():
                next_roles = role_progressions[key]
                break
        
        if not next_roles:
            # Generic progression based on seniority
            if "junior" in current_role.lower():
                next_roles = [current_role.replace("Junior", "Senior").replace("junior", "")]
            elif "senior" in current_role.lower():
                next_roles = [current_role.replace("Senior", "Lead").replace("senior", "")]
            else:
                next_roles = [f"Senior {current_role}", f"Lead {current_role}"]
        
        predicted = []
        base_probability = 0.6
        for i, role in enumerate(next_roles[:3]):
            predicted.append({
                "role": role,
                "probability": round(base_probability - (i * 0.15), 3),
                "timeframe_months": 24 + (i * 12),
                "required_skills": user_skills[:5],  # Use user's current skills
                "skill_match_percentage": 75.0 - (i * 10),
                "success_rate": 0.7 - (i * 0.1)
            })
        
        return predicted
    
    async def _get_recommended_skills(
        self,
        db_conn,
        current_role: str,
        predicted_roles: List[Dict]
    ) -> List[str]:
        """
        Get skills recommended for career growth
        """
        all_skills = set()
        
        # Collect skills from predicted roles
        for role in predicted_roles[:3]:
            if 'required_skills' in role:
                all_skills.update(role['required_skills'])
        
        # Also get skills from skill graph for current role context
        async with db_conn.cursor() as cursor:
            await cursor.execute("""
                SELECT DISTINCT skill_name
                FROM skill_graph
                WHERE job_count > 0
                ORDER BY popularity_score DESC
                LIMIT 10
            """)
            trending_skills = await cursor.fetchall()
        
        # Add some trending skills
        for skill in trending_skills[:5]:
            all_skills.add(skill[0])
        
        return list(all_skills)[:10]
    
    async def _find_similar_alumni(
        self,
        db_conn,
        user_id: str,
        current_role: str,
        user_skills: List[str],
        years_exp: int
    ) -> List[Dict]:
        """
        Find alumni with similar profiles who made successful transitions
        """
        try:
            # Find alumni with similar role and experience
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        ap.user_id, ap.name, ap.current_role, 
                        ap.current_company, ap.years_of_experience,
                        ap.skills, ap.photo_url
                    FROM alumni_profiles ap
                    WHERE ap.user_id != %s
                    AND ap.current_role IS NOT NULL
                    AND ap.years_of_experience BETWEEN %s AND %s
                    LIMIT 10
                """, (user_id, max(0, years_exp - 3), years_exp + 3))
                similar = await cursor.fetchall()
            
            similar_alumni = []
            for alum in similar[:5]:
                alum_skills = []
                if alum[5]:
                    try:
                        alum_skills = json.loads(alum[5]) if isinstance(alum[5], str) else alum[5]
                        if not isinstance(alum_skills, list):
                            alum_skills = []
                    except (json.JSONDecodeError, TypeError):
                        alum_skills = []
                
                # Calculate similarity (Jaccard similarity)
                if user_skills and alum_skills:
                    intersection = len(set(user_skills) & set(alum_skills))
                    union = len(set(user_skills) | set(alum_skills))
                    similarity = (intersection / union) if union > 0 else 0
                else:
                    similarity = 0.5
                
                similar_alumni.append({
                    "user_id": alum[0],
                    "name": alum[1],
                    "current_role": alum[2],
                    "current_company": alum[3],
                    "years_of_experience": alum[4],
                    "photo_url": alum[6],
                    "similarity_score": round(similarity, 3)
                })
            
            return sorted(similar_alumni, key=lambda x: x['similarity_score'], reverse=True)
        
        except Exception as e:
            logger.error(f"Error finding similar alumni: {str(e)}")
            return []
    
    async def _calculate_confidence(
        self,
        db_conn,
        current_role: str,
        skills_count: int,
        years_exp: int
    ) -> float:
        """
        Calculate confidence score for prediction
        """
        # Base confidence
        confidence = 0.5
        
        # Boost based on data availability
        async with db_conn.cursor() as cursor:
            await cursor.execute("""
                SELECT COUNT(*) FROM career_transition_matrix
                WHERE from_role = %s
            """, (current_role,))
            result = await cursor.fetchone()
            transition_count = result[0] if result else 0
        
        # Adjust confidence
        if transition_count >= 5:
            confidence += 0.3
        elif transition_count >= 2:
            confidence += 0.2
        
        # Skills factor
        if skills_count >= 5:
            confidence += 0.1
        
        # Experience factor
        if years_exp >= 3:
            confidence += 0.1
        
        return min(confidence, 0.95)  # Cap at 95%
    
    async def _store_prediction(
        self,
        db_conn,
        user_id: str,
        current_role: str,
        predicted_roles: List[Dict],
        recommended_skills: List[str],
        similar_alumni: List[Dict],
        confidence_score: float
    ) -> str:
        """
        Store prediction in database
        """
        async with db_conn.cursor() as cursor:
            await cursor.execute("""
                INSERT INTO career_predictions 
                (user_id, current_role, predicted_roles, recommended_skills, 
                 similar_alumni, confidence_score)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                current_role,
                json.dumps(predicted_roles),
                json.dumps(recommended_skills),
                json.dumps([a['user_id'] for a in similar_alumni]),
                confidence_score
            ))
            
            await db_conn.commit()
            
            # Get the inserted ID
            await cursor.execute("SELECT LAST_INSERT_ID()")
            result = await cursor.fetchone()
            prediction_id = result[0] if result else None
            
            return str(prediction_id) if prediction_id else "unknown"
    
    async def get_common_career_paths(
        self,
        db_conn,
        limit: int = 20
    ) -> List[Dict]:
        """
        Get most common career transitions across all alumni
        """
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        from_role, to_role, transition_count,
                        transition_probability, avg_duration_months, success_rate
                    FROM career_transition_matrix
                    WHERE transition_count > 0
                    ORDER BY transition_count DESC, transition_probability DESC
                    LIMIT %s
                """, (limit,))
                paths = await cursor.fetchall()
            
            return [
                {
                    "from_role": p[0],
                    "to_role": p[1],
                    "transition_count": p[2],
                    "probability": float(p[3]) if p[3] else 0,
                    "avg_duration_months": p[4] or 24,
                    "success_rate": float(p[5]) if p[5] else 0.7
                }
                for p in paths
            ]
        
        except Exception as e:
            logger.error(f"Error getting common career paths: {str(e)}")
            raise
    
    async def get_career_transitions_by_skill(
        self,
        db_conn,
        skill: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Get career transitions where a specific skill is required
        """
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        from_role, to_role, transition_probability,
                        avg_duration_months, required_skills, success_rate
                    FROM career_transition_matrix
                    WHERE JSON_CONTAINS(required_skills, %s)
                    ORDER BY transition_probability DESC
                    LIMIT %s
                """, (json.dumps(skill), limit))
                transitions = await cursor.fetchall()
            
            result = []
            for trans in transitions:
                req_skills = []
                if trans[4]:
                    try:
                        req_skills = json.loads(trans[4]) if isinstance(trans[4], str) else trans[4]
                    except (json.JSONDecodeError, TypeError):
                        req_skills = []
                
                result.append({
                    "from_role": trans[0],
                    "to_role": trans[1],
                    "probability": float(trans[2]) if trans[2] else 0,
                    "timeframe_months": trans[3] or 24,
                    "required_skills": req_skills,
                    "success_rate": float(trans[5]) if trans[5] else 0.7
                })
            
            return result
        
        except Exception as e:
            logger.error(f"Error getting career transitions by skill: {str(e)}")
            raise


# ML MODEL PLACEHOLDER
# This is where the actual ML model would be integrated
# See ML_MODEL_GUIDE.md for implementation details
class MLCareerPredictor:
    """
    Placeholder for ML-based career path prediction
    Replace this with actual ML model implementation
    """
    
    def __init__(self):
        self.model = None  # Load trained model here
        logger.info("ML Career Predictor placeholder initialized")
    
    async def predict(self, features: Dict) -> List[Dict]:
        """
        Predict career paths using ML model
        
        Args:
            features: Dict containing user profile features
                - current_role: str
                - skills: List[str]
                - years_experience: int
                - industry: str
                - education_level: str
        
        Returns:
            List of predicted roles with probabilities
        """
        # TODO: Implement actual ML prediction
        # This is a placeholder that returns empty results
        logger.warning("Using ML placeholder - implement actual model")
        return []
