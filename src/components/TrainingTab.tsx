import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Student } from '../types';
import './TrainingTab.css';

/**
 * TrainingTab Component
 * Shows strengths, weaknesses, and coach feedback for a student.
 * Skill assessment is done in the Progress tab.
 */

interface TrainingTabProps {
  student: Student;
  onUpdateStrengths?: (strengths: string[]) => void;
  onUpdateWeaknesses?: (weaknesses: string[]) => void;
  onUpdateFeedback?: (feedback: string) => void;
  onSave?: (updates: { strengths?: string[]; weaknesses?: string[]; coachFeedback?: string }) => Promise<void>;
}

export const TrainingTab: React.FC<TrainingTabProps> = ({
  student,
  onUpdateStrengths,
  onUpdateWeaknesses,
  onUpdateFeedback,
  onSave,
}) => {
  const { role } = useAuth();
  const isCoach = role === 'HEAD_COACH' || role === 'ASSISTANT_COACH';

  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [strengths, setStrengths] = useState<string[]>(student.strengths ?? []);
  const [weaknesses, setWeaknesses] = useState<string[]>(student.weaknesses ?? []);
  const [feedback, setFeedback] = useState<string>(student.coachFeedback ?? '');
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');

  const handleAddStrength = () => {
    const trimmed = newStrength.trim();
    if (!trimmed || strengths.includes(trimmed)) return;
    const updated = [...strengths, trimmed];
    setStrengths(updated);
    setNewStrength('');
    onUpdateStrengths?.(updated);
  };

  const handleRemoveStrength = (tag: string) => {
    const updated = strengths.filter((s) => s !== tag);
    setStrengths(updated);
    onUpdateStrengths?.(updated);
  };

  const handleAddWeakness = () => {
    const trimmed = newWeakness.trim();
    if (!trimmed || weaknesses.includes(trimmed)) return;
    const updated = [...weaknesses, trimmed];
    setWeaknesses(updated);
    setNewWeakness('');
    onUpdateWeaknesses?.(updated);
  };

  const handleRemoveWeakness = (tag: string) => {
    const updated = weaknesses.filter((w) => w !== tag);
    setWeaknesses(updated);
    onUpdateWeaknesses?.(updated);
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value);
    onUpdateFeedback?.(e.target.value);
  };

  const handleSaveAll = async () => {
    if (!onSave) return;
    setIsSaving(true);
    setSaveErr(null);
    setSaveMsg(null);
    try {
      await onSave({ strengths, weaknesses, coachFeedback: feedback });
      setSaveMsg('Saved ✓');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveErr('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="training-tab" data-testid="training-tab">
      {/* Own header row so this Save button never competes for space with
          the Progress tab's "Record Assessment" button above it — that one
          saves skill scores, this one saves strengths/weaknesses/feedback. */}
      <div className="training-tab-header">
        <h3 className="training-tab-title">Coach Notes</h3>
        {isCoach && onSave && (
          <div className="training-tab-save-actions">
            {saveMsg && <span className="training-tab-save-msg training-tab-save-msg--ok">{saveMsg}</span>}
            {saveErr && <span className="training-tab-save-msg training-tab-save-msg--err">{saveErr}</span>}
            <button type="button" className="btn-create-fee" onClick={handleSaveAll} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="training-tab-sections">

        {/* Strengths + Areas to Improve side by side */}
        <div className="training-tab-columns">
          <div className="tag-section" data-testid="strengths-section">
            <h4 className="training-tab-heading">Strengths</h4>
            <div className="tag-list">
              {strengths.map((s) => (
                <span key={s} className="tag-strength" data-testid="strength-tag">
                  {s}
                  {isCoach && (
                    <button className="tag-remove" onClick={() => handleRemoveStrength(s)} aria-label={`Remove ${s}`} type="button">×</button>
                  )}
                </span>
              ))}
              {strengths.length === 0 && <span className="tag-empty">No strengths added yet</span>}
            </div>
            {isCoach && (
              <div className="tag-input-group" data-testid="add-strength-input">
                <input
                  type="text"
                  className="tag-input"
                  placeholder="Add a strength..."
                  value={newStrength}
                  onChange={(e) => setNewStrength(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStrength(); } }}
                  aria-label="New strength"
                />
                <button className="tag-add-btn tag-add-btn-strength" onClick={handleAddStrength} type="button" disabled={!newStrength.trim()}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                  Add
                </button>
              </div>
            )}
          </div>

          <div className="tag-section" data-testid="weaknesses-section">
            <h4 className="training-tab-heading">Areas to Improve</h4>
            <div className="tag-list">
              {weaknesses.map((w) => (
                <span key={w} className="tag-weakness" data-testid="weakness-tag">
                  {w}
                  {isCoach && (
                    <button className="tag-remove" onClick={() => handleRemoveWeakness(w)} aria-label={`Remove ${w}`} type="button">×</button>
                  )}
                </span>
              ))}
              {weaknesses.length === 0 && <span className="tag-empty">No weaknesses added yet</span>}
            </div>
            {isCoach && (
              <div className="tag-input-group" data-testid="add-weakness-input">
                <input
                  type="text"
                  className="tag-input"
                  placeholder="Add a weakness..."
                  value={newWeakness}
                  onChange={(e) => setNewWeakness(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddWeakness(); } }}
                  aria-label="New weakness"
                />
                <button className="tag-add-btn tag-add-btn-weakness" onClick={handleAddWeakness} type="button" disabled={!newWeakness.trim()}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Coach Feedback — full width below the two columns */}
        <div className="feedback-section" data-testid="feedback-section">
          <h4 className="training-tab-heading">Coach Feedback</h4>
          {isCoach ? (
            <textarea
              className="coach-feedback-textarea"
              value={feedback}
              onChange={handleFeedbackChange}
              placeholder="Write feedback for this student..."
              rows={5}
              aria-label="Coach feedback"
              data-testid="coach-feedback-textarea"
            />
          ) : (
            <p className="coach-feedback-text" data-testid="coach-feedback-readonly">
              {feedback || 'No feedback available yet.'}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default TrainingTab;
