// ===== Grade Goals & Advisory System =====

// Grading scale
const GRADE_SCALE = [
  { grade: 'A+', gpa: 5.0, min: 85, max: 100 },
  { grade: 'A',  gpa: 5.0, min: 80, max: 84 },
  { grade: 'A-', gpa: 4.5, min: 75, max: 79 },
  { grade: 'B+', gpa: 4.0, min: 70, max: 74 },
  { grade: 'B',  gpa: 3.5, min: 65, max: 69 },
  { grade: 'B-', gpa: 3.0, min: 60, max: 64 },
  { grade: 'C+', gpa: 2.5, min: 55, max: 59 },
  { grade: 'C',  gpa: 2.0, min: 50, max: 54 },
  { grade: 'D+', gpa: 1.5, min: 45, max: 49 },
  { grade: 'D',  gpa: 1.0, min: 40, max: 44 },
  { grade: 'F',  gpa: 0.0, min: 0,  max: 39 }
];

function getMinScoreForGrade(targetGrade) {
  const entry = GRADE_SCALE.find(g => g.grade === targetGrade);
  return entry ? entry.min : 50;
}

function getGradeFromScore(score) {
  for (const entry of GRADE_SCALE) {
    if (score >= entry.min) return entry.grade;
  }
  return 'F';
}

function loadGoals() {
  const stored = localStorage.getItem('studentGradeGoals');
  return stored ? JSON.parse(stored) : [];
}

function saveGoals(goals) {
  localStorage.setItem('studentGradeGoals', JSON.stringify(goals));
}

// Add a new module goal
function addModuleGoal() {
  const moduleName = document.getElementById('goalModuleName').value.trim();
  const targetGrade = document.getElementById('goalTargetGrade').value;

  if (!moduleName) {
    alert('Please enter a module name.');
    return;
  }

  const goals = loadGoals();

  if (goals.find(g => g.moduleName.toLowerCase() === moduleName.toLowerCase())) {
    alert('This module already exists.');
    return;
  }

  goals.push({
    id: Date.now().toString(),
    moduleName: moduleName,
    targetGrade: targetGrade,
    assessments: []
  });

  saveGoals(goals);
  document.getElementById('goalModuleName').value = '';
  document.getElementById('goalTargetGrade').value = 'C';
  renderGoals();
}

// Add an assessment to a module
function addAssessment(moduleId) {
  const nameInput = document.getElementById(`assessName_${moduleId}`);
  const weightInput = document.getElementById(`assessWeight_${moduleId}`);
  const maxInput = document.getElementById(`assessMax_${moduleId}`);

  const name = nameInput.value.trim();
  const weight = parseFloat(weightInput.value);
  const maxScore = parseFloat(maxInput.value);

  if (!name) { alert('Please enter an assessment name.'); return; }
  if (isNaN(weight) || weight <= 0 || weight > 100) { alert('Please enter a valid weight (1-100).'); return; }
  if (isNaN(maxScore) || maxScore <= 0) { alert('Please enter a valid max score.'); return; }

  const goals = loadGoals();
  const goal = goals.find(g => g.id === moduleId);
  if (!goal) return;

  const currentTotal = goal.assessments.reduce((sum, a) => sum + a.weight, 0);
  if (currentTotal + weight > 100) {
    alert(`Total weight cannot exceed 100%. Current: ${currentTotal}%. You can add up to ${100 - currentTotal}% more.`);
    return;
  }

  goal.assessments.push({
    id: Date.now().toString(),
    name: name,
    weight: weight,
    maxScore: maxScore,
    actualScore: null
  });

  saveGoals(goals);
  nameInput.value = '';
  weightInput.value = '';
  maxInput.value = '';
  renderGoals();
}

// Record actual score
function recordScore(moduleId, assessmentId) {
  const input = document.getElementById(`score_${assessmentId}`);
  const score = parseFloat(input.value);

  const goals = loadGoals();
  const goal = goals.find(g => g.id === moduleId);
  if (!goal) return;
  const assessment = goal.assessments.find(a => a.id === assessmentId);
  if (!assessment) return;

  if (isNaN(score) || score < 0 || score > assessment.maxScore) {
    alert(`Please enter a score between 0 and ${assessment.maxScore}.`);
    return;
  }

  assessment.actualScore = score;
  saveGoals(goals);
  renderGoals();
}

// Clear score
function clearScore(moduleId, assessmentId) {
  const goals = loadGoals();
  const goal = goals.find(g => g.id === moduleId);
  if (!goal) return;
  const assessment = goal.assessments.find(a => a.id === assessmentId);
  if (!assessment) return;
  assessment.actualScore = null;
  saveGoals(goals);
  renderGoals();
}

// Delete assessment
function deleteAssessment(moduleId, assessmentId) {
  const goals = loadGoals();
  const goal = goals.find(g => g.id === moduleId);
  if (!goal) return;
  goal.assessments = goal.assessments.filter(a => a.id !== assessmentId);
  saveGoals(goals);
  renderGoals();
}

// Delete module goal
function deleteModuleGoal(moduleId) {
  if (!confirm('Remove this goal?')) return;
  const goals = loadGoals().filter(g => g.id !== moduleId);
  saveGoals(goals);
  renderGoals();
}

// Calculate advisory
function calculateAdvisory(goal) {
  const targetMin = getMinScoreForGrade(goal.targetGrade);
  const assessments = goal.assessments;
  const totalWeight = assessments.reduce((sum, a) => sum + a.weight, 0);

  if (assessments.length === 0) {
    return { status: 'no-assessments', message: 'Add assessments to get started.' };
  }

  const completed = assessments.filter(a => a.actualScore !== null);
  const remaining = assessments.filter(a => a.actualScore === null);

  // Weighted percentage earned so far
  const pointsEarned = completed.reduce((sum, a) => sum + (a.actualScore / a.maxScore) * a.weight, 0);
  const pointsNeeded = (targetMin / 100) * totalWeight;
  const remainingWeight = remaining.reduce((sum, a) => sum + a.weight, 0);

  // Current earned percentage (out of total weight)
  const currentEarnedPct = (pointsEarned / totalWeight) * 100;

  if (remaining.length === 0) {
    const finalGrade = getGradeFromScore(currentEarnedPct);
    const achieved = currentEarnedPct >= targetMin;
    return {
      status: achieved ? 'achieved' : 'missed',
      message: achieved
        ? `Congratulations! Final score: ${currentEarnedPct.toFixed(1)}% (${finalGrade}). You hit your target of ${goal.targetGrade}!`
        : `Final score: ${currentEarnedPct.toFixed(1)}% (${finalGrade}). You missed your target of ${goal.targetGrade} (needed ${targetMin}%).`
    };
  }

  const pointsStillNeeded = pointsNeeded - pointsEarned;

  if (pointsStillNeeded <= 0) {
    // Calculate suggested scores (they can get 0 and still pass)
    const suggestions = remaining.map(a => ({ name: a.name, maxScore: a.maxScore, suggestedScore: 0 }));
    return {
      status: 'secured',
      message: `You've already secured ${goal.targetGrade}! Current earned: ${currentEarnedPct.toFixed(1)}%. Keep up the good work!`,
      suggestions: suggestions
    };
  }

  // Required average percentage across remaining
  const requiredPct = (pointsStillNeeded / remainingWeight) * 100;

  if (requiredPct > 100) {
    return {
      status: 'impossible',
      message: `Even with 100% on remaining assessments, you can't reach ${goal.targetGrade} (needs ${targetMin}%). Consider adjusting your target.`,
      suggestions: remaining.map(a => ({ name: a.name, maxScore: a.maxScore, suggestedScore: a.maxScore }))
    };
  }

  // Suggested score for each remaining assessment
  const suggestions = remaining.map(a => {
    const suggested = (requiredPct / 100) * a.maxScore;
    return { name: a.name, maxScore: a.maxScore, suggestedScore: suggested };
  });

  return {
    status: 'on-track',
    currentEarnedPct: currentEarnedPct.toFixed(1),
    requiredPct: requiredPct.toFixed(1),
    message: `You're on track for ${goal.targetGrade}. Current earned: ${currentEarnedPct.toFixed(1)}%. Keep up the good work!`,
    suggestions: suggestions
  };
}

// Render all goals
function renderGoals() {
  const goals = loadGoals();
  const container = document.getElementById('goalsContainer');

  if (goals.length === 0) {
    container.innerHTML = '<div class="goals-empty"><p>No module goals set yet. Add a module above to get started!</p></div>';
    return;
  }

  container.innerHTML = goals.map(goal => {
    const advisory = calculateAdvisory(goal);
    const totalWeight = goal.assessments.reduce((sum, a) => sum + a.weight, 0);
    const completedCount = goal.assessments.filter(a => a.actualScore !== null).length;
    const targetMin = getMinScoreForGrade(goal.targetGrade);

    // Status badge
    let statusBadge = '';
    if (advisory.status === 'on-track' || advisory.status === 'secured') {
      statusBadge = '<span class="badge badge-success">&#10003; On Track</span>';
    } else if (advisory.status === 'achieved') {
      statusBadge = '<span class="badge badge-success">&#127881; Achieved</span>';
    } else if (advisory.status === 'impossible' || advisory.status === 'missed') {
      statusBadge = '<span class="badge badge-danger">&#9888; At Risk</span>';
    }

    return `
      <div class="goal-card">
        <div class="goal-card-header">
          <div class="goal-card-title-section">
            <h4>${escapeHtml(goal.moduleName)}</h4>
            <span class="goal-subtitle">Target: ${goal.targetGrade} (&ge;${targetMin}%) &middot; ${completedCount}/${goal.assessments.length} assessments completed</span>
          </div>
          ${statusBadge}
        </div>

        <!-- Assessments Table -->
        ${goal.assessments.length > 0 ? `
        <div class="goal-assessments">
          <table class="data-table">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Weight</th>
                <th>Suggested</th>
                <th>Actual Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${goal.assessments.map(a => {
                const isDone = a.actualScore !== null;
                const pct = isDone ? ((a.actualScore / a.maxScore) * 100).toFixed(1) : null;

                // Find suggestion for this assessment
                let suggested = '';
                if (isDone) {
                  suggested = 'Done';
                } else if (advisory.suggestions) {
                  const s = advisory.suggestions.find(s => s.name === a.name);
                  if (s) {
                    suggested = `<span class="suggested-score">${(s.suggestedScore).toFixed(1)}/${a.maxScore}</span>`;
                  }
                }

                return `
                  <tr class="${isDone ? 'row-done' : ''}">
                    <td>${escapeHtml(a.name)}</td>
                    <td>${a.weight}%</td>
                    <td>${suggested}</td>
                    <td>
                      ${isDone
                        ? `<strong>${a.actualScore}/${a.maxScore}</strong> <span class="score-pct">${pct}%</span>`
                        : `<div class="score-input-group">
                            <input type="number" id="score_${a.id}" min="0" max="${a.maxScore}" placeholder="Score" class="score-input">
                            <span class="score-max">/ ${a.maxScore}</span>
                          </div>`
                      }
                    </td>
                    <td>
                      ${isDone
                        ? `<button class="btn-sm btn-outline" onclick="clearScore('${goal.id}', '${a.id}')">Edit</button>`
                        : `<button class="btn-sm btn-primary" onclick="recordScore('${goal.id}', '${a.id}')">Save</button>`
                      }
                      <button class="btn-sm btn-danger-outline" onclick="deleteAssessment('${goal.id}', '${a.id}')" title="Remove">&#10005;</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Add Assessment Form -->
        ${totalWeight < 100 ? `
        <div class="add-assessment-form">
          <input type="text" id="assessName_${goal.id}" placeholder="Name (e.g., CA1, Exam)" class="form-input">
          <input type="number" id="assessWeight_${goal.id}" min="1" max="${100 - totalWeight}" placeholder="Weight %" class="form-input form-input-sm">
          <input type="number" id="assessMax_${goal.id}" min="1" placeholder="Max score" class="form-input form-input-sm">
          <button class="btn-sm btn-primary" onclick="addAssessment('${goal.id}')">+ Add</button>
        </div>
        ` : ''}

        <!-- Advisory Box -->
        <div class="advisory-box advisory-${advisory.status}">
          <div class="advisory-content">
            <p class="advisory-title">${getAdvisoryTitle(advisory.status)}</p>
            <p class="advisory-message">${advisory.message}</p>
            ${advisory.suggestions && advisory.suggestions.length > 0 && advisory.status !== 'secured' && advisory.status !== 'achieved' ? `
              <div class="advisory-breakdown">
                ${advisory.suggestions.filter(s => s.suggestedScore > 0).map(s => `
                  <p>&rarr; <strong>${escapeHtml(s.name)}</strong>: aim for at least <strong>${s.suggestedScore.toFixed(1)}/${s.maxScore}</strong></p>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <button class="btn-remove-goal" onclick="deleteModuleGoal('${goal.id}')">&#128465; Remove Goal</button>
      </div>
    `;
  }).join('');
}

function getAdvisoryTitle(status) {
  switch (status) {
    case 'achieved': return '&#127881; Goal Achieved!';
    case 'secured': return '&#10003; On Track';
    case 'on-track': return '&#10003; On Track';
    case 'impossible': return '&#9888; At Risk';
    case 'missed': return '&#9888; Goal Missed';
    default: return '&#128203; Get Started';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  renderGoals();
});
