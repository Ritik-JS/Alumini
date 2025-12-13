"""
LLM-based Career Advisor
Uses Gemini AI to generate personalized career advice
"""
import logging
import os
import json
from typing import Dict, List, Optional
import asyncio

logger = logging.getLogger(__name__)

# Import Gemini SDK
try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed. LLM advice will be disabled")


class CareerLLMAdvisor:
    """
    Generates personalized career advice using Gemini AI
    Falls back to Emergent LLM if Gemini is unavailable
    """
    
    def __init__(self):
        # Try Gemini first (primary)
        self.gemini_key = os.getenv('GEMINI_API_KEY')
        self.gemini_model_name = os.getenv('GEMINI_MODEL', 'gemini-1.5-pro')
        self.gemini_model = None
        
        # Configure Gemini if available
        if self.gemini_key and GEMINI_AVAILABLE:
            try:
                genai.configure(api_key=self.gemini_key)
                self.gemini_model = genai.GenerativeModel(self.gemini_model_name)
                logger.info(f"✅ Gemini AI configured successfully ({self.gemini_model_name})")
            except Exception as e:
                logger.error(f"Failed to configure Gemini: {str(e)}")
                self.gemini_model = None
        
        # Fallback to Emergent LLM (legacy)
        self.emergent_key = os.getenv('EMERGENT_LLM_KEY')
        self.emergent_url = os.getenv('EMERGENT_LLM_API_URL', 'https://api.emergent.ai/v1/chat/completions')
        self.emergent_model = os.getenv('EMERGENT_LLM_MODEL', 'gpt-4')
        
        if not self.gemini_model and not self.emergent_key:
            logger.warning("No LLM API configured (Gemini or Emergent). LLM advice will be disabled")
    
    async def generate_career_advice(
        self,
        user_profile: Dict,
        predictions: List[Dict],
        similar_alumni: List[Dict]
    ) -> str:
        """
        Generate personalized career advice using LLM
        
        Args:
            user_profile: User's current profile
            predictions: Predicted career paths
            similar_alumni: Similar alumni who made transitions
        
        Returns:
            str: Personalized career advice
        """
        # Check if any LLM is available
        if not self.gemini_model and not self.emergent_key:
            return self._generate_fallback_advice(user_profile, predictions)
        
        try:
            # Prepare context for LLM
            prompt = self._build_prompt(user_profile, predictions, similar_alumni)
            
            # Try Gemini first, then Emergent LLM as fallback
            if self.gemini_model:
                advice = await self._call_gemini_api(prompt)
            elif self.emergent_key:
                advice = await self._call_emergent_api(prompt)
            else:
                return self._generate_fallback_advice(user_profile, predictions)
            
            return advice
        
        except Exception as e:
            logger.error(f"Error generating LLM advice: {str(e)}")
            return self._generate_fallback_advice(user_profile, predictions)
    
    def _build_prompt(
        self,
        user_profile: Dict,
        predictions: List[Dict],
        similar_alumni: List[Dict]
    ) -> str:
        """
        Build LLM prompt with career context
        """
        # Extract key information
        current_role = user_profile.get('current_role', 'Unknown')
        current_company = user_profile.get('current_company', 'Unknown')
        skills = user_profile.get('skills', [])
        years_exp = user_profile.get('years_of_experience', 0)
        industry = user_profile.get('industry', 'Unknown')
        
        # Format predictions
        predictions_text = "\n".join([
            f"- {p['role']} (probability: {p['probability']:.1%}, timeframe: {p.get('timeframe_months', 24)} months)"
            for p in predictions[:3]
        ])
        
        # Format similar alumni
        alumni_text = "\n".join([
            f"- {a['name']} transitioned from similar background to {a['current_role']} at {a['current_company']}"
            for a in similar_alumni[:3]
        ]) if similar_alumni else "No similar alumni found"
        
        prompt = f"""You are a career advisor for an alumni network. Generate personalized, actionable career advice.

**Current Profile:**
- Role: {current_role}
- Company: {current_company}
- Years of Experience: {years_exp}
- Industry: {industry}
- Skills: {', '.join(skills[:8])}

**Predicted Career Paths:**
{predictions_text}

**Similar Alumni Success Stories:**
{alumni_text}

**Task:** Provide concise, actionable career advice (3-4 sentences) that:
1. Acknowledges their current position and strengths
2. Highlights the most promising career path based on predictions
3. Suggests 2-3 specific skills to develop for that path
4. Mentions a realistic timeframe for the transition

Keep the tone encouraging and professional. Focus on actionable next steps."""

        return prompt
    
    async def _call_gemini_api(self, prompt: str) -> str:
        """
        Call Gemini AI API (Primary method)
        """
        try:
            # Run sync Gemini call in executor to avoid blocking
            def _generate():
                response = self.gemini_model.generate_content(
                    prompt,
                    generation_config={
                        'temperature': 0.7,
                        'max_output_tokens': 300,
                    },
                    safety_settings={
                        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    }
                )
                return response.text.strip()
            
            # Execute in thread pool to avoid blocking
            advice = await asyncio.to_thread(_generate)
            
            if not advice:
                raise Exception("Empty response from Gemini API")
            
            logger.info("✅ Generated career advice using Gemini AI")
            return advice
            
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise
    
    async def _call_emergent_api(self, prompt: str) -> str:
        """
        Call Emergent LLM API (Fallback method)
        """
        import aiohttp
        
        headers = {
            'Authorization': f'Bearer {self.emergent_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': self.emergent_model,
            'messages': [
                {
                    'role': 'system',
                    'content': 'You are a professional career advisor specializing in alumni career development.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'temperature': 0.7,
            'max_tokens': 300
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.emergent_url,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Emergent LLM API error: {response.status} - {error_text}")
                    raise Exception(f"Emergent LLM API returned status {response.status}")
                
                data = await response.json()
                
                # Extract advice from response
                advice = data.get('choices', [{}])[0].get('message', {}).get('content', '')
                
                if not advice:
                    raise Exception("Empty response from Emergent LLM API")
                
                logger.info("✅ Generated career advice using Emergent LLM (fallback)")
                return advice.strip()
    
    def _generate_fallback_advice(
        self,
        user_profile: Dict,
        predictions: List[Dict]
    ) -> str:
        """
        Generate rule-based advice when LLM is unavailable
        """
        current_role = user_profile.get('current_role', 'your current position')
        years_exp = user_profile.get('years_of_experience', 0)
        
        if not predictions:
            return (
                f"Based on your experience as {current_role}, continue building your expertise "
                f"and expanding your skill set. Consider taking on leadership responsibilities "
                f"and mentoring junior team members to prepare for advancement opportunities."
            )
        
        top_prediction = predictions[0]
        next_role = top_prediction.get('role', 'a senior position')
        probability = top_prediction.get('probability', 0)
        required_skills = top_prediction.get('required_skills', [])
        
        confidence_text = "strong" if probability > 0.5 else "good" if probability > 0.3 else "potential"
        
        skills_text = ", ".join(required_skills[:3]) if required_skills else "leadership and technical skills"
        
        advice = (
            f"Based on your {years_exp} years of experience as {current_role}, "
            f"you have a {confidence_text} pathway to {next_role}. "
            f"Focus on developing {skills_text} to strengthen your candidacy. "
            f"Consider taking on projects that demonstrate these competencies, "
            f"and aim for this transition within the next 18-24 months."
        )
        
        return advice
    
    async def generate_skill_learning_path(
        self,
        target_role: str,
        current_skills: List[str],
        required_skills: List[str]
    ) -> Dict:
        """
        Generate a learning path for acquiring missing skills
        
        Args:
            target_role: Desired future role
            current_skills: User's current skills
            required_skills: Skills needed for target role
        
        Returns:
            Dict with learning path recommendations
        """
        # Calculate skill gap
        current_set = set(current_skills)
        required_set = set(required_skills)
        missing_skills = list(required_set - current_set)
        
        if not missing_skills:
            return {
                "skills_to_learn": [],
                "message": "You already have all the required skills!",
                "estimated_time": "0 months"
            }
        
        # Prioritize skills (this is simplified - could use LLM for better prioritization)
        priority_order = self._prioritize_skills(missing_skills, target_role)
        
        return {
            "target_role": target_role,
            "skills_to_learn": priority_order,
            "estimated_time": f"{len(priority_order) * 2} months",
            "recommendation": (
                f"To transition to {target_role}, focus on acquiring {len(priority_order)} key skills. "
                f"Start with {priority_order[0] if priority_order else 'the fundamentals'} as it's most critical for this role."
            )
        }
    
    def _prioritize_skills(self, skills: List[str], target_role: str) -> List[str]:
        """
        Prioritize skills based on role requirements (simplified rule-based)
        """
        # Define skill importance by category
        high_priority = ['leadership', 'management', 'architecture', 'strategy']
        medium_priority = ['communication', 'collaboration', 'problem solving']
        
        high = []
        medium = []
        other = []
        
        for skill in skills:
            skill_lower = skill.lower()
            if any(hp in skill_lower for hp in high_priority):
                high.append(skill)
            elif any(mp in skill_lower for mp in medium_priority):
                medium.append(skill)
            else:
                other.append(skill)
        
        return high + medium + other


# Global advisor instance
_advisor = None


def get_llm_advisor() -> CareerLLMAdvisor:
    """
    Get or create global LLM advisor instance
    """
    global _advisor
    
    if _advisor is None:
        _advisor = CareerLLMAdvisor()
    
    return _advisor
