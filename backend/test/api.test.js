// テスト用にインメモリDBを使う（require より前に設定する必要がある）
process.env.DB_FILE = ':memory:';

const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');
const { closeDB } = require('../db');

after(() => closeDB());

// ログイン済みのエージェントを返す
async function loginAs(username, password) {
  const agent = request.agent(app);
  await agent.post('/api/login').send({ username, password }).expect(200);
  return agent;
}

describe('POST /api/login', () => {
  test('正しい認証情報で成功する', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'user1', password: 'password1' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test('誤ったパスワードは401', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'user1', password: 'wrong' });
    assert.equal(res.status, 401);
  });

  test('存在しないユーザーは401', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'nobody', password: 'x' });
    assert.equal(res.status, 401);
  });

  test('入力が欠けていると400', async () => {
    const res = await request(app).post('/api/login').send({ username: 'user1' });
    assert.equal(res.status, 400);
  });

  test('ボディなしでも500にならず400', async () => {
    const res = await request(app).post('/api/login');
    assert.equal(res.status, 400);
  });
});

describe('認証が必要なエンドポイント', () => {
  test('未ログインは全て401', async () => {
    await request(app).get('/api/bookmarks').expect(401);
    await request(app).post('/api/bookmarks').send({ url: 'https://a.example', title: 'a' }).expect(401);
    await request(app).delete('/api/bookmarks/1').expect(401);
  });

  test('GET /api/me はログイン中のみユーザー名を返す', async () => {
    await request(app).get('/api/me').expect(401);
    const agent = await loginAs('user1', 'password1');
    const res = await agent.get('/api/me').expect(200);
    assert.equal(res.body.username, 'user1');
  });

  test('ログアウト後は401に戻る', async () => {
    const agent = await loginAs('user1', 'password1');
    await agent.get('/api/bookmarks').expect(200);
    await agent.post('/api/logout').expect(200);
    await agent.get('/api/bookmarks').expect(401);
  });
});

describe('/api/bookmarks', () => {
  test('追加→取得→削除ができる', async () => {
    const agent = await loginAs('taro', 'yamada');

    const created = await agent
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', title: 'Example' })
      .expect(201);
    const { id } = created.body.bookmark;
    assert.ok(Number.isInteger(id));

    const list = await agent.get('/api/bookmarks').expect(200);
    assert.ok(list.body.bookmarks.some((b) => b.id === id && b.title === 'Example'));

    await agent.delete(`/api/bookmarks/${id}`).expect(200);
    const after = await agent.get('/api/bookmarks').expect(200);
    assert.ok(!after.body.bookmarks.some((b) => b.id === id));
  });

  test('url/title が不正なら400', async () => {
    const agent = await loginAs('taro', 'yamada');
    await agent.post('/api/bookmarks').send({ title: 'no url' }).expect(400);
    await agent.post('/api/bookmarks').send({ url: 'https://a.example' }).expect(400);
    await agent.post('/api/bookmarks').send({ url: 'javascript:alert(1)', title: 'xss' }).expect(400);
  });

  test('他ユーザーのブックマークは見えず、削除もできない', async () => {
    const hanako = await loginAs('hanako', 'flower');
    const { body } = await hanako
      .post('/api/bookmarks')
      .send({ url: 'https://hanako.example', title: 'private' })
      .expect(201);
    const { id } = body.bookmark;

    const sachiko = await loginAs('sachiko', 'happy');
    const list = await sachiko.get('/api/bookmarks').expect(200);
    assert.ok(!list.body.bookmarks.some((b) => b.id === id));

    await sachiko.delete(`/api/bookmarks/${id}`).expect(404);

    // 持ち主からはまだ見える
    const still = await hanako.get('/api/bookmarks').expect(200);
    assert.ok(still.body.bookmarks.some((b) => b.id === id));
  });

  test('不正なIDは400、存在しないIDは404', async () => {
    const agent = await loginAs('taro', 'yamada');
    await agent.delete('/api/bookmarks/abc').expect(400);
    await agent.delete('/api/bookmarks/999999').expect(404);
  });
});
