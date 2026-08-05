// ===== AI Advisory Chatbot - Interactive Demo =====

function toggleChat() {
  const chatWindow = document.getElementById('chatWindow');
  chatWindow.classList.toggle('open');
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  appendMessage(message, 'user');
  input.value = '';

  // Simulate AI thinking delay
  setTimeout(() => {
    const response = generateResponse(message);
    appendMessage(response, 'bot');
  }, 800 + Math.random() * 700);
}

function appendMessage(text, sender) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-message ${sender}`;
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function generateResponse(message) {
  const msg = message.toLowerCase();

  // Detect if we're in lecturer mode
  const isLecturer = window.lecturerMode === true;

  if (isLecturer) {
    return generateLecturerResponse(msg);
  } else {
    return generateStudentResponse(msg);
  }
}

// ===== Student Chatbot Responses =====
function generateStudentResponse(msg) {
  // Study help
  if (msg.includes('study') || msg.includes('learn') || msg.includes('tip')) {
    return "Based on your persona, you're a visual and hands-on learner. I'd recommend: 1) Watch video tutorials before lectures, 2) Practice coding problems daily on LeetCode, 3) Use diagrams to map out database concepts - that's an area where you can grow. Would you like specific resource links?";
  }

  // Database struggles
  if (msg.includes('database') || msg.includes('sql') || msg.includes('db')) {
    return "I've noticed Database Systems is your lowest-performing course at 62%. Here's what I suggest: The Thursday lab sessions cover practical exercises that match your hands-on learning style. Also, there's a study group forming with 3 classmates working on similar topics. Want me to recommend some visual SQL tutorials?";
  }

  // Assignments / deadlines
  if (msg.includes('assignment') || msg.includes('deadline') || msg.includes('due')) {
    return "You have 3 upcoming deadlines: 1) Database Systems Assignment 3 - due in 3 days (not yet started), 2) Software Engineering Sprint Review - due next Monday, 3) Web Dev Project Milestone - due in 10 days. I'd prioritise the Database assignment since it's closest and that course needs attention.";
  }

  // Grades / performance
  if (msg.includes('grade') || msg.includes('gpa') || msg.includes('performance') || msg.includes('mark')) {
    return "Your current GPA is 3.72, which places you in the top 25% of your cohort. You're excelling in Web Development (91%) and Data Structures (85%). Your main opportunity is Database Systems (62%) - improving there could push your GPA above 3.8. Would you like a study plan for that?";
  }

  // Career / jobs
  if (msg.includes('career') || msg.includes('job') || msg.includes('intern')) {
    return "Based on your persona, your strengths in algorithm design and problem-solving align well with Software Engineering and ML roles. I'd recommend: 1) The upcoming ML Hackathon to build portfolio projects, 2) Contributing to open source, 3) The university's industry mentoring programme. Your collaboration style also suits Agile team environments.";
  }

  // Writing / communication
  if (msg.includes('writing') || msg.includes('communication') || msg.includes('report')) {
    return "Technical writing is one of your identified growth areas. Good news - there's a workshop next Tuesday that's specifically designed for CS students. I also recommend: 1) Start reports with an outline before writing, 2) Use the university writing centre for feedback, 3) Practice explaining your code in comments - it builds the same skill.";
  }

  // Wellbeing / stress
  if (msg.includes('stress') || msg.includes('overwhelm') || msg.includes('anxious') || msg.includes('help')) {
    return "I understand things can feel overwhelming. Based on your workload, I can see you have multiple deadlines clustering. Here are some options: 1) Student counselling services are available Mon-Fri (Book via the student portal), 2) I can help you create a prioritised task list, 3) The mindfulness sessions run Wednesdays at lunch. Would any of these help?";
  }

  // Attendance
  if (msg.includes('attendance') || msg.includes('absent') || msg.includes('miss')) {
    return "Your attendance rate is 92%, which is excellent. You've attended consistently across all modules. This is one of the factors that supports your strong academic performance. Keep it up - data shows that students with 90%+ attendance average 15% higher grades.";
  }

  // Generic / greeting
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hi Sarah! How can I help you today? I can assist with study strategies, explain your academic progress, recommend resources, remind you about deadlines, or discuss career paths. What's on your mind?";
  }

  // Default
  return "That's a great question! Based on your learning persona, I can provide personalised advice on study strategies, course progress, career planning, or available support services. Could you tell me a bit more about what you'd like help with?";
}

// ===== Lecturer Chatbot Responses =====
function generateLecturerResponse(msg) {
  // At-risk students
  if (msg.includes('risk') || msg.includes('struggling') || msg.includes('concern') || msg.includes('failing')) {
    return "Currently 8 students are flagged as at-risk. The two most critical are: 1) James Wilson - 45% attendance, 3 missed assignments. I recommend an urgent one-on-one meeting. 2) Emma Liu - grades dropped from B+ to D in 4 weeks with 70% less LMS activity, which may indicate personal issues. Would you like suggested intervention strategies for either student?";
  }

  // Specific student - James
  if (msg.includes('james') || msg.includes('wilson')) {
    return "James Wilson's AI Persona Summary: GPA 1.85 (down from 2.9 last semester). Attendance at 45%. Learning style: Auditory/Solo. He disengaged around Week 4, correlating with the group project start - he may struggle with collaborative tasks. His persona shows strong individual problem-solving but low confidence in group settings. Suggested approach: Individual meeting, offer alternative assessment path, connect with counselling.";
  }

  // Specific student - Sarah
  if (msg.includes('sarah') || msg.includes('anderson')) {
    return "Sarah Anderson's AI Persona: GPA 3.72, 92% attendance, high engagement. Strong in algorithms and problem-solving. Struggles with technical writing and database concepts. She's a visual/hands-on learner who thrives in collaborative settings. Great candidate for team leader roles. Currently performing below potential in Database Systems (62%). Recommend pairing with peers strong in databases.";
  }

  // Teams / group formation
  if (msg.includes('team') || msg.includes('group') || msg.includes('project')) {
    return "I've generated 3 balanced project teams based on complementary skills, personality types, and learning styles. Key considerations: 1) Each team has a mix of technical and communication strengths, 2) At-risk students are paired with supportive peers, 3) Leadership roles assigned based on persona traits. The teams are shown in the Team Formation panel. Would you like me to adjust any team composition?";
  }

  // Performance / grades
  if (msg.includes('performance') || msg.includes('grade') || msg.includes('class')) {
    return "Class Performance Summary (Data Structures & Algorithms): Average grade 71%, with 35% achieving A grades. Engagement dipped in Weeks 5-6 during recursion topics. Students attending labs score 23% higher. 12 students are below the pass threshold. I recommend adding more visual recursion examples and considering deadline adjustments given 3 courses have assignments due the same week.";
  }

  // Engagement
  if (msg.includes('engagement') || msg.includes('lms') || msg.includes('participation')) {
    return "LMS Engagement Insights: Overall class engagement is rated 'High' but trending downward since Week 5. Key findings: 1) Video content gets 3x more views than text, 2) Discussion forum posts peak Tuesdays/Thursdays, 3) 15 students haven't accessed materials in 7+ days, 4) Interactive quizzes have 94% completion vs 67% for reading assignments. Would you like recommendations to boost engagement?";
  }

  // Teaching strategies
  if (msg.includes('teach') || msg.includes('strategy') || msg.includes('approach') || msg.includes('improve')) {
    return "Based on class persona analysis: 1) 60% of your students are visual learners - increase diagrams and video content, 2) Lab sessions drive +23% performance - consider expanding hands-on time, 3) Peer tutoring could help 15 students with complementary strengths, 4) Spacing deadlines would reduce Week 6-7 stress clustering. Would you like a detailed action plan for any of these?";
  }

  // Hello/greeting
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hello Dr. Chen! I can help you with: student persona summaries, at-risk student interventions, class engagement trends, project team recommendations, or teaching strategy suggestions. What would you like to explore?";
  }

  // Default
  return "I can provide insights on individual student personas, class-wide performance trends, at-risk interventions, team formation, or teaching strategies. Could you be more specific about what you'd like to know? For example, try asking about a specific student or about class engagement.";
}
