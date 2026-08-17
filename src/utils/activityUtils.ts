/**
 * Activity feed utility functions
 * Helper functions for generating recent activity feed
 */

import type { Student, SkillAssessment, TrainingLog, User } from '../types';

export type ActivityType = 'assessment' | 'training_log' | 'student_added';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  coachName: string;
  studentName?: string;
}

/**
 * Generate activity feed from assessments, training logs, and students
 * @param getBatchName Optional resolver to convert batch IDs to human-readable names.
 *   When provided, activity descriptions will use resolved batch names.
 *   When omitted, existing behavior (truncated ID fragments) is preserved.
 */
export function generateActivityFeed(
  assessments: SkillAssessment[],
  trainingLogs: TrainingLog[],
  students: Student[],
  limit: number = 10,
  getBatchName?: (batchId: string | undefined) => string
): Activity[] {
  const activities: Activity[] = [];
  
  // Add skill assessments
  assessments.forEach((assessment) => {
    const student = students.find((s) => s.id === assessment.studentId);
    if (student) {
      activities.push({
        id: `assessment-${assessment.id}`,
        type: 'assessment',
        title: 'Skill Assessment Recorded',
        description: `${assessment.recordedBy} completed skill assessment for ${student.fullName} (${assessment.cycleKey})`,
        timestamp: new Date(assessment.recordedAt),
        coachName: assessment.recordedBy,
        studentName: student.fullName,
      });
    }
  });
  
  // Add training logs
  trainingLogs.forEach((log) => {
    const student = students.find((s) => s.id === log.studentId);
    if (student) {
      activities.push({
        id: `log-${log.id}`,
        type: 'training_log',
        title: 'Training Log Added',
        description: `${log.recordedBy} added Week ${log.weekNumber} training notes for ${student.fullName}`,
        timestamp: new Date(log.recordedAt),
        coachName: log.recordedBy,
        studentName: student.fullName,
      });
    }
  });
  
  // Add recent student additions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  students.forEach((student) => {
    const createdAt = new Date(student.createdAt);
    if (createdAt > thirtyDaysAgo) {
      // Find the coach who likely added the student
      const coach = student.assignedCoachId 
        ? `Coach ${student.assignedCoachId.split('-')[1]}`
        : 'System';
      
      // Resolve batch display name: use getBatchName when provided, else fall back to ID fragment
      let batchDisplay: string;
      if (student.batchId) {
        batchDisplay = getBatchName
          ? getBatchName(student.batchId)
          : `Batch ${student.batchId.split('-')[1]}`;
      } else {
        batchDisplay = 'the academy';
      }

      activities.push({
        id: `student-${student.id}`,
        type: 'student_added',
        title: 'New Student Added',
        description: `${student.fullName} joined ${batchDisplay}`,
        timestamp: createdAt,
        coachName: coach,
        studentName: student.fullName,
      });
    }
  });
  
  // Sort by timestamp (most recent first) and limit
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get coach workload statistics
 */
export interface CoachWorkload {
  coachId: string;
  coachName: string;
  studentCount: number;
  isOverloaded: boolean; // More than 10 students
  isBalanced: boolean; // 5-10 students
  isUnderloaded: boolean; // Less than 5 students
}

export function getCoachWorkloads(
  students: Student[],
  coaches: User[],
  batches?: Array<{ id: string; assignedCoachId?: string; studentCount?: number }>
): CoachWorkload[] {
  // Count students per coach using direct assignment
  const studentCounts = new Map<string, number>();
  
  students.forEach((student) => {
    if (student.assignedCoachId) {
      const current = studentCounts.get(student.assignedCoachId) || 0;
      studentCounts.set(student.assignedCoachId, current + 1);
    }
  });

  // Also count students by batch ownership if batches are provided
  // This handles cases where students have batchId but no assignedCoachId
  if (batches && batches.length > 0) {
    // Build batchId → coachId map
    const batchCoachMap = new Map<string, string>();
    for (const batch of batches) {
      if (batch.assignedCoachId) {
        batchCoachMap.set(batch.id, batch.assignedCoachId);
      }
    }

    students.forEach((student) => {
      // Only count if student has a batchId but no direct assignedCoachId
      if (student.batchId && !student.assignedCoachId) {
        const coachId = batchCoachMap.get(student.batchId);
        if (coachId) {
          const current = studentCounts.get(coachId) || 0;
          studentCounts.set(coachId, current + 1);
        }
      }
    });
  }
  
  // Map to workload objects
  const workloads: CoachWorkload[] = coaches
    .filter((coach) => coach.role === 'ASSISTANT_COACH' || coach.role === 'HEAD_COACH')
    .map((coach) => {
      const studentCount = studentCounts.get(coach.id) || 0;
      return {
        coachId: coach.id,
        coachName: coach.name,
        studentCount,
        isOverloaded: studentCount > 10,
        isBalanced: studentCount >= 5 && studentCount <= 10,
        isUnderloaded: studentCount < 5 && studentCount > 0,
      };
    });
  
  // Sort by student count (descending)
  return workloads.sort((a, b) => b.studentCount - a.studentCount);
}
