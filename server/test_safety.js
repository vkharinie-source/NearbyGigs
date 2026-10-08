async function testApi() {
  console.log('=== 1. Testing Root API ===');
  const root = await fetch('http://localhost:5000/');
  console.log('Root Status:', root.status);
  console.log('Root Response:', await root.json());

  console.log('\n=== 2. Testing Login (Rahul - Student Worker) ===');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul@example.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  console.log('User Profile:', JSON.stringify(loginData.user, null, 2));
  const token = loginData.token;

  console.log('\n=== 3. Testing Safety Status API ===');
  const safetyRes = await fetch('http://localhost:5000/api/safety/my-safety-status', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const safetyData = await safetyRes.json();
  console.log('Safety Status:', JSON.stringify(safetyData, null, 2));

  console.log('\n=== 4. Testing Gigs API with Night Work and Employer Badges ===');
  const gigsRes = await fetch('http://localhost:5000/api/gigs');
  const gigsData = await gigsRes.json();
  console.log('Gigs Count:', gigsData.count);
  gigsData.gigs.forEach(g => {
    console.log(`- Gig: "${g.title}" | isNightGig: ${g.isNightGig} | isVerifiedEmployer: ${g.isVerifiedEmployer} | budget: ₹${g.budgetMin}-₹${g.budgetMax}`);
  });

  console.log('\n=== 5. Testing Start Work Session (Location Privacy) ===');
  const sessionRes = await fetch('http://localhost:5000/api/safety/work-session/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946, address: 'MG Road Worksite' })
  });
  console.log('Work Session Start Response:', await sessionRes.json());

  console.log('\n=== 6. Testing End Work Session (Cease Tracking) ===');
  const endSessionRes = await fetch('http://localhost:5000/api/safety/work-session/end', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('Work Session End Response:', await endSessionRes.json());
}

testApi().catch(err => console.error(err));
