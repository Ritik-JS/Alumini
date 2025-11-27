// Mock AI System Health Monitoring Service
// Provides simulated data for AI system monitoring dashboard

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock AI Systems Configuration
const AI_SYSTEMS = {
  SKILL_GRAPH: {
    id: 'skill_graph_ai',
    name: 'Skill Graph AI',
    description: 'Analyzes skill relationships and recommendations',
  },
  CAREER_PREDICTION: {
    id: 'career_prediction',
    name: 'Career Prediction',
    description: 'Predicts career paths and role transitions',
  },
  TALENT_CLUSTERING: {
    id: 'talent_clustering',
    name: 'Talent Clustering',
    description: 'Clusters alumni by location and skills',
  },
  ID_VALIDATION: {
    id: 'id_validation',
    name: 'ID Validation',
    description: 'Validates alumni ID cards using AI',
  },
  CAPSULE_RANKING: {
    id: 'capsule_ranking',
    name: 'Capsule Ranking',
    description: 'Ranks knowledge capsules for personalization',
  },
  ENGAGEMENT_SCORING: {
    id: 'engagement_scoring',
    name: 'Engagement Scoring',
    description: 'Scores and predicts user engagement',
  },
};

// Generate mock system status
const generateSystemStatus = () => {
  const statuses = ['active', 'processing', 'idle', 'warning', 'error'];
  const weights = [0.6, 0.2, 0.1, 0.08, 0.02]; // Probability distribution
  
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < statuses.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return statuses[i];
    }
  }
  
  return 'active';
};

// Generate mock metrics
const generateMetrics = (systemId) => {
  const baseMetrics = {
    skill_graph_ai: {
      accuracy: 0.87 + Math.random() * 0.1,
      predictions: Math.floor(15000 + Math.random() * 5000),
      avgProcessingTime: 0.2 + Math.random() * 0.3,
    },
    career_prediction: {
      accuracy: 0.84 + Math.random() * 0.12,
      predictions: Math.floor(8000 + Math.random() * 4000),
      avgProcessingTime: 1.5 + Math.random() * 1.0,
    },
    talent_clustering: {
      accuracy: 0.91 + Math.random() * 0.07,
      predictions: Math.floor(5000 + Math.random() * 2000),
      avgProcessingTime: 2.0 + Math.random() * 1.5,
    },
    id_validation: {
      accuracy: 0.96 + Math.random() * 0.03,
      predictions: Math.floor(20000 + Math.random() * 10000),
      avgProcessingTime: 0.1 + Math.random() * 0.1,
    },
    capsule_ranking: {
      accuracy: 0.79 + Math.random() * 0.15,
      predictions: Math.floor(12000 + Math.random() * 6000),
      avgProcessingTime: 0.5 + Math.random() * 0.5,
    },
    engagement_scoring: {
      accuracy: 0.82 + Math.random() * 0.13,
      predictions: Math.floor(10000 + Math.random() * 5000),
      avgProcessingTime: 0.4 + Math.random() * 0.4,
    },
  };
  
  return baseMetrics[systemId] || {};
};

// Generate recent activity
const generateRecentActivity = (systemId, count = 10) => {
  const activities = [];
  const types = ['prediction', 'training', 'update', 'validation', 'optimization'];
  const statuses = ['success', 'warning', 'error'];
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - (i * 15 + Math.random() * 10));
    
    activities.push({
      id: `activity-${systemId}-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      status: i === 0 && Math.random() > 0.9 ? 'error' : 'success',
      message: `Processed batch ${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: date.toISOString(),
      duration: (Math.random() * 5).toFixed(2),
    });
  }
  
  return activities;
};

export const mockAIMonitorService = {
  // Get all AI systems overview
  getAllSystemsStatus: async () => {
    await delay(500);
    
    const systems = Object.values(AI_SYSTEMS).map(system => {
      const status = generateSystemStatus();
      const metrics = generateMetrics(system.id);
      
      return {
        ...system,
        status,
        lastUpdated: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        queueSize: status === 'processing' ? Math.floor(10 + Math.random() * 50) : 0,
        successRate: 0.92 + Math.random() * 0.07,
        ...metrics,
      };
    });
    
    return {
      success: true,
      data: {
        systems,
        overallHealth: systems.filter(s => s.status === 'active' || s.status === 'processing').length / systems.length,
        timestamp: new Date().toISOString(),
      },
    };
  },

  // Get specific system details
  getSystemDetails: async (systemId) => {
    await delay(400);
    
    const system = Object.values(AI_SYSTEMS).find(s => s.id === systemId);
    if (!system) {
      return {
        success: false,
        error: 'System not found',
      };
    }
    
    const status = generateSystemStatus();
    const metrics = generateMetrics(systemId);
    const recentActivity = generateRecentActivity(systemId);
    
    return {
      success: true,
      data: {
        ...system,
        status,
        lastUpdated: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        queueSize: status === 'processing' ? Math.floor(10 + Math.random() * 50) : 0,
        successRate: 0.92 + Math.random() * 0.07,
        ...metrics,
        recentActivity,
        modelInfo: {
          version: '2.1.0',
          lastTrained: new Date(Date.now() - Math.random() * 7 * 24 * 3600000).toISOString(),
          trainingDataSize: Math.floor(50000 + Math.random() * 100000),
          nextRetraining: new Date(Date.now() + Math.random() * 7 * 24 * 3600000).toISOString(),
        },
      },
    };
  },

  // Get model performance metrics
  getModelPerformance: async (systemId, days = 30) => {
    await delay(600);
    
    const dataPoints = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        accuracy: 0.75 + Math.random() * 0.2,
        predictions: Math.floor(100 + Math.random() * 400),
        avgConfidence: 0.65 + Math.random() * 0.3,
        errorRate: Math.random() * 0.1,
      });
    }
    
    return {
      success: true,
      data: {
        systemId,
        period: `${days} days`,
        metrics: dataPoints,
        summary: {
          avgAccuracy: dataPoints.reduce((sum, d) => sum + d.accuracy, 0) / dataPoints.length,
          totalPredictions: dataPoints.reduce((sum, d) => sum + d.predictions, 0),
          avgConfidence: dataPoints.reduce((sum, d) => sum + d.avgConfidence, 0) / dataPoints.length,
          avgErrorRate: dataPoints.reduce((sum, d) => sum + d.errorRate, 0) / dataPoints.length,
        },
      },
    };
  },

  // Get processing queue status
  getProcessingQueue: async () => {
    await delay(300);
    
    const queueItems = [];
    const taskTypes = ['prediction', 'training', 'validation', 'optimization', 'analysis'];
    
    for (let i = 0; i < Math.floor(Math.random() * 15); i++) {
      queueItems.push({
        id: `task-${Date.now()}-${i}`,
        systemId: Object.values(AI_SYSTEMS)[Math.floor(Math.random() * 6)].id,
        taskType: taskTypes[Math.floor(Math.random() * taskTypes.length)],
        priority: Math.floor(Math.random() * 5) + 1,
        status: i < 2 ? 'processing' : 'queued',
        createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        estimatedTime: Math.floor(30 + Math.random() * 300),
      });
    }
    
    return {
      success: true,
      data: {
        queue: queueItems,
        totalItems: queueItems.length,
        processing: queueItems.filter(t => t.status === 'processing').length,
        queued: queueItems.filter(t => t.status === 'queued').length,
        avgWaitTime: Math.floor(60 + Math.random() * 120),
      },
    };
  },

  // Get error logs
  getErrorLogs: async (systemId = null, limit = 50) => {
    await delay(400);
    
    const errors = [];
    const errorTypes = ['validation_error', 'timeout', 'data_quality', 'model_error', 'api_error'];
    const severity = ['low', 'medium', 'high', 'critical'];
    
    for (let i = 0; i < Math.floor(Math.random() * limit / 2); i++) {
      const date = new Date();
      date.setHours(date.getHours() - Math.floor(Math.random() * 48));
      
      const errorSystemId = systemId || Object.values(AI_SYSTEMS)[Math.floor(Math.random() * 6)].id;
      
      errors.push({
        id: `error-${Date.now()}-${i}`,
        systemId: errorSystemId,
        errorType: errorTypes[Math.floor(Math.random() * errorTypes.length)],
        severity: severity[Math.floor(Math.random() * severity.length)],
        message: `Error processing data batch: ${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: date.toISOString(),
        resolved: Math.random() > 0.3,
      });
    }
    
    return {
      success: true,
      data: {
        errors: errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        total: errors.length,
        unresolved: errors.filter(e => !e.resolved).length,
      },
    };
  },

  // Trigger manual AI update
  triggerAIUpdate: async (systemId) => {
    await delay(1000);
    
    const success = Math.random() > 0.1; // 90% success rate
    
    return {
      success,
      data: success ? {
        message: `Successfully triggered update for ${systemId}`,
        taskId: `task-${Date.now()}`,
        estimatedTime: Math.floor(60 + Math.random() * 300),
      } : null,
      error: success ? null : 'Failed to trigger update. System is currently busy.',
    };
  },

  // Clear processing queue
  clearQueue: async (systemId = null) => {
    await delay(800);
    
    return {
      success: true,
      data: {
        message: systemId 
          ? `Cleared queue for ${systemId}` 
          : 'Cleared all queues',
        clearedTasks: Math.floor(5 + Math.random() * 20),
      },
    };
  },

  // Download metrics report
  downloadMetricsReport: async (format = 'json') => {
    await delay(1200);
    
    const systems = await mockAIMonitorService.getAllSystemsStatus();
    
    return {
      success: true,
      data: {
        report: systems.data,
        format,
        generatedAt: new Date().toISOString(),
        downloadUrl: '#', // In real scenario, this would be a blob URL
      },
    };
  },

  // Get system alerts
  getSystemAlerts: async () => {
    await delay(300);
    
    const alerts = [];
    const alertTypes = ['performance_degradation', 'high_queue', 'error_spike', 'low_accuracy'];
    
    // Sometimes generate alerts
    if (Math.random() > 0.5) {
      for (let i = 0; i < Math.floor(Math.random() * 3); i++) {
        alerts.push({
          id: `alert-${Date.now()}-${i}`,
          systemId: Object.values(AI_SYSTEMS)[Math.floor(Math.random() * 6)].id,
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          severity: ['medium', 'high'][Math.floor(Math.random() * 2)],
          message: 'System performance below threshold',
          timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
          acknowledged: Math.random() > 0.6,
        });
      }
    }
    
    return {
      success: true,
      data: {
        alerts,
        unacknowledged: alerts.filter(a => !a.acknowledged).length,
      },
    };
  },

  // Acknowledge alert
  acknowledgeAlert: async (alertId) => {
    await delay(200);
    
    return {
      success: true,
      data: {
        message: 'Alert acknowledged successfully',
        alertId,
      },
    };
  },
};

export default mockAIMonitorService;
