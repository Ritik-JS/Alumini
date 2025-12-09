import axios from 'axios';
import { handleApiError } from './apiErrorHandler';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Event Service API
class ApiEventService {
  // Get all events with optional filters
  async getEvents(filters = {}) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/events`, { params: filters });
      return response.data;
    } catch (error) {
      return handleApiError(error, []);
    }
  }

  // Get single event by ID
  async getEventById(eventId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/events/${eventId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Create new event
  async createEvent(eventData) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/events`, eventData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Update event
  async updateEvent(eventId, eventData) {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Delete event
  async deleteEvent(eventId) {
    try {
      const response = await axios.delete(`${BACKEND_URL}/api/events/${eventId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // RSVP to event
  async rsvpToEvent(eventId, status = 'attending') {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/events/${eventId}/rsvp`, {
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
      const response = await axios.get(`${BACKEND_URL}/api/events/${eventId}/my-rsvp`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Get attendees for an event
  async getEventAttendees(eventId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/events/${eventId}/attendees`);
      return response.data;
    } catch (error) {
      return handleApiError(error, []);
    }
  }

  // Get events created by current user
  async getMyEvents() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/events/my-events`);
      return response.data;
    } catch (error) {
      return handleApiError(error, []);
    }
  }
}

export default new ApiEventService();
