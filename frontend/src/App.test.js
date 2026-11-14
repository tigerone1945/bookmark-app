import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// fetch の戻り値を最小限に再現するヘルパー
const respond = (status, body = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

// バックエンドの代わりに状態を持つ fetch のフェイク
function installFakeBackend({ loggedIn = false, bookmarks = [], failAdd = false } = {}) {
  const state = { loggedIn, bookmarks: [...bookmarks], nextId: 100 };

  global.fetch = jest.fn(async (url, options = {}) => {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};

    if (url === '/api/me') {
      return state.loggedIn ? respond(200, { success: true, username: 'user1' }) : respond(401);
    }
    if (url === '/api/login' && method === 'POST') {
      if (body.username === 'user1' && body.password === 'password1') {
        state.loggedIn = true;
        return respond(200, { success: true });
      }
      return respond(401, { success: false });
    }
    if (url === '/api/logout' && method === 'POST') {
      state.loggedIn = false;
      return respond(200, { success: true });
    }
    if (!state.loggedIn) return respond(401);

    if (url === '/api/bookmarks' && method === 'GET') {
      // 実APIと同様、毎回新しい配列を返す（同一参照だと React が再描画しない）
      return respond(200, { success: true, bookmarks: [...state.bookmarks] });
    }
    if (url === '/api/bookmarks' && method === 'POST') {
      if (failAdd) return respond(500);
      const bookmark = { id: state.nextId++, ...body };
      state.bookmarks.push(bookmark);
      return respond(201, { success: true, bookmark });
    }
    const match = url.match(/^\/api\/bookmarks\/(\d+)$/);
    if (match && method === 'DELETE') {
      state.bookmarks = state.bookmarks.filter((b) => b.id !== Number(match[1]));
      return respond(200, { success: true });
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  });

  return state;
}

const sample = { id: 1, url: 'https://example.com', title: 'Example', description: 'first' };

async function login() {
  userEvent.type(await screen.findByLabelText('Username:'), 'user1');
  userEvent.type(screen.getByLabelText('Password:'), 'password1');
  userEvent.click(screen.getByRole('button', { name: 'Login' }));
}

beforeEach(() => {
  // 意図的なエラーのログでテスト出力が汚れないようにする
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

describe('ログイン', () => {
  test('未ログインならログインフォームを表示する', async () => {
    installFakeBackend();
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('サーバー側のセッションが有効ならリロード後も一覧画面を表示する', async () => {
    installFakeBackend({ loggedIn: true, bookmarks: [sample] });
    render(<App />);
    expect(await screen.findByText('Example')).toBeInTheDocument();
  });

  test('ログイン成功でブックマーク一覧を表示する', async () => {
    installFakeBackend({ bookmarks: [sample] });
    render(<App />);
    await login();
    expect(await screen.findByText('Example')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://example.com' })).toHaveAttribute(
      'href',
      'https://example.com/' // URL 正規化により末尾スラッシュが付く
    );
  });

  test('http/https 以外のURLはリンクにせず、テキストとして表示する', async () => {
    const evil = { id: 9, url: 'javascript:alert(1)', title: 'Evil', description: '' };
    installFakeBackend({ loggedIn: true, bookmarks: [sample, evil] });
    render(<App />);
    expect(await screen.findByText('Evil')).toBeInTheDocument();
    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
    // リンクとして描画されるのは安全なURLのみ
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/');
  });

  test('認証失敗ならエラーを表示し、ログイン画面に留まる', async () => {
    installFakeBackend();
    render(<App />);
    userEvent.type(await screen.findByLabelText('Username:'), 'user1');
    userEvent.type(screen.getByLabelText('Password:'), 'wrong');
    userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByText('ログインに失敗しました')).toBeInTheDocument();
    expect(screen.queryByText('Bookmarks list')).not.toBeInTheDocument();
  });

  test('ネットワークエラーでもクラッシュせずエラーを表示する', async () => {
    installFakeBackend();
    render(<App />);
    await screen.findByLabelText('Username:');
    global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByText('サーバーに接続できませんでした')).toBeInTheDocument();
  });
});

describe('ブックマーク操作', () => {
  async function renderLoggedIn(options) {
    const state = installFakeBackend({ loggedIn: true, ...options });
    render(<App />);
    await screen.findByText('Bookmarks list');
    return state;
  }

  test('追加するとリストに反映され、フォームが空に戻る', async () => {
    await renderLoggedIn();
    userEvent.type(screen.getByPlaceholderText('URL'), 'https://new.example');
    userEvent.type(screen.getByPlaceholderText('Title'), 'New one');
    userEvent.type(screen.getByPlaceholderText('Description'), 'desc');
    userEvent.click(screen.getByRole('button', { name: 'Add Bookmark' }));

    expect(await screen.findByText('New one')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('URL')).toHaveValue('');
  });

  test('追加に失敗したらエラーを表示する', async () => {
    await renderLoggedIn({ failAdd: true });
    userEvent.type(screen.getByPlaceholderText('URL'), 'https://new.example');
    userEvent.type(screen.getByPlaceholderText('Title'), 'New one');
    userEvent.type(screen.getByPlaceholderText('Description'), 'desc');
    userEvent.click(screen.getByRole('button', { name: 'Add Bookmark' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ブックマークの追加に失敗しました');
    expect(screen.queryByText('New one')).not.toBeInTheDocument();
  });

  test('削除するとリストから消える', async () => {
    const second = { id: 2, url: 'https://b.example', title: 'Second', description: '' };
    await renderLoggedIn({ bookmarks: [sample, second] });
    expect(await screen.findByText('Example')).toBeInTheDocument();

    userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    await waitFor(() => expect(screen.queryByText('Example')).not.toBeInTheDocument());
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  test('一覧の取得に失敗したらエラーを表示する', async () => {
    installFakeBackend({ loggedIn: true });
    render(<App />);
    await screen.findByText('Bookmarks list');
    // 以降の取得（追加後の再取得）を失敗させる
    global.fetch.mockImplementation(async (url) =>
      url === '/api/bookmarks' ? respond(500) : respond(200, { success: true })
    );
    userEvent.type(screen.getByPlaceholderText('URL'), 'https://x.example');
    userEvent.type(screen.getByPlaceholderText('Title'), 'x');
    userEvent.type(screen.getByPlaceholderText('Description'), 'x');
    userEvent.click(screen.getByRole('button', { name: 'Add Bookmark' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  test('ログアウトするとログイン画面に戻る', async () => {
    await renderLoggedIn();
    userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(await screen.findByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
});
