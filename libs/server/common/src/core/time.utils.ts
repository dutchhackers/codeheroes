export class TimeUtils {
  static calculateTimeBetween(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.floor((endDate.getTime() - startDate.getTime()) / 1000); // Convert to seconds
  }

  static isWithinTimeThreshold(timestamp: string, threshold: string): boolean {
    const thresholdMs = TimeUtils.parseTimeThreshold(threshold);
    const timestampDate = new Date(timestamp);
    const now = new Date();
    return now.getTime() - timestampDate.getTime() <= thresholdMs;
  }

  static parseTimeThreshold(threshold: string): number {
    const unit = threshold.slice(-1);
    const value = parseInt(threshold.slice(0, -1));
    
    switch(unit) {
      case 'h': return value * 60 * 60 * 1000; // hours to ms
      case 'm': return value * 60 * 1000; // minutes to ms
      case 'd': return value * 24 * 60 * 60 * 1000; // days to ms
      default: throw new Error(`Unsupported time unit: ${unit}`);
    }
  }
}
