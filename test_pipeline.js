async function testPipeline() {
    try {
        console.log("--- 1. Logging in as Staff ---");
        const loginRes = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'staff@example.com',
                password: 'staff123'
            })
        });

        if (!loginRes.ok) {
            const err = await loginRes.json();
            throw new Error(`Login failed: ${JSON.stringify(err)}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Login successful. Token acquired.");

        console.log("\n--- 2. Submitting Tactical Report ---");
        const reportRes = await fetch('http://localhost:8080/api/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                category: 'Logística',
                subcategory: 'Fardamento',
                description: 'Falta crítica de vestimenta de inverno no 4º Esquadrão. Militares estão sem proteção adequada. Teste de Pipeline ' + new Date().getTime(),
                priority: 'High',
                media: [],
                hierarchy: 'Sd/Cb EP',
                identify: 'Sim',
                warName: 'Jenkins',
                squadron: '4º Esqd',
                solution: 'Requisição imediata ao S-4',
                impact: ['Moral da Tropa', 'Segurança'],
                urgency: 'Crítico'
            })
        });

        if (!reportRes.ok) {
            const err = await reportRes.json();
            throw new Error(`Report submission failed: ${JSON.stringify(err)}`);
        }

        const reportData = await reportRes.json();
        console.log("Report submitted successfully ID:", reportData.id);

        console.log("\n--- 3. Verifying Topic in Commander Panel ---");
        // We might need to wait a second for AI processing if it were async, 
        // but in our current controller it's awaited.
        const topicsRes = await fetch('http://localhost:8080/api/topics', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!topicsRes.ok) {
            const err = await topicsRes.json();
            throw new Error(`Fetching topics failed: ${JSON.stringify(err)}`);
        }

        const topicsData = await topicsRes.json();
        console.log(`Retrieved ${topicsData.length} topics.`);

        const latestTopic = topicsData.find(t => t.title.includes('Logística') || t.title.includes('Equipamentos'));
        if (latestTopic) {
            console.log("SUCCESS: Topic found in Commander Panel!");
            console.log("Topic ID:", latestTopic.id);
            console.log("Topic Title:", latestTopic.title);
            console.log("Topic Status:", latestTopic.status);
            console.log("Reports linked:", latestTopic.report_count);
        } else {
            console.log("FAILURE: Topic NOT found in Commander Panel.");
            console.log("Recent Topics titles:", topicsData.map(t => t.title).join(', '));
        }

    } catch (error) {
        console.error("Pipeline Test Error:", error.message);
    }
}

testPipeline();
