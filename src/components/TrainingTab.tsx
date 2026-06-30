import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Student } from '../types';
import './TrainingTab.css';

/**
 * TrainingTab Component
 * Displays strengths (green tags), weaknesses (red tags), and coach feedback
 * Coaches (HEAD_COACH, ASSISTANT_COACH) can add/remove tags and edit feedback
 * Students see a read-only view
 * Requirements: 5.8, 5.9
 */

interface TrainingTabProps {
  student: Student;
  onUpdateStrengths?: (strengths: string[]) => void;
  onUpdateWeaknesses?: (weaknesses: string[]) => void;
  onUpdateFeedback?: (feedback: string) => void;
}

export const TrainingTab: React.FC<TrainingTabProps> = ({
  student,
  onUpdateStrengths,
  onUpdateWeaknesses,
  onUpdateFeedback,
}) => {
  const { role } = useAuth();
  const isCoach = role === 'HEAD_COACH' || role === 'ASSISTANT_COACH';

  const [strengths, setStrengths] = useState<string[]>(student.strengths);
  const [weaknesses, setWeaknesses] = useState<string[]>(student.weaknesses);
  const [feedback, setFeedback] = useState<string>(student.coachFeedback || '');
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');

  const handleAddStrength = () => {
    const trimmed = newStrength.trim();
    if (!trimmed) return;
    if (strengths.includes(trimmed)) return;
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
    if (!trimmed) return;
    if (weaknesses.includes(trimmed)) return;
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

  const handleStrengthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddStrength();
    }
  };

  const handleWeaknessKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddWeakness();
    }
  };

  return (
    <div className="training-tab" data-testid="training-tab">
      <h2 className="tab-section-title">Training Overview</h2>

      <div className="training-tab-sections">
        {/* Strengths Section */}
        <div className="tag-section" data-testid="strengths-section">
          <h3 className="tag-section-title">Strengths</h3>
          <div className="tag-list">
            {strengths.map((strength) => (
              <span key={strength} className="tag tag-strength" data-testid="strength-tag">
                {strength}
                {isCoach && (
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveStrength(strength)}
                    aria-label={`Remove strength: ${strength}`}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {strengths.length === 0 && (
              <span className="tag-empty">No strengths added yet</span>
            )}
          </div>
          {isCoach && (
            <div className="tag-input-group" data-testid="add-strength-input">
              <input
                type="text"
                className="tag-input"
                placeholder="Add a strength..."
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                onKeyDown={handleStrengthKeyDown}
                aria-label="New strength"
              />
              <button
                className="tag-add-btn tag-add-btn-strength"
                onClick={handleAddStrength}
                type="button"
                disabled={!newStrength.trim()}
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Weaknesses Section */}
        <div className="tag-section" data-testid="weaknesses-section">
          <h3 className="tag-section-title">Areas to Improve</h3>
          <div className="tag-list">
            {weaknesses.map((weakness) => (
              <span key={weakness} className="tag tag-weakness" data-testid="weakness-tag">
                {weakness}
                {isCoach && (
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveWeakness(weakness)}
                    aria-label={`Remove weakness: ${weakness}`}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {weaknesses.length === 0 && (
              <span className="tag-empty">No weaknesses added yet</span>
            )}
          </div>
          {isCoach && (
            <div className="tag-input-group" data-testid="add-weakness-input">
              <input
                type="text"
                className="tag-input"
                placeholder="Add a weakness..."
                value={newWeakness}
                onChange={(e) => setNewWeakness(e.target.value)}
                onKeyDown={handleWeaknessKeyDown}
                aria-label="New weakness"
              />
              <button
                className="tag-add-btn tag-add-btn-weakness"
                onClick={handleAddWeakness}
                type="button"
                disabled={!newWeakness.trim()}
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Coach Feedback Section */}
        <div className="feedback-section" data-testid="feedback-section">
          <h3 className="tag-section-title">Coach Feedback</h3>
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
