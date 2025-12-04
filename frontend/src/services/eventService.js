import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const getCurrentUser = () => {
  const userData = localStorage.getItem('user') || localStorage.getItem('auth_user');
  return userData ? JSON.parse(userData) : null;
};

class EventService {
  constructor() {
    this.events = [...mockData.events];
    this.rsvps = [...mockData.event_rsvps];
  }

  async getEvents(filters = {}) {
    if (USE_MOCK_DATA) {
      await delay();
      let filtered = [...this.events];
      
      if (filters.type) {
        filtered = filtered.filter(event => event.event_type === filters.type);
      }
      
      if (filters.status) {
        const now = new Date();
        if (filters.status === 'upcoming') {
          filtered = filtered.filter(event => new Date(event.start_date) >= now);
        } else if (filters.status === 'past') {
          filtered = filtered.filter(event => new Date(event.start_date) < now);
        }
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(event => 
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower)
        );
      }
      
      filtered.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      
      return { success: true, data: filtered };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/events`, { params: filters });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getEventById(eventId) {
    if (USE_MOCK_DATA) {
      await delay();
      const event = this.events.find(e => e.id === eventId);
      
      if (!event) {
        return { success: false, message: 'Event not found' };
      }
      
      const eventRsvps = this.rsvps.filter(r => r.event_id === eventId);
      
      return {
        success: true,
        data: { ...event, rsvps: eventRsvps }
      };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/events/${eventId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async createEvent(eventData) {
    if (USE_MOCK_DATA) {
      await delay();
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'Not authenticated' };
      }
      
      const newEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...eventData,
        created_by: currentUser.id,
        status: 'published',
        current_attendees_count: 0,
        views_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.events.push(newEvent);
      
      return { success: true, data: newEvent, message: 'Event created successfully' };
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/events`, eventData);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async updateEvent(eventId, eventData) {
    if (USE_MOCK_DATA) {
      await delay();
      const index = this.events.findIndex(e => e.id === eventId);
      
      if (index === -1) {
        return { success: false, message: 'Event not found' };
      }
      
      this.events[index] = {
        ...this.events[index],
        ...eventData,
        updated_at: new Date().toISOString()
      };
      
      return { success: true, data: this.events[index], message: 'Event updated successfully' };
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/events/${eventId}`, eventData);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async deleteEvent(eventId) {
    if (USE_MOCK_DATA) {
      await delay();
      const index = this.events.findIndex(e => e.id === eventId);
      
      if (index === -1) {
        return { success: false, message: 'Event not found' };
      }
      
      this.events.splice(index, 1);
      
      return { success: true, message: 'Event deleted successfully' };
    } else {
      try {
        const response = await axios.delete(`${BACKEND_URL}/api/events/${eventId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async rsvpToEvent(eventId, status = 'attending') {
    if (USE_MOCK_DATA) {
      await delay();
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'Not authenticated' };
      }
      
      const event = this.events.find(e => e.id === eventId);
      if (!event) {
        return { success: false, message: 'Event not found' };
      }
      
      const existingRsvp = this.rsvps.find(
        r => r.event_id === eventId && r.user_id === currentUser.id
      );
      
      if (existingRsvp) {
        existingRsvp.status = status;
        existingRsvp.updated_at = new Date().toISOString();
        return { success: true, data: existingRsvp, message: 'RSVP updated successfully' };
      }
      
      const newRsvp = {
        id: `rsvp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        event_id: eventId,
        user_id: currentUser.id,
        status: status,
        rsvp_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.rsvps.push(newRsvp);
      
      if (status === 'attending') {
        event.current_attendees_count += 1;
      }
      
      return { success: true, data: newRsvp, message: 'RSVP successful' };
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/events/${eventId}/rsvp`, { status });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getUserRsvp(eventId) {
    if (USE_MOCK_DATA) {
      await delay();
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'Not authenticated' };
      }
      
      const rsvp = this.rsvps.find(
        r => r.event_id === eventId && r.user_id === currentUser.id
      );
      
      return { success: true, data: rsvp || null };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/events/${eventId}/my-rsvp`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getEventAttendees(eventId) {
    if (USE_MOCK_DATA) {
      await delay();
      const eventRsvps = this.rsvps.filter(
        r => r.event_id === eventId && r.status === 'attending'
      );
      
      const attendees = eventRsvps.map(rsvp => {
        const user = mockData.users.find(u => u.id === rsvp.user_id);
        const profile = mockData.alumni_profiles.find(p => p.user_id === rsvp.user_id);
        
        return { ...rsvp, user: user, profile: profile };
      });
      
      return { success: true, data: attendees };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/events/${eventId}/attendees`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getMyEvents() {
    if (USE_MOCK_DATA) {
      await delay();
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'Not authenticated' };
      }
      
      const myEvents = this.events.filter(e => e.created_by === currentUser.id);
      
      return { success: true, data: myEvents };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/events/my-events`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
}

export default new EventService();
