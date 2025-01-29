// factories/processor.factory.ts
import { ActivityType } from '../../activity/activity.model';
import { BaseActivityProcessor } from '../activities/base/activity-processor.base';

// Import all specific activity processors
import { PushActivityProcessor } from '../activities/push/push-processor';
// import { PullRequestProcessor } from '../activities/pull-request/pr-processor';
// Import other processors as needed...

export class ProcessorFactory {
  // Map to store processor classes for each activity type
  private static processors = new Map<ActivityType, new () => BaseActivityProcessor>();

  static initialize() {
    // Register all processors
    this.processors.set(ActivityType.CODE_PUSH, PushActivityProcessor);
    // this.processors.set(ActivityType.PR_CREATED, PullRequestProcessor);
    // Register other processors...
  }

  static getProcessor(type: ActivityType): BaseActivityProcessor {
    const ProcessorClass = this.processors.get(type);
    if (!ProcessorClass) {
      throw new Error(`No processor registered for activity type: ${type}`);
    }
    return new ProcessorClass();
  }
}
