// ===== AI Grade Goal Planner - Logic & Calculations =====

// Grade mapping
const GRADE_MAP = [
  { grade: 'A', min: 80 },
  { grade: 'B+', min: 75 },
  { grade: 'B', min: 70 },
  { grade: 'C+', min: 60 },
  { grade: 'C', min: 50 },
  { grade: 'D', min: 40 },
  { grade: 'F', min: 0 }
];

// Load modules from localStorage
function loadModules() {
  const data = localStorage.getItem('gradePlannerModules');
  return data ? JSON.parse(data) : [];
}

// Save modules to localStorage
function saveModules(modules) {
  localStorage.setItem('gradePlannerModules', JSON.stringify(modules));
}

// Add a new assessment row to the form
function addAssessmentRow() {
  const container = document.getElementById('assessmentInputs');
  const row = document.createElement('div');
  row.className = 'gp-assessment-row';
  row.innerHTML = `
    <input type="text" placeholder="Component name (e.g., Quiz 2)" class="assess-name">
    <input type="number" placeholder="Weight %" class="assess-weight" min="1" max="100">
    <button class="gp-btn-remove" onclick="removeAssessmentRow(this)" aria-label="Remove component">&#10005;</button>
  `;
  container.appendChild(row);
  updateWeightTotal();
}

// Remove an assessment row
function removeAssessmentRow(btn) {
  const container = document.getElementById('assessmentInputs');
  if (container.children.length > 1) {
    btn.parentElement.remove();
    updateWeightTotal();
  }
}

// Update the displayed weight total
function updateWeightTotal() {
  const weights = document.querySelectorAll('.assess-weight');
  let total = 0;
  weights.forEach(w => { total += parseInt(w.value) || 0; });
  const el = document.getElementById('weightTotal');
  el.textContent = `Total: ${total}%`;
  el.style.color = total === 100 ? '#059669' : (total > 100 ? '#dc2626' : '#6b7280');
}

// Listen for weight input changes
document.addEventListener('input', function(e) {
  if (e.target.classList.contains('assess-weight')) {
    updateWeightTotal();
  }
});

// Add a module
function addModule() {
  const nameInput = document.getElementById('moduleName');
  const gradeSelect = document.getElementById('targetGrade');
  const errorDiv = document.getElementById('formError');

  const moduleName = nameInput.value.trim();
  const targetPercent = parseInt(gradeSelect.value);

  // Validate module name
  if (!moduleName) {
    showError('Please enter a module name.');
    return;
  }

  // Gather assessments
  const rows = document.querySelectorAll('.gp-assessment-row');
  const assessments = [];
  let totalWeight = 0;

  for (const row of rows) {
    const name = row.querySelector('.assess-name').value.trim();
    const weight = parseInt(row.querySelector('.assess-weight').value) || 0;

    if (!name) {
      showError('Please enter a name for every assessment component.');
      return;
    }
    if (weight <= 0) {
      showError(`Please enter a valid weight for "${name}".`);
      return;
    }

    totalWeight += weight;
    assessments.push({
      name: name,
      weight: weight,
      score: null, // null means not yet completed
      completed: false
    });
  }

  if (totalWeight !== 100) {
    showError(`Assessment weights must total 100%. Currently: ${totalWeight}%.`);
    return;
  }

  if (assessments.length < 1) {
    showError('Add at least one assessment component.');
    return;
  }

  // Create module object
  const module = {
    id: Date.now().toString(),
    name: moduleName,
    targetPercent: targetPercent,
    targetGrade: getGradeLetter(targetPercent),
    assessments: assessments
  };

  // Save
  const modules = loadModules();
  modules.push(module);
  saveModules(modules);

  // Reset form
  nameInput.value = '';
  gradeSelect.value = '50';
  document.getElementById('assessmentInputs').innerHTML = `
    <div class="gp-assessment-row">
      <input type="text" placeholder="Component name (e.g., CA1)" class="assess-name">
      <input type="number" placeholder="Weight %" class="assess-weight" min="1" max="100">
      <button class="gp-btn-remove" onclick="removeAssessmentRow(this)" aria-label="Remove component">&#10005;</button>
    </div>
    <div class="gp-assessment-row">
      <input type="text" placeholder="Component name (e.g., Final Exam)" class="assess-name">
      <input type="number" placeholder="Weight %" class="assess-weight" min="1" max="100">
      <button class="gp-btn-remove" onclick="removeAssessmentRow(this)" aria-label="Remove component">&#10005;</button>
    </div>
  `;
  updateWeightTotal();
  hideError();

  // Re-render
  renderModules();
}

// Get grade letter from percentage
function getGradeLetter(percent) {
  for (const g of GRADE_MAP) {
    if (percent >= g.min) return g.grade;
  }
  return 'F';
}

// Get highest achievable grade given earned marks and remaining weight
function getHighestAchievableGrade(earnedMarks, remainingWeight) {
  const maxPossible = earnedMarks + remainingWeight; // if student gets 100% on remaining
  return getGradeLetter(maxPossible);
}

// Show form error
function showError(msg) {
  const el = document.getElementById('formError');
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError() {
  document.getElementById('formError').style.display = 'none';
}

// Toggle grade map visibility
function toggleGradeMap() {
  const el = document.getElementById('gradeMapTable');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// Calculate AI recommendations for a module
function calculateRecommendations(module) {
  const target = module.targetPercent;
  let earnedMarks = 0;
  let completedWeight = 0;
  let remainingAssessments = [];

  for (const a of module.assessments) {
    if (a.completed && a.score !== null) {
      // Score is stored as actual marks earned (out of the weight)
      earnedMarks += a.score;
      completedWeight += a.weight;
    } else {
      remainingAssessments.push(a);
    }
  }

  const remainingWeight = remainingAssessments.reduce((sum, a) => sum + a.weight, 0);
  const marksNeeded = target - earnedMarks;

  // Check if target is still possible
  const impossible = marksNeeded > remainingWeight;
  const alreadyAchieved = earnedMarks >= target;

  // Calculate recommended score per remaining assessment (proportional distribution)
  const recommendations = [];
  for (const a of remainingAssessments) {
    let recommended;
    if (remainingWeight > 0) {
      recommended = (marksNeeded / remainingWeight) * a.weight;
    } else {
      recommended = 0;
    }
    recommendations.push({
      name: a.name,
      weight: a.weight,
      recommended: Math.max(0, Math.min(a.weight, recommended)),
      recommendedPercent: remainingWeight > 0 ? Math.max(0, (marksNeeded / remainingWeight) * 100) : 0
    });
  }

  // Highest achievable grade
  const highestAchievable = getHighestAchievableGrade(earnedMarks, remainingWeight);

  // Progress percentage
  const progressPercent = Math.min(100, (earnedMarks / target) * 100);

  return {
    earnedMarks,
    completedWeight,
    remainingWeight,
    marksNeeded: Math.max(0, marksNeeded),
    impossible,
    alreadyAchieved,
    recommendations,
    highestAchievable,
    progressPercent
  };
}

// Generate AI advice text
function generateAIAdvice(module, calc) {
  const adviceList = [];

  if (calc.alreadyAchieved) {
    adviceList.push(`Excellent! You've already secured ${calc.earnedMarks.toFixed(1)}% which meets your target of ${module.targetPercent}% (${module.targetGrade}). Any additional marks will push you higher!`);
    // Check if higher grade is possible
    const maxPossible = calc.earnedMarks + calc.remainingWeight;
    const higherGrade = getGradeLetter(maxPossible);
    if (higherGrade !== module.targetGrade) {
      adviceList.push(`With maximum effort on remaining assessments, you could achieve up to a ${higherGrade} (${maxPossible.toFixed(1)}%).`);
    }
  } else if (calc.impossible) {
    adviceList.push(`Unfortunately, achieving ${module.targetGrade} (${module.targetPercent}%) is no longer mathematically possible. You would need ${calc.marksNeeded.toFixed(1)}% from ${calc.remainingWeight}% worth of assessments.`);
    adviceList.push(`The highest grade you can now achieve is ${calc.highestAchievable}. Consider adjusting your target.`);
  } else {
    const percentNeeded = (calc.marksNeeded / calc.remainingWeight) * 100;

    if (percentNeeded <= 40) {
      adviceList.push(`You're well ahead of your target! You only need ${percentNeeded.toFixed(1)}% across remaining assessments. Keep up the great work.`);
    } else if (percentNeeded <= 60) {
      adviceList.push(`You're on a good track. You need ${percentNeeded.toFixed(1)}% across remaining assessments to hit your target of ${module.targetGrade}.`);
    } else if (percentNeeded <= 80) {
      adviceList.push(`You'll need to perform well on remaining assessments. Aim for ${percentNeeded.toFixed(1)}% across them to achieve ${module.targetGrade}.`);
      adviceList.push(`Consider dedicating extra study time to ${module.name} this week.`);
    } else {
      adviceList.push(`This will be challenging. You need ${percentNeeded.toFixed(1)}% on remaining assessments. Focus your study efforts here and consider seeking extra help.`);
    }

    if (calc.completedWeight > 0) {
      const currentAvg = (calc.earnedMarks / calc.completedWeight) * 100;
      if (currentAvg >= module.targetPercent) {
        adviceList.push(`Your current average (${currentAvg.toFixed(1)}%) is above your target. Great performance so far!`);
      } else {
        adviceList.push(`Your current average is ${currentAvg.toFixed(1)}%. You need to improve in remaining assessments to meet your target.`);
      }
    }
  }

  return adviceList;
}

// Render all modules
function renderModules() {
  const container = document.getElementById('modulesDashboard');
  const modules = loadModules();

  if (modules.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 48px;">
        <p style="font-size: 48px; margin-bottom: 16px;">&#127919;</p>
        <h3 style="color: var(--gray-600); margin-bottom: 8px;">No modules added yet</h3>
        <p style="color: var(--gray-400); font-size: 14px;">Add your first module above to start planning your grades with AI assistance.</p>
      </div>
    `;
    return;
  }

  let html = '';

  for (const module of modules) {
    const calc = calculateRecommendations(module);
    const advice = generateAIAdvice(module, calc);

    // Determine status badge
    let statusBadge;
    if (calc.alreadyAchieved) {
      statusBadge = '<span class="badge badge-success">&#9989; Target Achieved</span>';
    } else if (calc.impossible) {
      statusBadge = '<span class="badge badge-danger">&#9888; Target Unreachable</span>';
    } else if (calc.progressPercent >= 60) {
      statusBadge = '<span class="badge badge-success">&#128994; On Track</span>';
    } else if (calc.progressPercent >= 30) {
      statusBadge = '<span class="badge badge-warning">&#128992; In Progress</span>';
    } else {
      statusBadge = '<span class="badge badge-info">&#128309; Just Started</span>';
    }

    // Progress bar color
    let progressColor = 'blue';
    if (calc.alreadyAchieved) progressColor = 'high';
    else if (calc.impossible) progressColor = 'low';
    else if (calc.progressPercent >= 60) progressColor = 'high';
    else if (calc.progressPercent >= 30) progressColor = 'medium';

    html += `
      <div class="card gp-module-card">
        <div class="card-header">
          <h3>&#128218; ${escapeHtml(module.name)}</h3>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${statusBadge}
            <button class="gp-btn-small gp-btn-danger" onclick="deleteModule('${module.id}')" aria-label="Delete module">&#128465;</button>
          </div>
        </div>

        <!-- Progress Dashboard -->
        <div class="gp-progress-dashboard">
          <div class="gp-progress-stats">
            <div class="gp-stat">
              <span class="gp-stat-label">Target Grade</span>
              <span class="gp-stat-value">${module.targetGrade} (${module.targetPercent}%)</span>
            </div>
            <div class="gp-stat">
              <span class="gp-stat-label">Marks Earned</span>
              <span class="gp-stat-value">${calc.earnedMarks.toFixed(1)}%</span>
            </div>
            <div class="gp-stat">
              <span class="gp-stat-label">Still Needed</span>
              <span class="gp-stat-value">${calc.impossible ? 'Impossible' : calc.marksNeeded.toFixed(1) + '%'}</span>
            </div>
            <div class="gp-stat">
              <span class="gp-stat-label">Completed</span>
              <span class="gp-stat-value">${calc.completedWeight}% of 100%</span>
            </div>
          </div>
          <div class="progress-item" style="margin-top: 12px;">
            <div class="progress-label">
              <span>Progress toward ${module.targetGrade}</span>
              <span>${Math.min(100, calc.progressPercent).toFixed(0)}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${progressColor}" style="width: ${Math.min(100, calc.progressPercent)}%"></div>
            </div>
          </div>
        </div>

        <!-- Assessment Table -->
        <div class="gp-assessments-table">
          <table class="data-table">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Weight</th>
                <th>Your Score</th>
                <th>AI Recommended</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
    `;

    for (let i = 0; i < module.assessments.length; i++) {
      const a = module.assessments[i];
      const rec = calc.recommendations.find(r => r.name === a.name);

      if (a.completed) {
        const percent = (a.score / a.weight * 100).toFixed(1);
        html += `
              <tr>
                <td>${escapeHtml(a.name)}</td>
                <td>${a.weight}%</td>
                <td><strong>${a.score.toFixed(1)} / ${a.weight}</strong> (${percent}%)</td>
                <td>-</td>
                <td><span class="badge badge-success">&#9989; Done</span></td>
              </tr>
        `;
      } else {
        const recScore = rec ? rec.recommended.toFixed(1) : '-';
        const recPercent = rec ? rec.recommendedPercent.toFixed(1) : '-';
        html += `
              <tr>
                <td>${escapeHtml(a.name)}</td>
                <td>${a.weight}%</td>
                <td>
                  <div class="gp-score-input-group">
                    <input type="number" class="gp-score-input" id="score-${module.id}-${i}" 
                      placeholder="Score" min="0" max="${a.weight}" step="0.1">
                    <span class="gp-score-max">/ ${a.weight}</span>
                    <button class="gp-btn-small" onclick="submitScore('${module.id}', ${i})">Save</button>
                  </div>
                </td>
                <td><span class="gp-recommended">${recScore} / ${a.weight} <span class="gp-hint">(${recPercent}%)</span></span></td>
                <td><span class="badge badge-warning">&#9201; Pending</span></td>
              </tr>
        `;
      }
    }

    html += `
            </tbody>
          </table>
        </div>

        <!-- AI Advisor -->
        <div class="gp-ai-advice">
          <h4>&#129302; AI Advisor</h4>
          <ul>
    `;

    for (const tip of advice) {
      html += `<li>${tip}</li>`;
    }

    html += `
          </ul>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

// Submit a score for an assessment
function submitScore(moduleId, assessmentIndex) {
  const input = document.getElementById(`score-${moduleId}-${assessmentIndex}`);
  const score = parseFloat(input.value);
  const modules = loadModules();
  const module = modules.find(m => m.id === moduleId);

  if (!module) return;

  const assessment = module.assessments[assessmentIndex];

  if (isNaN(score) || score < 0) {
    alert('Please enter a valid score (0 or above).');
    return;
  }

  if (score > assessment.weight) {
    alert(`Score cannot exceed the maximum weight of ${assessment.weight}.`);
    return;
  }

  assessment.score = score;
  assessment.completed = true;

  saveModules(modules);
  renderModules();
}

// Delete a module
function deleteModule(moduleId) {
  if (!confirm('Are you sure you want to remove this module from your planner?')) return;
  const modules = loadModules().filter(m => m.id !== moduleId);
  saveModules(modules);
  renderModules();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  renderModules();
  updateWeightTotal();

  // Load demo data if no modules exist
  const modules = loadModules();
  if (modules.length === 0) {
    loadDemoData();
  }
});

// Demo data to showcase the feature
function loadDemoData() {
  const demoModules = [
    {
      id: 'demo-1',
      name: 'Database Systems',
      targetPercent: 50,
      targetGrade: 'C',
      assessments: [
        { name: 'Continuous Assessment 1', weight: 10, score: 7.5, completed: true },
        { name: 'Continuous Assessment 2', weight: 10, score: null, completed: false },
        { name: 'Midterm Exam', weight: 20, score: 12, completed: true },
        { name: 'Final Exam', weight: 60, score: null, completed: false }
      ]
    },
    {
      id: 'demo-2',
      name: 'Data Structures & Algorithms',
      targetPercent: 80,
      targetGrade: 'A',
      assessments: [
        { name: 'Lab Work', weight: 15, score: 13, completed: true },
        { name: 'Assignment 1', weight: 10, score: 8.5, completed: true },
        { name: 'Assignment 2', weight: 10, score: null, completed: false },
        { name: 'Midterm', weight: 25, score: 21, completed: true },
        { name: 'Final Exam', weight: 40, score: null, completed: false }
      ]
    },
    {
      id: 'demo-3',
      name: 'Web Development',
      targetPercent: 75,
      targetGrade: 'B+',
      assessments: [
        { name: 'Project Phase 1', weight: 20, score: 18, completed: true },
        { name: 'Project Phase 2', weight: 20, score: 17, completed: true },
        { name: 'Presentation', weight: 10, score: null, completed: false },
        { name: 'Final Project', weight: 30, score: null, completed: false },
        { name: 'Peer Review', weight: 20, score: 16, completed: true }
      ]
    }
  ];

  saveModules(demoModules);
  renderModules();
}
