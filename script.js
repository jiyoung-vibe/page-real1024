// Supabase 주소와 공개 키 (비밀 키는 넣지 않습니다)
const SUPABASE_URL = 'https://vurhwxovinlzsquzydvk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_kAuQ299DLTEhijHcmguUCQ_K47LCO94';

const nicknameInput = document.getElementById('nickname');
const messageInput = document.getElementById('message');
const submitButton = document.querySelector('form button');
const list = document.getElementById('guestbook-list');

// 오류 문구를 보여 줄 자리 (목록 바로 위)
const statusText = document.createElement('p');
list.before(statusText);

const headers = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
};

function showStatus(text) {
  statusText.textContent = text;
}

// 최신 글이 맨 위에 오도록 목록을 다시 그린다
async function loadGuestbook() {
  const url = `${SUPABASE_URL}/rest/v1/guestbook?select=nickname,message,created_at&order=created_at.desc`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`목록을 불러오지 못했습니다 (${response.status})`);
  }

  const rows = await response.json();
  const items = rows.map((row) => {
    const item = document.createElement('li');
    const name = document.createElement('strong');
    name.textContent = row.nickname;
    const text = document.createElement('p');
    text.textContent = row.message;
    item.append(name, text);
    return item;
  });
  list.replaceChildren(...items);
}

async function saveEntry() {
  const nickname = nicknameInput.value.trim();
  const message = messageInput.value.trim();
  if (!nickname || !message) {
    showStatus('별명과 한마디를 모두 적어 주세요.');
    return;
  }

  submitButton.disabled = true;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/guestbook`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ nickname, message }),
    });
    if (!response.ok) {
      throw new Error(`남기지 못했습니다 (${response.status})`);
    }

    nicknameInput.value = '';
    messageInput.value = '';
    showStatus('');
    await loadGuestbook();
  } catch (error) {
    showStatus(error.message);
  } finally {
    submitButton.disabled = false;
  }
}

submitButton.addEventListener('click', saveEntry);

loadGuestbook().catch((error) => showStatus(error.message));
