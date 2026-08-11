/**
 * Bug Condition Exploration Tests
 * 
 * These tests encode the EXPECTED (correct) behavior for the drill/curriculum
 * management system. They are designed to FAIL on unfixed code, proving the
 * bug exists.
 * 
 * Property 1: Bug Condition - Data Source Inconsistency and Missing Propagation
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8**
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Test 1: DrillLibrary makes API call to GET /api/drills
// Bug Condition: drillLibraryReadsStaticJSON = DrillLibrary.dataSource == 'src/data/drills.json'
// Expected: DrillLibrary fetches from GET /api/drills (not static JSON)
// Validates: Requirements 1.1, 1.2
// ============================================================================

describe('Bug Condition Exploration: DrillLibrary Data Source', () => {
  const drillLibrarySource = fs.readFileSync(
    path.resolve(__dirname, '../components/DrillLibrary.tsx'),
    'utf-8'
  );

  it('should NOT import drills from static JSON file', () => {
    // The unfixed code has: import drillsData from '../data/drills.json'
    // The fixed code should NOT have this import
    const importsStaticJSON = drillLibrarySource.includes("from '../data/drills.json'") ||
                               drillLibrarySource.includes('from "../data/drills.json"');
    
    expect(importsStaticJSON).toBe(false);
  });

  it('should fetch drills from the API using apiClient or a useDrills hook', () => {
    // The fixed code should use apiClient.get('/drills') or a hook that fetches from API
    const usesApiClient = drillLibrarySource.includes('apiClient') ||
                           drillLibrarySource.includes('useDrills') ||
                           drillLibrarySource.includes("get('/drills')") ||
                           drillLibrarySource.includes('get("/drills")');
    
    expect(usesApiClient).toBe(true);
  });

  it('should have a loading state while fetching drills from API', () => {
    // The fixed code should show a loading state while the API call is in progress
    const hasLoadingState = drillLibrarySource.includes('loading') ||
                             drillLibrarySource.includes('Loading') ||
                             drillLibrarySource.includes('isLoading');
    
    expect(hasLoadingState).toBe(true);
  });
});

// ============================================================================
// Test 2: CurriculumBuilderPage save calls POST /api/curriculum
// Bug Condition: curriculumBuilderWritesToLocalStorage = CurriculumBuilderPage.persistTarget == 'localStorage'
// Expected: Save persists via POST /api/curriculum to backend
// Validates: Requirements 1.3, 1.4, 1.5
// ============================================================================

describe('Bug Condition Exploration: CurriculumBuilderPage Persistence', () => {
  const builderSource = fs.readFileSync(
    path.resolve(__dirname, '../pages/CurriculumBuilderPage.tsx'),
    'utf-8'
  );

  it('should NOT write curriculum plans to localStorage', () => {
    // The unfixed code has: localStorage.setItem('curriculumPlans', ...)
    // The fixed code should NOT use localStorage for curriculum persistence
    const usesLocalStorageForSave = builderSource.includes("localStorage.setItem('curriculumPlans'") ||
                                     builderSource.includes('localStorage.setItem("curriculumPlans"') ||
                                     builderSource.includes("localStorage.setItem(`curriculumPlans`");
    
    expect(usesLocalStorageForSave).toBe(false);
  });

  it('should NOT read curriculum plans from localStorage', () => {
    // The unfixed code has: localStorage.getItem('curriculumPlans')
    // The fixed code should fetch from API instead
    const readsFromLocalStorage = builderSource.includes("localStorage.getItem('curriculumPlans'") ||
                                   builderSource.includes('localStorage.getItem("curriculumPlans"');
    
    expect(readsFromLocalStorage).toBe(false);
  });

  it('should use useCurriculum hook or apiClient to persist plans to API', () => {
    // The fixed code should use useCurriculum hook (like IndividualCurriculumPage does)
    // or directly call apiClient.post('/curriculum')
    const usesApiForPersistence = builderSource.includes('useCurriculum') ||
                                    builderSource.includes("post('/curriculum')") ||
                                    builderSource.includes('post("/curriculum")') ||
                                    builderSource.includes('createPlan') ||
                                    builderSource.includes('cloneBatchPlan');
    
    expect(usesApiForPersistence).toBe(true);
  });

  it('should NOT import static curriculum data from JSON', () => {
    // The unfixed code has: import curriculumData from '../data/curriculum.json'
    const importsStaticCurriculum = builderSource.includes("from '../data/curriculum.json'") ||
                                     builderSource.includes('from "../data/curriculum.json"');
    
    expect(importsStaticCurriculum).toBe(false);
  });

  it('should NOT import static students data from JSON', () => {
    // The unfixed code has: import studentsData from '../data/students.json'
    const importsStaticStudents = builderSource.includes("from '../data/students.json'") ||
                                   builderSource.includes('from "../data/students.json"');
    
    expect(importsStaticStudents).toBe(false);
  });
});

// ============================================================================
// Test 3: SessionCalendarPage entries include populated drills[] from assigned curriculum
// Bug Condition: calendarMissingCurriculumDrills = SessionCalendarPage.entries[].drills NOT populated
// Expected: Calendar entries have drills[] populated from assigned curriculum
// Validates: Requirements 1.6, 1.7
// ============================================================================

describe('Bug Condition Exploration: Calendar Drill Population', () => {
  const hookSource = fs.readFileSync(
    path.resolve(__dirname, '../hooks/useSessionSchedule.ts'),
    'utf-8'
  );

  it('should have code logic (not just comments) that joins curriculum drills into calendar entries', () => {
    // The useSessionCalendar hook or the API it calls should join curriculum data.
    // In the fixed version, either:
    // 1. The API endpoint /api/session-calendar returns entries with populated drills, OR
    // 2. The hook does a secondary fetch to get curriculum and merge drills into entries
    //
    // Currently, templateSessionToCalendarEntry always sets drills: [] and the API
    // does not join curriculum data. The word "curriculum" only appears in comments.
    //
    // Strip comments and check if the actual CODE references curriculum operations.
    const codeWithoutComments = hookSource
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove block comments
      .replace(/\/\/.*/g, '');            // Remove line comments
    
    const codeReferencesCurriculum = codeWithoutComments.includes('curriculum') ||
                                      codeWithoutComments.includes('useCurriculum') ||
                                      codeWithoutComments.includes('curriculumPlan');
    
    expect(codeReferencesCurriculum).toBe(true);
  });

  it('should enrich calendar entries with drills from curriculum plans (not always empty)', () => {
    // The templateSessionToCalendarEntry function currently hardcodes drills: []
    // and the hook does not enrich entries with curriculum data.
    //
    // In the fixed version, the hook should either:
    // - Pass through drills from API (which should now include populated drills), OR
    // - Do a secondary fetch and merge curriculum drill data into entries
    //
    // Strip comments and check that there is active logic to merge/populate drills
    const codeWithoutComments = hookSource
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');
    
    // The fixed version must have logic that fetches or merges curriculum drill data
    // into the calendar entries. This means the code should reference curriculum plans,
    // or the API response should already include populated drills (which the hook passes
    // through without modification). Either way, the hook or API must have a curriculum
    // data join.
    //
    // Look for concrete drill population: fetching curriculum, merging drills into entries,
    // or mapping curriculum weeks to calendar entries
    const hasDrillPopulationLogic = 
      codeWithoutComments.includes('curriculumPlan') ||
      codeWithoutComments.includes('curriculum_plan') ||
      codeWithoutComments.includes('.drills.map') ||
      codeWithoutComments.includes('.drills.filter') ||
      codeWithoutComments.includes('entry.drills') ||
      // The hook should merge drill names from curriculum into entries
      codeWithoutComments.includes('focusArea:') && !codeWithoutComments.includes("focusArea: ''");
    
    // In the fixed version, there must be curriculum-drills population logic
    expect(hasDrillPopulationLogic).toBe(true);
  });
});

// ============================================================================
// Test 4: Reassigning curriculum for student with progress shows confirmation dialog
// Bug Condition: reassignmentMissingWarning = (action == 'reassignCurriculum' AND hasProgress AND NOT confirmationShown)
// Expected: Confirmation warning displayed before proceeding with reassignment
// Validates: Requirement 1.8
// ============================================================================

describe('Bug Condition Exploration: Curriculum Reassignment Warning', () => {
  // Check all relevant source files for reassignment confirmation logic
  const individualPageSource = fs.readFileSync(
    path.resolve(__dirname, '../pages/IndividualCurriculumPage.tsx'),
    'utf-8'
  );
  
  const builderPageSource = fs.readFileSync(
    path.resolve(__dirname, '../pages/CurriculumBuilderPage.tsx'),
    'utf-8'
  );
  
  const allRelevantSource = individualPageSource + builderPageSource;

  it('should check for existing student progress before curriculum reassignment', () => {
    // The fixed code should query training logs or check if student has progress
    // beyond week 1 before allowing reassignment
    const hasProgressCheck = allRelevantSource.includes('progress') ||
                              allRelevantSource.includes('training_log') ||
                              allRelevantSource.includes('trainingLog') ||
                              allRelevantSource.includes('weekNumber > 1') ||
                              allRelevantSource.includes('hasProgress');
    
    expect(hasProgressCheck).toBe(true);
  });

  it('should display confirmation warning about progress reset on reassignment', () => {
    // The fixed code should show a confirmation dialog/modal warning that
    // the student's progress will reset to week 1, day 1
    const hasConfirmationWarning = allRelevantSource.includes('confirm') ||
                                    allRelevantSource.includes('Confirm') ||
                                    allRelevantSource.includes('Are you sure') ||
                                    allRelevantSource.includes('progress will reset') ||
                                    allRelevantSource.includes('week 1');
    
    expect(hasConfirmationWarning).toBe(true);
  });

  it('should require explicit user confirmation before proceeding with reassignment', () => {
    // The fixed code should have a mechanism to block reassignment until
    // the user explicitly confirms (e.g., a modal with confirm/cancel buttons)
    const hasExplicitConfirmation = allRelevantSource.includes('setShowConfirm') ||
                                     allRelevantSource.includes('confirmDialog') ||
                                     allRelevantSource.includes('ConfirmModal') ||
                                     allRelevantSource.includes('window.confirm') ||
                                     allRelevantSource.includes('confirmReassign') ||
                                     allRelevantSource.includes('showWarning');
    
    expect(hasExplicitConfirmation).toBe(true);
  });
});
