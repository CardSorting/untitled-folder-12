// Celery client for communicating with LavinMQ
class CeleryClient {
    constructor() {
        this.baseUrl = 'http://localhost:5000'; // We'll need to create a small Flask server to bridge JS and Celery
    }

    async processText(text) {
        try {
            const response = await fetch(`${this.baseUrl}/process_text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error processing text:', error);
            throw error;
        }
    }
}

export const celeryClient = new CeleryClient();
