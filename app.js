// Insta Mini — Frontend-only Instagram-like demo using LocalStorage
(() => {
  const STORAGE_KEY = 'insta-mini-v1';

  // Utils
  const uid = (p='id') => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  const escapeHtml = (s='') => s.replace(/[&<>"'`=\/]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','=':'&#x3D;','`':'&#x60;'}[c]));
  const timeAgo = (d) => {
    const t = (typeof d === 'number') ? d : new Date(d).getTime();
    const s = Math.floor((Date.now() - t)/1000);
    if (s<5) return 'just now';
    const units = [['y',31536000],['mo',2592000],['w',604800],['d',86400],['h',3600],['m',60],['s',1]];
    for (const [label, sec] of units){
      const v = Math.floor(s/sec); if (v>=1) return `${v}${label} ago`;
    }
    return 'just now';
  };
  const byTimeDesc = (a,b) => b.createdAt - a.createdAt;

  // Store
  class Store {
    constructor(key){ this.key = key; this.state = null; this.load(); if (!this.state) this.seed(); }
    load(){ try{ this.state = JSON.parse(localStorage.getItem(this.key)); }catch{ this.state=null; } }
    save(){ localStorage.setItem(this.key, JSON.stringify(this.state)); }
    reset(){ localStorage.removeItem(this.key); this.seed(); }

    seed(){
      const u1 = { id: uid('u'), username:'alex', name:'Alex Rivera', bio:'Photographer • Coffee • Travel', following:[] };
      const u2 = { id: uid('u'), username:'bella', name:'Bella Chen', bio:'Design + Frontend', following:[] };
      const u3 = { id: uid('u'), username:'carlos', name:'Carlos M', bio:'Runner. Gamer. Dev.', following:[] };

      // follows
      u1.following.push(u2.id);
      u2.following.push(u1.id);
      u3.following.push(u1.id);

      const posts = [
        { id: uid('p'), authorId: u2.id, imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop', caption:'Late night code ✨', createdAt: Date.now()-1000*60*60*20, likes:[u1.id] },
        { id: uid('p'), authorId: u1.id, imageUrl: 'https://images.unsplash.com/photo-1520975922325-24c4c1e3509b?q=80&w=1200&auto=format&fit=crop', caption:'City lights.', createdAt: Date.now()-1000*60*60*9, likes:[u2.id,u3.id] },
        { id: uid('p'), authorId: u3.id, imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop', caption:'Trail run 🏃‍♂️', createdAt: Date.now()-1000*60*60*2, likes:[] },
      ];
      const comments = [
        { id: uid('c'), postId: posts[0].id, authorId: u1.id, content:'Love this vibe 🔥', createdAt: Date.now()-1000*60*60*19.5 },
        { id: uid('c'), postId: posts[1].id, authorId: u2.id, content:'Where is this?', createdAt: Date.now()-1000*60*60*8.5 },
        { id: uid('c'), postId: posts[1].id, authorId: u3.id, content:'Looks awesome!', createdAt: Date.now()-1000*60*60*8.4 },
      ];

      this.state = {
        users: [u1,u2,u3],
        posts,
        comments,
        currentUserId: u1.id,
        createdAt: Date.now()
      };
      this.save();
    }

    // Users
    allUsers(){ return [...this.state.users].sort((a,b)=>a.username.localeCompare(b.username)); }
    getUser(id){ return this.state.users.find(u=>u.id===id)||null; }
    getUserByUsername(username){ return this.state.users.find(u=>u.username.toLowerCase()===username.toLowerCase())||null; }
    createUser({username, name='', bio=''}) {
      const un = (username||'').trim();
      if (!un) throw new Error('Username required');
      if (this.getUserByUsername(un)) throw new Error('Username already exists');
      const user = { id: uid('u'), username: un, name: (name||un).trim(), bio: (bio||'').trim(), following:[] };
      this.state.users.push(user); this.save(); return user;
    }
    setCurrentUser(id){ this.state.currentUserId = id; this.save(); }
    currentUser(){ return this.getUser(this.state.currentUserId); }

    // Follow
    isFollowing(srcId, targetId){ const u = this.getUser(srcId); return !!u && u.following.includes(targetId); }
    follow(srcId, targetId){ if (srcId===targetId) return; const u=this.getUser(srcId); if(!u.following.includes(targetId)){ u.following.push(targetId); this.save(); } }
    unfollow(srcId, targetId){ const u=this.getUser(srcId); u.following = u.following.filter(id=>id!==targetId); this.save(); }
    followersOf(userId){ return this.state.users.filter(u => u.following.includes(userId)); }

    // Posts
    createPost(authorId, imageUrl, caption=''){
      if (!imageUrl) throw new Error('Please select an image');
      const p = { id: uid('p'), authorId, imageUrl, caption: caption.trim(), createdAt: Date.now(), likes:[] };
      this.state.posts.push(p); this.save(); return p;
    }
    getPost(id){ return this.state.posts.find(p=>p.id===id)||null; }
    toggleLike(postId, userId){
      const p = this.getPost(postId); if (!p) return false;
      const i = p.likes.indexOf(userId);
      if (i === -1){ p.likes.push(userId); this.save(); return true; }
      p.likes.splice(i,1); this.save(); return false;
    }
    ensureLike(postId, userId){
      const p = this.getPost(postId); if (!p) return false;
      if (!p.likes.includes(userId)){ p.likes.push(userId); this.save(); return true; }
      return false;
    }
    isPostLikedBy(postId, userId){
      const p = this.getPost(postId); return p ? p.likes.includes(userId) : false;
    }

    // Comments
    addComment(postId, authorId, content){
      const txt = (content||'').trim(); if (!txt) throw new Error('Comment cannot be empty');
      const c = { id: uid('c'), postId, authorId, content: txt, createdAt: Date.now() };
      this.state.comments.push(c); this.save(); return c;
    }
    commentsFor(postId){ return this.state.comments.filter(c=>c.postId===postId).sort(byTimeDesc); }

    // Feeds
    userPosts(userId){ return this.state.posts.filter(p=>p.authorId===userId).sort(byTimeDesc); }
    feedFor(userId){
      if (!userId) return [...this.state.posts].sort(byTimeDesc);
      const me = this.getUser(userId);
      const ids = new Set([userId,...(me?.following||[])]);
      return this.state.posts.filter(p=>ids.has(p.authorId)).sort(byTimeDesc);
    }
  }

  const store = new Store(STORAGE_KEY);

  // State (UI)
  let view = { name:'feed', userId:null };
  const expandedComments = new Set(); // postId -> expanded

  // DOM
  const el = {
    navHome: document.getElementById('navHome'),
    auth: document.getElementById('authArea'),
    search: document.getElementById('userSearch'),
    userList: document.getElementById('userList'),
    viewFeed: document.getElementById('view-feed'),
    viewProfile: document.getElementById('view-profile'),
  };

  // UI bits
  const avatarHtml = (name='', tiny=false) => `<div class="avatar ${tiny?'tiny':''}">${escapeHtml((name||'?').trim()[0]||'?')}</div>`;
  const heartSvg = (liked=false) => `
    <svg class="icon-heart ${liked?'liked':''}" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`;
  const commentSvg = () => `
    <svg class="icon-comment" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
    </svg>`;

  // Render auth
  function renderAuth(){
    const me = store.currentUser();
    if (!me){
      el.auth.innerHTML = `
        <form id="loginForm" style="display:flex; gap:8px; align-items:center;">
          <input required name="username" type="text" placeholder="Username" class="search" style="max-width:160px"/>
          <input name="name" type="text" placeholder="Display name" class="search" style="max-width:180px"/>
          <button class="btn primary">Sign in / Create</button>
        </form>
      `;
    } else {
      el.auth.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          ${avatarHtml(me.name, true)}
          <span style="font-weight:700">@${escapeHtml(me.username)}</span>
          <button class="btn ghost small" id="btnMyProfile">Profile</button>
          <button class="btn danger small" id="btnLogout">Log out</button>
        </div>
      `;
    }
  }

  // Suggestions
  function renderSuggestions(filter=''){
    const me = store.currentUser();
    const users = store.allUsers().filter(u => (u.username+' '+u.name).toLowerCase().includes(filter.toLowerCase()));
    el.userList.innerHTML = users.map(u => {
      const isMe = me && me.id === u.id;
      const following = me ? store.isFollowing(me.id, u.id) : false;
      return `
        <li class="user-item">
          <div class="user-meta" data-action="open-profile" data-user-id="${u.id}">
            ${avatarHtml(u.name, true)}
            <div>
              <div class="user-name">${escapeHtml(u.name)}</div>
              <div class="username">@${escapeHtml(u.username)}</div>
            </div>
          </div>
          ${isMe ? '' : `
            <button class="btn small ${following?'ghost':'success'}" data-action="${following?'unfollow':'follow'}" data-user-id="${u.id}">
              ${following ? 'Following' : 'Follow'}
            </button>
          `}
        </li>
      `;
    }).join('');
  }

  // Composer
  function composerHtml(){
    const me = store.currentUser();
    const disabled = me ? '' : 'disabled';
    return `
      <div class="card composer">
        <form id="postForm">
          <div class="row">
            ${me ? avatarHtml(me.name, true) : ''}
            <input name="caption" type="text" placeholder="${me?'Write a caption…':'Sign in to post'}" ${disabled} class="search" style="max-width:none; flex:1"/>
            <label class="btn ghost small" style="cursor:pointer;">
              Upload
              <input id="imageInput" name="image" type="file" accept="image/*" ${disabled} style="display:none"/>
            </label>
            <button class="btn primary" ${disabled}>Post</button>
          </div>
          <div class="preview" id="imagePreview">
            <button type="button" class="remove-preview" id="removePreview">Remove</button>
            <img alt="Preview" id="previewImg"/>
          </div>
        </form>
      </div>
    `;
  }

  // Post
  function postHtml(p){
    const me = store.currentUser();
    const author = store.getUser(p.authorId);
    const liked = me ? store.isPostLikedBy(p.id, me.id) : false;
    const comments = store.commentsFor(p.id);
    const showAll = expandedComments.has(p.id);
    const visibleComments = showAll ? comments : comments.slice(0, 2);
    return `
      <article class="post card" data-post-id="${p.id}">
        <header class="post-head">
          ${avatarHtml(author?.name || '?', true)}
          <div class="post-author" data-action="open-profile" data-user-id="${author?.id || ''}">
            ${escapeHtml(author?.name || 'Unknown')}
            <span class="post-username">@${escapeHtml(author?.username || 'unknown')}</span>
          </div>
        </header>

        <div class="post-media" data-action="media" data-post-id="${p.id}">
          <img src="${escapeHtml(p.imageUrl)}" alt="Post image"/>
          <div class="heart-overlay" id="heart-${p.id}">
            ${heartSvg(true)}
          </div>
        </div>

        <div class="post-actions">
          <button class="icon-btn" data-action="toggle-like" data-post-id="${p.id}">
            ${heartSvg(liked)}
            <span class="count">${p.likes.length}</span>
          </button>
          <button class="icon-btn" data-action="focus-comment" data-post-id="${p.id}">
            ${commentSvg()}
            <span class="count">${comments.length}</span>
          </button>
        </div>

        <div class="post-meta">
          <div class="likes">${p.likes.length} ${p.likes.length===1?'like':'likes'}</div>
          ${p.caption ? `<div class="caption"><b data-action="open-profile" data-user-id="${author?.id || ''}">${escapeHtml(author?.username || '')}</b> ${escapeHtml(p.caption)}</div>` : ''}
          <div class="time">${timeAgo(p.createdAt)}</div>
        </div>

        <div class="comment-list">
          ${comments.length>2 ? `
            <div class="view-all" data-action="toggle-comments" data-post-id="${p.id}">
              ${showAll ? 'Hide comments' : `View all ${comments.length} comments`}
            </div>
          ` : ''}
          ${visibleComments.map(c => commentHtml(c)).join('')}
        </div>

        <form class="comment-form" data-post-id="${p.id}">
          <input type="text" name="content" placeholder="${me?'Add a comment…':'Sign in to comment'}" ${me?'':'disabled'} />
          <button class="btn primary small" ${me?'':'disabled'}>Post</button>
        </form>
      </article>
    `;
  }

  function commentHtml(c){
    const by = store.getUser(c.authorId);
    return `
      <div class="comment">
        <div><b data-action="open-profile" data-user-id="${by?.id || ''}">${escapeHtml(by?.username || 'user')}</b></div>
        <div>${escapeHtml(c.content)}</div>
      </div>
    `;
  }

  // Views
  function renderFeed(){
    const me = store.currentUser();
    const posts = store.feedFor(me?.id);
    el.viewProfile.classList.add('hidden');
    el.viewFeed.classList.remove('hidden');
    el.viewFeed.innerHTML = `
      ${composerHtml()}
      <div class="feed">
        ${posts.map(p => postHtml(p)).join('')}
      </div>
    `;
  }

  function renderProfile(userId){
    const user = store.getUser(userId);
    const me = store.currentUser();
    if (!user){ renderFeed(); return; }
    const posts = store.userPosts(userId);
    const followers = store.followersOf(userId);
    const isMe = me && me.id === user.id;
    const following = me ? store.isFollowing(me.id, user.id) : false;

    el.viewFeed.classList.add('hidden');
    el.viewProfile.classList.remove('hidden');
    el.viewProfile.innerHTML = `
      <div class="profile-header">
        ${avatarHtml(user.name)}
        <div style="flex:1">
          <div class="profile-name">
            ${escapeHtml(user.name)} <span class="profile-username">@${escapeHtml(user.username)}</span>
          </div>
          <div class="stats">
            <div><strong>${posts.length}</strong> posts</div>
            <div><strong>${followers.length}</strong> follower${followers.length===1?'':'s'}</div>
            <div><strong>${user.following.length}</strong> following</div>
          </div>
          <div class="bio">${user.bio ? escapeHtml(user.bio) : '<span style="color:#777">No bio yet</span>'}</div>
        </div>
        <div class="profile-actions">
          ${isMe ? '' : `
            <button class="btn ${following?'ghost':'success'}" data-action="${following?'unfollow':'follow'}" data-user-id="${user.id}">
              ${following ? 'Following' : 'Follow'}
            </button>
          `}
        </div>
      </div>

      <div class="grid">
        ${posts.map(p => `
          <div class="tile" data-action="open-post" data-post-id="${p.id}">
            <img src="${escapeHtml(p.imageUrl)}" alt="Post"/>
          </div>
        `).join('') || `<div class="card" style="padding:12px;">No posts yet.</div>`}
      </div>
    `;
  }

  // Router
  function goHome(){ view = {name:'feed', userId:null}; renderAll(); }
  function goProfile(userId){ view = {name:'profile', userId}; renderAll(); }

  // Global render
  function renderAll(){
    renderAuth();
    renderSuggestions(el.search.value || '');
    if (view.name === 'feed') renderFeed();
    else renderProfile(view.userId);
  }

  // Helpers
  const readFileAsDataURL = (file) => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

  // Events
  function attachEvents(){
    // Top brand -> home
    el.navHome.addEventListener('click', goHome);
    el.navHome.addEventListener('keydown', (e)=>{ if (e.key==='Enter') goHome(); });

    // Auth events
    el.auth.addEventListener('submit', (e) => {
      if (e.target.id === 'loginForm'){
        e.preventDefault();
        const fd = new FormData(e.target);
        const username = String(fd.get('username')||'').trim();
        const name = String(fd.get('name')||'').trim();
        if (!username) return;
        const existing = store.getUserByUsername(username);
        if (existing) store.setCurrentUser(existing.id);
        else {
          try{ const u = store.createUser({ username, name }); store.setCurrentUser(u.id); }
          catch(err){ alert(err.message); }
        }
        renderAll();
      }
    });
    el.auth.addEventListener('click', (e) => {
      if (e.target.id === 'btnLogout'){ store.setCurrentUser(null); renderAll(); }
      if (e.target.id === 'btnMyProfile'){ const me = store.currentUser(); if (me) goProfile(me.id); }
    });

    // Search
    el.search.addEventListener('input', () => renderSuggestions(el.search.value || ''));

    // Suggestions interactions
    el.userList.addEventListener('click', (e) => {
      const meta = e.target.closest('[data-action="open-profile"]');
      if (meta){ goProfile(meta.dataset.userId); return; }
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const me = store.currentUser(); if (!me){ alert('Sign in to follow people'); return; }
      const action = btn.dataset.action;
      const uid = btn.dataset.userId;
      if (action==='follow') store.follow(me.id, uid);
      if (action==='unfollow') store.unfollow(me.id, uid);
      renderAll();
    });

    // Content events (delegated)
    const content = document.querySelector('.content');

    // Posting
    content.addEventListener('change', async (e) => {
      if (e.target.id === 'imageInput'){
        const file = e.target.files?.[0];
        const preview = document.getElementById('imagePreview');
        const img = document.getElementById('previewImg');
        if (file){
          img.src = await readFileAsDataURL(file);
          preview.style.display = 'block';
        } else {
          img.src = '';
          preview.style.display = 'none';
        }
      }
    });
    content.addEventListener('click', (e) => {
      if (e.target.id === 'removePreview'){
        const preview = document.getElementById('imagePreview');
        const imgInput = document.getElementById('imageInput');
        const img = document.getElementById('previewImg');
        imgInput.value = '';
        img.src = '';
        preview.style.display = 'none';
      }
    });
    content.addEventListener('submit', async (e) => {
      // New post
      if (e.target.id === 'postForm'){
        e.preventDefault();
        const me = store.currentUser(); if (!me){ alert('Sign in to post'); return; }
        const fd = new FormData(e.target);
        const caption = String(fd.get('caption')||'');
        const fileInput = document.getElementById('imageInput');
        const file = fileInput.files?.[0];
        let dataUrl = '';
        if (file) dataUrl = await readFileAsDataURL(file);
        try{
          store.createPost(me.id, dataUrl, caption);
          // reset
          e.target.reset();
          const preview = document.getElementById('imagePreview');
          const img = document.getElementById('previewImg');
          img.src = ''; preview.style.display='none';
          renderAll();
        } catch(err){ alert(err.message); }
      }

      // Comment form
      if (e.target.classList.contains('comment-form')){
        e.preventDefault();
        const me = store.currentUser(); if (!me){ alert('Sign in to comment'); return; }
        const postId = e.target.dataset.postId;
        const fd = new FormData(e.target);
        const contentTxt = String(fd.get('content')||'');
        try{
          store.addComment(postId, me.id, contentTxt);
          e.target.reset();
          renderAll();
        } catch(err){ alert(err.message); }
      }
    });

    // Likes, open profile, toggle comments, focus comment
    content.addEventListener('click', (e) => {
      const op = e.target.closest('[data-action="open-profile"]');
      if (op){ goProfile(op.dataset.userId); return; }

      const likeBtn = e.target.closest('[data-action="toggle-like"]');
      if (likeBtn){
        const me = store.currentUser(); if (!me){ alert('Sign in to like posts'); return; }
        store.toggleLike(likeBtn.dataset.postId, me.id);
        renderAll();
        return;
      }

      const toggle = e.target.closest('[data-action="toggle-comments"]');
      if (toggle){
        const id = toggle.dataset.postId;
        if (expandedComments.has(id)) expandedComments.delete(id);
        else expandedComments.add(id);
        renderAll();
        return;
      }

      const focusC = e.target.closest('[data-action="focus-comment"]');
      if (focusC){
        const form = document.querySelector(`form.comment-form[data-post-id="${focusC.dataset.postId}"] input[name="content"]`);
        if (form){ form.focus(); }
        return;
      }

      const followBtn = e.target.closest('button[data-action="follow"],button[data-action="unfollow"]');
      if (followBtn){
        const me = store.currentUser(); if (!me){ alert('Sign in to follow'); return; }
        const action = followBtn.dataset.action;
        const uid = followBtn.dataset.userId;
        if (action==='follow') store.follow(me.id, uid); else store.unfollow(me.id, uid);
        renderAll();
      }
    });

    // Double-click to like (and mobile double-tap)
    const lastTap = new Map(); // postId -> timestamp
    content.addEventListener('dblclick', (e) => {
      const media = e.target.closest('[data-action="media"]');
      if (!media) return;
      const postId = media.dataset.postId;
      const me = store.currentUser(); if (!me) return;
      showPopHeart(postId);
      store.ensureLike(postId, me.id);
      renderAll();
    }, { passive:true });

    content.addEventListener('touchend', (e) => {
      const media = e.target.closest('[data-action="media"]');
      if (!media) return;
      const postId = media.dataset.postId;
      const now = Date.now();
      const t = lastTap.get(postId) || 0;
      if (now - t < 300){
        const me = store.currentUser(); if (!me) return;
        showPopHeart(postId);
        store.ensureLike(postId, me.id);
        renderAll();
      }
      lastTap.set(postId, now);
    }, { passive:true });
  }

  function showPopHeart(postId){
    const elHeart = document.getElementById(`heart-${postId}`);
    if (!elHeart) return;
    elHeart.classList.remove('pop');
    void elHeart.offsetWidth; // reflow to restart animation
    elHeart.classList.add('pop');
  }

  // Init
  attachEvents();
  renderAll();

  // Debug
  window.__instaMiniReset = () => { store.reset(); expandedComments.clear(); renderAll(); };
})();