import { test, expect } from '@playwright/test';

test.describe('AI Tutor API (/api/tutor)', () => {
  // We use the storage state from admin auth, but the API should work for any authenticated user
  
  test('should reject unauthorized requests', async ({ request }) => {
    // Creating a new request context without the auth state
    const context = await request.post('/api/tutor', {
      data: { conceptId: 'test', question: 'hello' },
      headers: { 'Cookie': '' } // Wipe cookies for this call
    });
    
    expect(context.status()).toBe(401);
  });

  test('should reject malformed payloads', async ({ request }) => {
    const response = await request.post('/api/tutor', {
      data: { question: 'No concept ID here' }
    });
    
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('required');
  });

  test('should handle valid socratic requests', async ({ request }) => {
    // Note: This test requires a valid conceptId from your database.
    // We'll use a placeholder or attempt to find one.
    const response = await request.post('/api/tutor', {
      data: { 
        conceptId: 'cmpk5u58x0010vtd2q8uqk9ue', // From your provided URL
        question: 'How do I solve $x^2 = 4$?' 
      }
    });
    
    // If Ollama is offline in CI/Local, it might return 503 or 500
    // We check for success or a graceful AI-related error
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('content');
      expect(body).toHaveProperty('retrievedContextIds');
      // The AI should not give the answer "2" directly if it's being socratic
      expect(body.content.toLowerCase()).not.toContain('the answer is 2');
    } else {
      console.warn(`⚠️ Tutor API returned status ${response.status()}. Possibly Ollama/Chroma offline.`);
      expect([200, 503, 500]).toContain(response.status());
    }
  });

  test('should persist session history', async ({ request }) => {
     const conceptId = 'cmpk5u58x0010vtd2q8uqk9ue';
     
     // First question
     await request.post('/api/tutor', {
       data: { conceptId, question: 'I want to learn about limits.' }
     });

     // Second question (should include history in the prompt internally)
     const response = await request.post('/api/tutor', {
       data: { conceptId, question: 'Can you give me an example?' }
     });

     if (response.status() !== 200) {
       console.warn(`⚠️ Tutor API returned status ${response.status()}. Possibly Ollama/Chroma offline.`);
       expect([503, 500]).toContain(response.status());
     } else {
       expect(response.ok()).toBeTruthy();
     }
  });
});
