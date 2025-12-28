const testRegistration = async () => {
    try {
        console.log('Testing Registration API...');
        const randomUser = 'admin_' + Math.floor(Math.random() * 1000);

        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: randomUser,
                password: 'password123'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Registration Successful!');
            console.log('Status:', response.status);
            console.log('Data:', data);
        } else {
            console.error('❌ Registration Failed!');
            console.error('Status:', response.status);
            console.error('Data:', data);
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
};

testRegistration();
