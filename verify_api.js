/**
 * Verification Test Script for PLANOVA API
 * Tests registration, login, JWT protection, task CRUD, and user isolation.
 */

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting PLANOVA API Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    assert(health.status === 'online', 'Server health check is online');
    assert(health.database === 'connected', 'Database is connected');

    // 2. User A Registration
    const timestamp = Date.now();
    const userAEmail = `tester_${timestamp}@planova.app`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Morgan',
        email: userAEmail,
        password: 'password123',
        confirmPassword: 'password123'
      })
    });
    const regData = await regRes.json();
    assert(regData.success === true, 'User A registered successfully');
    assert(!!regData.token, 'Registration returns JWT token');
    const tokenA = regData.token;

    // 3. User A Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userAEmail,
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    assert(loginData.success === true, 'User A logged in successfully');
    assert(loginData.user.email === userAEmail, 'Returned user email matches');

    // 4. Verify /api/auth/me
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const meData = await meRes.json();
    assert(meData.success === true && meData.user.name === 'Alex Morgan', 'Auth /me returns profile');

    // 5. Create Tasks for User A
    const t1Res = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Design high-fidelity dashboard in CSS',
        description: 'Glassmorphism dark theme with purple glow',
        category: 'Design',
        priority: 'High',
        status: 'In Progress',
        dueDate: '2026-09-20'
      })
    });
    const t1Data = await t1Res.json();
    assert(t1Data.success === true, 'Created Task 1 (High Priority)');
    const task1Id = t1Data.task._id;

    const t2Res = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Implement MongoDB Mongoose models',
        description: 'User and Task schemas with relational IDs',
        category: 'Backend',
        priority: 'Medium',
        status: 'Completed'
      })
    });
    const t2Data = await t2Res.json();
    assert(t2Data.success === true, 'Created Task 2 (Completed)');
    const task2Id = t2Data.task._id;

    // 6. Fetch Tasks & Verify Stats
    const tasksRes = await fetch(`${BASE_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const tasksData = await tasksRes.json();
    assert(tasksData.count === 2, 'User A has 2 tasks');
    assert(tasksData.stats.total === 2, 'Stats total is 2');
    assert(tasksData.stats.completed === 1, 'Stats completed is 1');
    assert(tasksData.stats.inProgress === 1, 'Stats inProgress is 1');

    // 7. Update Task 1 to Completed
    const updateRes = await fetch(`${BASE_URL}/api/tasks/${task1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        status: 'Completed'
      })
    });
    const updateData = await updateRes.json();
    assert(updateData.task.status === 'Completed', 'Task 1 updated to Completed');

    // 8. Delete Task 2
    const delRes = await fetch(`${BASE_URL}/api/tasks/${task2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const delData = await delRes.json();
    assert(delData.success === true, 'Task 2 deleted successfully');

    // 9. User Isolation Test
    // Register User B
    const userBEmail = `userb_${timestamp}@planova.app`;
    const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Lee',
        email: userBEmail,
        password: 'password456'
      })
    });
    const regBData = await regBRes.json();
    const tokenB = regBData.token;

    // User B should have 0 tasks
    const tasksBRes = await fetch(`${BASE_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const tasksBData = await tasksBRes.json();
    assert(tasksBData.count === 0, 'User B has 0 tasks (Isolated from User A)');

    // User B should NOT be able to delete or edit User A's task
    const illegalDelRes = await fetch(`${BASE_URL}/api/tasks/${task1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(illegalDelRes.status === 404, 'User B cannot delete User A task (Strict Isolation 404)');

    // 10. Verify Frontend Files Served
    const frontendRes = await fetch(`${BASE_URL}/`);
    const htmlText = await frontendRes.text();
    assert(htmlText.includes('PLANOVA') && htmlText.includes('Plan less. Accomplish more.'), 'Frontend HTML served correctly at /');

    const cssRes = await fetch(`${BASE_URL}/style.css`);
    assert(cssRes.status === 200, 'Frontend style.css served with 200 OK');

    const jsRes = await fetch(`${BASE_URL}/script.js`);
    assert(jsRes.status === 200, 'Frontend script.js served with 200 OK');

    console.log(`\n========================================`);
    console.log(`  Tests Completed: Passed: ${passed}, Failed: ${failed}`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Verification error:', err);
    process.exit(1);
  }
}

runTests();
