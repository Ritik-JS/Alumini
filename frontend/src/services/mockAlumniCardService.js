import mockData from '../mockdata.json';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAlumniCardService = {
  // Get user's alumni card
  getMyCard: async (userId) => {
    await delay(300);
    
    const card = mockData.alumni_cards.find(c => c.user_id === userId);
    
    if (!card) {
      return {
        success: false,
        error: 'Alumni card not found. Please contact admin.'
      };
    }
    
    // Get user and profile info
    const user = mockData.users.find(u => u.id === userId);
    const profile = mockData.alumni_profiles.find(p => p.user_id === userId);
    
    return {
      success: true,
      data: {
        ...card,
        user,
        profile
      }
    };
  },

  // Verify card by QR code or card number
  verifyCard: async (identifier) => {
    await delay(400);
    
    // Find card by card_number or qr_code_data
    const card = mockData.alumni_cards.find(c => 
      c.card_number === identifier || c.qr_code_data === identifier
    );
    
    if (!card) {
      return {
        success: false,
        error: 'Card not found or invalid'
      };
    }
    
    if (!card.is_active) {
      return {
        success: false,
        error: 'Card is not active'
      };
    }
    
    // Check if expired
    const expiryDate = new Date(card.expiry_date);
    if (expiryDate < new Date()) {
      return {
        success: false,
        error: 'Card has expired'
      };
    }
    
    // Get user and profile info
    const user = mockData.users.find(u => u.id === card.user_id);
    const profile = mockData.alumni_profiles.find(p => p.user_id === card.user_id);
    
    return {
      success: true,
      data: {
        verified: true,
        card,
        user,
        profile
      }
    };
  },

  // Download card as image (returns URL in real app)
  downloadCard: async (cardId) => {
    await delay(500);
    
    return {
      success: true,
      message: 'Card download started',
      // In real app, this would return a blob URL or trigger download
    };
  }
};
