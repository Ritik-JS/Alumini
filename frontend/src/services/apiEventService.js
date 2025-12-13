import axios from './axiosConfig';
import { handleApiError } from './apiErrorHandler';

// Real Event Service API
class ApiEventService {
  // Get all events with optional filters
  async getEvents(filters = {}) {
    try {
      // Map frontend filter parameters to backend parameters
      const params = { ...filters };
      
      // Map status: "upcoming"/"past" to is_upcoming: boolean
      if (filters.status === 'upcoming') {
        params.is_upcoming = true;
        delete params.status;
      } else if (filters.status === 'past') {
        params.is_upcoming = false;
        delete params.status;
      }
      
      // Map type to event_type
      if (filters.type) {
        params.event_type = filters.type;
        delete params.type;
      }
      
      const response = await axios.get('/api/events', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error, []);
    }
  }

  // Get single event by ID
  async getEventById(eventId) {
    try {
      const response = await axios.get(`/api/events/${eventId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Create new event
  async createEvent(eventData) {
    try {
      const response = await axios.post('/api/events', eventData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Update event
  async updateEvent(eventId, eventData) {
    try {
      const response = await axios.put(`/api/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Delete event
  async deleteEvent(eventId) {
    try {
      const response = await axios.delete(`/api/events/${eventId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // RSVP to event
  async rsvpToEvent(eventId, status = 'attending') {
    try {
      const response = await axios.post(`/api/events/${eventId}/rsvp`, {
        status,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Get user's RSVP for an event
  async getUserRsvp(eventId) {
    try {
      const response = await axios.get(`/api/events/${eventId}/my-rsvp`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Get attendees for an event
  async getEventAttendees(eventId) {
    try {
      const response = await axios.get(`/api/events/${eventId}/attendees`);
      return response.data;
    } catch (error) {
      return handleApiError(error, []);
    }
  }

  // Get events created by current user
  async getMyEvents() {
    try {
      const response = await axios.get('/api/events/user/my-events');
      return response.data;
    } catch (error) {
      return handleApiError(error, []);
    }
  }
}

export default new ApiEventService();
