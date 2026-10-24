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

// 한마디는 100자까지만, 남은 글자 수를 입력칸 아래에 보여 준다
const MESSAGE_MAX_LENGTH = 100;
messageInput.maxLength = MESSAGE_MAX_LENGTH;
const counterText = document.createElement('p');
messageInput.after(counterText);

function showCounter() {
  const remaining = MESSAGE_MAX_LENGTH - messageInput.value.length;
  counterText.textContent = `남은 글자 수: ${remaining}`;
}

messageInput.addEventListener('input', showCounter);
showCounter();

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
    showCounter();
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

// [임시] 공개 키로 글 고치기 규칙 확인 버튼 (확인 후 지울 것)
// 별명이 '테스트'인 글 하나만 고치고, 바뀌었으면 원래 글로 되돌린다
const TEST_NICKNAME = '테스트';
const testButton = document.createElement('button');
testButton.type = 'button';
testButton.textContent = '[임시] 공개 키로 고치기 테스트';
const testStatus = document.createElement('p');
list.after(testButton, testStatus);

async function patchMessage(id, message) {
  const url = `${SUPABASE_URL}/rest/v1/guestbook?id=eq.${id}&nickname=eq.${encodeURIComponent(TEST_NICKNAME)}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ message }),
  });
  const body = response.ok ? await response.json() : [];
  return { status: response.status, count: body.length };
}

async function runEditTest() {
  testButton.disabled = true;
  testStatus.textContent = '확인 중...';
  try {
    const url = `${SUPABASE_URL}/rest/v1/guestbook?select=id,message&nickname=eq.${encodeURIComponent(TEST_NICKNAME)}&order=created_at.desc&limit=1`;
    const found = await fetch(url, { headers });
    if (!found.ok) {
      throw new Error(`테스트 글을 찾지 못했습니다 (${found.status})`);
    }
    const [row] = await found.json();
    if (!row) {
      testStatus.textContent = "별명 '테스트'로 먼저 한 줄 남겨 주세요.";
      return;
    }

    const changed = await patchMessage(row.id, `규칙 테스트 ${new Date().toLocaleTimeString('ko-KR')}`);
    let result = `고치기 요청: 응답 ${changed.status}, 바뀐 줄 ${changed.count}개`;
    if (changed.count > 0) {
      const restored = await patchMessage(row.id, row.message);
      result += ` / 원래 글로 되돌리기: 응답 ${restored.status}, 바뀐 줄 ${restored.count}개`;
    }
    testStatus.textContent = result;
  } catch (error) {
    testStatus.textContent = error.message;
  } finally {
    testButton.disabled = false;
  }
}

testButton.addEventListener('click', runEditTest);
