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

// Get minimum score needed for a target grade
function getMinScoreForGrade(targetGrade) {
  const entry = GRADE_SCALE.find(g => g.grade === targetGrade);
  return entry ? entry.min : 50;
}

// Get grade from a percentage score
function getGradeFromScore(score) {
  for (const entry of GRADE_SCALE) {
    if (score >= entry.min) return entry.grade;
  }
  return 'F';
}

// Load goals from localStorage
function loadGoals() {
  const stored = localStorage.getItem('studentGradeGoals');
  return stored ? JSON.parse(stored) : [];
}

// Save goals to localStorage
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

  // Check if module already exists
  if (goals.find(g => g.moduleName.toLowerCase() === moduleName.toLowerCase())) {
    alert('This module already exists. Please edit the existing one or use a different name.');
    return;
  }

  const newGoal = {
    id: Date.now().toString(),
    moduleName: moduleName,
    targetGrade: targetGrade,
    assessments: [],
    createdAt: new Date().toISOString()
  };

  goals.push(newGoal);
  saveGoals(goals);

  // Clear form
  document.getElementById('goalModuleName').value = '';
  document.getElementById('goalTargetGrade').value = 'C';

  renderGoals();
}

// Add an assessment to a module
function addAssessment(moduleId) {
  const nameInput = document.getElementById(`assessName_${moduleId}`);
  const weightInput = document.getElementById(`assessWeight_${moduleId}`);

  const name = nameInput.value.trim();
  const weight = parseFloat(weightInput.value);

  if (!name) {
    alert('Please enter an assessment name.');
    return;
  }
  if (isNaN(weight) || weight <= 0 || weight > 100) {
    alert('Please enter a valid weight between 1 and 100.');
    return;
  }

  const goals = loadGoals();
  const goal = goals.find(g => g.id === moduleId);
  if (!goal) return;

  // Check total weight doesn't exceed 100
  const currentTotal = goal.assessments.reduce((sum, a) => sum + a.weight, 0);
  if (currentTotal + weight > 100) {
    alert(`Total weight cannot exceed 100%. Current total: ${currentTotal}%. You can add up to ${100 - currentTotal}% more.`);
    return;
  }

  goal.assessments.push({
    id: Date.now().toString(),
    name: name,
    weight: weight,
    actualScore: null // null means not yet completed
  });

  saveGoals(goals);
  nameInput.value = '';
  weightInput.value = '';
  renderGoals();
}

// Record actual score for an assessment
function recordScore(moduleId, assessmentId) {
  const input = document.getElementById(`score_${assessmentId}`);
  const score = parseFloat(input.value);

  if (isNaN(score) || score < 0 || score > 100) {
    alert('Please enter a valid score between 0 and 100 (as a percentage).');
    return;
  }

  const goals = loadGoals();
  const goal = goals.find(g => g.id === moduleId);
  if (!goal) return;

  const assessment = goal.assessments.find(a => a.id === assessmentId);
  if (!assessment) return;

  assessment.actualScore = score;
  saveGoals(goals);
  renderGoals();
}

// Clear a recorded score
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

// Delete an assessment
function deleteAssessment(moduleId, assessmentId) {
  const goals = loadGoals();
  const goal = goals.find(g => g.id === moduleId);
  if (!goal) return;

  goal.assessments = goal.assessments.filter(a => a.id !== assessmentId);
  saveGoals(goals);
  renderGoals();
}

// Delete a module goal
function deleteModuleGoal(moduleId) {
  if (!confirm('Are you sure you want to delete this module goal?')) return;
  const goals = loadGoals().filter(g => g.id !== moduleId);
  saveGoals(goals);
  renderGoals();
}

// Calculate advisory for a module
function calculateAdvisory(goal) {
  const targetMin = getMinScoreForGrade(goal.targetGrade);
  const assessments = goal.assessments;
  const totalWeight = assessments.reduce((sum, a) => sum + a.weight, 0);

  if (assessments.length === 0) {
    return {
      status: 'no-assessments',
      message: 'Add assessments with their weightages to get advice.'
    };
  }

  // Separate completed and remaining assessments
  const completed = assessments.filter(a => a.actualScore !== null);
  const remaining = assessments.filter(a => a.actualScore === null);

  // Points earned so far (weighted)
  const pointsEarned = completed.reduce((sum, a) => sum + (a.actualScore / 100) * a.weight, 0);

  // Points needed to hit target
  const pointsNeeded = (targetMin / 100) * totalWeight;

  // Remaining weight
  const remainingWeight = remaining.reduce((sum, a) => sum + a.weight, 0);

  if (remaining.length === 0) {
    // All assessments completed — show final result
    const finalPercentage = (pointsEarned / totalWeight) * 100;
    const finalGrade = getGradeFromScore(finalPercentage);
    const achieved = finalPercentage >= targetMin;

    return {
      status: achieved ? 'achieved' : 'missed',
      finalPercentage: finalPercentage.toFixed(1),
      finalGrade: finalGrade,
      message: achieved
        ? `Congratulations! You scored ${finalPercentage.toFixed(1)}% overall (${finalGrade}). You achieved your target of ${goal.targetGrade}!`
        : `You scored ${finalPercentage.toFixed(1)}% overall (${finalGrade}). Unfortunately, you missed your target of ${goal.targetGrade}. The minimum required was ${targetMin}%.`
    };
  }

  // Calculate how many points still needed from remaining assessments
  const pointsStillNeeded = pointsNeeded - pointsEarned;

  if (pointsStillNeeded <= 0) {
    // Already secured the grade
    return {
      status: 'secured',
      message: `Great news! You've already secured enough marks for ${goal.targetGrade}. Even if you score 0 on remaining assessments, you'll still meet your target!`,
      remaining: remaining,
      requiredPercentage: 0
    };
  }

  // Required average percentage across remaining assessments
  const requiredPercentage = (pointsStillNeeded / remainingWeight) * 100;

  if (requiredPercentage > 100) {
    return {
      status: 'impossible',
      message: `Unfortunately, even with 100% on all remaining assessments, you cannot reach ${goal.targetGrade} (needs ${targetMin}%). Consider adjusting your target grade.`,
      remaining: remaining,
      requiredPercentage: requiredPercentage.toFixed(1)
    };
  }

  // Build per-assessment advice
  const advice = remaining.map(a => {
    const neededScore = (pointsStillNeeded / remainingWeight) * a.weight;
    const neededPercentage = (neededScore / a.weight) * 100;
    const neededMarks = (neededPercentage / 100) * a.weight;
    return {
      name: a.name,
      weight: a.weight,
      neededPercentage: neededPercentage.toFixed(1),
      neededMarks: neededMarks.toFixed(1)
    };
  });

  return {
    status: 'in-progress',
    message: `To achieve ${goal.targetGrade} (min ${targetMin}%), you need an average of ${requiredPercentage.toFixed(1)}% across your remaining assessments.`,
    remaining: remaining,
    requiredPercentage: requiredPercentage.toFixed(1),
    advice: advice,
    pointsEarned: pointsEarned.toFixed(1),
    pointsNeeded: pointsNeeded.toFixed(1),
    totalWeight: totalWeight
  };
}

// Render all goals
function renderGoals() {
  const goals = loadGoals();
  const container = document.getElementById('goalsContainer');

  if (goals.length === 0) {
    container.innerHTML = `
      <div class="goals-empty">
        <p>&#127919; No module goals set yet. Add a module above to get started!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = goals.map(goal => {
    const advisory = calculateAdvisory(goal);
    const totalWeight = goal.assessments.reduce((sum, a) => sum + a.weight, 0);

    return `
      <div class="goal-card">
        <div class="goal-card-header">
          <div class="goal-card-title">
            <h4>${escapeHtml(goal.moduleName)}</h4>
            <span class="badge badge-info">Target: ${goal.targetGrade}</span>
            <span class="badge ${totalWeight === 100 ? 'badge-success' : 'badge-warning'}">Weight: ${totalWeight}%</span>
          </div>
          <button class="btn-delete" onclick="deleteModuleGoal('${goal.id}')" title="Delete module">&#128465;</button>
        </div>

        <!-- Assessments Table -->
        <div class="goal-assessments">
          ${goal.assessments.length > 0 ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Weight</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${goal.assessments.map(a => `
                  <tr>
                    <td>${escapeHtml(a.name)}</td>
                    <td>${a.weight}%</td>
                    <td>
                      ${a.actualScore !== null
                        ? `<span class="score-badge ${a.actualScore >= 50 ? 'score-pass' : 'score-fail'}">${a.actualScore}%</span>`
                        : `<div class="score-input-group">
                            <input type="number" id="score_${a.id}" min="0" max="100" placeholder="%" class="score-input">
                            <button class="btn-sm btn-primary" onclick="recordScore('${goal.id}', '${a.id}')">Save</button>
                          </div>`
                      }
                    </td>
                    <td>
                      ${a.actualScore !== null
                        ? `<button class="btn-sm btn-outline" onclick="clearScore('${goal.id}', '${a.id}')">Edit</button>`
                        : ''
                      }
                      <button class="btn-sm btn-danger-outline" onclick="deleteAssessment('${goal.id}', '${a.id}')">&#10005;</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p class="text-muted">No assessments added yet.</p>'}
        </div>

        <!-- Add Assessment Form -->
        ${totalWeight < 100 ? `
        <div class="add-assessment-form">
          <input type="text" id="assessName_${goal.id}" placeholder="Assessment name (e.g., CA1, Exam)" class="form-input">
          <input type="number" id="assessWeight_${goal.id}" min="1" max="${100 - totalWeight}" placeholder="Weight %" class="form-input form-input-sm">
          <button class="btn-sm btn-primary" onclick="addAssessment('${goal.id}')">+ Add</button>
        </div>
        ` : ''}

        <!-- Advisory Box -->
        <div class="advisory-box advisory-${advisory.status}">
          <div class="advisory-icon">
            ${getAdvisoryIcon(advisory.status)}
          </div>
          <div class="advisory-content">
            <p class="advisory-message">${advisory.message}</p>
            ${advisory.advice ? `
              <div class="advisory-breakdown">
                <p><strong>Suggested targets for remaining assessments:</strong></p>
                <ul>
                  ${advisory.advice.map(a => `
                    <li><strong>${escapeHtml(a.name)}</strong> (${a.weight}% weight): aim for at least <strong>${a.neededPercentage}%</strong></li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getAdvisoryIcon(status) {
  switch (status) {
    case 'achieved': return '&#127881;';
    case 'secured': return '&#9989;';
    case 'in-progress': return '&#128161;';
    case 'impossible': return '&#9888;';
    case 'missed': return '&#128532;';
    default: return '&#128203;';
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
