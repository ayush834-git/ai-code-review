const { logger } = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.events = [];
  }

  trackEvent(eventName, metadata = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: eventName,
      timestamp: new Date().toISOString(),
      metadata
    };
    this.events.push(event);
    logger.debug(`Tracked event: ${eventName}`);
    return event;
  }

  getRecentEvents(limit = 10) {
    return this.events.slice(-limit);
  }
}

module.exports = new AnalyticsService();
