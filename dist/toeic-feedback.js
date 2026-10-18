import { mountFeedbackForm } from './toeic/feedback.js';
const form = document.getElementById('feedback-form');
if (form instanceof HTMLFormElement) {
    try {
        mountFeedbackForm(form, new URLSearchParams(location.search));
    }
    catch (error) {
        const status = document.getElementById('feedback-error');
        if (status) {
            status.hidden = false;
            status.textContent = error.message;
        }
    }
}
