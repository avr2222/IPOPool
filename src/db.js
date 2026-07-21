/* ============================================================
   IPO Pool — Supabase data layer
   Exposes window.loadDB() which fetches all tables and
   populates window.DB with the same shape the UI expects.
   Also exposes window.DB.mutations for all admin writes.
   ============================================================ */
(function () {

// ── Shared helpers ────────────────────────────────────────────────────────────

function fmtINR(n, opts) {
  const { compact = false } = opts || {};
  if (n == null || isNaN(n)) return '₹—';
  const neg = n < 0;
  const abs = Math.abs(n);
  let s;
  if (compact && abs >= 10000000)   s = '₹' + (abs / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
  else if (compact && abs >= 100000) s = '₹' + (abs / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
  else s = '₹' + abs.toLocaleString('en-IN');
  return (neg ? '-' : '') + s;
}

function initials(name) {
  return (name || '').trim().split(/\s+/).map(function(w){ return w[0]; }).slice(0, 2).join('').toUpperCase();
}

// ── In-memory cache (rebuilt on every loadDB call) ───────────────────────────

var _members     = [];
var _pans        = [];
var _ipos        = [];
var _allotments  = [];
var _pools       = [];
var _settlements = [];
var _currentUid  = null;

// ── Row transformers ─────────────────────────────────────────────────────────

function txMembers(rows) {
  return rows.map(function(r) {
    return {
      id:         r.id,
      name:       r.name,
      email:      r.email  || '',
      phone:      r.phone  || '',
      avatarHue:  r.avatar_hue || 200,
      isAdmin:    r.is_admin  || false,
      role:       r.is_admin  ? 'Admin' : 'Member',
      you:        r.auth_uid === _currentUid,
    };
  });
}

function txPans(rows) {
  return rows.map(function(r) {
    return {
      id:         r.id,
      holder:     r.holder_name,
      pan:        r.pan,
      member:     r.member_id,
      relation:   r.relation   || 'Self',
      linkedBank: r.bank       || '',
      bank:       r.bank       || '',
      status:     r.status,
    };
  });
}

function txIpos(rows) {
  return rows.map(function(r) {
    return {
      id:        r.id,
      name:      r.name,
      short:     r.short_name || r.name.split(' ')[0],
      type:      r.type,
      sector:    r.sector     || '',
      status:    r.status,
      band:      r.band_low   ? ('₹' + r.band_low + '–' + r.band_high) : '—',
      bandHigh:  r.band_high  || null,
      lotValue:  r.lot_value  || 0,
      lotSize:   r.lot_size   || null,
      open:      r.open_date,
      close:     r.close_date,
      allotDate: r.allot_date,
      listDate:  r.list_date,
      listPrice: r.list_price,
      listGain:  r.list_gain_pct,
      sub:       r.subscription,
      hue:       r.hue        || 220,
      logo:      r.logo       || '',
      createdAt: r.created_at || null,
    };
  });
}

// Live IPO status. The stored ipos.status is left at its 'Upcoming' default and
// never maintained, so we compute the real phase from actual activity first
// (allotment results marked or a profit pool exists ⇒ it has listed), then fall
// back to the calendar dates, and only to the stored value when nothing is known.
function deriveIpoStatus(ipo, allots, pools) {
  var hasPool = pools.some(function(p){ return p.ipo === ipo.id; });
  var marked  = allots.some(function(a){ return a.ipo === ipo.id && (a.status === 'allotted' || a.status === 'not_allotted'); });
  if (hasPool || marked) return 'Listed';

  var toDate = function(s){ if (!s) return null; var d = new Date(s); return isNaN(d.getTime()) ? null : d; };
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var open = toDate(ipo.open), close = toDate(ipo.close), list = toDate(ipo.listDate);

  if (list  && today >= list)  return 'Listed';
  if (close && today >  close)  return 'Closed';   // applications closed, awaiting listing
  if (open  && today >= open)   return 'Open';      // open for applications
  if (open  && today <  open)   return 'Upcoming';
  return ipo.status || 'Upcoming';                  // no dates set — keep the stored value
}

function txAllotments(rows) {
  // rows joined: allotments.*, applications!inner(ipo_id, pan_id, category)
  return rows.map(function(r) {
    var ipoId = r.applications.ipo_id;
    var ipo   = _ipos.find(function(i){ return i.id === ipoId; });
    return {
      id:        r.id,
      appId:     r.application_id,
      ipo:       ipoId,
      pan:       r.applications.pan_id,
      category:  r.applications.category,
      status:    r.status,
      shares:    r.shares || 0,
      gain:      r.gain   || 0,
      invest:    ipo ? (ipo.lotValue || 0) : 0,
      sellPrice: r.sell_price != null ? parseFloat(r.sell_price) : null,
    };
  });
}

function txPools(rows) {
  return rows.map(function(r) {
    return {
      id: r.id, ipo: r.ipo_id, status: r.status,
      stcgRate:  r.stcg_rate != null ? parseFloat(r.stcg_rate) : null,
      brokerage: r.brokerage != null ? parseFloat(r.brokerage) : null,
    };
  });
}

function txSettlements(rows) {
  // rows joined: settlements.*, profit_pools!inner(ipo_id)
  return rows.map(function(r) {
    return {
      id:       r.id,
      pool:     r.pool_id,
      ipo:      r.profit_pools.ipo_id,
      member:   r.member_id,
      category: r.category,
      pans:     r.pans   || 1,
      amount:   r.amount || 0,
      status:   r.status,
      date:     r.paid_date || null,
    };
  });
}

// ── Shared pool math (single source of truth for profit distribution) ─────────
// Every screen that splits profit — dashboard KPIs, charts, the Profit Pool
// screen and the Settlement ledger — goes through PoolMath so the numbers
// always agree. Net profit is split equally per PAN applied; the rounding
// remainder is distributed one rupee at a time so member shares sum EXACTLY
// to the category's net profit (no unallocated/over-allocated paise).
var PoolMath = {
  // Base math for one category's allotments (same IPO, same category).
  category: function(catAllots, stcgRate, brokerageAmt) {
    var gross     = catAllots.reduce(function(s, a){ return s + (a.gain || 0); }, 0);
    var stcgAmt   = Math.round(gross * stcgRate / 100);
    var net       = Math.max(0, gross - stcgAmt - brokerageAmt);
    var total     = catAllots.length;
    var perPan    = total > 0 ? Math.floor(net / total) : 0;
    var remainder = net - perPan * total;   // integer rupees, 0 .. total-1
    var allotted  = catAllots.filter(function(a){ return a.status === 'allotted'; }).length;
    return { gross: gross, stcgAmt: stcgAmt, net: net, total: total, perPan: perPan, remainder: remainder, allotted: allotted };
  },

  // Amount per PAN with the remainder distributed deterministically:
  // the first `remainder` PANs (sorted by id) each get one extra rupee.
  panAmounts: function(catAllots, stcgRate, brokerageAmt) {
    var m = this.category(catAllots, stcgRate, brokerageAmt);
    var sorted = catAllots.slice().sort(function(a, b){ return String(a.id).localeCompare(String(b.id)); });
    var out = {};
    for (var i = 0; i < sorted.length; i++) {
      out[sorted[i].id] = m.perPan + (i < m.remainder ? 1 : 0);
    }
    return out;
  },

  // Aggregate per-PAN amounts by member. panToMember(panId) -> memberId | null.
  // Returns { [memberId]: { pans, share } } where the shares sum to net.
  memberShares: function(catAllots, stcgRate, brokerageAmt, panToMember) {
    var amounts = this.panAmounts(catAllots, stcgRate, brokerageAmt);
    var shares = {};
    catAllots.forEach(function(a) {
      var mid = panToMember(a.pan);
      if (mid == null) return;
      if (!shares[mid]) shares[mid] = { pans: 0, share: 0 };
      shares[mid].pans++;
      shares[mid].share += (amounts[a.id] || 0);
    });
    return shares;
  },
};
window.PoolMath = PoolMath;

// Rate resolution used by EVERY profit aggregate. Once a pool is finalized it
// carries the STCG/brokerage rates used at that moment, so the dashboard, ledger
// and leaderboard must all price a pool's profit with those captured rates.
// Unfinalized pools (no row / null rates) fall back to the current local
// settings, matching the Profit Pool screen's pre-finalize preview.
function ratesForIpo(ipoId) {
  var pool = _pools.find(function(p){ return p.ipo === ipoId; });
  return {
    stcg: pool && pool.stcgRate  != null ? pool.stcgRate  : parseFloat(localStorage.getItem('stcg')      || '15'),
    brok: pool && pool.brokerage != null ? pool.brokerage : parseFloat(localStorage.getItem('brokerage') || '0'),
  };
}

// Total net profit across a set of allotments, grouped by (ipo, category) so
// STCG and brokerage are applied per category exactly as the pool screen does.
// Each group is priced with its own IPO's finalized rates via ratesForIpo.
function groupNetProfit(allots) {
  var groups = {};
  allots.forEach(function(a) {
    var key = a.ipo + '|' + a.category;
    (groups[key] = groups[key] || []).push(a);
  });
  return Object.keys(groups).reduce(function(sum, k) {
    var r = ratesForIpo(groups[k][0].ipo);
    return sum + PoolMath.category(groups[k], r.stcg, r.brok).net;
  }, 0);
}

// ── Computed aggregates ───────────────────────────────────────────────────────

function computeKpis() {
  var allotted  = _allotments.filter(function(a){ return a.status === 'allotted'; });
  var totalNet   = groupNetProfit(_allotments);
  // Invested = capital actually deployed. Only allotted applications tie up money;
  // non-allotted ASBA applications are refunded, so they don't count.
  var invested   = allotted.reduce(function(s, a) {
    var ip = _ipos.find(function(i){ return i.id === a.ipo; });
    return s + (ip ? ip.lotValue : 0);
  }, 0);
  var pendingSettlements = _settlements.filter(function(s){ return s.status === 'Pending'; });
  var uniqueIpos = new Set(_allotments.map(function(a){ return a.ipo; })).size;
  return {
    applied:       uniqueIpos,
    applications:  _allotments.length,
    allotments:    allotted.length,
    allotRate:     _allotments.length > 0
                     ? +((allotted.length / _allotments.length * 100).toFixed(1))
                     : 0,
    invested:      invested,
    profit:        totalNet,
    roi:           invested > 0 ? +((totalNet / invested) * 100).toFixed(1) : 0,
    pending:       pendingSettlements.length,
    pendingAmount: pendingSettlements.reduce(function(s, p){ return s + (p.amount || 0); }, 0),
  };
}

function computeCharts() {
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Per-IPO profit breakdown (every IPO the pool applied to, newest first).
  // Net is summed per (ipo, category) via PoolMath so it matches the pool
  // screen and the settlement ledger exactly.
  var profitByIpo = _ipos
    .map(function(i) {
      var apps     = _allotments.filter(function(a){ return a.ipo === i.id; });
      var allotted = apps.filter(function(a){ return a.status === 'allotted'; });
      var gross    = allotted.reduce(function(s,a){ return s + a.gain; }, 0);
      return {
        id: i.id, name: i.name, short: i.short, type: i.type, status: i.status,
        applied: apps.length, allotted: allotted.length,
        gross: gross, net: groupNetProfit(apps),
        month: i.listDate || i.allotDate || i.close || i.open || null,
      };
    })
    .filter(function(p){ return p.applied > 0; });

  // Monthly profit trend: net profit bucketed by each IPO's listing month.
  // We emit a CONTIGUOUS run of the last 6 calendar months (zero-filling months
  // with no profit) so the chart always renders a real trend line instead of a
  // lone dot or an empty '—'. The window is anchored to the most recent month
  // that actually has profit, falling back to the current month when there's none.
  var byMonth = {};   // 'YYYY-MM' -> net profit
  profitByIpo.forEach(function(p) {
    if (!p.net || !p.month) return;
    byMonth[String(p.month).slice(0, 7)] = (byMonth[String(p.month).slice(0, 7)] || 0) + p.net;
  });
  var keys = Object.keys(byMonth).sort();
  var anchor = keys.length ? keys[keys.length - 1] : (new Date()).toISOString().slice(0, 7);
  var anchorYear  = parseInt(anchor.slice(0, 4), 10);
  var anchorMonth = parseInt(anchor.slice(5, 7), 10) - 1;   // 0-based
  var monthlyProfit = [];
  for (var back = 5; back >= 0; back--) {
    var d   = new Date(anchorYear, anchorMonth - back, 1);
    var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    monthlyProfit.push({ m: MONTHS[d.getMonth()], v: byMonth[key] || 0 });
  }

  // SME vs Mainboard — per-category nets grouped by board
  var smeNet  = groupNetProfit(_allotments.filter(function(a){ return a.category === 'SME'; }));
  var mainNet = groupNetProfit(_allotments.filter(function(a){ return a.category !== 'SME'; }));

  // Allotment history: last 6 IPOs the pool applied to, oldest → newest
  var allotHistory = profitByIpo.slice(0, 6).reverse().map(function(p) {
    return { m: p.short, applied: p.applied, allot: p.allotted };
  });

  return {
    monthlyProfit: monthlyProfit,
    smeVsMain:     { sme: smeNet, mainboard: mainNet },
    allotHistory:  allotHistory,
    profitByIpo:   profitByIpo,
  };
}

// Per-member profit totalled across EVERY IPO, ranked highest first. Reuses the
// same PoolMath.memberShares split the Profit Pool screen uses, and the same
// rate resolution (finalized pool rates when present, else the local defaults),
// so a member's leaderboard total equals the sum of their pool shares.
function computeMemberProfits() {
  var panToMember = function(panId) {
    var p = _pans.find(function(x){ return x.id === panId; });
    return p ? p.member : null;
  };

  var totals = {};   // memberId -> { profit, pans }
  _ipos.forEach(function(ipo) {
    var ipoAllots = _allotments.filter(function(a){ return a.ipo === ipo.id; });
    if (!ipoAllots.length) return;
    var r = ratesForIpo(ipo.id);

    var cats = {};
    ipoAllots.forEach(function(a){ (cats[a.category] = cats[a.category] || []).push(a); });
    Object.keys(cats).forEach(function(cat) {
      var shares = PoolMath.memberShares(cats[cat], r.stcg, r.brok, panToMember);
      Object.keys(shares).forEach(function(mid) {
        if (!totals[mid]) totals[mid] = { profit: 0, pans: 0 };
        totals[mid].profit += shares[mid].share;
        totals[mid].pans   += shares[mid].pans;
      });
    });
  });

  return _members.map(function(m) {
    var t = totals[m.id] || { profit: 0, pans: 0 };
    return { id: m.id, name: m.name, avatarHue: m.avatarHue, you: m.you,
             profit: Math.round(t.profit), pans: t.pans };
  }).sort(function(a, b){ return b.profit - a.profit; });
}

// Pools worth showing: a profit pool is only meaningful once at least one PAN is
// actually allotted. Marking an IPO's applicants all "not allotted" still upserts
// a pool row (so the screen can list it), which would otherwise surface as an
// empty "Distributing" pool with ₹0 to distribute. Filter those out everywhere
// the UI reads DB.pools. The raw _pools array is kept for internal rate lookups.
function activePools() {
  return _pools.filter(function(p) {
    return _allotments.some(function(a){ return a.ipo === p.ipo && a.status === 'allotted'; });
  });
}

// ── Main loader ───────────────────────────────────────────────────────────────

async function loadDB() {
  var sb = window.sb;

  // Resolve current user
  var userRes = await sb.auth.getUser();
  _currentUid = userRes.data.user ? userRes.data.user.id : null;

  // Fetch all tables in parallel
  var [membersRes, pansRes, iposRes, allotRes, poolsRes, settleRes] = await Promise.all([
    sb.from('members').select('*').order('name'),
    sb.from('pan_accounts').select('*').order('holder_name'),
    sb.from('ipos').select('*').order('open_date', { ascending: false }),
    sb.from('allotments').select('*, applications!inner(ipo_id, pan_id, category)'),
    sb.from('profit_pools').select('*'),
    sb.from('settlements').select('*, profit_pools!inner(ipo_id)').order('created_at', { ascending: false }),
  ]);

  // If ANY table failed, abort rather than render a confident but partial
  // picture (e.g. IPOs present but allotments silently empty). The caller
  // surfaces this and offers a retry.
  var failed = [membersRes, pansRes, iposRes, allotRes, poolsRes, settleRes]
    .filter(function(r){ return r.error; });
  if (failed.length) {
    failed.forEach(function(r){ console.error('[IPOPool DB]', r.error.message); });
    throw new Error(failed[0].error.message || 'Failed to load pool data.');
  }

  _members     = txMembers    (membersRes.data  || []);
  _pans        = txPans       (pansRes.data     || []);
  _ipos        = txIpos       (iposRes.data     || []);
  _allotments  = txAllotments (allotRes.data    || []);
  _pools       = txPools      (poolsRes.data    || []);
  _settlements = txSettlements(settleRes.data   || []);

  // The stored ipos.status is never advanced past its 'Upcoming' default, so
  // derive a live status from the IPO's dates and real activity instead.
  _ipos = _ipos.map(function(ipo) {
    return Object.assign({}, ipo, { status: deriveIpoStatus(ipo, _allotments, _pools) });
  });

  var charts = computeCharts();

  window.DB = {
    fmtINR:       fmtINR,
    initials:     initials,
    members:      _members,
    pans:         _pans,
    ipos:         _ipos,
    allotments:   _allotments,
    pools:        activePools(),
    settlements:  _settlements,
    kpis:         computeKpis(),
    monthlyProfit: charts.monthlyProfit,
    smeVsMain:    charts.smeVsMain,
    allotHistory: charts.allotHistory,
    profitByIpo:  charts.profitByIpo,
    memberProfits: computeMemberProfits(),

    me:     _members.find(function(m){ return m.you; }) || null,
    ipo:    function(id){ return _ipos.find(function(i){ return i.id === id; }); },
    member: function(id){ return _members.find(function(m){ return m.id === id; }); },
    pan:    function(id){ return _pans.find(function(p){ return p.id === id; }); },

    // ── Mutations ──────────────────────────────────────────────────────────────
    mutations: {

      // ─── Members ────────────────────────────────────────────────────────────
      async addMember(fields) {
        var { data, error } = await window.sb.from('members').insert({
          name:       fields.name,
          email:      fields.email      || null,
          phone:      fields.phone      || null,
          avatar_hue: fields.avatarHue  || Math.floor(Math.random() * 360),
          is_admin:   fields.isAdmin    || false,
        }).select().single();
        if (error) throw error;
        _members.push(txMembers([data])[0]);
        window.DB.members = _members;
        return txMembers([data])[0];
      },

      async deleteMember(id) {
        var { data, error } = await window.sb.from('members').delete().eq('id', id).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Delete failed — no rows removed (check admin permissions).');
        _members = _members.filter(function(m){ return m.id !== id; });
        window.DB.members = _members;
      },

      async updateMember(id, fields) {
        var { data, error } = await window.sb.from('members')
          .update({ name: fields.name, email: fields.email || null, phone: fields.phone || null })
          .eq('id', id).select().single();
        if (error) throw error;
        var idx = _members.findIndex(function(m){ return m.id === id; });
        if (idx !== -1) _members[idx] = Object.assign({}, _members[idx], txMembers([data])[0]);
        window.DB.members = _members;
        window.DB.me = _members.find(function(m){ return m.you; }) || null;
      },

      // ─── PANs ────────────────────────────────────────────────────────────────
      async addPan(fields) {
        var { data, error } = await window.sb.from('pan_accounts').insert({
          member_id:   fields.memberId,
          pan:         fields.pan.toUpperCase(),
          holder_name: fields.holderName,
          relation:    fields.relation  || 'Self',
          bank:        fields.bank      || null,
          status:      'Active',
        }).select().single();
        if (error) throw error;
        _pans.push(txPans([data])[0]);
        window.DB.pans = _pans;
        return txPans([data])[0];
      },

      async deletePan(id) {
        var { data, error } = await window.sb.from('pan_accounts').delete().eq('id', id).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Delete failed — no rows removed (check admin permissions).');
        _pans = _pans.filter(function(p){ return p.id !== id; });
        window.DB.pans = _pans;
      },

      async updatePan(id, fields) {
        var { data, error } = await window.sb.from('pan_accounts')
          .update({ holder_name: fields.holderName, relation: fields.relation || 'Self', bank: fields.bank || null, status: fields.status })
          .eq('id', id).select().single();
        if (error) throw error;
        var idx = _pans.findIndex(function(p){ return p.id === id; });
        if (idx !== -1) _pans[idx] = Object.assign({}, _pans[idx], txPans([data])[0]);
        window.DB.pans = _pans;
      },

      // ─── IPOs ────────────────────────────────────────────────────────────────
      async addIpo(fields) {
        var { data, error } = await window.sb.from('ipos').insert({
          name:          fields.name,
          short_name:    fields.shortName || fields.name.split(' ')[0],
          type:          fields.type,
          sector:        fields.sector    || null,
          status:        fields.status    || 'Upcoming',
          band_low:      fields.bandLow   || null,
          band_high:     fields.bandHigh  || null,
          lot_size:      fields.lotSize   || null,
          lot_value:     fields.lotValue  || null,
          open_date:     fields.openDate  || null,
          close_date:    fields.closeDate || null,
          allot_date:    fields.allotDate || null,
          list_date:     fields.listDate  || null,
          list_price:    fields.listPrice || null,
          list_gain_pct: fields.listGain  || null,
          subscription:  fields.sub       || null,
          hue:           fields.hue       || 220,
        }).select().single();
        if (error) throw error;
        var transformed = txIpos([data])[0];
        _ipos.unshift(transformed);
        window.DB.ipos = _ipos;
        return transformed;
      },

      async updateIpo(id, fields) {
        var updates = {};
        if (fields.name          != null) updates.name          = fields.name;
        if (fields.shortName     != null) updates.short_name    = fields.shortName;
        if (fields.type          != null) updates.type          = fields.type;
        if (fields.bandHigh      != null) updates.band_high     = fields.bandHigh;
        if (fields.lotSize       != null) updates.lot_size      = fields.lotSize;
        if (fields.status        != null) updates.status        = fields.status;
        if (fields.listPrice     != null) updates.list_price    = fields.listPrice;
        if (fields.listGain      != null) updates.list_gain_pct = fields.listGain;
        if (fields.subscription  != null) updates.subscription  = fields.subscription;
        // Dates: presence-based so any of them can be entered, corrected, or
        // cleared (empty → null). Only saveEditIpo calls updateIpo, and it always
        // sends these keys. ISO YYYY-MM-DD strings map straight to DATE columns.
        if ('openDate'  in fields) updates.open_date  = fields.openDate  || null;
        if ('closeDate' in fields) updates.close_date = fields.closeDate || null;
        if ('allotDate' in fields) updates.allot_date = fields.allotDate || null;
        if ('listDate'  in fields) updates.list_date  = fields.listDate  || null;
        var { data, error } = await window.sb.from('ipos').update(updates).eq('id', id).select().single();
        if (error) throw error;
        var t = txIpos([data])[0];
        _ipos = _ipos.map(function(i){ return i.id === id ? t : i; });
        window.DB.ipos = _ipos;
        return t;
      },

      async deleteIpo(id) {
        var { data, error } = await window.sb.from('ipos').delete().eq('id', id).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Delete failed — no rows removed (check admin permissions).');
        _ipos = _ipos.filter(function(i){ return i.id !== id; });
        window.DB.ipos = _ipos;
      },

      // ─── Allotments ──────────────────────────────────────────────────────────
      // Record who applied (before allotment results are known).
      // rows: [{ panId, category }]
      async addApplications(ipoId, rows) {
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var { data: app, error: appErr } = await window.sb.from('applications')
            .upsert(
              { ipo_id: ipoId, pan_id: row.panId, category: row.category, lots: row.lots || 1 },
              { onConflict: 'ipo_id,pan_id' }
            ).select().single();
          if (appErr) throw appErr;
          var { error: allotErr } = await window.sb.from('allotments')
            .upsert(
              { application_id: app.id, status: 'pending', shares: 0, gain: 0 },
              { onConflict: 'application_id' }
            );
          if (allotErr) throw allotErr;
        }
        await loadDB();
      },

      // rows: [{ panId, category, status, shares, gain }]
      async importAllotments(ipoId, rows) {
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          // Upsert application
          var { data: app, error: appErr } = await window.sb.from('applications')
            .upsert(
              { ipo_id: ipoId, pan_id: row.panId, category: row.category, lots: row.lots || 1 },
              { onConflict: 'ipo_id,pan_id' }
            ).select().single();
          if (appErr) throw appErr;

          // Upsert allotment
          var { error: allotErr } = await window.sb.from('allotments')
            .upsert(
              { application_id: app.id, status: row.status, shares: row.shares || 0, gain: row.gain || 0, checked_at: new Date().toISOString() },
              { onConflict: 'application_id' }
            );
          if (allotErr) throw allotErr;
        }

        // Ensure a profit_pool row exists for this IPO — but only if at least one
        // PAN was actually allotted. An all-"not allotted" import has nothing to
        // distribute, so it must not create an empty "Distributing" pool.
        if (rows.some(function(r){ return r.status === 'allotted'; })) {
          await window.sb.from('profit_pools')
            .upsert({ ipo_id: ipoId, status: 'Distributing' }, { onConflict: 'ipo_id' });
        }

        await loadDB();
      },

      // Save changed statuses for an IPO's allotments
      // changes: [{ id: allotmentId, status, shares, gain }]
      async saveAllotmentChanges(changes) {
        for (var i = 0; i < changes.length; i++) {
          var c = changes[i];
          var upd = { status: c.status, shares: c.shares || 0, gain: c.gain || 0, checked_at: new Date().toISOString() };
          if (c.sellPrice != null) upd.sell_price = c.sellPrice;
          var { data, error } = await window.sb.from('allotments').update(upd).eq('id', c.id).select();
          if (error) throw error;
          if (!data || data.length === 0) throw new Error('Save failed — no rows updated (check admin permissions).');
        }
        // Ensure a profit_pool row exists for each affected IPO so the Pool screen
        // can show it — but only when that IPO will have ≥1 allotted PAN after
        // this edit. Otherwise (e.g. all marked "not allotted") there is nothing
        // to distribute and we must not create an empty "Distributing" pool.
        var changeStatus = {};
        changes.forEach(function(c){ changeStatus[c.id] = c.status; });
        var ipoIds = new Set(changes.map(function(c) {
          var a = _allotments.find(function(x){ return x.id === c.id; });
          return a ? a.ipo : null;
        }).filter(Boolean));
        for (var ipoId of ipoIds) {
          var willHaveAllot = _allotments.some(function(a) {
            if (a.ipo !== ipoId) return false;
            var st = changeStatus[a.id] != null ? changeStatus[a.id] : a.status;
            return st === 'allotted';
          });
          if (willHaveAllot) {
            await window.sb.from('profit_pools')
              .upsert({ ipo_id: ipoId, status: 'Distributing' }, { onConflict: 'ipo_id' });
          }
        }
        await loadDB();
      },

      async removeApplicant(allotmentId) {
        var allot = _allotments.find(function(a) { return a.id === allotmentId; });
        if (!allot) throw new Error('Allotment not found');
        var { data: ad, error: ae } = await window.sb.from('allotments').delete().eq('id', allotmentId).select();
        if (ae) throw ae;
        if (!ad || ad.length === 0) throw new Error('Delete failed — no rows removed (check admin permissions).');
        var { data: apd, error: ape } = await window.sb.from('applications').delete().eq('id', allot.appId).select();
        if (ape) throw ape;
        if (!apd || apd.length === 0) throw new Error('Delete failed — no rows removed (check admin permissions).');
        await loadDB();
      },

      // ─── Settlements ─────────────────────────────────────────────────────────
      // Generate settlement rows for an IPO from the current pool math.
      // rows:  [{ memberId, category, pans, amount }]
      // rates: { stcgRate, brokerage } — captured on the pool so the ledger
      //        shows the same numbers on every device.
      // Already-Paid settlements are preserved: re-finalizing never resets a
      // payment back to Pending or changes its recorded amount/date.
      async createSettlements(ipoId, rows, rates) {
        // Upsert WITHOUT status: a fresh pool gets the column default
        // ('Distributing'), and re-finalizing never downgrades a Settled pool —
        // the real status is reconciled from the ledger rows at the end.
        var { data: poolData, error: poolErr } = await window.sb.from('profit_pools')
          .upsert({ ipo_id: ipoId }, { onConflict: 'ipo_id' })
          .select().single();
        if (poolErr) throw poolErr;
        var pool = txPools([poolData])[0];

        // Persist the rates used, so the ledger is identical on every device.
        // Best-effort: if migration 003 (stcg_rate/brokerage columns) hasn't
        // been applied yet, finalize still succeeds and falls back to local
        // settings for display.
        if (rates) {
          var { error: rateErr } = await window.sb.from('profit_pools')
            .update({ stcg_rate: rates.stcgRate, brokerage: rates.brokerage })
            .eq('id', pool.id);
          if (rateErr) console.warn('[IPOPool] pool rate columns missing — run migration 003:', rateErr.message);
        }

        // Which (member, category) settlements are already Paid — leave untouched.
        var { data: existing, error: exErr } = await window.sb.from('settlements')
          .select('id, member_id, category, status').eq('pool_id', pool.id);
        if (exErr) throw exErr;
        var paid = {};
        (existing || []).forEach(function(s) {
          if (s.status === 'Paid') paid[s.member_id + '|' + s.category] = true;
        });

        var newKeys = {};
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          newKeys[r.memberId + '|' + r.category] = true;
          if (paid[r.memberId + '|' + r.category]) continue;   // don't un-pay
          var { error } = await window.sb.from('settlements').upsert({
            pool_id:   pool.id,
            member_id: r.memberId,
            category:  r.category,
            pans:      r.pans,
            amount:    r.amount,
            status:    'Pending',
          }, { onConflict: 'pool_id,member_id,category' });
          if (error) throw error;
        }

        // Remove stale Pending rows no longer in the finalized set (e.g. a member
        // whose corrected allotment dropped their share to 0). Paid rows are kept.
        for (var j = 0; j < (existing || []).length; j++) {
          var ex = existing[j];
          if (ex.status === 'Paid') continue;
          if (newKeys[ex.member_id + '|' + ex.category]) continue;
          var { error: delErr } = await window.sb.from('settlements').delete().eq('id', ex.id);
          if (delErr) throw delErr;
        }

        // Reconcile the pool status from what the ledger actually holds now:
        // rows exist and every one is Paid → Settled, otherwise Distributing.
        var { data: after, error: afterErr } = await window.sb.from('settlements')
          .select('status').eq('pool_id', pool.id);
        if (!afterErr) {
          var allPaid = (after || []).length > 0 && after.every(function(s){ return s.status === 'Paid'; });
          await window.sb.from('profit_pools')
            .update({ status: allPaid ? 'Settled' : 'Distributing' }).eq('id', pool.id);
        }
        await loadDB();
      },

      async markSettlementPaid(settlementId) {
        var today = new Date().toISOString().slice(0, 10);
        var { data, error } = await window.sb.from('settlements')
          .update({ status: 'Paid', paid_date: today })
          .eq('id', settlementId).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Save failed — no rows updated (check admin permissions).');
        _settlements = _settlements.map(function(s) {
          return s.id === settlementId ? Object.assign({}, s, { status: 'Paid', date: today }) : s;
        });
        window.DB.settlements = _settlements;
        window.DB.kpis        = computeKpis();
      },

      async markPoolSettled(ipoId) {
        var pool = _pools.find(function(p){ return p.ipo === ipoId; });
        if (!pool) return;
        var { data, error } = await window.sb.from('profit_pools').update({ status: 'Settled' }).eq('id', pool.id).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Save failed — no rows updated (check admin permissions).');
        _pools = _pools.map(function(p){ return p.ipo === ipoId ? Object.assign({}, p, { status: 'Settled' }) : p; });
        window.DB.pools = activePools();
      },
    },
  };
}

window.loadDB = loadDB;

// Money formatter exposed globally so the anonymous member portal (which never
// runs loadDB, so has no window.DB) can format rupees the same way.
window.fmtINR = fmtINR;

// ── Member self-service API (PAN login, no Supabase session) ──────────────────
// Thin wrappers over the SECURITY DEFINER RPCs from migration 004. Available
// WITHOUT loadDB (members are anonymous and never load the full admin dataset).
window.MemberAPI = {
  login: async function (pan) {
    var res = await window.sb.rpc('member_login', { p_pan: pan });
    if (res.error) throw res.error;
    return res.data;   // { member_id, name, pans:[{id,holder,relation,pan_masked}] } or null
  },
  getApplyIpo: async function (ipoId) {
    var res = await window.sb.rpc('get_apply_ipo', { p_ipo: ipoId });
    if (res.error) throw res.error;
    return res.data;   // { id, name, short, type, status, band_*, lot_*, *_date } or null
  },
  submitApplications: async function (loginPan, ipoId, rows) {
    // rows: [{ pan_id, category, lots }]
    var res = await window.sb.rpc('submit_applications', { p_login_pan: loginPan, p_ipo: ipoId, p_rows: rows });
    if (res.error) throw res.error;
    return res.data;   // { ok:true, count:N }
  },
  summary: async function (loginPan) {
    var res = await window.sb.rpc('member_summary', { p_login_pan: loginPan });
    if (res.error) throw res.error;
    return res.data;   // { name, total_profit, paid_profit, pending_profit, ipos_applied, pans_applied, allotments, ipos:[...] }
  },
  myIpoApplications: async function (loginPan, ipoId) {
    var res = await window.sb.rpc('my_ipo_applications', { p_login_pan: loginPan, p_ipo: ipoId });
    if (res.error) throw res.error;
    return res.data || [];   // [{ pan_id, category, lots, allot_status }]
  },
};

})();
