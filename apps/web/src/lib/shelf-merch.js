// Auto-extracted from shelf-merch.html — vanilla JS view engine.
// Wrapped so it mounts exactly once into #app/#toast/#layer when called from React.
import * as api from '../services/api-bridge.js';

let __mounted = false;
export function mountShelfMerch() {
  if (__mounted) return; __mounted = true;
/* =================================================================
   SHELF MERCH — Corporate Swag Platform (single-file interactive demo)
   INR throughout · brand green · vanilla JS view-router + in-memory state
================================================================= */

/* ---------- icons ---------- */
const I = {
  logo:`<svg viewBox="0 0 32 32" fill="none"><path d="M16 3 4 9l12 6 12-6-12-6Z" fill="#15784C"/><path d="M4 15l12 6 12-6" stroke="#0E5536" stroke-width="2.4" stroke-linejoin="round"/><path d="M4 21l12 6 12-6" stroke="#1E8E5C" stroke-width="2.4" stroke-linejoin="round"/></svg>`,
  home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>`,
  orders:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h12"/></svg>`,
  wallet:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M16 12h2"/></svg>`,
  shop:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h16l-1 11H5L4 9Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>`,
  swag:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4l3 2 3-2 3 2 3-2v4l-2 2v10H8V10L6 8V4Z"/></svg>`,
  kit:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l9-4 9 4-9 4-9-4Z"/><path d="M3 8v8l9 4 9-4V8M12 12v8"/></svg>`,
  camp:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10v4h4l6 4V6L8 10H4Z"/><path d="M18 9a4 4 0 0 1 0 6"/></svg>`,
  contacts:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6a3 3 0 0 1 0 6M16.5 20a5 5 0 0 0-3-4.6"/></svg>`,
  plug:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7ZM12 16v5"/></svg>`,
  bill:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>`,
  gear:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>`,
  cat:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  help:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7M12 17h.01"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>`,
  back:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>`,
  plus:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>`,
  send:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/></svg>`,
  check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg>`,
  upload:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4M8 8l4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>`,
  edit:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>`,
  eye:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  dots:`<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`,
  share:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>`,
  swap:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10H3l4-4M3 10l4 4M17 14h4l-4 4M21 14l-4-4"/></svg>`,
  truck:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>`,
  box:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l9-4 9 4-9 4-9-4Z"/><path d="M3 8v8l9 4 9-4V8"/></svg>`,
  spark:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/></svg>`,
  coin:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9h4a1.7 1.7 0 0 1 0 3.4H10a1.7 1.7 0 0 0 0 3.4h4"/></svg>`,
  trash:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13h10l1-13"/></svg>`,
};

/* product silhouettes (inline svg) */
const PG = {
  tee:`<svg viewBox="0 0 64 64" fill="none" stroke="#9aa39c" stroke-width="2.2"><path d="M22 10l-12 7 5 8 5-3v28h28V22l5 3 5-8-12-7-7 5-10 0-7-5Z"/></svg>`,
  hoodie:`<svg viewBox="0 0 64 64" fill="none" stroke="#9aa39c" stroke-width="2.2"><path d="M20 12l-10 7 4 9 6-3v25h24V25l6 3 4-9-10-7c-2 5-6 7-12 7s-10-2-12-7Z"/></svg>`,
  bottle:`<svg viewBox="0 0 64 64" fill="none" stroke="#9aa39c" stroke-width="2.2"><path d="M27 8h10v6l3 5v33a2 2 0 0 1-2 2H26a2 2 0 0 1-2-2V19l3-5V8Z"/></svg>`,
  mug:`<svg viewBox="0 0 64 64" fill="none" stroke="#9aa39c" stroke-width="2.2"><path d="M16 18h28v24a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6V18Z"/><path d="M44 24h6a5 5 0 0 1 0 12h-6"/></svg>`,
  bag:`<svg viewBox="0 0 64 64" fill="none" stroke="#9aa39c" stroke-width="2.2"><path d="M16 22h32l-3 32H19l-3-32Z"/><path d="M24 22v-4a8 8 0 0 1 16 0v4"/></svg>`,
  cap:`<svg viewBox="0 0 64 64" fill="none" stroke="#9aa39c" stroke-width="2.2"><path d="M12 40c0-14 9-22 20-22s20 8 20 22M12 40h44a3 3 0 0 1 0 6H12a3 3 0 0 1 0-6Z"/></svg>`,
  pack:`<svg viewBox="0 0 64 64" fill="none" stroke="#9aa39c" stroke-width="2.2"><rect x="18" y="14" width="28" height="38" rx="6"/><path d="M26 14v-3a6 6 0 0 1 12 0v3M24 26h16"/></svg>`,
  power:`<svg viewBox="0 0 64 64" fill="none" stroke="#9aa39c" stroke-width="2.2"><rect x="20" y="12" width="24" height="40" rx="4"/><path d="M28 20h8M28 44h8"/></svg>`,
  pillow:`<svg viewBox="0 0 64 64" fill="none" stroke="#9aa39c" stroke-width="2.2"><rect x="12" y="18" width="40" height="28" rx="10"/></svg>`,
  note:`<svg viewBox="0 0 64 64" fill="none" stroke="#9aa39c" stroke-width="2.2"><rect x="18" y="12" width="28" height="40" rx="3"/><path d="M24 22h16M24 30h16M24 38h10"/></svg>`,
};
const LOGO_DECO=`<svg viewBox="0 0 48 48" fill="#15784C"><path d="M24 6c2 5 7 8 13 8-3 5-3 11 0 16-6 0-11 3-13 8-2-5-7-8-13-8 3-5 3-11 0-16 6 0 11-3 13-8Z" opacity=".9"/><circle cx="24" cy="24" r="6" fill="#0E5536"/></svg>`;

/* ---------- money / points ---------- */
const PT = 2;                       // 1 point = ₹2
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const inr2 = n => '₹' + n.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const pts = n => (Math.round(n*100)/100).toLocaleString('en-IN') + ' Pts';
const USD_INR = 83;                 // demo conversion rate
const cmoney = (cur,n)=> cur==='USD' ? '$'+Math.round(n).toLocaleString('en-US') : inr(n);
const esc = s => (''+s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- state ---------- */
const S = {
  authed:false, view:'login', nav:'orders', loading:false,
  account:'Rubix', user:{name:'Chandra Sekhar', initials:'CS', email:'hr@rubix.net'},
  catalogProducts:[], campaigns:[], primaryEntityId:null,
  flow:{}, // ephemeral wizard state
  wallets:[
    {id:'w1', name:'Chakram Wallet', cur:'INR', balance:415000, unalloc:90000, alloc:325000, owner:'Jonna Madhavi', email:'jonnaml2015@gmail.com',
      activity:[
        {t:'Allocated', who:'12 recipients · Diwali 2026', amt:-120000, on:'02 Jun 2026'},
        {t:'Funds added', who:'Razorpay · UPI', amt:200000, on:'28 May 2026'},
        {t:'Transfer in', who:'from Sales Wallet', amt:90000, on:'21 May 2026'},
        {t:'Order paid', who:'New Hire Kit · 20 recipients', amt:-84000, on:'13 May 2026'},
      ]},
    {id:'w2', name:'Sales Wallet', cur:'INR', balance:142000, unalloc:142000, alloc:0, owner:'Chandra Sekhar', email:'konetibaba@gmail.com',
      activity:[{t:'Funds added', who:'Purchase order #PO-3391', amt:142000, on:'30 May 2026'}]},
    {id:'w3', name:'Global Wallet', cur:'USD', balance:6200, unalloc:6200, alloc:0, owner:'Jonna Madhavi', email:'jonnaml2015@gmail.com',
      activity:[{t:'Funds added', who:'Stripe · card', amt:6200, on:'18 May 2026'}]},
  ],
  shops:[
    {id:'s1', name:'Rubix Dubai', currency:'Points', live:true, categories:['Food & Beverages','Work Essentials','Merch'], collections:['c1']},
  ],
  collections:[
    {id:'c1', code:'C343955972', name:'New employee Swag', created:'28 May 2026', by:'Jonna Madhavi', status:'ready', shopId:'s1',
     products:[{g:'pack',brand:'Mercer+Mettle',nm:'Mercer+Mettle Pack'},{g:'hoodie',brand:'Bella + Canvas',nm:'Bella + Canvas Youth Sponge Fleece'},{g:'mug',brand:'',nm:'Black Glossy Mug 11oz'},{g:'bottle',brand:'',nm:'The Standard Bottle'}]},
  ],
  kits:[
    {id:'k1', name:'Welcome', items:4, status:'live', sent:false},
    {id:'k2', name:'New hire', items:5, status:'live', sent:false},
  ],
  contacts:[
    {id:'p1', email:'jonnaml2015@gmail.com', name:'Jonna Madhavi', role:'Owner', address:'', loc:''},
    {id:'p2', email:'konetibaba@gmail.com', name:'Chandra Sekhar', role:'Sender', address:'Flat No 1004, Tower-9, Eipl Corner Stone', loc:'Hyderabad, Telangana, IN'},
  ],
  departments:[
    {id:'d1', walletId:'w1', name:'Engineering', code:'CC-ENG', budget:120000, spent:64000, manager:'Chandra Sekhar', managerEmail:'konetibaba@gmail.com'},
    {id:'d2', walletId:'w1', name:'Sales', code:'CC-SAL', budget:90000, spent:38000, manager:'Jonna Madhavi', managerEmail:'jonnaml2015@gmail.com'},
    {id:'d3', walletId:'w1', name:'Marketing', code:'CC-MKT', budget:75000, spent:12000, manager:'Chandra Sekhar', managerEmail:'konetibaba@gmail.com'},
    {id:'d4', walletId:'w1', name:'People & HR', code:'CC-HR', budget:40000, spent:40000, manager:'Jonna Madhavi', managerEmail:'jonnaml2015@gmail.com'},
  ],
  orders:[
    {id:'o1', date:'01/05/2026', name:'Welcome Kit', status:'Shipped', amount:30000, track:'D43KJ3PPP', items:[['Welcome Tee','25'],['Steel Bottle','25'],['Logo Mug','25']]},
    {id:'o2', date:'01/05/2026', name:'New Hire Kit', status:'Delivered', amount:30000, track:'D43KJ3PPP', delivered:'13-05-2026', items:[['Hoodie','20'],['Notebook','20'],['Tote Bag','20']]},
    {id:'o3', date:'24/04/2026', name:'Diwali Hamper', status:'Processing', amount:184500, track:'', items:[['Gift Box','60'],['Sweets Pack','60']]},
  ],
  uid:100,
  org:{
    step:1, done:false, active:true, inWizard:false,
    wallet:{ name:'FY2026 Merchandise Budget', amount:1000000, start:'2026-04-01', end:'2027-03-31', funding:'upload', docType:'Purchase Order', docNumber:'PO-RUBIX-2026-0417', uploaded:false, pay:'card' },
    seq:6,
    departments:[
      {id:1,name:'Marketing',desc:'Events, conferences, swag campaigns and promotions.',users:25,allocated:300000,color:'#2563EB',mgr:{name:'Priya Sharma',email:'priya@rubix.net',mobile:'+91 98765 43210',role:'Marketing Manager',invite:true}},
      {id:2,name:'Sales',desc:'Client gifting, field sales kits and prospect merchandise.',users:40,allocated:200000,color:'#7C3AED',mgr:{name:'Ravi Kumar',email:'ravi@rubix.net',mobile:'+91 98220 11234',role:'Sales Manager',invite:true}},
      {id:3,name:'HR',desc:'Onboarding kits, employee rewards and recognition.',users:30,allocated:200000,color:'#0E9CB5',mgr:{name:'Anita Rao',email:'anita@rubix.net',mobile:'+91 99001 22789',role:'HR Manager',invite:true}},
      {id:4,name:'Admin',desc:'Office supplies, signage and facility merchandise.',users:12,allocated:150000,color:'#E08600',mgr:{name:'Karan Gupta',email:'karan@rubix.net',mobile:'+91 90040 55678',role:'Admin Manager',invite:true}},
      {id:5,name:'Customer Success',desc:'Customer welcome kits and loyalty merchandise.',users:18,allocated:150000,color:'#0A8F5B',mgr:{name:'Amit Singh',email:'amit@rubix.net',mobile:'+91 96320 99001',role:'Customer Success Manager',invite:true}},
    ],
  },
};
const nid = p => p+(++S.uid);

/* ---------- nav config ---------- */
const NAV = [
  ['orders','Orders',I.orders],['wallets','Wallets',I.wallet],['shops','Shops',I.shop],
  ['swag','Swag',I.swag],['kits','Kits',I.kit],['campaigns','Campaigns',I.camp],
  ['contacts','Contacts',I.contacts],['integrations','Integrations',I.plug],
  ['billing','Billing',I.bill],['settings','Settings',I.gear],['catalog','Catalog',I.cat],
];

/* ---------- router ---------- */
const APP = ()=>document.getElementById('app');
function go(view, opts={}){ S.view=view; if(opts.nav)S.nav=opts.nav; Object.assign(S.flow, opts.flow||{}); window.scrollTo(0,0); render(); }
function setNav(n){ S.nav=n; S.view=n; closeLayer(); render(); }

function render(){
  if(S.loading){ APP().innerHTML = `<div class="auth"><div style="display:grid;place-items:center;min-height:60vh;color:var(--ink-2);font-size:15px">Loading…</div></div>`; return; }
  if(!S.authed){ APP().innerHTML = S.view==='signup'?ViewSignup():ViewLogin(); return; }
  // full-screen wizard flows render without shell
  const full = ['createShop','shopBuilder','swagName','swagCatalog','swagArtwork','sendPoints','createKit','sendItems'];
  if(full.includes(S.view)){ APP().innerHTML = Wizards[S.view](); afterRender(); return; }
  APP().innerHTML = Shell( ViewFor(S.view) );
  afterRender();
}
function afterRender(){
  // focus first autofocus
  const a=document.querySelector('[autofocus]'); if(a)a.focus();
}
function ViewFor(v){
  const map={orders:ViewOrders,wallets:ViewWallets,shops:ViewShops,shopDetail:ViewShopDetail,
    swag:ViewSwag,kits:ViewKits,contacts:ViewContacts,campaigns:ViewCampaigns,
    integrations:ViewIntegrations,billing:()=>Stub('Billing','Manage invoices, GST details and payment methods.',I.bill),
    settings:ViewSettings,
    catalog:ViewCatalog};
  return (map[v]||ViewOrders)();
}

/* ---------- shell ---------- */
function Shell(inner){
  return `
  <div class="topbar">
    <div class="brandmark">${I.logo}<span style="font-family:var(--disp);font-weight:800;font-size:18px;letter-spacing:-.02em">Shelf Merch</span></div>
    <div class="acct" data-act="toast" data-arg="Switch workspace"><div><div class="k">Account</div><div class="v">${esc(S.account)}</div></div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#56655C" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></div>
    <div class="spacer"></div>
    <button class="btn btn-dark" data-act="sendGift">${I.send}<span>Send Gift</span></button>
    <button class="iconbtn" data-act="toast" data-arg="Help & support">${I.help}</button>
    <div class="avatar" data-act="userMenu">${S.user.initials}</div>
  </div>
  <div class="body">
    <aside class="sidebar scroll">
      <div class="nav-home">${I.home}<span>Home</span></div>
      ${NAV.map(([k,l,ic])=>`<div class="nav-item ${S.nav===k?'on':''}" data-act="nav" data-arg="${k}">${ic}<span>${l}</span></div>`).join('')}
    </aside>
    <main class="main scroll"><div class="wrap fade-in">${inner}</div></main>
  </div>`;
}
function ViewSettings(){
  const tab=S.setTab||'workspace';
  const rail=`<div class="subrail">
    ${[['workspace','Workspace settings'],['sso','SSO']].map(([k,t])=>`<div class="item ${tab===k?'on':''}" data-act="setTab" data-arg="${k}">${t}</div>`).join('')}</div>`;
  const content = tab==='sso' ? ViewSSO() : ViewWorkspaceSettings();
  return `<div class="page-h"><div><h1>Settings</h1><div class="sub">Manage your workspace, ownership, currency and single sign-on.</div></div></div>
    <div style="display:flex;gap:22px">${rail}<div style="flex:1;max-width:780px">${content}</div></div>`;
}
function ViewWorkspaceSettings(){
  const name=S.account;
  return `<div class="card" style="padding:30px">
    <h2 style="font-size:23px;font-family:var(--disp);margin-bottom:22px">Workspace Settings</h2>
    <div class="field" style="max-width:440px"><label class="lbl">Workspace name</label><input class="inp" id="ws-name" value="${esc(name)}"></div>
    <div class="divider"></div>
    <div class="lbl">Workspace icon</div>
    <p class="muted" style="font-size:13px;margin:4px 0 12px">This will be used as the company icon for the workspace on all members' profiles.</p>
    <div class="row" style="gap:14px;align-items:center"><div class="logo-chip" style="width:50px;height:50px">${LOGO_DECO}</div><button class="btn btn-ghost btn-sm" data-act="toast" data-arg="Icon uploaded">Upload</button></div>
    <div class="divider"></div>
    <div class="lbl">Owner</div>
    <div class="row" style="gap:18px;align-items:center;margin-top:8px;flex-wrap:wrap"><div style="font-size:14px"><b>Jonna Madhavi</b> &nbsp;<span class="muted">jonnaml2015@gmail.com</span></div><span class="lnk" data-act="toast" data-arg="Transfer ownership flow">Transfer ownership ↗</span></div>
    <div class="divider"></div>
    <div class="lbl">Workspace currency</div>
    <p class="muted" style="font-size:13px;margin:4px 0 10px">This will be used as the default currency for the main workspace wallet or any refunds.</p>
    <div class="row" style="gap:14px;align-items:center"><b style="font-size:15px">INR</b><span class="lnk" data-act="toast" data-arg="Change currency">Change ↗</span></div>
    <div class="divider"></div>
    <div class="lbl">Workspace URL</div>
    <div class="row" style="gap:8px;align-items:center;margin-top:8px"><span class="muted" style="font-size:14px">app.shelfmerch.io/</span><input class="inp" id="ws-slug" value="${esc(name.toLowerCase())}" style="max-width:320px"></div>
    <div style="margin-top:24px"><button class="btn btn-brand" data-act="saveWorkspace">Save changes</button></div>
  </div>`;
}
function ViewSSO(){
  return `<div class="card" style="padding:30px">
    <h2 style="font-size:23px;font-family:var(--disp);margin-bottom:14px">SSO</h2>
    <p class="muted" style="font-size:14px;line-height:1.6;margin-bottom:20px">Enable SSO on Shelf Merch for a faster, more secure login. Available for enterprise packages or as an add-on. <span class="lnk" data-act="toast" data-arg="SSO docs opened">Learn more</span></p>
    <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:var(--ink)">
      <li style="margin-bottom:12px">Find our metadata at <a class="lnk" href="https://account.shelfmerch.io/saml/metadata" data-act="toast" data-arg="Opening metadata URL">https://account.shelfmerch.io/saml/metadata</a></li>
      <li style="margin-bottom:12px">Create a custom SSO app on your IdP (Okta, Azure, etc.) using the ACS URL, Entity ID, Certificate and Attributes listed in the metadata above.</li>
      <li style="margin-bottom:12px">Once the app setup is done, email <b>sso@shelfmerch.io</b> with the following details:
        <ul style="margin:8px 0 0;padding-left:20px;color:var(--ink-2)">
          <li>Single Sign-On URL</li>
          <li>Single Logout URL (optional)</li>
          <li>Entity ID</li>
          <li>Certificate</li></ul></li>
      <li>Leave everything else to us. After we receive the above details, we'll create a corresponding configuration in our backend to enable SSO. This process typically takes <b>4–6 business days</b> to configure and test. Once SSO is enabled for your email domain, all users on the same email domain will be redirected to your IdP immediately.</li>
    </ol>
    <p class="muted" style="font-size:13.5px;margin-top:20px">For any further queries, please <span class="lnk" data-act="toast" data-arg="Support contacted">contact us</span>.</p>
  </div>`;
}
function setTab(a){ S.setTab=a; render(); }
function saveWorkspace(){ const n=document.getElementById('ws-name'); if(n)S.account=n.value||S.account; toast('Workspace settings saved'); render(); }

function Stub(title,sub,icon){
  return `<div class="page-h"><div><h1>${title}</h1><div class="sub">${sub}</div></div></div>
  <div class="card empty"><div class="ic">${icon.replace('width="24"','').replace('currentColor','#15784C')}</div>
  <h3>${title} is coming together</h3><p>This module is part of the Shelf Merch roadmap. Hook it up to your data to go live.</p>
  <button class="btn btn-soft" style="margin-top:16px" data-act="toast" data-arg="Request early access — noted!">Request early access</button></div>`;
}

/* ---------- layers: modal / drawer / toast ---------- */
function openModal(html){ document.getElementById('layer').innerHTML=`<div class="scrim" data-scrim><div class="modal scroll">${html}</div></div>`; }
function openDrawer(html){ document.getElementById('layer').innerHTML=`<div class="drawer-scrim" data-scrim></div><div class="drawer">${html}</div>`; }
function closeLayer(){ document.getElementById('layer').innerHTML=''; }
function toast(msg,ok=true){ const t=document.getElementById('toast'); const e=document.createElement('div'); e.className='toast '+(ok?'ok':''); e.innerHTML=(ok?I.check:'')+`<span>${esc(msg)}</span>`; t.appendChild(e); setTimeout(()=>e.remove(),2600); }

/* ---------- auth screens ---------- */
function AuthArt(){
  return `<div class="auth-art dotted">
    <div class="brandmark">${I.logo}<span style="font-family:var(--disp);font-weight:800;font-size:20px;color:#fff">Shelf Merch</span></div>
    <div>
      <div class="big">Corporate swag &amp; gifting, on autopilot.</div>
      <div class="sub">Build branded stores, load wallets, design swag and send points to your team — all in one workspace, billed in ₹ with GST &amp; Razorpay.</div>
      <div class="chiprow">
        <span class="chip">Branded shops</span><span class="chip">Points wallets</span>
        <span class="chip">Swag designer</span><span class="chip">Kits at scale</span><span class="chip">HRIS sync</span>
      </div>
    </div>
    <div style="opacity:.7;font-size:12.5px">Trusted by people teams · Made in India 🇮🇳</div>
  </div>`;
}
function ViewSignup(){
  return `<div class="auth">${AuthArt()}
  <div class="auth-form"><div class="inner stagger">
    <div class="eyebrow">Get started</div>
    <h1 style="font-size:30px;margin-bottom:6px">Create your account</h1>
    <p class="muted" style="margin-bottom:22px">Set up your Shelf Merch workspace in minutes.</p>
    <div class="field"><label class="lbl">Work email</label><input class="inp" autofocus placeholder="you@company.com" value="hr@rubix.net"></div>
    <div class="field"><label class="lbl">Password</label><input class="inp" type="password" placeholder="••••••••" value="demo1234"></div>
    <div class="row"><div class="field" style="flex:1"><label class="lbl">Name</label><input class="inp" value="Chandra Sekhar"></div>
    <div class="field" style="flex:1"><label class="lbl">Company</label><input class="inp" value="Rubix"></div></div>
    <p class="mut3" style="font-size:11.5px;line-height:1.5;margin:6px 0 16px">By creating an account, I agree to Shelf Merch’s <a>Terms of Use</a>, the use of my personal data per the <a>Privacy Notice</a>, and to receive product emails from Shelf Merch.</p>
    <button class="btn btn-brand btn-lg btn-block" data-act="auth">Create account</button>
    <p class="muted" style="text-align:center;margin-top:16px;font-size:13px">Already have an account? <span class="lnk" data-act="go" data-arg="login">Log in</span></p>
  </div></div></div>`;
}
function ViewLogin(){
  return `<div class="auth">${AuthArt()}
  <div class="auth-form"><div class="inner stagger">
    <div class="eyebrow">Welcome back</div>
    <h1 style="font-size:30px;margin-bottom:6px">Log in to Shelf Merch</h1>
    <p class="muted" style="margin-bottom:22px">Pick up where your people team left off.</p>
    <div class="field"><label class="lbl">Work email</label><input class="inp" autofocus value="hr@rubix.net"></div>
    <div class="field"><label class="lbl">Password</label><input class="inp" type="password" value="demo1234"></div>
    <div style="text-align:right;margin-bottom:18px"><span class="lnk-muted" data-act="toast" data-arg="Reset link sent">Forgot password?</span></div>
    <button class="btn btn-brand btn-lg btn-block" data-act="auth">Log in</button>
    <p class="muted" style="text-align:center;margin-top:16px;font-size:13px">New here? <span class="lnk" data-act="go" data-arg="signup">Create an account</span></p>
  </div></div></div>`;
}

/* ---------- WIZARD REGISTRY ---------- */
const Wizards={};

/* ---------- CREATE KIT ---------- */
const KIT_STEPS=['Name','Products','Branding','Packaging'];
function createKitStart(){ S.flow={exitTo:'kits',step:0,kitName:'Welcome Kit',picked:[0,2,3],logos:false,notes:'',pkg:'box'}; go('createKit'); }
Wizards.createKit=function(){
  const f=S.flow; const step=f.step;
  let body='';
  if(step===0){
    body=`<div style="max-width:620px;margin:0 auto"><h1 style="font-size:26px;margin-bottom:6px">Name your kit</h1><p class="muted" style="margin-bottom:20px">A kit is a reusable bundle of products you can send to recipients at any time.</p>
      <div class="field"><label class="lbl">Kit name</label><input class="inp" id="kt-name" value="${esc(f.kitName)}" autofocus></div>
      <div class="field"><label class="lbl">Internal description (optional)</label><textarea class="inp" rows="3" placeholder="e.g. Standard onboarding kit for new joiners">${''}</textarea></div></div>`;
  } else if(step===1){
    body=`<h1 style="font-size:24px;margin-bottom:4px">Choose products for "${esc(f.kitName)}"</h1><p class="muted" style="margin-bottom:18px">Select the items to include. You can brand them in the next step.</p>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">${getCatalogList().map((p,i)=>{const on=f.picked.includes(i);return `<div class="pcard" style="${on?'border-color:var(--brand);box-shadow:0 0 0 2px var(--brand-50)':''}" data-act="ktPick" data-arg="${i}"><div class="img">${PG[p.g]}<div style="position:absolute;right:10px;bottom:10px;width:30px;height:30px;border-radius:50%;background:${on?'var(--brand)':'#fff'};color:${on?'#fff':'var(--brand)'};border:1px solid var(--brand);display:grid;place-items:center;font-weight:700">${on?'✓':'+'}</div></div><div class="meta">${p.brand?`<div class="brand">${esc(p.brand)}</div>`:''}<div class="nm">${esc(p.nm)}</div><div class="pr">${p.price}</div></div></div>`;}).join('')}</div>`;
  } else if(step===2){
    const prods=f.picked.map(i=>getCatalogList()[i]);
    body=`<div style="display:grid;grid-template-columns:380px 1fr;gap:26px">
      <div><h1 style="font-size:22px;margin-bottom:6px">Brand your kit</h1><p class="muted" style="font-size:13px;margin-bottom:16px">Upload logos and leave notes for our design team. We'll mock up each item for approval.</p>
        ${f.logos?`<div class="row" style="gap:10px;align-items:center;border:1px solid var(--brand);border-radius:var(--r-sm);padding:10px;background:var(--brand-50);margin-bottom:12px"><div class="logo-chip" style="width:36px;height:36px">${LOGO_DECO}</div><div><div style="font-weight:600">rubix-mark.svg</div><div class="mut3" style="font-size:11px">SVG · 660 KB</div></div></div>`
          :`<div style="border:1.5px dashed var(--line);border-radius:var(--r);padding:24px;text-align:center;color:var(--ink-2);background:#fff;margin-bottom:12px" data-act="ktLogo">${I.upload.replace('currentColor','#15784C')}<div style="margin-top:8px;font-weight:600">Upload logos</div><div class="mut3" style="font-size:11px;margin-top:6px">SVG, PNG · 300 DPI+</div></div>`}
        <button class="btn ${f.logos?'btn-ghost':'btn-dark'} btn-block" data-act="ktLogo">${f.logos?'Add another logo':'Add logo'}</button>
        <div class="field" style="margin-top:16px"><label class="lbl">Notes to design team</label><textarea class="inp" id="kt-notes" rows="4" placeholder="e.g. White logo on the chest, full-colour on mugs">${esc(f.notes)}</textarea></div></div>
      <div><div class="${f.logos?'banner info':'banner'}" style="margin-bottom:16px">${f.logos?I.spark.replace('width="24" height="24"','width="16" height="16"')+'<div>Branding applied. Our team will share proofs within 2 business days.</div>':'<div>Add a logo to preview branded mockups for each item.</div>'}</div>
        <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">${prods.map(p=>pcard(p,{branded:f.logos,act:'noop'})).join('')}</div></div></div>`;
  } else {
    const pk=f.pkg;
    body=`<div style="max-width:680px;margin:0 auto"><h1 style="font-size:24px;margin-bottom:6px">Choose packaging</h1><p class="muted" style="margin-bottom:18px">How should "${esc(f.kitName)}" arrive? Premium packaging is charged per kit.</p>
      <div class="grid">
        <div class="optcard ${pk==='none'?'on':''}" data-act="ktPkg" data-arg="none"><div class="rd"></div><div style="flex:1"><h4>No packaging</h4><p>Items ship in standard protective mailers.</p></div><b>Free</b></div>
        <div class="optcard ${pk==='box'?'on':''}" data-act="ktPkg" data-arg="box"><div class="rd"></div><div style="flex:1"><h4>Premium shipping box</h4><p>Branded rigid box with crinkle-paper fill.</p></div><b>₹49 / kit</b></div></div>
      <div class="note" style="margin-top:18px">Once published, this kit is reusable — send it to new recipients any time without rebuilding.</div></div>`;
  }
  const back=step>0?`<span class="lnk-muted" data-act="ktBack">${I.back} Back</span>`:`<span class="lnk-muted" data-act="wzExit">Cancel</span>`;
  const next=step<3?`<button class="btn btn-dark" ${step===1&&!f.picked.length?'disabled':''} data-act="ktNext">Next</button>`:`<button class="btn btn-brand" data-act="kitPublish">Publish kit &amp; send</button>`;
  return wzChrome('Create a kit',KIT_STEPS,step,body,back+next);
};
function ktPick(el){ const i=+el.dataset.arg; const a=S.flow.picked; const k=a.indexOf(i); if(k<0)a.push(i); else a.splice(k,1); render(); }
function ktLogo(){ S.flow.logos=true; render(); }
function ktPkg(el){ S.flow.pkg=el.dataset.arg; render(); }
function ktBack(){ S.flow.step--; render(); }
function ktNext(){ const f=S.flow; if(f.step===0)f.kitName=document.getElementById('kt-name').value||'New Kit'; if(f.step===2)f.notes=(document.getElementById('kt-notes')||{}).value||''; f.step++; render(); }
async function kitPublish(){
  const f=S.flow;
  if(api.useMocks()){
    const k={id:nid('k'),name:f.kitName,items:f.picked.length,status:'live',sent:false};
    S.kits.push(k);
    toast('Kit "'+k.name+'" published');
    sendItemsStartFor(k.id, f.picked.slice());
    return;
  }
  try{
    S.loading=true; render();
    const k=await api.createKitFlow({
      name:f.kitName||'New Kit',
      pickedIndices:f.picked,
      catalog:getCatalogList(),
      packaging:f.pkg||'box',
      designNotes:f.notes||'',
    });
    S.kits.push(k);
    S.loading=false;
    toast('Kit "'+k.name+'" saved to your workspace');
    sendItemsStartFor(k.id, f.picked.slice());
  }catch(err){
    S.loading=false; render();
    toast(err.message||'Failed to save kit');
  }
}

/* ---------- SEND ITEMS ---------- */
const SI_STEPS=['Items','Recipients','Experience','Checkout'];
function sendItemsStart(el){ const id=el&&el.dataset?el.dataset.arg:null; closeLayer();
  const k=S.kits.find(x=>x.id===id);
  const picked = k? [0,2,3].slice(0,k.items) : [0,2,3];
  sendItemsStartFor(id, picked);
}
function sendItemsStartFor(kitId, picked){
  S.flow={exitTo:'kits',step:0,kitId,picked,selRecips:S.contacts.slice(0,2).map(c=>c.id),mode:'redeem',
    note:'Welcome to the team — we are thrilled to have you!',pkg:'box',
    from:'People Team, '+S.account, when:'now',
    msg:"Your welcome kit is on its way! A little something from all of us — we're so glad you're here.",
    prevView:'landing'};
  go('sendItems');
}
Wizards.sendItems=function(){
  const f=S.flow; const step=f.step; const k=S.kits.find(x=>x.id===f.kitId);
  let body='';
  if(step===0){
    const prods=f.picked.map(i=>getCatalogList()[i]);
    body=`<h1 style="font-size:24px;margin-bottom:4px">Items in this send</h1><p class="muted" style="margin-bottom:18px">${k?'From kit "'+esc(k.name)+'". ':''}Confirm what goes out. Quantities scale to your recipient list.</p>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">${prods.map(p=>pcard(p,{branded:true,act:'noop'})).join('')}
        <div class="pcard" style="display:grid;place-items:center;border-style:dashed;cursor:pointer" data-act="toast" data-arg="Add more from catalog"><div style="text-align:center;color:var(--brand)">${I.plus}<div style="font-weight:700;margin-top:6px">Add item</div></div></div></div>`;
  } else if(step===1){
    body=recipientPicker(f,"Who's receiving this?","Choose how recipients get their items, then pick people.",{modes:true});
    if(f.mode==='surprise'){ const missing=S.contacts.filter(c=>f.selRecips.includes(c.id)&&!c.address);
      if(missing.length) body+=`<div class="banner" style="margin-top:14px">${I.truck.replace('width="24" height="24"','width="16" height="16"')}<div><b>${missing.length} recipient(s) missing a shipping address.</b> Surprise sends need addresses up front. <span class="lnk" data-act="contactEdit" data-arg="${missing[0].id}">Fix recipient information</span></div></div>`; }
  } else if(step===2){
    body=recipientExperience(f,{kind:'items'})+`
      <div class="card" style="padding:20px;margin-top:18px;max-width:620px">
        <h3 style="font-size:15px;margin-bottom:6px">Printed card note</h3>
        <p class="muted" style="font-size:12.5px;margin-bottom:10px">Printed on a card tucked inside every kit.</p>
        <textarea class="inp" id="si-note" rows="3" data-act="reNote">${esc(f.note)}</textarea>
        <div class="card" style="padding:14px;background:var(--surface-2);margin-top:12px"><div class="mut3" style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;margin-bottom:6px">Card preview</div>
          <div style="font-family:var(--disp);font-style:italic;font-size:14px" id="si-prev">${esc(f.note)}</div><div class="muted" style="margin-top:8px;font-size:12px">— The ${esc(S.account)} team</div></div>
      </div>`;
  } else {
    const unit=4200, qty=f.selRecips.length, sub=unit*qty;
    const pkgCost=(f.pkg==='box'?49:0)*qty;
    const fee=sub*0.12; const ship=120*qty; const tax=(sub+fee+pkgCost+ship)*0.18; const total=sub+fee+pkgCost+ship+tax;
    body=`<h1 style="font-size:24px;margin-bottom:16px">Checkout</h1>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">${paymentPanel()}
        <div class="card" style="padding:22px;height:fit-content"><h3 style="font-size:18px;margin-bottom:12px">Order summary</h3>
          ${sumRow('Kit',esc(k?k.name:'Custom kit'))}
          ${sumRow('Items per recipient',f.picked.length)}
          ${sumRow('Recipients',qty)}
          ${sumRow('Items subtotal',inr(sub))}
          ${sumRow('Packaging',pkgCost?inr(pkgCost):'Free')}
          ${sumRow('Service fee (12%)',inr(fee))}
          ${sumRow('Shipping',inr(ship))}
          ${sumRow('Estimated GST (18%)',inr(tax))}
          <div class="divider"></div>
          <div class="row" style="justify-content:space-between;align-items:center"><b style="font-size:18px">You pay</b><b class="num" style="font-size:22px;font-family:var(--disp)">${inr(total)}</b></div>
          <button class="btn btn-brand btn-block btn-lg" style="margin-top:14px" data-act="sendItemsDo">Pay &amp; send</button></div></div>`;
  }
  const back=step>0?`<span class="lnk-muted" data-act="siBack">${I.back} Back</span>`:`<span class="lnk-muted" data-act="wzExit">Save draft</span>`;
  const next=step<3?`<button class="btn btn-dark" data-act="siNext">Next</button>`:'<span></span>';
  return wzChrome('Send Items',SI_STEPS,step,body,back+next);
};
function siBack(){ S.flow.step--; render(); }
function siNext(){ const f=S.flow; if(f.step===2){ const n=document.getElementById('si-note'); if(n)f.note=n.value; const fr=document.getElementById('re-from'); if(fr)f.from=fr.value; const m=document.getElementById('re-msg'); if(m)f.msg=m.value; } f.step++; render(); }
function sendItemsDo(){ const f=S.flow; const k=S.kits.find(x=>x.id===f.kitId); if(k)k.sent=true;
  go('orders',{nav:'orders'});
  S.orders.unshift({id:nid('o'),date:new Date().toLocaleDateString('en-GB'),name:(k?k.name:'Custom kit'),status:'Processing',amount:4200*f.selRecips.length,track:'',items:f.picked.map(i=>[DEMO_PRODUCTS[i].nm,String(f.selRecips.length)])});
  render(); toast('Order placed for '+f.selRecips.length+' recipients! 📦');
}


/* ---------- SWAG DESIGNER ---------- */
function swagDesignerStart(el){
  closeLayer();
  const shopId=(el&&el.dataset&&el.dataset.arg)||S.flow.shopId||(S.shops[0]&&S.shops[0].id);
  S.flow={exitTo:shopId?'shopDetail':'swag', shopId, colName:'New employee Swag', colColors:['Black','White'], picked:[], artwork:false, exitToNav:shopId?'shops':'swag'};
  go('swagName');
}
const SWAG_COLORS=[['Black','#1c1c1c'],['Blue','#2b54d6'],['Brown','#7a4a25'],['Green','#15784c'],['Gray','#9a9a9a'],['Navy','#1c2a52'],['Orange','#f59e0b'],['Pink','#f4aacb'],['Purple','#7a3fb0'],['Red','#d33b30'],['White','#ffffff'],['Yellow','#f5d000']];
Wizards.swagName=function(){
  const f=S.flow;
  const body=`<div style="max-width:640px;margin:0 auto"><h1 style="font-size:26px;margin-bottom:6px">Name your collection</h1><p class="muted" style="margin-bottom:20px">Choose a name and your preferred colours to filter the catalog and set defaults.</p>
    <div class="field"><label class="lbl">Collection name</label><input class="inp" id="sw-name" value="${esc(f.colName)}" autofocus></div>
    <div class="lbl">Preferred swag colours</div>
    <div class="grid" style="grid-template-columns:repeat(4,1fr)">${SWAG_COLORS.map(([n,c])=>`<label class="optcard ${f.colColors.includes(n)?'on':''}" style="padding:10px 12px;align-items:center" data-act="swColor" data-arg="${n}"><span class="sw" style="width:18px;height:18px;background:${c}"></span><span style="font-weight:600;font-size:13px">${n}</span></label>`).join('')}</div></div>`;
  const foot=`<span class="lnk-muted" data-act="wzExit">Back to my swag</span><button class="btn btn-dark" data-act="swNameNext">Next</button>`;
  return wzChrome('Design swag',['Collection','Products','Artwork'],0,body,foot);
};
function swColor(el){ const n=el.dataset.arg; const a=S.flow.colColors; const i=a.indexOf(n); if(i<0)a.push(n); else a.splice(i,1); render(); }
function swNameNext(){ S.flow.colName=document.getElementById('sw-name').value||'New Collection'; go('swagCatalog'); }

Wizards.swagCatalog=function(){
  const f=S.flow; const cats=['All Products','Apparel','Bags','Drinkware','Technology','Office'];
  const body=`<h1 style="font-size:24px;margin-bottom:4px">Add products to your collection</h1><p class="muted" style="margin-bottom:16px">${DEMO_PRODUCTS.length} products · pick the items you want to brand.</p>
    <div class="tabs" style="margin-bottom:18px">${cats.map((c,i)=>`<button class="${i===0?'on':''}" data-act="noop">${c}</button>`).join('')}</div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));padding-bottom:90px">${getCatalogList().map((p,i)=>{const on=f.picked.includes(i);return `<div class="pcard" style="${on?'border-color:var(--brand);box-shadow:0 0 0 2px var(--brand-50)':''}" data-act="swPick" data-arg="${i}"><div class="img">${PG[p.g]}<div style="position:absolute;right:10px;bottom:10px;width:30px;height:30px;border-radius:50%;background:${on?'var(--brand)':'#fff'};color:${on?'#fff':'var(--brand)'};border:1px solid var(--brand);display:grid;place-items:center;font-weight:700">${on?'✓':'+'}</div></div><div class="meta">${p.brand?`<div class="brand">${esc(p.brand)}</div>`:''}<div class="nm">${esc(p.nm)}</div><div class="pr">${p.price}</div></div></div>`;}).join('')}</div>`;
  const foot='';
  const bar=`<div style="position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--line);padding:14px 34px;display:flex;align-items:center;justify-content:space-between;z-index:30">
    <div class="row" style="gap:10px;align-items:center"><b>${esc(f.colName)}</b><span class="tag tag-soft" style="background:var(--brand-50);color:var(--brand-d)">${f.picked.length} item${f.picked.length===1?'':'s'}</span></div>
    <div class="row" style="gap:10px"><button class="btn btn-ghost" data-act="go" data-arg="swagName">Back</button><button class="btn btn-dark" ${f.picked.length?'':'disabled'} data-act="go" data-arg="swagArtwork">Add artwork ${I.send.replace('width="24" height="24"','width="14" height="14"')}</button></div></div>`;
  return wzChrome('Design swag',['Collection','Products','Artwork'],1,body+bar,foot);
};
function swPick(el){ const i=+el.dataset.arg; const a=S.flow.picked; const k=a.indexOf(i); if(k<0)a.push(i); else a.splice(k,1); render(); }

Wizards.swagArtwork=function(){
  const f=S.flow; const prods=f.picked.map(i=>DEMO_PRODUCTS[i]);
  const atab=f.artTab||'prev';
  let pickerBody;
  if(atab==='device'){
    pickerBody=`<div style="border:1.5px dashed var(--line);border-radius:var(--r-sm);padding:22px;text-align:center;color:var(--ink-2);background:#fff" data-act="swArtUpload">
      <div style="font-weight:600;font-size:13px">Drag and drop file</div>
      <div class="mut3" style="font-size:11px;margin:6px 0">SVG, PNG, JPG, AI · 300 DPI+</div>
      <button class="btn btn-soft btn-sm" data-act="swArtUpload">Search local device</button></div>`;
  } else {
    pickerBody=`<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:8px">${PREV_UPLOADS.map((u,i)=>prevThumb(i,u,f.artwork&&f.artSel===i,'artPick')).join('')}</div>`;
  }
  const left=`<div><h1 style="font-size:22px;margin-bottom:6px">Add artwork to your products</h1>
    <p class="muted" style="font-size:13px;margin-bottom:16px">Upload your artwork and choose the products to apply it to. Edit your design any time. Items are created using DTF decoration.</p>
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:13.5px;margin-bottom:10px">Add new artwork</div>
      <div class="tabs" style="max-width:300px;margin-bottom:14px">
        <button class="${atab==='device'?'on':''}" data-act="artTab" data-arg="device">Upload from device</button>
        <button class="${atab==='prev'?'on':''}" data-act="artTab" data-arg="prev">Previous uploads</button></div>
      ${pickerBody}
      <div class="note" style="margin-top:12px">Use a high-quality file with a transparent background (300 DPI+) to prevent production delays. <span class="lnk" data-act="toast" data-arg="Guidelines opened">Learn more</span></div>
      <button class="btn btn-dark btn-block" style="margin-top:14px" data-act="${atab==='device'?'swArtUpload':'artPick'}" data-arg="0">Add artwork</button>
    </div>
    <button class="btn btn-dark btn-block btn-lg" style="margin-top:14px" ${f.artwork?'':'disabled'} data-act="swGenerate">Generate designs</button></div>`;
  const banner=f.artwork
    ? `<div class="banner info" style="margin-bottom:16px">${I.spark.replace('width="24" height="24"','width="16" height="16"')}<div>Artwork applied to all ${prods.length} products — all colour variants included.</div></div>`
    : `<div class="banner" style="margin-bottom:16px;background:#eaf1fb;color:#1c2a52;border:none">Please add artwork before selecting your products. We've included all colour variants.</div>`;
  const right=`<div>${banner}
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">${prods.map(p=>`<div class="pcard" style="position:relative">${f.artwork?'':'<div class="dots-btn">'+I.dots+'</div>'}<div class="img">${PG[p.g]}${f.artwork?`<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:26px;height:26px">${LOGO_DECO}</div>`:''}</div><div class="meta">${p.brand?`<div class="brand">${esc(p.brand)}</div>`:''}<div class="nm">${esc(p.nm)}</div></div></div>`).join('')}</div></div>`;
  const body=`<div style="display:grid;grid-template-columns:400px 1fr;gap:26px">${left}${right}</div>`;
  return wzChrome('Design swag',['Collection','Products','Artwork'],2,body,'');
};
function swArtUpload(){ S.flow.artwork=true; render(); }
async function swGenerate(){
  const f=S.flow; const s=S.shops.find(x=>x.id===f.shopId)||S.shops[0];
  const catalog=getCatalogList();
  if(api.useMocks()){
    const col={id:nid('c'),code:'C'+(100000000+Math.floor(Math.random()*899999999)),name:f.colName,created:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),by:S.user.name,status:'ready',shopId:s?s.id:'s1',products:f.picked.map(i=>({g:catalog[i]?.g||'tee',brand:catalog[i]?.brand||'',nm:catalog[i]?.nm||'Product'}))};
    S.collections.push(col); if(s)s.collections.push(col.id);
    if(f.shopId&&S.shops.find(x=>x.id===f.shopId)){ go('shopDetail',{flow:{shopId:f.shopId,shopTab:'Branded Swag'},nav:'shops'}); }
    else go('swag');
    toast('Collection "'+col.name+'" is design-ready!');
    return;
  }
  if(!s?.id) { toast('Create a shop first'); return; }
  try{
    S.loading=true; render();
    const col=await api.createCollectionFlow({
      shopId:s.id,
      name:f.colName||'New collection',
      pickedIndices:f.picked,
      catalog,
    });
    col.by=S.user.name;
    S.collections.push(col);
    if(s) s.collections.push(col.id);
    S.loading=false;
    if(f.shopId&&S.shops.find(x=>x.id===f.shopId)){ go('shopDetail',{flow:{shopId:f.shopId,shopTab:'Branded Swag'},nav:'shops'}); }
    else go('swag');
    toast('Collection "'+col.name+'" saved');
  }catch(err){
    S.loading=false; render();
    toast(err.message||'Failed to save collection');
  }
}

/* ---------- SEND POINTS ---------- */
function sendPointsStart(el){
  closeLayer();
  const shopId=(el&&el.dataset&&el.dataset.arg)||S.flow.shopId||(S.shops[0]&&S.shops[0].id);
  const defaultRecips=S.contacts.slice(0,2).map(c=>c.id);
  S.flow={exitTo:shopId?'shopDetail':'shops', exitToNav:'shops', shopId, step:0, ppr:1500, recips:100, orderName:'Order R'+(200000000+Math.floor(Math.random()*99999999)), selRecips:defaultRecips, from:'People Team, '+S.account, msg:'Appreciate your turnaround completing the key project, which is critical to company revenue.', when:'now', prevView:'landing'};
  go('sendPoints');
}
const SP_STEPS=['Budget','Recipients','Message','Checkout'];
Wizards.sendPoints=function(){
  const f=S.flow; const step=f.step;
  let body='';
  if(step===0){
    const points=(f.ppr/PT);
    body=`<div class="card" style="padding:24px;max-width:880px">
      <div class="row" style="justify-content:space-between;align-items:flex-start"><div><h1 style="font-size:24px">Send Points</h1><p class="muted">Points let recipients redeem items from your shop.</p></div><span class="tag tag-ready">₹2 = 1 Pt</span></div>
      <div class="divider"></div>
      <div class="row" style="gap:20px"><div class="field" style="flex:1"><label class="lbl">Name your order (internal)</label><input class="inp" id="sp-name" value="${esc(f.orderName)}"></div>
      <div class="field" style="flex:1"><label class="lbl">Number of recipients</label><input class="inp num" id="sp-recips" value="${f.recips}" data-act="spRecalc"></div></div>
      <label class="lbl">Budget per recipient (₹2 = 1 Pt)</label>
      <div class="row" style="align-items:center;gap:14px"><div class="inp-wrap" style="flex:1"><input class="inp num" id="sp-ppr" value="${f.ppr}" data-act="spRecalc"><span class="inp-suffix">INR</span></div>
        <div style="color:var(--ink-3)">${I.swap}</div>
        <div class="inp-wrap" style="flex:1"><input class="inp num" id="sp-pts" value="${(points).toFixed(2)}" readonly style="background:var(--surface-2)"><span class="inp-suffix">POINTS</span></div></div>
      <p class="mut3" style="font-size:12px;margin-top:8px">No minimum budget. Shipping included.</p></div>`;
  } else if(step===1){
    body=recipientPicker(f,'Add recipients',"Don't have all emails? You can add recipients later from the shop dashboard.");
  } else if(step===2){
    body=recipientExperience(f,{kind:'points'});
  } else {
    const sub=(f.ppr/PT)*f.recips*PT; const fee=sub*0.15; const tax=(sub+fee)*0.18; const total=sub+fee+tax;
    body=`<h1 style="font-size:24px;margin-bottom:16px">Checkout</h1>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        ${paymentPanel()}
        <div class="card" style="padding:22px;height:fit-content"><div class="row" style="justify-content:space-between;align-items:center;margin-bottom:14px"><h3 style="font-size:18px">Order summary</h3><span class="tag tag-ready">₹2 = 1 Pt</span></div>
          ${sumRow('No. of recipients',f.recips)}
          ${sumRow('Points per recipient',(f.ppr/PT).toFixed(2)+' Pts')}
          ${sumRow('Total points purchased',((f.ppr/PT)*f.recips).toLocaleString('en-IN')+' Pts ('+inr(sub)+')')}
          ${sumRow('Service fee (15%)',inr(fee))}
          ${sumRow('Estimated GST (18%)',inr(tax))}
          <div class="lnk" style="font-size:12.5px;margin:8px 0" data-act="toast" data-arg="Promo applied">Apply promo code</div>
          <div class="divider"></div>
          <div class="row" style="justify-content:space-between;align-items:center"><b style="font-size:18px">You pay</b><b class="num" style="font-size:22px;font-family:var(--disp)">${inr(total)}</b></div>
          <button class="btn btn-brand btn-block btn-lg" style="margin-top:14px" data-act="sendPointsDo">Pay now</button></div></div>`;
  }
  const back = step>0?`<span class="lnk-muted" data-act="spBack">${I.back} Back</span>`:'<span></span>';
  const next = step<3?`<button class="btn btn-dark" data-act="spNext">Next</button>`:'<span></span>';
  return wzChrome('Send Points',SP_STEPS,step,body,back+next);
};
function spRecalc(){ const ppr=+document.getElementById('sp-ppr').value||0; document.getElementById('sp-pts').value=(ppr/PT).toFixed(2);
  S.flow.ppr=ppr; S.flow.recips=+document.getElementById('sp-recips').value||0; }
function spMsg(e){ S.flow.msg=e.target?e.target.value:''; const p=document.getElementById('sp-prev'); if(p)p.textContent=S.flow.msg; }
function spWhen(el){ S.flow.when=el.dataset.arg; render(); }
function spBack(){ if(S.flow.step===0){wzExit();return;} S.flow.step--; render(); }
function spNext(){ const f=S.flow;
  if(f.step===0){ f.ppr=+document.getElementById('sp-ppr').value||0; f.recips=+document.getElementById('sp-recips').value||0; f.orderName=document.getElementById('sp-name').value; }
  if(f.step===2){ const fr=document.getElementById('re-from'); if(fr)f.from=fr.value; const m=document.getElementById('re-msg'); if(m)f.msg=m.value; }
  f.step++; render();
}
async function sendPointsDo(){
  const f=S.flow;
  const finishUi=(g)=>{
    S.flow.sentGifts=(S.flow.sentGifts||[]);
    go('shopDetail',{flow:{shopId:f.shopId,shopTab:'Sent Gifts',sentGifts:[g]},nav:'shops'});
    toast('Points sent to '+f.selRecips.length+' recipients! 🎉');
  };
  if(api.useMocks()){
    finishUi({name:f.orderName,by:S.user.name,ppr:(f.ppr/PT),recips:f.selRecips.length});
    return;
  }
  const entityId=S.primaryEntityId||(S.org.departments[0]&&S.org.departments[0].id);
  if(!entityId){ toast('No department budget found — complete wallet setup first'); return; }
  if(!f.shopId){ toast('Select a shop for this campaign'); return; }
  try{
    S.loading=true; render();
    const campaign=await api.launchPointsCampaignFlow({
      entityId:String(entityId),
      shopId:String(f.shopId),
      name:f.orderName||'Points campaign',
      creditsPerRecipient:f.ppr,
      message:{from:f.from||'',body:f.msg||''},
      contactIds:f.selRecips,
      contacts:S.contacts,
    });
    S.campaigns=(S.campaigns||[]);
    S.campaigns.unshift(campaign);
    await hydrateFromApi();
    S.loading=false;
    finishUi({name:f.orderName,by:S.user.name,ppr:(f.ppr/PT),recips:f.selRecips.length});
  }catch(err){
    S.loading=false; render();
    toast(err.message||'Failed to launch campaign');
  }
}

/* shared checkout bits */
function sumRow(k,v){ return `<div class="row" style="justify-content:space-between;padding:7px 0"><span class="muted" style="font-size:13px">${k}</span><span class="num" style="font-weight:600;font-size:13px">${v}</span></div>`; }
function paymentPanel(){
  const w=S.wallets[0]; const bal=w?w.balance:0; const sel=S.flow.pay||'wallet';
  const opt=(k,title,sub,extra)=>`<div class="pay-opt ${sel===k?'on':''}" data-act="payPick" data-arg="${k}"><div class="rd"></div><div style="flex:1"><div style="font-weight:600;font-size:13.5px">${title}</div><div class="mut3" style="font-size:11.5px">${sub}</div></div>${extra||''}</div>`;
  return `<div class="card" style="padding:22px">
    <h3 style="font-size:16px;margin-bottom:4px">Payment method</h3>
    <p class="muted" style="font-size:12.5px;margin-bottom:16px">Pay from your wallet balance, or add a new payment method.</p>
    ${opt('wallet',esc(w?w.name:'Wallet')+' balance',inr(bal)+' available',`<span class="tag tag-live"><span class="dot"></span>Ready</span>`)}
    ${opt('upi','UPI / Netbanking','Pay instantly via any UPI app or bank')}
    ${opt('card','Debit / credit card','Visa, Mastercard, RuPay, Amex')}
    ${sel==='card'?`<div class="field" style="margin-top:6px"><input class="inp" placeholder="Name on card"></div><div class="field"><input class="inp" placeholder="Card number"></div>`:''}
    <div class="field" style="margin-top:14px"><label class="lbl">Billing</label><div class="card" style="padding:11px 13px;font-size:12.5px;color:var(--ink-2)">Hyderabad, Telangana, IN · GSTIN 36AAAAA0000A1Z5 <span class="lnk" data-act="toast" data-arg="Edit billing in Settings">Edit</span></div></div>
  </div>`;
}
function payPick(el){ S.flow.pay=el.dataset.arg; render(); }

/* shared recipient picker (used by Send Points + Send Items) */
function recipientPicker(f,title,sub,opts={}){
  const rows=S.contacts.map(c=>{const on=f.selRecips.includes(c.id);return `<tr><td><div data-act="recToggle" data-arg="${c.id}" style="width:18px;height:18px;border:2px solid ${on?'var(--brand)':'#c4ccc6'};border-radius:4px;display:grid;place-items:center;background:${on?'var(--brand)':'#fff'};cursor:pointer">${on?'<span style="color:#fff;font-size:11px">✓</span>':''}</div></td>
    <td class="muted">${esc(c.email)}</td><td style="font-weight:600">${esc(c.name)}</td><td class="muted">${c.loc?esc(c.loc):'—'}</td></tr>`;}).join('');
  const modes = opts.modes? `<div class="grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:18px">
      ${[['redeem','Recipients redeem','Recipients choose size, colour & shipping address from a private link.'],['surprise','Surprise recipients','Enter recipient details up front so gifts ship without input.'],['single','Single location','Ship all units to one office, event venue or address.']].map(([k,t,d])=>`<div class="optcard ${(f.mode||'redeem')===k?'on':''}" data-act="recMode" data-arg="${k}"><div class="rd"></div><div><h4>${t}</h4><p>${d}</p></div></div>`).join('')}</div>`:'';
  return `<h1 style="font-size:24px;margin-bottom:4px">${title}</h1><p class="muted" style="margin-bottom:18px">${sub}</p>
    ${modes}
    <div class="card" style="padding:16px">
      <div class="row" style="gap:8px;margin-bottom:12px;align-items:center"><span class="tag tag-soft" style="background:var(--brand-50);color:var(--brand-d)">${f.selRecips.length} selected</span>
        <button class="btn btn-ghost btn-sm" data-act="recDeselect">Deselect all</button>
        <button class="btn btn-ghost btn-sm" data-act="toast" data-arg="Paste emails">Input emails</button><button class="btn btn-ghost btn-sm" data-act="toast" data-arg="Upload CSV">Add by CSV</button>
        <div class="search" style="flex:1">${I.search}<input style="height:36px" placeholder="Search by name or email" data-act="noop"></div></div>
      <table class="tbl"><thead><tr><th></th><th>Email</th><th>Name</th><th>Home address</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function recToggle(el){ const id=el.dataset.arg; const a=S.flow.selRecips; const i=a.indexOf(id); if(i<0)a.push(id); else a.splice(i,1); render(); }
function recDeselect(){ S.flow.selRecips=[]; render(); }
function recMode(el){ S.flow.mode=el.dataset.arg; render(); }

/* shared recipient-experience step: message editor + landing/email previews + scheduler */
function recipientExperience(f,opts={}){
  const shop=(S.shops.find(s=>s.id===f.shopId)||{}).name||'Rubix';
  const pv=f.prevView||'landing';
  const isPoints=opts.kind==='points';
  const mode=f.mode||'redeem';
  const shipMode = !isPoints && mode!=='redeem';   // surprise / single-location item sends ship directly
  const from=esc(f.from||'Your team');
  const msg=esc(f.msg||'');
  // ship-mode helpers
  const track='SM'+(740000000+Math.floor(Math.random()*9999999));
  const eta=new Date(Date.now()+5*86400000).toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
  const items=(f.picked?f.picked.length:3);
  const headline=isPoints?`You've been gifted ${(f.ppr/PT).toFixed(0)} Pts to ${esc(shop)}!`
    : shipMode?`Your gift from ${from} is on its way!`
    : `${from} sent you a gift!`;
  const cta=isPoints?'Redeem your points':shipMode?'Track your shipment':'Choose your gift';
  // tab labels + captions adapt to mode
  const tab1 = shipMode?'Tracking page':'Landing page';
  const tab2 = shipMode?'Shipping email':'Invitation email';
  const cap1 = shipMode?'Mobile tracking page recipients open to follow their parcel.':'Mobile-first redeem page recipients open from any device.';
  const cap2 = shipMode?'The shipping confirmation that lands in their inbox.':'The branded email that lands in their inbox.';
  const msgCaption = shipMode?'included in the shipping email & on the printed card':'shown on landing page & email';
  // tomorrow @ 10:00 default
  const tmrw=new Date(Date.now()+86400000).toISOString().slice(0,10);
  const sched=f.sched||{date:tmrw,time:'10:00',tz:'Asia/Kolkata (IST)'};
  const shipBlock=`<div style="display:flex;justify-content:center;gap:8px;margin:10px 0"><span class="tag tag-live"><span class="dot"></span>Shipped</span><span class="tag tag-draft">ETA ${eta}</span></div>
      <div class="mut3" style="font-size:10px;font-weight:700">TRACKING ${track} · ${items} item${items>1?'s':''}</div>`;
  const landing = shipMode
    ? `<div class="phone"><div class="bar"><i></i></div>
        <div class="shopbanner dotted" style="height:96px;border-radius:0;display:grid;place-items:center"><div style="width:46px;height:46px;background:#fff;border-radius:10px;display:grid;place-items:center">${LOGO_DECO}</div></div>
        <div style="padding:18px;text-align:center">
          <div class="mut3" style="font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-weight:700">A gift from ${from}</div>
          <h3 style="font-size:16px;margin:8px 0;line-height:1.25">${headline}</h3>
          ${shipBlock}
          <p class="muted" style="font-size:11.5px;margin-top:8px" id="re-prev-l">${msg}</p>
          <div class="btn btn-brand btn-block btn-sm" style="margin-top:12px;pointer-events:none">${cta}</div>
          <div class="mut3" style="font-size:9px;margin-top:8px">Powered by Shelf Merch</div></div></div>`
    : `<div class="phone"><div class="bar"><i></i></div>
        <div class="shopbanner dotted" style="height:96px;border-radius:0;display:grid;place-items:center"><div style="width:46px;height:46px;background:#fff;border-radius:10px;display:grid;place-items:center">${LOGO_DECO}</div></div>
        <div style="padding:18px;text-align:center">
          <div class="mut3" style="font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-weight:700">${from} created a gift for you</div>
          <h3 style="font-size:16px;margin:8px 0;line-height:1.25">${headline}</h3>
          <p class="muted" style="font-size:11.5px" id="re-prev-l">${msg}</p>
          <div style="height:3px;border-radius:3px;margin:12px 0;background:linear-gradient(90deg,#7a3fb0,#2b54d6,#f5d000,#d33b30,#15784c)"></div>
          <div class="btn btn-brand btn-block btn-sm" style="pointer-events:none">${cta}</div>
          <div class="mut3" style="font-size:9px;margin-top:8px">Powered by Shelf Merch</div></div></div>`;
  const email=`<div class="email-frame"><div class="topline"><i></i><i></i><i></i><span class="mut3" style="font-size:10px;margin-left:6px">inbox · ${esc(shop)} ${shipMode?'shipping':'gift'}</span></div>
    <div class="shopbanner dotted" style="height:96px;border-radius:0;display:grid;place-items:center"><div style="width:46px;height:46px;background:#fff;border-radius:10px;display:grid;place-items:center">${LOGO_DECO}</div></div>
    <div style="padding:20px;text-align:center">
      <div class="mut3" style="font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-weight:700">${shipMode?`${from} · shipping update`:`${from} sent you something`}</div>
      <h3 style="font-size:17px;margin:8px 0">${headline}</h3>
      ${shipMode?shipBlock:''}
      <div style="border:1px solid var(--line);border-radius:var(--r-sm);padding:14px;margin-top:6px"><p class="muted" style="font-size:12px" id="re-prev-e">${msg}</p>
        <div style="height:3px;border-radius:3px;margin:12px 0;background:linear-gradient(90deg,#7a3fb0,#2b54d6,#f5d000,#d33b30,#15784c)"></div>
        <div class="mut3" style="font-size:10px;font-weight:700">FROM ${esc((f.from||'').toUpperCase())}</div></div>
      <div class="btn btn-dark btn-block btn-sm" style="margin-top:12px;pointer-events:none">${cta}</div></div></div>`;
  return `<h1 style="font-size:24px;margin-bottom:4px">Recipient experience</h1>
    <p class="muted" style="margin-bottom:18px">${shipMode?'These gifts ship directly to recipients. Preview the tracking page and shipping email they receive.':'Craft the message and see exactly what recipients get — on the landing page and in their invitation email.'}</p>
    <div style="display:grid;grid-template-columns:420px 1fr;gap:28px">
      <div>
        <div class="card" style="padding:20px">
          <h3 style="font-size:15px;margin-bottom:10px">Your message</h3>
          <div class="field"><label class="lbl">From</label><input class="inp" id="re-from" value="${esc(f.from||'')}"></div>
          <div class="field"><label class="lbl">Message <span class="mut3" style="font-weight:400;text-transform:none;letter-spacing:0">${msgCaption}</span></label>
            <textarea class="inp" id="re-msg" rows="4" data-act="reMsg">${msg}</textarea></div>
        </div>
        <div class="card" style="padding:20px;margin-top:16px">
          <h3 style="font-size:15px;margin-bottom:10px">When should we send?</h3>
          <div class="optcard ${f.when==='now'?'on':''}" data-act="spWhen" data-arg="now"><div class="rd"></div><div><h4>${shipMode?'Ship immediately after payment':'Immediately after payment'}</h4></div></div>
          <div class="optcard ${f.when==='sched'?'on':''}" style="margin-top:10px" data-act="spWhen" data-arg="sched"><div class="rd"></div><div><h4>Schedule for later</h4><p>Pick a date, time & time zone</p></div></div>
          ${f.when==='sched'?`<div class="sched-grid">
            <div><label class="lbl">Date</label><input type="date" class="inp" value="${sched.date}" data-act="schedSet" data-k="date"></div>
            <div><label class="lbl">Time</label><input type="time" class="inp" value="${sched.time}" data-act="schedSet" data-k="time"></div>
            <div><label class="lbl">Time zone</label><select class="inp" data-act="schedSet" data-k="tz">${['Asia/Kolkata (IST)','Asia/Dubai (GST)','Europe/London (BST)','America/New_York (EDT)','Asia/Singapore (SGT)'].map(z=>`<option ${sched.tz===z?'selected':''}>${z}</option>`).join('')}</select></div></div>`:''}
          ${shipMode?'':`<div class="optcard ${f.when==='self'?'on':''}" style="margin-top:10px" data-act="spWhen" data-arg="self"><div class="rd"></div><div><h4>I'll share the invite link myself</h4></div></div>`}
        </div>
      </div>
      <div>
        <div class="row" style="justify-content:center;margin-bottom:16px"><div class="prevtabs">
          <button class="${pv==='landing'?'on':''}" data-act="prevTab" data-arg="landing">${tab1}</button>
          <button class="${pv==='email'?'on':''}" data-act="prevTab" data-arg="email">${tab2}</button></div></div>
        ${pv==='landing'?`<div style="max-width:300px;margin:0 auto">${landing}</div>`:`<div style="max-width:440px;margin:0 auto">${email}</div>`}
        <p class="mut3" style="text-align:center;font-size:11.5px;margin-top:14px">${pv==='landing'?cap1:cap2}</p>
      </div>
    </div>`;
}
function reMsg(e){ S.flow.msg=e.target?e.target.value:''; const l=document.getElementById('re-prev-l'), em=document.getElementById('re-prev-e'); if(l)l.textContent=S.flow.msg; if(em)em.textContent=S.flow.msg; }
function reNote(e){ S.flow.note=e.target?e.target.value:''; const p=document.getElementById('si-prev'); if(p)p.textContent=S.flow.note; }


/* demo catalog */
function getCatalogList(){ return (!api.useMocks() && S.catalogProducts.length) ? S.catalogProducts : DEMO_PRODUCTS; }

const DEMO_PRODUCTS=[
  {g:'tee',brand:'Port & Company',nm:'Youth Core Cotton Tee',price:'as low as ₹180',sw:35},
  {g:'hoodie',brand:'Bella + Canvas',nm:'Sponge Fleece Pullover Hoodie',price:'as low as ₹1,150',sw:6},
  {g:'bottle',brand:'',nm:'The Standard Bottle',price:'₹890',sw:4},
  {g:'mug',brand:'',nm:'Black Glossy Mug 11oz',price:'₹420',sw:3},
  {g:'pack',brand:'Mercer+Mettle',nm:'Commuter Backpack',price:'₹3,400',sw:4},
  {g:'cap',brand:'Decathlon',nm:'Structured Twill Cap',price:'₹640',sw:8},
  {g:'note',brand:'Moleskine',nm:'Classic Hard Notebook',price:'₹1,120',sw:5},
  {g:'power',brand:'Ambrane',nm:'Xtreme-10 Power Bank',price:'as low as ₹1,426',sw:2},
  {g:'pillow',brand:'',nm:'Travel Neck Pillow',price:'₹540',sw:6},
  {g:'bag',brand:'ChangeBag',nm:'Organic Canvas Tote',price:'₹360',sw:7},
  {g:'tee',brand:'Comfort Colors',nm:'Garment-Dyed Heavyweight Tee',price:'₹1,640',sw:61},
  {g:'bottle',brand:'DeskMate',nm:'Steel Bottle 750ml',price:'₹689',sw:5},
];

/* wizard chrome */
function wzChrome(title, steps, idx, body, foot){
  return `<div style="height:100%;display:flex;flex-direction:column;background:var(--bg)">
    <div class="wzbar"><div class="title">${title}</div>
      <div class="wzsteps">${steps.map((s,i)=>`<div class="wzstep ${i<idx?'done':''} ${i===idx?'on':''}"><span class="b">${i<idx?'✓':i+1}</span>${s}</div>`).join('')}</div>
      <span class="lnk-muted" data-act="wzExit">Save and exit</span></div>
    <div class="main scroll" style="flex:1"><div style="max-width:1080px;margin:0 auto;padding:34px" class="fade-in">${body}</div></div>
    ${foot?`<div class="wzfoot">${foot}</div>`:''}</div>`;
}
function wzExit(){ go(S.flow.exitTo||'shops'); toast('Saved as draft'); }

/* split overlay (create shop steps) */
function shopOverlay(rightHtml){
  return `<div style="height:100%;display:flex;flex-direction:column;background:#0E1E16">
    ${Shell('')==''?'':''}
    <div style="flex:1;display:grid;place-items:center;padding:24px">
      <div class="card" style="width:100%;max-width:980px;display:grid;grid-template-columns:1fr 1fr;overflow:hidden;box-shadow:var(--sh-3)">
        <div style="padding:48px 40px;display:flex;flex-direction:column;justify-content:center">
          <h1 style="font-size:40px;color:var(--brand);line-height:1.05">Let's create<br>your shop</h1>
          <p class="muted" style="margin-top:20px;max-width:34ch;line-height:1.55">Create a shop for gifting recipients and beyond. Total control over branding, banner and products.</p>
        </div>
        <div style="padding:40px 38px;background:var(--surface-2);border-left:1px solid var(--line)">${rightHtml}</div>
      </div></div></div>`;
}

/* ---------- CREATE WALLET ---------- */



/* ---------- CREATE SHOP (3 steps in split overlay) ---------- */
Wizards.createShop=function(){
  const f=S.flow; const step=f.step||0;
  if(step===0){
    const cur=f.shopCur||'Points';
    const opt=(k,t,d)=>`<div class="optcard ${cur===k?'on':''}" data-act="shopCur" data-arg="${k}" style="margin-bottom:10px"><div class="rd"></div><div><h4>${t}</h4><p>${d}</p></div></div>`;
    const right=`<h3 style="font-size:19px;margin-bottom:16px">Shop details</h3>
      <div class="field"><label class="lbl">Shop name *</label><input class="inp" id="sh-name" value="Rubix" autofocus></div>
      <div class="lbl">Choose currency</div>
      ${opt('Points','Points','₹2 = 1 Pt. Recipients redeem with points.')}
      ${opt('INR','Indian Rupee (₹)','Prices shown in rupees, GST inclusive.')}
      ${opt('Priceless','Priceless','Hide prices. Choose how many items recipients can redeem.')}
      <p class="mut3" style="font-size:11.5px;margin:6px 0 16px;line-height:1.5">Currency &amp; shop name can be edited from your dashboard. Currency can't change once an order starts.</p>
      <button class="btn btn-dark btn-block btn-lg" data-act="shopNext">Next</button>`;
    return shopOverlay(right);
  }
  // step 1: logo
  const uploaded=f.logo; const ltab=f.logoTab||'device';
  const tabs=`<div class="tabs" style="max-width:340px;margin:6px 0 16px">
    <button class="${ltab==='device'?'on':''}" data-act="shopLogoTab" data-arg="device">Upload from device</button>
    <button class="${ltab==='prev'?'on':''}" data-act="shopLogoTab" data-arg="prev">Previous uploads</button></div>`;
  let picker;
  if(uploaded){
    picker=`<div class="row" style="align-items:center;justify-content:space-between;border:1px solid var(--brand);border-radius:var(--r-sm);padding:12px 14px;background:var(--brand-50)"><div class="row" style="gap:10px;align-items:center"><div class="logo-chip" style="width:38px;height:38px">${LOGO_DECO}</div><div><div style="font-weight:600">rubix-logo.svg</div><div class="mut3" style="font-size:11px">SVG · 747 KB</div></div></div><button class="xbtn" data-act="shopLogoClear">✕</button></div>
      <label class="row" style="gap:9px;align-items:center;margin-top:14px;font-size:13px"><input type="checkbox" checked> I am authorised to use this logo *</label>`;
  } else if(ltab==='prev'){
    picker=`<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:10px">${PREV_UPLOADS.map((u,i)=>prevThumb(i,u,f.logoSel===i,'shopLogoPrev')).join('')}</div>`;
  } else {
    picker=`<div style="border:1.5px dashed var(--line);border-radius:var(--r);padding:30px;text-align:center;color:var(--ink-2);background:#fff" data-act="shopLogoUpload">
      <div style="font-weight:600">Drag and drop file</div>
      <div class="mut3" style="font-size:11.5px;margin:8px 0 4px">Accepted: SVG, PNG, WEBP, JPEG, JPG · Recommended 20px × 14px · Max 5 MB</div>
      <button class="btn btn-soft btn-sm" style="margin-top:12px" data-act="shopLogoUpload">Search local device</button></div>`;
  }
  const right=`<h3 style="font-size:22px;font-family:var(--disp)">Add your logo</h3><p class="muted" style="font-size:13px;margin:4px 0 6px">We'll use your logo to generate assets for your shop.</p>
    ${tabs}${picker}
    <div class="note" style="margin-top:14px">${I.help?'':''}Upload a high-quality, transparent-background logo (300 DPI+) to prevent production delays. <span class="lnk" data-act="toast" data-arg="Guidelines opened">Learn more</span></div>
    <div class="row" style="margin-top:18px"><button class="btn btn-ghost btn-block" data-act="shopBuildGo">Skip for now</button>
      <button class="btn btn-dark btn-block" ${uploaded?'':'disabled'} data-act="shopBuildGo">Generate assets</button></div>`;
  return shopOverlay(right);
};
function createShopStart(){ S.flow={exitTo:'shops',step:0,shopCur:'Points'}; go('createShop'); }
function shopCur(el){ S.flow.shopCur=el.dataset.arg; render(); }
function shopNext(){ S.flow.shopName=document.getElementById('sh-name').value||'Rubix'; S.flow.step=1; render(); }
function shopLogoUpload(){ S.flow.logo=true; render(); }
function shopLogoClear(){ S.flow.logo=false; render(); }
function shopBuildGo(){ go('shopBuilder'); }

/* ---------- SHOP BUILDER ---------- */
Wizards.shopBuilder=function(){
  const f=S.flow;
  const cats=[['Food & Beverages','mug'],['Work Essentials','note'],['Merch','tee'],['Life & Hobbies','cap'],['Wellness','bottle'],['Experiences','spark'],['Luxury','bag']];
  const sel=f.cats||['Food & Beverages','Work Essentials','Merch'];
  return `<div style="height:100%;display:flex;flex-direction:column;background:var(--bg)">
    <div style="height:60px;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 22px;flex:none">
      <span class="lnk-muted" style="color:#fff" data-act="wzExit">${I.back} Exit</span>
      <span style="font-family:var(--disp);font-weight:800;font-size:18px;font-style:italic">Shelf Merch</span>
      <button class="btn btn-ghost btn-sm" data-act="shopPublish">Save &amp; publish</button></div>
    <div class="main scroll" style="flex:1">
      <div class="shopbanner dotted" style="height:170px;border-radius:0;display:flex;align-items:center;justify-content:center;gap:24px">
        <div style="width:96px;height:96px;background:#fff;border-radius:16px;display:grid;place-items:center">${LOGO_DECO}</div>
        <div style="font-family:var(--disp);font-weight:800;font-size:40px;color:#fff">${esc(f.shopName||'Rubix')}</div>
        <button class="btn btn-soft btn-sm" data-act="toast" data-arg="Edit banner">${I.edit}Edit banner</button></div>
      <div style="max-width:1000px;margin:0 auto;padding:30px 24px" class="fade-in">
        <h2 style="font-size:22px;margin-bottom:6px">Choose categories for your shop</h2>
        <p class="muted" style="margin-bottom:20px">Pick categories for recipients to shop from. After saving, you can enable/disable individual products.</p>
        <div class="grid" style="grid-template-columns:repeat(4,1fr)">${cats.map(([c,g])=>`<label class="optcard ${sel.includes(c)?'on':''}" data-act="catToggle" data-arg="${c}"><div style="width:18px;height:18px;border:2px solid ${sel.includes(c)?'var(--brand)':'#c4ccc6'};border-radius:4px;display:grid;place-items:center;background:${sel.includes(c)?'var(--brand)':'#fff'};flex:none">${sel.includes(c)?'<span style="color:#fff;font-size:12px">✓</span>':''}</div><div style="flex:1"><h4>${c}</h4></div><div style="width:40px;height:40px;border-radius:8px;background:var(--surface-2);display:grid;place-items:center;flex:none">${PG[g]||I.spark.replace('currentColor','#9aa39c')}</div></label>`).join('')}</div>
      </div></div></div>`;
};
function catToggle(el){ const c=el.dataset.arg; S.flow.cats=S.flow.cats||['Food & Beverages','Work Essentials','Merch'];
  const i=S.flow.cats.indexOf(c); if(i<0)S.flow.cats.push(c); else S.flow.cats.splice(i,1); render(); }
async function shopPublish(){
  const name=S.flow.shopName||'Rubix', currency=S.flow.shopCur||'Points', categories=S.flow.cats||['Food & Beverages','Work Essentials','Merch'];
  let s;
  if(api.useMocks()){
    s={id:nid('s'),name,currency,live:true,categories,collections:[]};
    S.shops.push(s);
  } else {
    try{
      S.loading=true; render();
      s=await api.createShopFlow({name,currency,categories});
      S.shops.push(s);
    }catch(err){
      S.loading=false; render();
      toast(err.message||'Failed to publish shop');
      return;
    }
    S.loading=false;
  }
  go('shopDetail',{flow:{shopId:s.id,shopTab:'Branded Swag'},nav:'shops'});
  openModal(`<div class="modal-pad" style="text-align:center">
    <div class="shopbanner dotted" style="height:130px;display:grid;place-items:center;margin-bottom:18px"><div style="width:62px;height:62px;background:#fff;border-radius:14px;display:grid;place-items:center">${LOGO_DECO}</div></div>
    <h3>Let's take a tour of your shop!</h3><p class="muted" style="margin-top:6px">Your "${esc(s.name)}" shop is live. Add branded swag, then send points.</p>
    <div class="row" style="margin-top:18px"><button class="btn btn-ghost btn-block" data-act="closeLayer">Done</button><button class="btn btn-dark btn-block" data-act="swagDesignerStart">Take a tour · Design swag</button></div></div>`);
}


/* shared renderers */
function pcard(p,opts={}){
  const sw = opts.swatches?`<div class="swatches">${['#1c1c1c','#2b4a8b','#9a9a9a','#7a4a25'].map(c=>`<span class="sw" style="background:${c}"></span>`).join('')}<span class="mut3" style="font-size:11px;align-self:center;margin-left:2px">+${opts.swatches}</span></div>`:'';
  const logo = opts.branded?`<div style="position:absolute;width:34%;height:34%">${LOGO_DECO}</div>`:'';
  return `<div class="pcard" data-act="${opts.act||'noop'}" ${opts.arg?`data-arg="${opts.arg}"`:''}>
    <div class="img">${PG[p.g]||PG.tee}${logo}</div>
    <div class="meta">${p.brand?`<div class="brand">${esc(p.brand)}</div>`:''}<div class="nm">${esc(p.nm)}</div>${opts.price?`<div class="pr">${opts.price}</div>`:''}${sw}</div></div>`;
}

/* ===================== SHOPS ===================== */
function ViewShops(){
  if(!S.shops.length){
    return `<div class="page-h"><div><h1>Shops</h1><div class="sub">Branded storefronts your recipients shop from.</div></div>
      <button class="btn btn-brand" data-act="createShopStart">${I.plus}Create shop</button></div>
      <div class="card empty"><div class="ic">${I.shop.replace('currentColor','#cdd6cf')}</div><h3>No shops yet</h3><p>Create one to celebrate a moment.</p>
      <button class="btn btn-brand" style="margin-top:14px" data-act="createShopStart">Create your first shop</button></div>`;
  }
  const cards=S.shops.map(s=>`
    <div class="card" style="overflow:hidden;cursor:pointer" data-act="shopOpen" data-arg="${s.id}">
      <div class="shopbanner dotted" style="height:96px;border-radius:0"><div style="position:absolute;left:18px;top:50%;transform:translateY(-50%);width:48px;height:48px;background:#fff;border-radius:12px;display:grid;place-items:center">${LOGO_DECO}</div></div>
      <div style="padding:16px 18px"><div class="row" style="justify-content:space-between;align-items:center">
        <div><h3 style="font-size:18px">${esc(s.name)}</h3><div style="margin-top:5px">${s.live?'<span class="tag tag-live"><span class="dot"></span>Live</span>':'<span class="tag tag-draft">Draft</span>'} <span class="mut3" style="font-size:12px;margin-left:6px">${s.currency}</span></div></div>
        <button class="btn btn-soft btn-sm" data-act="shopOpen" data-arg="${s.id}">Open</button></div></div></div>`).join('');
  return `<div class="page-h"><div><h1>Shops</h1><div class="sub">Branded storefronts your recipients redeem points in.</div></div>
    <div class="row" style="gap:8px"><button class="btn btn-ghost" data-act="toast" data-arg="Browse templates">Browse templates</button>
    <button class="btn btn-brand" data-act="createShopStart">${I.plus}Create shop</button></div></div>
    <div class="grid stagger" style="grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">${cards}</div>`;
}
const SHOP_TABS=['Branded Swag','Shop Catalog','Sent Gifts','Layout','Settings','Reports'];
function ViewShopDetail(){
  const s=S.shops.find(x=>x.id===S.flow.shopId)||S.shops[0];
  const tab=S.flow.shopTab||'Branded Swag';
  return `
  <div class="lnk-muted" style="display:inline-flex;gap:6px;align-items:center;margin-bottom:14px" data-act="nav" data-arg="shops">${I.back}Back to shops</div>
  <div class="row" style="align-items:center;gap:16px;margin-bottom:18px">
    <div class="shopbanner dotted" style="width:160px;height:84px;flex:none"><div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:46px;height:46px;background:#fff;border-radius:10px;display:grid;place-items:center">${LOGO_DECO}</div></div>
    <div style="flex:1"><h1 style="font-size:26px">${esc(s.name)}</h1><div style="margin-top:6px">${s.live?'<span class="tag tag-live"><span class="dot"></span>Live</span>':''} <span class="lnk" style="margin-left:8px" data-act="toast" data-arg="Opening live shop…">View shop</span></div></div>
    <button class="btn btn-dark" data-act="sendPointsStart" data-arg="${s.id}">${I.coin}Send points</button>
  </div>
  <div class="tabs" style="margin-bottom:22px">${SHOP_TABS.map(t=>`<button class="${t===tab?'on':''}" data-act="shopTab" data-arg="${t}">${t}</button>`).join('')}</div>
  ${shopTabBody(s,tab)}`;
}
function shopTabBody(s,tab){
  if(tab==='Branded Swag'){
    const cols=S.collections.filter(c=>c.shopId===s.id);
    const sub=S.flow.swSub||'Saved Designs';
    const rail=`<div class="subrail">
      ${[['Saved Designs',cols.length],['Locker Inventory',''],['Archived','']].map(([k,ct])=>`<div class="item ${sub===k?'on':''}" data-act="swSub" data-arg="${k}">${k}${ct!==''?`<span class="ct">${ct}</span>`:''}</div>`).join('')}</div>`;
    let content;
    if(sub==='Saved Designs'){
      content = !cols.length ? swagEmptyDesigner() : `<div class="card" style="padding:22px">
        <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:6px"><h3 style="font-size:17px">Your branded swag designs</h3>
        <button class="btn btn-ghost btn-sm" data-act="swagDesignerStart">${I.plus}Start designing</button></div>
        <p class="muted" style="font-size:13px;margin-bottom:18px">Add more logos to auto-generate additional collections for free. Toggle products with the eye icon, or request design tweaks from our team.</p>
        ${cols.map(c=>collectionBlock(c)).join('')}</div>`;
    } else if(sub==='Locker Inventory'){
      const items=[['Mercer+Mettle Pack',42],['Bella + Canvas Hoodie',88],['Black Glossy Mug 11oz',120],['The Standard Bottle',64]];
      content=`<div class="card" style="padding:22px"><div class="row" style="justify-content:space-between;margin-bottom:14px"><h3 style="font-size:17px">Locker inventory</h3><button class="btn btn-ghost btn-sm" data-act="toast" data-arg="Reorder requested">Reorder low stock</button></div>
        <table class="tbl"><thead><tr><th>Item</th><th>In locker</th><th>Status</th><th></th></tr></thead><tbody>${items.map(([n,q])=>`<tr><td style="font-weight:600">${n}</td><td class="num">${q}</td><td>${q<50?'<span class="tag tag-warn"><span class="dot"></span>Low</span>':'<span class="tag tag-live"><span class="dot"></span>Healthy</span>'}</td><td style="text-align:right"><span class="lnk" data-act="toast" data-arg="Reorder requested">Reorder</span></td></tr>`).join('')}</tbody></table></div>`;
    } else {
      content=`<div class="card empty"><div class="ic">${I.swag.replace('currentColor','#cdd6cf')}</div><h3>No archived designs</h3><p>Designs you archive will be stored here and can be restored any time.</p></div>`;
    }
    return `<div style="display:flex;gap:22px">${rail}<div style="flex:1">${content}</div></div>`;
  }
  if(tab==='Sent Gifts'){
    return `<div class="card" style="padding:22px">
      <div class="row" style="justify-content:space-between;margin-bottom:16px"><h3 style="font-size:17px">Sent gifts</h3>
        <div class="search" style="width:300px">${I.search}<input placeholder="Search by order name or number" data-act="noop"></div></div>
      <table class="tbl"><thead><tr><th>Gift name</th><th>Sent by</th><th>Budget/recipient</th><th>Status</th><th>Recipients</th><th></th></tr></thead>
      <tbody>${(S.flow.sentGifts||[]).length?S.flow.sentGifts.map(g=>`<tr><td style="font-weight:600">${esc(g.name)}</td><td class="muted">${esc(g.by)}</td><td class="num">${pts(g.ppr)}</td><td><span class="tag tag-live"><span class="dot"></span>Sent</span></td><td>${g.recips}</td><td style="text-align:right"><span class="lnk">View</span></td></tr>`).join('')
        :`<tr><td style="font-weight:600">Order R212828590</td><td class="muted">Jonna Madhavi</td><td class="num">742.21 Pts</td><td><span class="tag tag-warn"><span class="dot"></span>Incomplete</span></td><td>1 <span class="mut3">(99 seats left)</span></td><td style="text-align:right"><span class="lnk" data-act="sendPointsStart" data-arg="'+s.id+'">Finish sending</span></td></tr>`}</tbody></table>
      <div style="margin-top:14px"><span class="lnk-muted" style="color:var(--danger)" data-act="toast" data-arg="Incomplete order deleted">🗑 Delete incomplete order</span></div></div>`;
  }
  if(tab==='Shop Catalog'){
    const ps=getCatalogList().slice(0,8);
    return `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">${ps.map(p=>pcard(p,{price:p.price,swatches:p.sw,act:'toast',arg:'Product enabled in shop'})).join('')}</div>`;
  }
  if(tab==='Reports'){
    return `<div class="grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:18px">
      ${[['Points sent','74,221'],['Points redeemed','38,540'],['Redemption rate','52%'],['Recipients','100']].map(([k,v])=>`<div class="card stat"><div class="k">${k}</div><div class="v num">${v}</div></div>`).join('')}</div>
      <div class="card" style="padding:22px"><h3 style="font-size:16px;margin-bottom:14px">Redemptions over time</h3>${miniChart()}</div>`;
  }
  return `<div class="card" style="padding:26px"><h3 style="font-size:17px;margin-bottom:8px">${tab}</h3><p class="muted">Configure ${tab.toLowerCase()} for ${esc(s.name)}. Banner, theme colours, custom domain and visibility live here.</p>
    <button class="btn btn-soft" style="margin-top:16px" data-act="toast" data-arg="${tab} saved">Edit ${tab.toLowerCase()}</button></div>`;
}
function swagEmptyDesigner(){
  const demo=[{g:'cap'},{g:'note'},{g:'pillow'},{g:'hoodie'},{g:'bag'},{g:'tee'},{g:'bottle'},{g:'mug'}];
  return `<div class="card" style="padding:26px">
    <div class="grid" style="grid-template-columns:repeat(8,1fr);margin-bottom:20px">${demo.map(p=>`<div style="aspect-ratio:1;border:1px solid var(--line);border-radius:var(--r-sm);display:grid;place-items:center;background:var(--surface-2)">${PG[p.g]}</div>`).join('')}</div>
    <div style="text-align:center"><h3 style="font-size:18px">Create swag collections instantly — no design skills required</h3>
    <p class="muted" style="margin:6px 0 16px">Choose your products, add your artwork, and build a branded collection that'll wow users.</p>
    <button class="btn btn-dark" data-act="swagDesignerStart">${I.plus}Start designing</button></div></div>`;
}
function collectionBlock(c){
  return `<div style="border:1px solid var(--line);border-radius:var(--r);padding:16px;margin-bottom:12px">
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:14px">
      <div><span style="font-weight:700">${esc(c.name)}</span> <span class="mut3" style="font-size:12px;margin-left:6px">#${c.code} · ${c.products.length} products · ${c.created}</span></div>
      <div class="row" style="gap:8px;align-items:center"><span class="tag tag-ready">In catalog</span><button class="iconbtn" style="width:30px;height:30px" data-act="toast" data-arg="Share link copied">${I.share}</button></div></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${c.products.map(p=>pcard(p,{branded:true,act:'noop'})).join('')}</div></div>`;
}

/* ===================== SWAG ===================== */
function ViewSwag(){
  const tab=S.flow.swagTab||'All Products';
  return `<div class="page-h"><div><h1>Swag</h1><div class="sub">Your designed collections and the full catalog you can build from.</div></div>
    <div class="row" style="gap:8px"><button class="btn btn-ghost" data-act="swagDesignerStart">${I.plus}Start designing</button>
    <button class="btn btn-dark" data-act="nav" data-arg="catalog">Purchase swag</button></div></div>
    <div class="tabs" style="max-width:360px;margin-bottom:22px">${['All Products','Saved Designs','Archived'].map(t=>`<button class="${t===tab?'on':''}" data-act="swagTab" data-arg="${t}">${t}</button>`).join('')}</div>
    ${S.collections.map(c=>`<div class="card" style="padding:18px;margin-bottom:16px">
      <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:14px"><div><span style="font-weight:700">${esc(c.name)}</span> <span class="mut3" style="font-size:12px;margin-left:6px">#${c.code} · Created ${c.created} by ${esc(c.by)} · ${c.products.length} products</span></div><span class="tag tag-ready">Design ready</span></div>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">${c.products.map(p=>pcard(p,{branded:true,act:'noop'})).join('')}</div></div>`).join('')}`;
}

/* ===================== KITS ===================== */
function ViewKits(){
  const total=S.kits.length, live=S.kits.filter(k=>k.status==='live').length, sent=S.kits.filter(k=>k.sent).length;
  const rows=S.kits.map(k=>`<tr>
    <td><div style="font-weight:600">${esc(k.name)}</div><div class="mut3" style="font-size:11.5px">Reusable kit</div></td>
    <td class="num">${k.items}</td>
    <td>${k.status==='live'?'<span class="tag tag-live"><span class="dot"></span>Live</span>':'<span class="tag tag-draft">Draft</span>'}</td>
    <td class="muted">${k.sent?'Recently':'Not yet'}</td>
    <td style="text-align:right;white-space:nowrap"><button class="btn btn-ghost btn-sm" data-act="kitOpen" data-arg="${k.id}">Details</button> <button class="btn btn-dark btn-sm" data-act="sendItemsStart" data-arg="${k.id}">Send</button></td>
  </tr>`).join('');
  return `<div class="page-h"><div><h1>Kits &amp; Items</h1><div class="sub">Package catalog products into reusable gift kits, then send them at scale.</div></div>
    <button class="btn btn-brand" data-act="createKitStart">${I.plus}Create a kit</button></div>
    <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:18px">
      ${[['Total kits',total],['Live kits',live],['Kits sent',sent],['Recipients reached','45']].map(([k,v])=>`<div class="card stat"><div class="k">${k}</div><div class="v num">${v}</div></div>`).join('')}</div>
    <div class="card" style="padding:22px">
      <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:12px"><h3 style="font-size:17px">Your kits</h3>
        <div class="search" style="max-width:260px">${I.search}<input style="height:36px" placeholder="Search kits" data-act="noop"></div></div>
      <table class="tbl"><thead><tr><th>Kit</th><th>Items</th><th>Status</th><th>Last sent</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
}
function kitOpen(id){ const k=S.kits.find(x=>x.id===id);
  openModal(`<div class="modal-pad"><div class="modal-h"><div><div class="eyebrow">${k.status} · ${k.items} items</div><h3>${esc(k.name)}</h3></div><button class="xbtn" data-act="closeLayer">✕</button></div>
    <p class="muted" style="margin:8px 0 16px">A reusable ${k.items}-item kit. Send it to new recipients any time without rebuilding.</p>
    <div class="row"><button class="btn btn-ghost btn-block" data-act="toast" data-arg="Editing kit">Edit kit</button><button class="btn btn-brand btn-block" data-act="sendItemsStart" data-arg="${id}">Send this kit</button></div></div>`); }

/* ===================== CONTACTS ===================== */
function roleSel(c){ return `<select class="inp" style="height:34px;width:auto;padding:0 30px 0 12px;display:inline-block" data-act="noop">${['Owner','Admin','Sender','Member','Non-Member'].map(r=>`<option ${c.role===r?'selected':''}>${r}</option>`).join('')}</select>`; }
function ViewContacts(){
  const rows=S.contacts.map(c=>`<tr>
    <td><input type="checkbox" ${c.role!=='Owner'?'':'disabled'}></td>
    <td class="muted">${esc(c.email)}</td>
    <td style="font-weight:600">${esc(c.name)}</td>
    <td>${c.role==='Owner'?'Owner':roleSel(c)}</td>
    <td class="muted">${c.loc?esc(c.loc):'—'}</td>
    <td style="text-align:right"><button class="iconbtn" style="width:30px;height:30px" data-act="contactEdit" data-arg="${c.id}">${I.edit}</button></td></tr>`).join('');
  const admins=S.contacts.filter(c=>['Owner','Admin'].includes(c.role)).length;
  const senders=S.contacts.filter(c=>c.role==='Sender').length;
  return `<div class="page-h"><div><h1>Workspace Contacts</h1><div class="sub">People in your workspace, their roles, and gifting permissions.</div></div>
    <div class="row" style="gap:14px;align-items:center">
      <div class="row" style="gap:16px"><div style="text-align:center"><div class="mut3" style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:700">Admins</div><div class="num" style="font-weight:700">${admins}</div></div>
      <div style="text-align:center"><div class="mut3" style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:700">Senders</div><div class="num" style="font-weight:700">${senders}</div></div>
      <div style="text-align:center"><div class="mut3" style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:700">Members</div><div class="num" style="font-weight:700">${S.contacts.length}</div></div></div>
      <button class="btn btn-dark" data-act="addContacts">${I.plus}Add contacts</button></div></div>
  <div class="card" style="padding:18px">
    <div class="search" style="margin-bottom:14px">${I.search}<input placeholder="Search by name or email" data-act="noop"></div>
    <table class="tbl"><thead><tr><th></th><th>Email</th><th>Name</th><th>Role</th><th>Home address</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function addContacts(){
  S.flow.addTab='manual';
  renderAddContacts();
}
function renderAddContacts(){
  const tab=S.flow.addTab;
  const body = tab==='manual'
    ? `<label class="lbl">Enter emails (comma separated)</label>
       <textarea class="inp" id="ac-emails" rows="5" placeholder="Enter or paste emails separated by commas or line breaks" autofocus></textarea>
       <div class="card" style="padding:12px 14px;margin-top:14px;display:flex;justify-content:space-between;align-items:center"><span class="muted" style="font-size:13px">Add these contacts to workspace as:</span>
       <select class="inp" id="ac-role" style="width:auto;height:36px;padding:0 30px 0 12px"><option>Non-Member</option><option>Member</option><option>Sender</option><option>Admin</option></select></div>`
    : `<p class="muted" style="font-size:13px;margin-bottom:12px">Download the CSV template, fill it out, and upload below. <span class="lnk" data-act="toast" data-arg="Template downloaded">Download template</span></p>
       <div style="border:1.5px dashed var(--line);border-radius:var(--r);padding:30px;text-align:center;color:var(--ink-2)">Accepted file type: CSV<div style="margin-top:10px"><button class="btn btn-soft btn-sm" data-act="toast" data-arg="CSV attached">Search local device</button></div></div>
       <label class="row" style="gap:9px;align-items:center;margin-top:14px;font-size:13px"><input type="checkbox"> Let CSV contacts overwrite existing contacts (excluding HRIS-synced)</label>`;
  openModal(`<div class="modal-pad"><div class="modal-h"><h3>Add contacts</h3><button class="xbtn" data-act="closeLayer">✕</button></div>
    <div class="tabs" style="max-width:240px;margin:12px 0 18px">${[['manual','Manually'],['csv','Upload CSV']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-act="acTab" data-arg="${k}">${l}</button>`).join('')}</div>
    ${body}
    <div class="row" style="margin-top:20px"><button class="btn btn-ghost btn-block" data-act="closeLayer">Cancel</button><button class="btn btn-brand btn-block" data-act="addContactsDo">Add contacts</button></div></div>`);
}
async function addContactsDo(){
  const ta=document.getElementById('ac-emails');
  const role=document.getElementById('ac-role')?document.getElementById('ac-role').value:'Member';
  const emails=ta?(ta.value.split(/[\s,]+/).filter(x=>x.includes('@'))):[];
  if(!emails.length){ closeLayer(); toast('No valid emails'); return; }
  if(api.useMocks()){
    emails.forEach(em=>{ S.contacts.push({id:nid('p'),email:em,name:em.split('@')[0],role,address:'',loc:''}); });
    closeLayer(); toast(`Added ${emails.length} contact${emails.length>1?'s':''}`); render();
    return;
  }
  try{
    const created=await api.addContactsFlow(emails,role);
    S.contacts.push(...created);
    closeLayer(); toast(`Added ${created.length} contact${created.length>1?'s':''}`); render();
  }catch(err){ toast(err.message||'Failed to add contacts'); }
}
function contactEdit(id){ const c=S.contacts.find(x=>x.id===id);
  openModal(`<div class="modal-pad"><div class="modal-h"><h3>Fix recipient information</h3><button class="xbtn" data-act="closeLayer">✕</button></div>
    <p class="muted" style="font-size:13px;margin:6px 0 16px">Update this person's details so they can be added to orders. HRIS-synced fields will override manual entries.</p>
    <div class="row"><div class="field" style="flex:1"><label class="lbl">First name</label><input class="inp" value="${esc(c.name.split(' ')[0]||'')}"></div>
    <div class="field" style="flex:1"><label class="lbl">Last name</label><input class="inp" value="${esc(c.name.split(' ').slice(1).join(' '))}"></div></div>
    <div class="row"><div class="field" style="flex:1"><label class="lbl">Email</label><input class="inp" value="${esc(c.email)}"></div>
    <div class="field" style="flex:1"><label class="lbl">Country</label><select class="inp"><option>India</option><option>UAE</option><option>USA</option></select></div></div>
    <div class="field"><label class="lbl">Address</label><input class="inp" value="${esc(c.address)}"></div>
    <div class="row"><div class="field" style="flex:1"><label class="lbl">City</label><input class="inp" value="Hyderabad"></div>
    <div class="field" style="flex:1"><label class="lbl">State</label><input class="inp" value="Telangana"></div>
    <div class="field" style="flex:1"><label class="lbl">PIN</label><input class="inp" value="500089"></div></div>
    <div class="row" style="margin-top:8px"><button class="btn btn-ghost btn-block" data-act="closeLayer">Cancel</button><button class="btn btn-brand btn-block" data-act="closeLayerToast" data-arg="Recipient details saved">Save</button></div></div>`); }

/* ===================== INTEGRATIONS ===================== */
function ViewIntegrations(){
  const apps=[['Darwinbox','HRIS','Sync employees, birthdays & start dates',true],['Keka','HRIS','People data & org chart',false],['Razorpay','Payments','Collect funds via UPI, cards, netbanking',true],['Shiprocket','Logistics','Domestic & global fulfilment tracking',true],['Slack','Comms','Celebrate milestones in channels',false],['Google Workspace','Directory','Provision recipients from Google',false]];
  return `<div class="page-h"><div><h1>Integrations</h1><div class="sub">Connect HRIS, payments and logistics to automate gifting end-to-end.</div></div></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${apps.map(([n,t,d,on])=>`<div class="card" style="padding:18px">
    <div class="row" style="justify-content:space-between;align-items:flex-start"><div class="logo-chip" style="font-family:var(--disp);font-weight:800;color:var(--brand-d)">${n[0]}</div>${on?'<span class="tag tag-live"><span class="dot"></span>Connected</span>':''}</div>
    <h3 style="font-size:16px;margin-top:12px">${n}</h3><div class="mut3" style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-top:2px">${t}</div>
    <p class="muted" style="font-size:13px;margin-top:8px">${d}</p>
    <button class="btn ${on?'btn-ghost':'btn-soft'} btn-sm btn-block" style="margin-top:14px" data-act="toast" data-arg="${on?n+' settings':'Connecting '+n+'…'}">${on?'Manage':'Connect'}</button></div>`).join('')}</div>`;
}

/* ===================== CATALOG ===================== */
function ViewCatalog(){
  const cats=['All Products','Apparel','Bags','Drinkware','Technology','Office','Health & Wellness'];
  const t=S.flow.catCat||'All Products';
  const list=getCatalogList();
  return `<div class="page-h"><div><h1>Catalog</h1><div class="sub">${list.length} products from vetted suppliers, ready to brand and ship across India.</div></div></div>
  <div class="tabs" style="margin-bottom:20px">${cats.map(c=>`<button class="${c===t?'on':''}" data-act="catCat" data-arg="${c}">${c}</button>`).join('')}</div>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${list.map(p=>pcard(p,{price:p.price,swatches:p.sw,act:'toast',arg:p.nm+' added to design'})).join('')}</div>`;
}

function campaignStatusTag(status){
  const live=['launched','redemption_open'].includes(status);
  const closed=['redemption_closed','fulfilled'].includes(status);
  if(live) return '<span class="tag tag-live"><span class="dot"></span>Live</span>';
  if(closed) return '<span class="tag tag-draft">Closed</span>';
  return '<span class="tag tag-proc">Draft</span>';
}
function ViewCampaigns(){
  const list=S.campaigns||[];
  if(!list.length){
    return `<div class="page-h"><div><h1>Campaigns</h1><div class="sub">Launch points campaigns and track redemptions.</div></div></div>
      <div class="card empty"><div class="ic">${I.camp.replace('currentColor','#cdd6cf')}</div><h3>No campaigns yet</h3><p>Create a campaign from a shop or entity budget to send redemption invites.</p></div>`;
  }
  const rows=list.map(c=>`<tr>
    <td style="font-weight:600">${esc(c.name)}</td>
    <td class="muted">${esc(c.type)}</td>
    <td>${campaignStatusTag(c.status)}</td>
    <td class="num">${c.recipientCount}</td>
    <td class="num">${inr(c.totalBudget)}</td>
    <td class="num">${inr(c.creditsPerRecipient)}</td>
  </tr>`).join('');
  return `<div class="page-h"><div><h1>Campaigns</h1><div class="sub">Points campaigns, recipient invites and redemption tracking.</div></div></div>
    <div class="card" style="padding:18px"><table class="tbl"><thead><tr><th>Campaign</th><th>Type</th><th>Status</th><th>Recipients</th><th>Total budget</th><th>Per recipient</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function miniChart(){
  const d=[20,38,30,55,48,70,62,84,76,92,80,88];
  const max=100,w=560,h=120,step=w/(d.length-1);
  const pts=d.map((v,i)=>`${i*step},${h-(v/max)*h}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h+10}" style="width:100%;height:auto"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15784C" stop-opacity=".25"/><stop offset="1" stop-color="#15784C" stop-opacity="0"/></linearGradient></defs>
    <polygon points="0,${h} ${pts} ${w},${h}" fill="url(#g)"/><polyline points="${pts}" fill="none" stroke="#15784C" stroke-width="2.5"/>
    ${d.map((v,i)=>`<circle cx="${i*step}" cy="${h-(v/max)*h}" r="3" fill="#15784C"/>`).join('')}</svg>`;
}


/* ===================== ORDERS ===================== */
function statusTag(s){
  const m={Processing:'tag-proc',Shipped:'tag-ship',Delivered:'tag-deliv'};
  return `<span class="tag ${m[s]||'tag-proc'}">${s}</span>`;
}
function ViewOrders(){
  const list=S.orders||[];
  if(!list.length){
    return `<div class="page-h"><div><h1>Orders</h1><div class="sub">Track every swag, kit and points order across your workspace.</div></div></div>
      <div class="card empty"><div class="ic">${I.orders.replace('currentColor','#cdd6cf')}</div><h3>No orders yet</h3><p>Orders appear here when recipients redeem gifts or you send kits at scale.</p></div>`;
  }
  const rows = list.map(o=>`
    <tr data-act="orderOpen" data-arg="${o.id}" style="cursor:pointer">
      <td class="num">${o.date}</td>
      <td style="font-weight:600">${esc(o.name)}</td>
      <td>${statusTag(o.status)}</td>
      <td class="num" style="font-weight:600">${inr(o.amount)}</td>
      <td style="text-align:right"><span class="lnk">${o.track?'Tracking':'View'}</span></td>
    </tr>`).join('');
  return `<div class="page-h"><div><h1>Orders</h1><div class="sub">Track every swag, kit and points order across your workspace.</div></div></div>
  <div class="search" style="margin-bottom:18px">${I.search}<input placeholder="Search by order name or ID…" data-act="noop"></div>
  <div class="card"><table class="tbl"><thead><tr><th>Date</th><th>Order details</th><th>Status</th><th>Amount</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function orderOpen(id){
  const o=S.orders.find(x=>x.id===id); if(!o)return;
  const deliv = o.status==='Delivered';
  const head = deliv
    ? `<div style="background:var(--brand-50);border-radius:var(--r-sm);padding:16px;text-align:center;margin-bottom:14px">
        <div style="font-family:var(--disp);font-weight:800;font-size:22px;color:var(--brand-d)">DELIVERED</div>
        <div class="muted" style="margin-top:2px">On ${o.delivered}</div>
        <div style="margin-top:6px">Tracking ID: <a>${o.track}</a></div></div>`
    : o.status==='Shipped'
    ? `<div style="background:var(--info-50);border-radius:var(--r-sm);padding:16px;text-align:center;margin-bottom:14px">
        <div style="font-family:var(--disp);font-weight:800;font-size:22px;color:var(--info)">SHIPPED</div>
        <div style="margin-top:6px">Tracking ID: <a>${o.track}</a></div></div>`
    : `<div class="banner" style="margin-bottom:14px">${I.truck}<div>Your order is being prepared. Tracking will appear here once it ships.</div></div>`;
  const items = o.items.map(([n,q])=>`<div class="row" style="justify-content:space-between;border:1px solid var(--line);border-radius:var(--r-sm);padding:11px 14px;margin-bottom:8px"><span style="font-weight:600">${esc(n)}</span><span class="muted">Qty ${q}</span></div>`).join('');
  openModal(`<div class="modal-pad">
    <div class="modal-h"><div><div class="eyebrow">${o.date} · ${inr(o.amount)} · ${esc(o.orderNumber||'')}</div><h3>${esc(o.name)}</h3></div><button class="xbtn" data-act="closeLayer">✕</button></div>
    <div style="margin-top:14px">${head}
      <div class="lbl" style="margin-bottom:8px">Items in shipment</div>${items}</div>
    <div class="row" style="margin-top:18px;gap:10px"><button class="btn btn-ghost btn-block" data-act="toast" data-arg="Invoice downloaded">Download invoice</button>${o.track?`<button class="btn btn-dark btn-block" data-act="toast" data-arg="Opening carrier tracking…">Track shipment</button>`:''}</div>
  </div>`);
}

/* ===================== WALLETS ===================== */
/* ===================== WALLETS · ORGANIZATION SETUP ===================== */
const ORG_ROLES=['Marketing Manager','Sales Manager','HR Manager','Admin Manager','Customer Success Manager','Operations Manager'];
const ORG_SUGG=['Marketing','Sales','HR','Admin','Customer Success','Engineering','Finance','Operations'];
const ORG_FALLBACK=['#DB2777','#0891B2','#65A30D','#9333EA','#EA580C','#0D9488'];
const ORG_CAN=['Create campaigns','Allocate credits','Upload recipients','Track orders','View department reports'];
const ORG_CANT=['Add funds','Transfer budgets','Access other departments'];
const ORG_STEPS=['Create Wallet','Departments','Allocate Budget','Assign Managers','Review & Finish'];
const parseAmt=s=>parseInt(String(s).replace(/[^\d]/g,'')||'0',10);
const fmtDate=iso=>{ if(!iso)return '—'; const d=new Date(iso+'T00:00'); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); };
const orgTotalAlloc=()=>S.org.departments.reduce((s,d)=>s+(d.allocated||0),0);
function orgNextColor(){ const o=S.org; o._c=(o._c||0); const c=ORG_FALLBACK[o._c%ORG_FALLBACK.length]; o._c++; return c; }

function ViewWallets(){
  if(!S.org.inWizard) return orgDashboard();
  if(S.org.done) return orgDone();
  const n=S.org.step;
  const stepper=`<div class="org-stepper">${ORG_STEPS.map((lab,i)=>{const s=i+1;const cls=s<n?'done':s===n?'active':'';return `<div class="org-step ${cls}"><button class="sbtn" data-act="orgGo" data-arg="${s}"><div class="snum">${s<n?'✓':s}</div><div class="smeta"><span class="seye">Step ${s}</span><span class="slabel">${lab}</span></div></button>${s<5?'<div class="sline"></div>':''}</div>`;}).join('')}</div>`;
  const body=[orgStep1,orgStep2,orgStep3,orgStep4,orgStep5][n-1]();
  const over=n===3 && orgTotalAlloc()>S.org.wallet.amount;
  const nextLabel=n===5?'Finish setup':'Continue';
  const foot=`<div class="org-foot">
    <button class="btn btn-ghost" data-act="orgBack" style="${n===1?'visibility:hidden':''}">${I.back}Back</button>
    <div class="note">Step ${n} of 5 · <b>${ORG_STEPS[n-1]}</b></div>
    <button class="btn btn-brand" id="org-next" data-act="orgNext" ${over?'disabled':''}>${nextLabel}${I.send.replace('width="24" height="24"','width="15" height="15"')}</button></div>`;
  return `<div class="page-h"><div><div class="lnk-muted" style="display:inline-flex;gap:6px;align-items:center;margin-bottom:8px" data-act="orgExit">${I.back}Back to wallet dashboard</div><h1>${S.org.active?'Create another wallet':'Organization setup'}</h1><div class="sub">${esc(S.account)} · configure your merchandise budget, cost centers and managers.</div></div></div>
    ${stepper}${body}${foot}`;
}

/* ---- Organization dashboard (landing) ---- */
function orgDashboard(){
  if(!S.org.active){
    return `<div class="page-h"><div><h1>Wallets</h1><div class="sub">Set up a merchandise budget, split it into cost centers, and assign managers.</div></div></div>
      <div class="card empty" style="padding:50px"><div class="ic">${I.wallet.replace('currentColor','#cdd6cf')}</div><h3>No merchandise wallet yet</h3><p>Create your organization's merchandise budget wallet to start funding department campaigns.</p>
        <button class="btn btn-brand" style="margin-top:16px" data-act="orgStart">${I.plus}Create wallet</button></div>`;
  }
  const o=S.org.wallet, total=o.amount, alloc=orgTotalAlloc(), rem=total-alloc;
  const depts=S.org.departments, invited=depts.filter(d=>d.mgr.invite&&d.mgr.email).length;
  const allocTot=alloc||1; let acc=0;
  const stops=depts.map(d=>{ const pct=(d.allocated/allocTot*100); const seg=`${d.color} ${acc}% ${acc+pct}%`; acc+=pct; return seg; }).join(',')||'var(--surface-2) 0% 100%';
  const rows=depts.map(d=>`<tr>
    <td><div class="row" style="gap:9px;align-items:center"><span class="lc" style="width:11px;height:11px;border-radius:3px;background:${d.color}"></span><span style="font-weight:600">${esc(d.name)}</span></div></td>
    <td>${d.mgr.name?`<div style="font-weight:500;font-size:13px">${esc(d.mgr.name)}</div><div class="mut3" style="font-size:11px">${esc(d.mgr.email||'')}</div>`:'<span class="muted">—</span>'}</td>
    <td class="muted" style="font-size:13px">${esc(d.mgr.role||'—')}</td>
    <td class="num">${inr(d.allocated)}</td>
    <td class="num">${total?Math.round(d.allocated/total*100):0}%</td>
    <td>${d.mgr.invite&&d.mgr.email?'<span class="tag tag-live"><span class="dot"></span>Invited</span>':'<span class="tag tag-draft">Not invited</span>'}</td>
  </tr>`).join('');
  return `<div class="page-h"><div><h1>Wallets</h1><div class="sub">Organization merchandise budget · ${esc(S.account)}</div></div>
    <button class="btn btn-brand" data-act="orgStart">${I.plus}Create wallet</button></div>

  <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:18px;margin-bottom:18px">
    <div class="card" style="padding:22px">
      <div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="mut3" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">Merchandise budget wallet</div>
        <h2 style="font-size:21px;font-family:var(--disp);margin-top:4px">${esc(o.name)}</h2></div>
        <span class="tag tag-live"><span class="dot"></span>Active</span></div>
      <div class="num" style="font-family:var(--disp);font-weight:800;font-size:34px;margin:14px 0 4px">${inr(total)}</div>
      <div class="muted" style="font-size:13px">Valid ${fmtDate(o.start)} → ${fmtDate(o.end)} · Funded via ${o.funding==='upload'?(esc(o.docType)+' '+esc(o.docNumber)):'online payment'}</div>
      <div class="row" style="gap:8px;margin-top:16px"><button class="btn btn-ghost btn-sm" data-act="orgGoEdit" data-arg="1">Edit wallet</button><button class="btn btn-ghost btn-sm" data-act="orgGoEdit" data-arg="3">Re-allocate budget</button><button class="btn btn-ghost btn-sm" data-act="orgGoEdit" data-arg="4">Manage managers</button></div>
    </div>
    <div class="card" style="padding:22px">
      <div class="mut3" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Budget distribution</div>
      <div style="display:flex;gap:18px;align-items:center">
        <div class="donut" style="width:130px;height:130px;flex:none;background:conic-gradient(${stops})"><div class="donut-center"><div class="num" style="font-family:var(--disp);font-weight:800;font-size:22px">${depts.length}</div><div class="mut3" style="font-size:10px">Depts</div></div></div>
        <div style="flex:1">${depts.map(d=>`<div class="row" style="justify-content:space-between;padding:3px 0;font-size:12px"><span class="row" style="gap:6px;align-items:center"><span class="lc" style="width:9px;height:9px;border-radius:3px;background:${d.color}"></span>${esc(d.name)}</span><b>${total?Math.round(d.allocated/total*100):0}%</b></div>`).join('')}</div>
      </div>
    </div>
  </div>

  <div class="card row" style="padding:0;margin-bottom:18px">
    <div class="stat" style="flex:1"><div class="k">Total budget</div><div class="v num">${inr(total)}</div></div>
    <div style="width:1px;background:var(--line)"></div>
    <div class="stat" style="flex:1"><div class="k">Allocated to cost centers</div><div class="v num">${inr(alloc)}</div></div>
    <div style="width:1px;background:var(--line)"></div>
    <div class="stat" style="flex:1"><div class="k">Unallocated</div><div class="v num" style="color:${rem<0?'var(--danger)':'var(--brand-d)'}">${inr(rem)}</div></div>
    <div style="width:1px;background:var(--line)"></div>
    <div class="stat" style="flex:1"><div class="k">Managers invited</div><div class="v num">${invited} / ${depts.length}</div></div>
  </div>

  <div class="card" style="padding:22px">
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:14px"><h3 style="font-size:17px">Departments (cost centers)</h3>
      <button class="btn btn-ghost btn-sm" data-act="orgGoEdit" data-arg="2">${I.plus}Add / edit departments</button></div>
    <table class="tbl"><thead><tr><th>Department</th><th>Manager</th><th>Role</th><th>Budget</th><th>% of total</th><th>Invite</th></tr></thead><tbody>${rows}</tbody></table>
  </div>`;
}
function orgStart(){ S.org.inWizard=true; S.org.done=false; S.org.step=1; render(); }
function orgGoEdit(arg){ S.org.inWizard=true; S.org.done=false; S.org.step=+arg; render(); }
function orgExit(){ S.org.inWizard=false; S.org.done=false; render(); }
function orgToDash(){ S.org.inWizard=false; S.org.active=true; S.org.done=false; render(); }

/* ---- Step 1: wallet ---- */
function orgStep1(){
  const o=S.org.wallet;
  return `<div style="display:grid;grid-template-columns:1.5fr 1fr;gap:22px">
    <div class="card" style="padding:24px">
      <h3 style="font-size:18px;margin-bottom:4px">Create Merchandise Budget Wallet</h3>
      <p class="muted" style="font-size:13px;margin-bottom:18px">Set up your annual merchandise budget. Funds in this wallet power every department campaign and order.</p>
      <div class="field"><label class="lbl">Wallet name</label><input class="inp" id="org-wname" value="${esc(o.name)}" data-act="orgWLive"></div>
      <div class="field"><label class="lbl">Budget amount</label><div class="inp-wrap"><span class="inp-prefix" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--ink-3)">₹</span><input class="inp num" id="org-wamt" style="padding-left:26px" value="${o.amount.toLocaleString('en-IN')}" data-act="orgWLive"></div><div class="mut3" style="font-size:11.5px;margin-top:6px">Total annual merchandise budget you want to fund.</div></div>
      <div class="row" style="gap:14px"><div class="field" style="flex:1;margin:0"><label class="lbl">Period start</label><input class="inp" type="date" id="org-wstart" value="${o.start}" data-act="orgWLive"></div>
        <div class="field" style="flex:1;margin:0"><label class="lbl">Period end</label><input class="inp" type="date" id="org-wend" value="${o.end}" data-act="orgWLive"></div></div>
      <div class="field" style="margin-top:16px"><label class="lbl">Funding method</label>
        <div class="row" style="gap:12px">
          <div class="radio-card ${o.funding==='upload'?'sel':''}" style="flex:1" data-act="orgFunding" data-arg="upload"><div class="rcd"></div><div class="rct">Upload Agreement / PO</div><div class="rcs">Fund against a signed agreement</div></div>
          <div class="radio-card ${o.funding==='pay'?'sel':''}" style="flex:1" data-act="orgFunding" data-arg="pay"><div class="rcd"></div><div class="rct">Pay Online</div><div class="rcs">Card, bank transfer or UPI</div></div></div></div>
      ${o.funding==='upload'?`
      <div class="row" style="gap:14px"><div class="field" style="flex:1;margin:0"><label class="lbl">Document type</label><select class="inp" id="org-doctype" data-act="orgWChange"><option ${o.docType==='Agreement'?'selected':''}>Agreement</option><option ${o.docType==='Purchase Order'?'selected':''}>Purchase Order</option><option ${o.docType==='Work Order'?'selected':''}>Work Order</option></select></div>
        <div class="field" style="flex:1;margin:0"><label class="lbl">Document number</label><input class="inp" id="org-docnum" value="${esc(o.docNumber)}" data-act="orgWLive"></div></div>
      <div class="field"><label class="lbl">Upload document</label>
        ${o.uploaded?`<div class="row" style="gap:10px;align-items:center;border:1px solid var(--brand);border-radius:var(--r-sm);padding:11px 13px;background:var(--brand-50)"><div class="logo-chip" style="width:34px;height:34px;font-size:10px;font-weight:800">PDF</div><div style="flex:1"><div style="font-weight:600;font-size:13px">${esc(S.account)}-Merch-Agreement-FY26.pdf</div><div class="mut3" style="font-size:11px">1.8 MB · uploaded just now</div></div><button class="xbtn" data-act="orgUploadClear">✕</button></div>`
        :`<div style="border:1.5px dashed var(--line);border-radius:var(--r-sm);padding:22px;text-align:center;color:var(--ink-2);cursor:pointer" data-act="orgUpload">${I.upload.replace('currentColor','#15784C')}<div style="font-weight:600;font-size:13px;margin-top:8px">Click to upload or drag & drop</div><div class="mut3" style="font-size:11px;margin-top:4px">PDF or DOCX · up to 25MB</div></div>`}
        <div class="row" style="gap:9px;align-items:center;margin-top:12px"><span class="lbl" style="margin:0">Approval status</span><span class="tag tag-warn"><span class="dot"></span>Pending review</span></div></div>`
      :`
      <div class="field"><label class="lbl">Amount</label><div class="inp-wrap"><span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--ink-3)">₹</span><input class="inp num" id="org-payamt" style="padding-left:26px" value="${o.amount.toLocaleString('en-IN')}" data-act="orgWLive"></div></div>
      <div class="field"><label class="lbl">Payment method</label><div class="row" style="gap:10px">
        ${['card','bank','upi'].map(p=>`<div class="radio-card ${o.pay===p?'sel':''}" style="flex:1;padding:12px 12px 12px 38px" data-act="orgPay" data-arg="${p}"><div class="rcd"></div><div class="rct">${p==='card'?'Credit card':p==='bank'?'Bank transfer':'UPI'}</div></div>`).join('')}</div></div>
      <button class="btn btn-dark btn-block" data-act="toast" data-arg="Redirecting to secure payment…">Proceed to payment</button>`}
    </div>
    <aside><div class="card" style="padding:20px">
      <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:14px"><span class="lbl" style="margin:0">Wallet summary</span><span class="tag tag-draft"><span class="dot"></span>Draft</span></div>
      <div style="border-top:1px solid var(--line);padding:12px 0"><div class="mut3" style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;font-weight:700">Wallet name</div><div id="org-sname" style="font-weight:600;margin-top:3px">${esc(o.name)}</div></div>
      <div style="border-top:1px solid var(--line);padding:12px 0"><div class="mut3" style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;font-weight:700">Budget</div><div id="org-sbudget" class="num" style="font-family:var(--disp);font-weight:800;font-size:24px;margin-top:3px">${inr(o.amount)}</div></div>
      <div style="border-top:1px solid var(--line);padding:12px 0"><div class="mut3" style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;font-weight:700">Validity</div><div id="org-svalidity" style="font-weight:500;margin-top:3px;font-size:13.5px">${fmtDate(o.start)} → ${fmtDate(o.end)}</div></div>
      <div style="border-top:1px solid var(--line);padding:12px 0 0"><div class="mut3" style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;font-weight:700">Funding method</div><div id="org-sfund" style="font-weight:500;margin-top:3px;font-size:13.5px">${o.funding==='upload'?'Upload Agreement / PO':'Pay Online'}</div></div>
    </div></aside></div>`;
}
function orgWLive(e){ const el=e.target||e, id=el.id, o=S.org.wallet;
  if(id==='org-wamt'||id==='org-payamt'){ const v=parseAmt(el.value); el.value=v?v.toLocaleString('en-IN'):''; o.amount=v; }
  else if(id==='org-wname') o.name=el.value;
  else if(id==='org-wstart') o.start=el.value;
  else if(id==='org-wend') o.end=el.value;
  else if(id==='org-docnum') o.docNumber=el.value;
  const s1=document.getElementById('org-sname'); if(s1)s1.textContent=o.name||'Untitled wallet';
  const s2=document.getElementById('org-sbudget'); if(s2)s2.textContent=inr(o.amount);
  const s3=document.getElementById('org-svalidity'); if(s3)s3.textContent=fmtDate(o.start)+' → '+fmtDate(o.end);
}
function orgWChange(el){ if(el.id==='org-doctype') S.org.wallet.docType=el.value; }
function orgFunding(m){ S.org.wallet.funding=m; render(); }
function orgPay(el,a){ S.org.wallet.pay=a; render(); }
function orgUpload(){ S.org.wallet.uploaded=true; toast('Document uploaded · pending review'); render(); }
function orgUploadClear(){ S.org.wallet.uploaded=false; render(); }

/* ---- Step 2: departments ---- */
function orgStep2(){
  const used=S.org.departments.map(d=>d.name.toLowerCase());
  const sugg=ORG_SUGG.map(s=>`<button class="chip ${used.includes(s.toLowerCase())?'used':''}" data-act="orgQuickAdd" data-arg="${esc(s)}"><span class="plus">+</span> ${s}</button>`).join('');
  const cards=S.org.departments.map(d=>`<div class="dept-card">
    <div class="row" style="gap:11px;align-items:center"><div class="dc-swatch" style="background:${d.color}">${esc(d.name.charAt(0))}</div><div style="font-weight:700;font-size:15px">${esc(d.name)}</div></div>
    <p class="muted" style="font-size:12.5px;margin:12px 0;min-height:34px">${esc(d.desc)}</p>
    <div class="row" style="justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:12px"><div class="mut3" style="font-size:12px">Expected users · <b style="color:var(--ink)">${d.users}</b></div>
      <div class="row" style="gap:4px"><button class="iconbtn" data-act="orgDeptModal" data-arg="${d.id}">${I.edit.replace('width="24" height="24"','width="15" height="15"')}</button><button class="iconbtn" data-act="orgDeptDel" data-arg="${d.id}">${I.trash.replace('width="24" height="24"','width="15" height="15"')}</button></div></div>
  </div>`).join('');
  return `<div style="margin-bottom:8px"><h3 style="font-size:18px">Create departments</h3><p class="muted" style="font-size:13px;margin-top:2px">Departments act as cost centers that consume the merchandise budget. Add the teams that will run campaigns and order swag.</p></div>
    <label class="lbl">Quick add suggestions</label><div style="margin:6px 0 18px">${sugg}</div>
    <div class="dept-grid">${cards}<button class="add-dept" data-act="orgDeptModal" data-arg="new"><div class="pc">+</div><span>Add another department</span></button></div>`;
}
function orgQuickAdd(name){ if(S.org.departments.some(d=>d.name.toLowerCase()===name.toLowerCase()))return;
  const descs={Engineering:'Team merchandise, hackathon kits and dev swag.',Finance:'Audit, compliance and finance team merchandise.',Operations:'Operational supplies and field team kits.'};
  S.org.departments.push({id:S.org.seq++,name,desc:descs[name]||'Department merchandise and campaigns.',users:10,allocated:0,color:orgNextColor(),mgr:{name:'',email:'',mobile:'',role:ORG_ROLES.find(r=>r.startsWith(name))||'Operations Manager',invite:true}});
  toast(name+' added'); render();
}
function orgDeptDel(id){ if(S.org.departments.length<=1){ toast('Keep at least one department',false); return; } S.org.departments=S.org.departments.filter(d=>d.id!==+id); render(); }
function orgDeptModal(arg){ const edit=arg!=='new'; const d=edit?S.org.departments.find(x=>x.id===+arg):null; S.org.editId=edit?+arg:null;
  openModal(`<div class="modal-pad"><div class="modal-h"><div><div class="eyebrow">Cost center</div><h2 style="font-size:22px;font-family:var(--disp)">${edit?'Edit department':'Add department'}</h2></div><button class="xbtn" data-act="closeLayer">✕</button></div>
    <p class="muted" style="font-size:13px;margin:4px 0 18px">Create a cost center that will consume merchandise budget.</p>
    <div class="field"><label class="lbl">Department name</label><input class="inp" id="org-mname" value="${edit?esc(d.name):''}" placeholder="e.g. Product" autofocus></div>
    <div class="field"><label class="lbl">Description</label><input class="inp" id="org-mdesc" value="${edit?esc(d.desc):''}" placeholder="What this team uses merchandise for"></div>
    <div class="field"><label class="lbl">Expected users</label><input class="inp num" id="org-musers" type="number" min="1" value="${edit?d.users:10}"></div>
    <div class="row" style="margin-top:20px;border-top:1px solid var(--line);padding-top:16px"><button class="btn btn-ghost btn-block" data-act="closeLayer">Cancel</button><button class="btn btn-brand btn-block" data-act="orgDeptSave">${edit?'Save changes':'Add department'}</button></div></div>`);
}
function orgDeptSave(){ const name=(document.getElementById('org-mname').value||'').trim(); if(!name){ toast('Enter a department name',false); return; }
  const desc=(document.getElementById('org-mdesc').value||'').trim()||'Department merchandise and campaigns.'; const users=parseInt(document.getElementById('org-musers').value)||1;
  if(S.org.editId){ const d=S.org.departments.find(x=>x.id===S.org.editId); d.name=name; d.desc=desc; d.users=users; }
  else S.org.departments.push({id:S.org.seq++,name,desc,users,allocated:0,color:orgNextColor(),mgr:{name:'',email:'',mobile:'',role:'Operations Manager',invite:true}});
  closeLayer(); render();
}

/* ---- Step 3: allocate ---- */
function orgStep3(){
  const total=S.org.wallet.amount, alloc=orgTotalAlloc(), rem=total-alloc;
  const segs=S.org.departments.filter(d=>d.allocated>0).map(d=>`<div class="alloc-seg" style="width:${Math.min(d.allocated/total*100,100)}%;background:${d.color}">${(d.allocated/total*100)>=8?Math.round(d.allocated/total*100)+'%':''}</div>`).join('')
    +(rem>0?`<div class="alloc-seg gap" style="width:${rem/total*100}%">${(rem/total*100)>=8?'Unallocated':''}</div>`:'');
  const legend=S.org.departments.map(d=>`<div class="leg"><span class="lc" style="background:${d.color}"></span>${esc(d.name)} · ${inr(d.allocated)}</div>`).join('');
  const rows=S.org.departments.map(d=>`<tr><td><div class="row" style="gap:8px;align-items:center"><span class="lc" style="width:10px;height:10px;border-radius:3px;background:${d.color}"></span>${esc(d.name)}</div></td>
    <td class="r"><span style="color:var(--ink-3);margin-right:2px">₹</span><input class="alloc-input ${alloc>total?'over':''}" data-act="orgAllocLive" data-id="${d.id}" value="${d.allocated.toLocaleString('en-IN')}"></td>
    <td class="r"><span class="pct-pill" id="org-pct-${d.id}">${total?(d.allocated/total*100).toFixed((d.allocated/total*100)%1?1:0):0}%</span></td></tr>`).join('');
  return `<div style="margin-bottom:14px"><h3 style="font-size:18px">Allocate budget across departments</h3><p class="muted" style="font-size:13px;margin-top:2px">Distribute the wallet across cost centers. Allocations update in real time and can never exceed the wallet value.</p></div>
    <div class="grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:18px">
      <div class="card stat"><div class="k">Total budget</div><div class="v num" id="org-stTotal">${inr(total)}</div></div>
      <div class="card stat"><div class="k">Allocated</div><div class="v num" id="org-stAlloc">${inr(alloc)}</div></div>
      <div class="card stat"><div class="k">Remaining</div><div class="v num" id="org-stRem" style="color:${rem<0?'var(--danger)':'var(--brand-d)'}">${inr(rem)}</div></div></div>
    <div class="card" style="padding:18px"><div class="alloc-bar" id="org-bar">${segs||'<div class="alloc-seg gap" style="width:100%">Unallocated</div>'}</div><div class="alloc-legend" id="org-legend">${legend}</div></div>
    <div class="row" style="justify-content:flex-end;gap:10px;align-items:center;margin-top:14px"><span class="mut3" style="font-size:12.5px">Need a starting point?</span><button class="btn btn-soft btn-sm" data-act="orgSplitEven">Split evenly</button></div>
    <table class="alloc-table"><thead><tr><th>Department</th><th class="r">Allocated budget</th><th class="r">Percentage</th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr style="font-weight:700"><td style="padding:12px 10px">Total allocated</td><td class="r" style="padding:12px 10px" id="org-footAmt">${inr(alloc)}</td><td class="r" style="padding:12px 10px" id="org-footPct">${total?Math.round(alloc/total*100):0}%</td></tr></tfoot></table>
    <div class="banner ${alloc>total?'':''}" id="org-allocAlert" style="margin-top:16px;background:var(--danger-tint,#fdeceb);color:var(--danger);border:none;${alloc>total?'':'display:none'}">Allocated amount exceeds the wallet value. Reduce allocations to continue.</div>`;
}
function orgAllocLive(e){ const el=e.target; const id=+el.dataset.id; let n=parseAmt(el.value); el.value=n?n.toLocaleString('en-IN'):''; S.org.departments.find(d=>d.id===id).allocated=n; orgAllocRecalc(); }
function orgAllocRecalc(){ const total=S.org.wallet.amount, alloc=orgTotalAlloc(), rem=total-alloc, over=alloc>total;
  const set=(id,v)=>{const e=document.getElementById(id); if(e)e.textContent=v;};
  set('org-stAlloc',inr(alloc)); set('org-footAmt',inr(alloc)); set('org-footPct',(total?Math.round(alloc/total*100):0)+'%');
  const r=document.getElementById('org-stRem'); if(r){ r.textContent=inr(rem); r.style.color=rem<0?'var(--danger)':'var(--brand-d)'; }
  S.org.departments.forEach(d=>{ const p=document.getElementById('org-pct-'+d.id); if(p)p.textContent=(total?(d.allocated/total*100).toFixed((d.allocated/total*100)%1?1:0):0)+'%'; });
  const bar=document.getElementById('org-bar'); if(bar){ let segs=S.org.departments.filter(d=>d.allocated>0).map(d=>`<div class="alloc-seg" style="width:${Math.min(d.allocated/total*100,100)}%;background:${d.color}">${(d.allocated/total*100)>=8?Math.round(d.allocated/total*100)+'%':''}</div>`).join(''); if(rem>0)segs+=`<div class="alloc-seg gap" style="width:${rem/total*100}%">${(rem/total*100)>=8?'Unallocated':''}</div>`; bar.innerHTML=segs||'<div class="alloc-seg gap" style="width:100%">Unallocated</div>'; }
  const lg=document.getElementById('org-legend'); if(lg)lg.innerHTML=S.org.departments.map(d=>`<div class="leg"><span class="lc" style="background:${d.color}"></span>${esc(d.name)} · ${inr(d.allocated)}</div>`).join('');
  const al=document.getElementById('org-allocAlert'); if(al)al.style.display=over?'flex':'none';
  document.querySelectorAll('.alloc-input').forEach(i=>i.classList.toggle('over',over));
  const nb=document.getElementById('org-next'); if(nb)nb.disabled=over;
}
function orgSplitEven(){ const total=S.org.wallet.amount,n=S.org.departments.length,base=Math.floor(total/n/1000)*1000; S.org.departments.forEach((d,i)=>d.allocated=i===n-1?total-base*(n-1):base); toast('Budget split evenly'); render(); }

/* ---- Step 4: managers ---- */
function orgStep4(){
  return `<div style="margin-bottom:14px"><h3 style="font-size:18px">Assign department managers</h3><p class="muted" style="font-size:13px;margin-top:2px">Managers control campaigns, recipients and spending for their department. Invitations are sent the moment setup completes.</p></div>`
  +S.org.departments.map(d=>`<div class="mgr-card">
    <div class="mgr-head"><div class="dc-swatch" style="background:${d.color};width:30px;height:30px;font-size:13px">${esc(d.name.charAt(0))}</div><div style="font-weight:700;font-size:15px">${esc(d.name)}</div><div class="mb">Budget <b>${inr(d.allocated)}</b></div></div>
    <div class="mgr-body" style="grid-template-columns:1fr;display:block;padding:18px">
      <div><div class="row" style="gap:12px;margin-bottom:14px"><div class="field" style="flex:1;margin:0"><label class="lbl">Manager name</label><input class="inp" value="${esc(d.mgr.name)}" data-act="orgMgrLive" data-id="${d.id}" data-f="name" placeholder="Full name"></div>
        <div class="field" style="flex:1;margin:0"><label class="lbl">Role</label><select class="inp" data-act="orgMgrRole" data-id="${d.id}">${ORG_ROLES.map(r=>`<option ${r===d.mgr.role?'selected':''}>${r}</option>`).join('')}</select></div></div>
        <div class="row" style="gap:12px"><div class="field" style="flex:1;margin:0"><label class="lbl">Email</label><input class="inp" value="${esc(d.mgr.email)}" data-act="orgMgrLive" data-id="${d.id}" data-f="email" placeholder="name@${esc(S.account.toLowerCase())}.net"></div>
        <div class="field" style="flex:1;margin:0"><label class="lbl">Mobile</label><input class="inp" value="${esc(d.mgr.mobile)}" data-act="orgMgrLive" data-id="${d.id}" data-f="mobile" placeholder="+91 ..."></div></div></div>
    </div>
    <div class="row" style="justify-content:space-between;align-items:center;padding:14px 18px;border-top:1px solid var(--line);background:var(--surface-2)"><div><div style="font-weight:600;font-size:13px">Send invitation</div><div class="mut3" style="font-size:11.5px">Email the manager an invite to activate their account</div></div><div class="switch ${d.mgr.invite?'on':''}" data-act="orgInvite" data-arg="${d.id}"></div></div>
  </div>`).join('');
}
function orgMgrLive(e){ const el=e.target; S.org.departments.find(d=>d.id===+el.dataset.id).mgr[el.dataset.f]=el.value; }
function orgMgrRole(el){ S.org.departments.find(d=>d.id===+el.dataset.id).mgr.role=el.value; }
function orgInvite(id){ const d=S.org.departments.find(x=>x.id===+id); d.mgr.invite=!d.mgr.invite; render(); }

/* ---- Step 5: review ---- */
function orgStep5(){
  const o=S.org.wallet, total=o.amount, allocTot=orgTotalAlloc()||1;
  let acc=0; const stops=S.org.departments.map(d=>{ const pct=d.allocated/allocTot*100; const seg=`${d.color} ${acc}% ${acc+pct}%`; acc+=pct; return seg; }).join(',');
  return `<div style="margin-bottom:14px"><h3 style="font-size:18px">Review organization setup</h3><p class="muted" style="font-size:13px;margin-top:2px">Confirm everything looks right. Jump back to any step to make changes before finishing.</p></div>
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:20px">
      <div>
        <div class="card" style="padding:20px;margin-bottom:16px"><div class="row" style="justify-content:space-between;margin-bottom:10px"><b style="font-size:14px">Organization & wallet</b><span class="lnk" data-act="orgGo" data-arg="1">Edit</span></div>
          <div class="row" style="justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)"><span class="muted" style="font-size:13px">Organization</span><span style="font-weight:600;font-size:13px">${esc(S.account)}</span></div>
          <div class="row" style="justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)"><span class="muted" style="font-size:13px">Wallet</span><span style="font-weight:600;font-size:13px">${esc(o.name)}</span></div>
          <div class="row" style="justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)"><span class="muted" style="font-size:13px">Total budget</span><span style="font-weight:700;font-size:13px;color:var(--brand-d)">${inr(total)}</span></div>
          <div class="row" style="justify-content:space-between;padding:7px 0"><span class="muted" style="font-size:13px">Validity</span><span style="font-weight:600;font-size:13px">${fmtDate(o.start)} → ${fmtDate(o.end)}</span></div></div>
        <div class="card" style="padding:20px"><div class="row" style="justify-content:space-between;margin-bottom:6px"><b style="font-size:14px">Departments & managers</b><span class="lnk" data-act="orgGo" data-arg="2">Edit</span></div>
          ${S.org.departments.map(d=>`<div class="rev-dept"><span class="sw" style="background:${d.color}"></span><div style="flex:1"><div style="font-weight:600;font-size:13.5px">${esc(d.name)}</div><div class="mut3" style="font-size:11.5px">${d.mgr.name?esc(d.mgr.name)+(d.mgr.email?' · '+esc(d.mgr.email):''):'No manager assigned'}</div></div><span class="num" style="font-weight:700;font-size:13px">${inr(d.allocated)}</span><span class="pct-pill">${total?Math.round(d.allocated/total*100):0}%</span></div>`).join('')}</div>
      </div>
      <aside class="card" style="padding:20px"><div class="mut3" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Budget distribution</div>
        <div class="donut" style="background:conic-gradient(${stops})"><div class="donut-center"><div class="num" style="font-family:var(--disp);font-weight:800;font-size:26px">${S.org.departments.length}</div><div class="mut3" style="font-size:11px">Departments</div></div></div>
        <div style="margin-top:6px">${S.org.departments.map(d=>`<div class="row" style="justify-content:space-between;padding:5px 0;font-size:12.5px"><span class="row" style="gap:7px;align-items:center"><span class="lc" style="width:10px;height:10px;border-radius:3px;background:${d.color}"></span>${esc(d.name)}</span><b>${total?Math.round(d.allocated/total*100):0}%</b></div>`).join('')}</div>
      </aside></div>`;
}

/* ---- nav + finish ---- */
function orgGo(arg){ S.org.step=+arg; render(); }
function orgBack(){ if(S.org.step>1){ S.org.step--; render(); } }
function orgNext(){ const st=S.org.step;
  if(st===3 && orgTotalAlloc()>S.org.wallet.amount){ toast('Reduce allocations to continue',false); return; }
  if(st===5){ orgFinishConfirm(); return; }
  S.org.step++; render();
}
function orgFinishConfirm(){ openModal(`<div class="modal-pad"><div class="modal-h"><div><h2 style="font-size:22px;font-family:var(--disp)">Finish setup?</h2></div><button class="xbtn" data-act="closeLayer">✕</button></div>
  <p class="muted" style="font-size:13.5px;margin:6px 0 20px">This activates the <b>${esc(S.org.wallet.name)}</b> wallet, creates all departments and sends manager invitations. You can still edit everything afterward.</p>
  <div class="row" style="border-top:1px solid var(--line);padding-top:16px"><button class="btn btn-ghost btn-block" data-act="closeLayer">Not yet</button><button class="btn btn-brand btn-block" data-act="orgFinish">Finish setup</button></div></div>`); }
async function orgFinish(){
  if(api.useMocks()){ S.org.done=true; closeLayer(); render(); return; }
  closeLayer();
  try{
    S.loading=true; render();
    await api.syncOrgWizard(S.org);
    await hydrateFromApi();
    S.org.done=true;
    S.org.active=true;
    toast('Wallet setup saved to your workspace');
  }catch(err){
    toast(err.message||'Failed to save wallet setup');
  }finally{
    S.loading=false; render();
  }
}

function orgDone(){ const o=S.org.wallet; const invited=S.org.departments.filter(d=>d.mgr.invite&&d.mgr.email).length;
  return `<div style="max-width:620px;margin:30px auto;text-align:center">
    <div class="success-burst">${I.check.replace('width="24" height="24"','width="36" height="36"')}</div>
    <h1 style="font-size:26px">Organization setup complete</h1>
    <p class="muted" style="margin:8px 0 24px">Your merchandise program is live. ${esc(S.account)} is ready to launch its first company store.</p>
    <div class="card" style="padding:8px 20px;text-align:left">
      <div class="succ-item"><div class="si">${I.wallet.replace('width="24" height="24"','width="17" height="17"')}</div><div style="flex:1"><div style="font-weight:600">Wallet created</div><div class="mut3" style="font-size:12px">${inr(o.amount)} budget activated</div></div><span class="tag tag-live"><span class="dot"></span>Active</span></div>
      <div class="succ-item"><div class="si">${I.box.replace('width="24" height="24"','width="17" height="17"')}</div><div style="flex:1"><div style="font-weight:600">${S.org.departments.length} departments created</div><div class="mut3" style="font-size:12px">${S.org.departments.map(d=>esc(d.name)).join(', ')}</div></div><span class="tag tag-live"><span class="dot"></span>Done</span></div>
      <div class="succ-item" style="border-bottom:none"><div class="si">${I.contacts.replace('width="24" height="24"','width="17" height="17"')}</div><div style="flex:1"><div style="font-weight:600">${invited} managers invited</div><div class="mut3" style="font-size:12px">Invitations sent via email</div></div><span class="tag tag-live"><span class="dot"></span>Sent</span></div>
    </div>
    <div class="card" style="padding:14px 18px;margin-top:16px;display:flex;gap:12px;align-items:center;text-align:left;background:var(--brand-50);border-color:#cfe7da"><div class="logo-chip" style="width:36px;height:36px">${I.shop.replace('currentColor','#15784C')}</div><div><div class="mut3" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">Recommended next step</div><div style="font-weight:600">Create your company store</div></div></div>
    <div class="row" style="justify-content:center;margin-top:22px"><button class="btn btn-ghost btn-lg" data-act="orgToDash">Go to dashboard</button><button class="btn btn-brand btn-lg" data-act="nav" data-arg="shops">Create store ${I.send.replace('width="24" height="24"','width="15" height="15"')}</button></div>
  </div>`;
}

/* ---------- small UI state handlers ---------- */
function schedSet(el){ S.flow.sched=S.flow.sched||{}; S.flow.sched[el.dataset.k]=el.value; }
function prevTab(a){ S.flow.prevView=a; render(); }
function swSub(a){ S.flow.swSub=a; render(); }
function artTab(a){ S.flow.artTab=a; render(); }
function artPick(el){ S.flow.artwork=true; S.flow.artSel=+el.dataset.arg; render(); }
function shopLogoTab(a){ S.flow.logoTab=a; render(); }
function shopLogoPrev(el){ S.flow.logo=true; S.flow.logoSel=+el.dataset.arg; render(); }

/* canned previous-uploads (logos + artwork) for picker grids */
const PREV_UPLOADS=[
  {nm:'PNG · 19.1 KB', deco:'logo'},
  {nm:'PNG · 19.1 KB', deco:'logo'},
  {nm:'SVG · 660 KB', deco:'crest'},
  {nm:'SVG · 660 KB', deco:'crest'},
];
function prevThumb(i,u,sel,act){ return `<div class="thumb ${sel?'on':''}" data-act="${act}" data-arg="${i}"><div class="ph">${u.deco==='crest'?I.spark.replace('currentColor','#d33b30').replace('width="24" height="24"','width="30" height="30"'):LOGO_DECO}</div><div class="nm">${u.nm}</div></div>`; }

/* ===================== TOP-LEVEL HANDLERS ===================== */
function readAuthForm(){
  const inputs=document.querySelectorAll('.auth-form .inp');
  return { email:(inputs[0]?.value||'').trim(), password:inputs[1]?.value||'' };
}
async function hydrateFromApi(){
  const data=await api.hydrateWorkspace();
  api.applyWorkspaceToState(S,data);
}
async function auth(){
  if(api.useMocks()){
    S.authed=true; S.nav='orders'; S.view='orders'; S.flow={}; render();
    toast('Welcome back, '+S.user.name.split(' ')[0]);
    return;
  }
  const {email,password}=readAuthForm();
  if(!email||!password){ toast('Enter email and password'); return; }
  S.loading=true; render();
  try{
    const user=await api.login(email,password);
    S.user={name:user.name,initials:user.name.split(/\s+/).slice(0,2).map(p=>p[0]?.toUpperCase()||'').join(''),email:user.email};
    await hydrateFromApi();
    S.authed=true; S.nav='orders'; S.view='orders'; S.flow={};
    toast('Welcome back, '+S.user.name.split(' ')[0]);
  }catch(err){
    toast(err.message||'Login failed');
  }finally{
    S.loading=false; render();
  }
}
async function logout(){
  if(!api.useMocks()) await api.logout().catch(()=>{});
  S.authed=false; S.view='login'; S.flow={}; closeLayer(); render();
}

function shopOpen(id){ go('shopDetail',{flow:{shopId:id,shopTab:'Branded Swag'},nav:'shops'}); }
function shopTab(t){ S.flow.shopTab=t; render(); }
function swagTab(t){ S.flow.swagTab=t; render(); }
function catCat(c){ S.flow.catCat=c; render(); }
function acTab(t){ S.flow.addTab=t; renderAddContacts(); }

function sendGift(){
  openModal(`<div class="modal-pad">
    <div class="modal-h"><div><div class="eyebrow">Send a gift</div><h3>What would you like to send?</h3></div><button class="xbtn" data-act="closeLayer">✕</button></div>
    <p class="muted" style="font-size:13px;margin:6px 0 18px">Choose how you'd like to delight your people. You can fine-tune recipients and branding on the next step.</p>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
      <div class="optcard" style="flex-direction:column;align-items:flex-start;gap:10px;cursor:pointer" data-act="sendPointsStart">
        <div style="width:42px;height:42px;border-radius:12px;background:var(--brand-50);color:var(--brand);display:grid;place-items:center">${I.coin}</div>
        <div><h4 style="margin-bottom:2px">Send points</h4><p>Let recipients pick their own swag from your branded shop.</p></div>
      </div>
      <div class="optcard" style="flex-direction:column;align-items:flex-start;gap:10px;cursor:pointer" data-act="sendItemsStart">
        <div style="width:42px;height:42px;border-radius:12px;background:var(--brand-50);color:var(--brand);display:grid;place-items:center">${I.box||I.gift||I.send}</div>
        <div><h4 style="margin-bottom:2px">Send a kit</h4><p>Ship a ready-made bundle of branded items to addresses.</p></div>
      </div>
    </div>
  </div>`);
}

function userMenu(){
  openModal(`<div class="modal-pad" style="max-width:380px">
    <div class="row" style="gap:14px;align-items:center;margin-bottom:18px">
      <div class="avatar" style="width:52px;height:52px;font-size:18px">${S.user.initials}</div>
      <div><div style="font-weight:700;font-size:16px">${esc(S.user.name)}</div><div class="muted" style="font-size:13px">${esc(S.user.email||'')}</div>
        <div style="margin-top:5px"><span class="tag tag-ready">People Admin · ${esc(S.account)}</span></div></div>
    </div>
    <div style="border-top:1px solid var(--line);padding-top:8px">
      ${[['Account settings','settings'],['Billing & invoices','billing']].map(([l,v])=>`<div class="nav-item" style="border-radius:var(--r-sm)" data-act="navClose" data-arg="${v}">${I.gear}<span>${l}</span></div>`).join('')}
      <div class="nav-item" style="border-radius:var(--r-sm);color:var(--danger)" data-act="logout">${I.exit||I.back}<span>Log out</span></div>
    </div>
  </div>`);
}

/* ===================== EVENT DELEGATION ===================== */
const ACT = {
  nav:(el,a)=>setNav(a),
  navClose:(el,a)=>{ closeLayer(); setNav(a); },
  go:(el,a)=>go(a),
  auth:()=>auth(),
  logout:()=>logout(),
  sendGift:()=>sendGift(),
  userMenu:()=>userMenu(),
  toast:(el,a)=>toast(a||'Done'),
  noop:()=>{},
  closeLayer:()=>closeLayer(),
  closeLayerToast:(el,a)=>{ closeLayer(); toast(a||'Done'); },
  // orders
  orderOpen:(el,a)=>orderOpen(a),
  // wallets · organization setup
  orgGo:(el,a)=>orgGo(a),
  orgBack:()=>orgBack(),
  orgNext:()=>orgNext(),
  orgFunding:(el,a)=>orgFunding(a),
  orgPay:(el,a)=>orgPay(el,a),
  orgUpload:()=>orgUpload(),
  orgUploadClear:()=>orgUploadClear(),
  orgQuickAdd:(el,a)=>orgQuickAdd(a),
  orgDeptModal:(el,a)=>orgDeptModal(a),
  orgDeptSave:()=>orgDeptSave(),
  orgDeptDel:(el,a)=>orgDeptDel(a),
  orgSplitEven:()=>orgSplitEven(),
  orgInvite:(el,a)=>orgInvite(a),
  orgFinish:()=>orgFinish(),
  orgStart:()=>orgStart(),
  orgGoEdit:(el,a)=>orgGoEdit(a),
  orgExit:()=>orgExit(),
  orgToDash:()=>orgToDash(),
  // shops
  shopOpen:(el,a)=>shopOpen(a),
  shopTab:(el,a)=>shopTab(a),
  createShopStart:()=>createShopStart(),
  shopCur:(el)=>shopCur(el),
  shopNext:()=>shopNext(),
  shopLogoUpload:()=>shopLogoUpload(),
  shopLogoClear:()=>shopLogoClear(),
  shopBuildGo:()=>shopBuildGo(),
  catToggle:(el)=>catToggle(el),
  shopPublish:()=>shopPublish(),
  // swag designer
  swagDesignerStart:(el)=>swagDesignerStart(el),
  swColor:(el)=>swColor(el),
  swNameNext:()=>swNameNext(),
  swPick:(el)=>swPick(el),
  swArtUpload:()=>swArtUpload(),
  swGenerate:()=>swGenerate(),
  swagTab:(el,a)=>swagTab(a),
  catCat:(el,a)=>catCat(a),
  // send points
  sendPointsStart:(el)=>sendPointsStart(el),
  spRecalc:()=>spRecalc(),
  spWhen:(el)=>spWhen(el),
  spBack:()=>spBack(),
  spNext:()=>spNext(),
  sendPointsDo:()=>sendPointsDo(),
  recToggle:(el)=>recToggle(el),
  recDeselect:()=>recDeselect(),
  recMode:(el)=>recMode(el),
  // kits
  kitOpen:(el,a)=>kitOpen(a),
  createKitStart:()=>createKitStart(),
  ktPick:(el)=>ktPick(el),
  ktLogo:()=>ktLogo(),
  ktPkg:(el)=>ktPkg(el),
  ktBack:()=>ktBack(),
  ktNext:()=>ktNext(),
  kitPublish:()=>kitPublish(),
  // send items
  sendItemsStart:(el)=>sendItemsStart(el),
  siBack:()=>siBack(),
  siNext:()=>siNext(),
  sendItemsDo:()=>sendItemsDo(),
  // contacts
  addContacts:()=>addContacts(),
  acTab:(el,a)=>acTab(a),
  addContactsDo:()=>addContactsDo(),
  contactEdit:(el,a)=>contactEdit(a),
  // wizards
  wzExit:()=>wzExit(),
  payPick:(el)=>payPick(el),
  setTab:(el,a)=>setTab(a),
  saveWorkspace:()=>saveWorkspace(),
  // recipient experience / scheduler
  schedSet:(el)=>schedSet(el),
  prevTab:(el,a)=>prevTab(a),
  // branded swag sub-rail
  swSub:(el,a)=>swSub(a),
  // artwork picker
  artTab:(el,a)=>artTab(a),
  artPick:(el)=>artPick(el),
  // shop logo tabs
  shopLogoTab:(el,a)=>shopLogoTab(a),
  shopLogoPrev:(el)=>shopLogoPrev(el),
};
const LIVE = { spRecalc:1, spMsg:1, reMsg:1, reNote:1, orgWLive:1, orgAllocLive:1, orgMgrLive:1 };  // input-driven
const CHANGED = { schedSet:1, orgWChange:1, orgMgrRole:1 };              // change-driven

document.addEventListener('click', function(e){
  // backdrop click closes any open layer
  if(e.target.hasAttribute && e.target.hasAttribute('data-scrim')){ closeLayer(); return; }
  const t = e.target.closest('[data-act]');
  if(!t) return;
  const act = t.dataset.act;
  if(LIVE[act] || CHANGED[act]) return;   // handled on input/change
  const fn = ACT[act];
  if(!fn){ return; }
  if(t.tagName==='A') e.preventDefault();
  fn(t, t.dataset.arg);
});

document.addEventListener('input', function(e){
  const t = e.target.closest('[data-act]');
  if(!t) return;
  const a=t.dataset.act;
  if(a==='spRecalc') spRecalc();
  else if(a==='spMsg') spMsg(e);
  else if(a==='reMsg') reMsg(e);
  else if(a==='reNote') reNote(e);
  else if(a==='orgWLive') orgWLive(e);
  else if(a==='orgAllocLive') orgAllocLive(e);
  else if(a==='orgMgrLive') orgMgrLive(e);
});

document.addEventListener('change', function(e){
  const t = e.target.closest('[data-act]');
  if(!t) return;
  const a=t.dataset.act;
  if(a==='schedSet') schedSet(t);
  else if(a==='orgWChange') orgWChange(t);
  else if(a==='orgWLive') orgWLive(t);
  else if(a==='orgMgrRole') orgMgrRole(t);
});

document.addEventListener('keydown', function(e){
  if(e.key==='Escape') closeLayer();
});

/* ===================== BOOT ===================== */
async function init(){
  if(api.useMocks()){
    S.authed=false; S.view='login'; render();
    return;
  }
  S.loading=true; render();
  const ok=await api.tryRestoreSession();
  if(ok){
    try{
      const data=await api.hydrateWorkspace();
      api.applyWorkspaceToState(S,data);
      S.authed=true; S.nav='orders'; S.view='orders';
    }catch{
      await api.logout().catch(()=>{});
      S.authed=false; S.view='login';
    }
  }else{
    S.authed=false; S.view='login';
  }
  S.loading=false; render();
}
init();
}
