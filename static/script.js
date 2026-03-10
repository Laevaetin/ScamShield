const form = document.getElementById('form');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const hero = document.getElementById('hero');
const textarea = document.getElementById('inp-msg');

textarea.addEventListener('input', () => {
  document.getElementById('char-num').textContent = textarea.value.length;
});

const EXAMPLES = {
  phishing: `From: security-alert@paypa1-support.com\nSubject: URGENT: Your account has been suspended\n\nDear Customer,\n\nWe have detected unusual activity on your PayPal account. To restore access, verify your information immediately:\n\nhttp://paypal-verification-security.xyz/restore-account\n\nYou must complete this within 24 hours or your account will be permanently closed.\n\nPayPal Security Team`,
  sms: `USPS NOTICE: Your package #9400111899223397 could not be delivered. A $2.50 redelivery fee is required. Pay now or your package will be returned: http://usps-redeliver.info/pay`,
  safe: `Hey! Just wanted to confirm our dinner reservation for Saturday at 7pm. The restaurant is on 4th and Main. Let me know if you need to reschedule!`
};

function loadExample(type) {
  textarea.value = EXAMPLES[type];
  document.getElementById('char-num').textContent = textarea.value.length;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = textarea.value.trim();
  if (!msg) return;

  hero.classList.add('hidden');
  loading.classList.remove('hidden');
  document.getElementById('analyze-btn').disabled = true;

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    loading.classList.add('hidden');

    if (data.error) {
      alert('Error: ' + data.error);
      hero.classList.remove('hidden');
      document.getElementById('analyze-btn').disabled = false;
      return;
    }

    renderResults(data);
    results.classList.remove('hidden');

  } catch {
    loading.classList.add('hidden');
    hero.classList.remove('hidden');
    document.getElementById('analyze-btn').disabled = false;
    alert('Network error — is Flask running?');
  }
});

function renderResults(d) {
  const verdict = (d.verdict || 'SUSPICIOUS').toUpperCase();
  const box = document.getElementById('verdict-box');
  const cls = verdict === 'SCAM' ? 'scam' : verdict === 'LIKELY SCAM' ? 'likelyscam' : verdict === 'SUSPICIOUS' ? 'suspicious' : 'safe';
  box.className = 'verdict-box ' + cls;

  document.getElementById('verdict-label').textContent = verdict;
  document.getElementById('confidence-label').textContent = (d.confidence || 0) + '% confident';
  document.getElementById('verdict-summary').textContent = d.summary || '';
  document.getElementById('scam-type').textContent = d.scam_type || '—';
  document.getElementById('what-they-want').textContent = d.what_they_want || '—';
  document.getElementById('what-to-do').textContent = d.what_to_do || '—';

  const list = document.getElementById('red-flags-list');
  list.innerHTML = '';
  if (!d.red_flags || d.red_flags.length === 0) {
    list.innerHTML = '<li class="clean-msg">✅ No red flags detected.</li>';
  } else {
    d.red_flags.forEach(flag => {
      const li = document.createElement('li');
      li.textContent = flag;
      list.appendChild(li);
    });
  }
}

function reset() {
  results.classList.add('hidden');
  hero.classList.remove('hidden');
  textarea.value = '';
  document.getElementById('char-num').textContent = '0';
  document.getElementById('analyze-btn').disabled = false;
}
