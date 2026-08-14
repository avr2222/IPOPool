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
      upiId:      r.upi_id || '',
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
      // Lots the member said they applied for. Without this the admin cannot
      // see that an sHNI applied for 14 lots and has to retype every HNI share
      // count by hand.
      lots:      r.applications.lots || 1,
      status:    r.status,
      shares:    r.shares || 0,
      gain:      r.gain   || 0,
      // Capital actually tied up: the shares allotted at the cut-off price.
      // A flat "one lot" understated every HNI row (an sHNI allotted 14 lots
      // reported one), and multiplying lots applied would overstate a partial
      // allotment, since ASBA releases the unallotted portion. Falls back to
      // one lot's value when shares are not recorded yet.
      invest:    (r.shares > 0 && ipo && ipo.bandHigh)
                   ? Math.round(r.shares * ipo.bandHigh)
                   : (ipo ? (ipo.lotValue || 0) : 0),
      sellPrice: r.sell_price != null ? parseFloat(r.sell_price) : null,
    };
  });
}

function txPools(rows) {
  return rows.map(function(r) {
    return {
      id: r.id, ipo: r.ipo_id, status: r.status,
      stcgRate:  r.stcg_rate  != null ? parseFloat(r.stcg_rate)  : null,
      brokerage: r.brokerage  != null ? parseFloat(r.brokerage)  : null,
      bonusRate: r.bonus_rate != null ? parseFloat(r.bonus_rate) : null,
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

// Realised gain for a single allotment row, and the one place that decides it.
//
// Two rules, both learned the hard way:
//  1. A row that is not `allotted` has no gain. The admin flow is "✓ All got"
//     (which fills a sell price on every row) followed by correcting the few
//     PANs that missed out — so a stale sell price left on a "✗" row used to
//     keep producing profit and was distributed to every member.
//  2. The result is NOT clamped at zero. A listing below the issue price is a
//     real loss and has to be visible; flooring it here would report a genuine
//     loss as "no profit". The floor belongs on the pool's distributable net
//     (PoolMath.category), not on the truth of what a PAN actually made.
function rowGain(status, sellPrice, issuePrice, shares) {
  if (status !== 'allotted') return 0;
  var sp = parseFloat(sellPrice)  || 0;
  var ip = parseFloat(issuePrice) || 0;
  var sh = parseInt(shares, 10)   || 0;
  if (sp <= 0 || ip <= 0 || sh <= 0) return 0;
  return Math.round((sp - ip) * sh);
}
window.rowGain = rowGain;

// Parse allotment results pasted from a registrar, so the admin stops typing
// every row by hand on listing day.
//
// One row per line: the PAN somewhere in the line, and the share count. Any of
// comma / tab / semicolon / pipe / whitespace separates them, since what comes
// off a registrar site or a spreadsheet varies. Lines without a PAN-shaped
// token (5 letters, 4 digits, 1 letter) are ignored, which drops headers and
// blurb without the admin having to clean the text up first. A missing or zero
// share count means "not allotted" — that is the registrar's own convention.
//
// Returns { rows: [{ pan, shares }], skipped: [line] } and never throws; the
// caller previews it before anything is written.
function parseAllotmentPaste(text) {
  var PAN_RE = /\b([A-Z]{5}[0-9]{4}[A-Z])\b/i;
  var rows = [], skipped = [], seen = {};
  String(text || '').split(/\r?\n/).forEach(function(line) {
    var raw = line.trim();
    if (!raw) return;
    var m = raw.match(PAN_RE);
    if (!m) { skipped.push(raw); return; }
    var pan = m[1].toUpperCase();
    // Share count. Strip thousands separators first (1,200 is one number, not
    // two), then prefer a number AFTER the PAN — registrar rows read
    // "<name> <PAN> <shares>", and a leading serial number or date would
    // otherwise win. Fall back to a number before the PAN.
    var norm = function(s) { return s.replace(/(\d),(?=\d\d\d\b)/g, '$1').replace(/[,\t;|]/g, ' '); };
    var after  = norm(raw.slice(m.index + m[1].length)).match(/\d+/);
    var before = norm(raw.slice(0, m.index)).match(/\d+/);
    var num = after || before;
    var shares = num ? parseInt(num[0], 10) : 0;
    if (isNaN(shares) || shares < 0) shares = 0;
    if (seen[pan]) { skipped.push(raw); return; }   // first mention wins
    seen[pan] = true;
    rows.push({ pan: pan, shares: shares });
  });
  return { rows: rows, skipped: skipped };
}
window.parseAllotmentPaste = parseAllotmentPaste;

// Price of one lot = lot size × cut-off price. Derived in the db layer rather
// than in the form, because the form forgetting to send it is exactly how
// lot_value stayed NULL on every IPO and left the dashboard reporting a total
// investment of ₹0 and 0% ROI. Mirrors the fallback buildApplyMessage uses.
function deriveLotValue(lotSize, bandHigh) {
  var ls = parseFloat(lotSize)  || 0;
  var bh = parseFloat(bandHigh) || 0;
  return ls > 0 && bh > 0 ? Math.round(ls * bh) : null;
}
window.deriveLotValue = deriveLotValue;

// ── Shared pool math (single source of truth for profit distribution) ─────────
// Every screen that splits profit — dashboard KPIs, charts, the Profit Pool
// screen and the Settlement ledger — goes through PoolMath so the numbers
// always agree. Net profit is split equally per PAN applied; the rounding
// remainder is distributed one rupee at a time so member shares sum EXACTLY
// to the category's net profit (no unallocated/over-allocated paise).
var PoolMath = {
  // Base math for one category's allotments (same IPO, same category).
  //
  // `gross` counts ONLY allotted rows — an application that got nothing cannot
  // contribute profit. `total` deliberately counts EVERY applicant, allotted or
  // not: pooling exists so the winners' profit is split across everyone who
  // applied. That asymmetry is the point of the pool, not a bug.
  // bonusRate is optional (defaults to 0, i.e. today's behaviour exactly) —
  // an admin-set % kept personally by whoever was allotted, on top of their
  // normal equal pool share. See the "afterTax"/"bonusTotal" comment below.
  category: function(catAllots, stcgRate, brokerageAmt, bonusRate) {
    var gross     = catAllots.reduce(function(s, a){
      return a.status === 'allotted' ? s + (a.gain || 0) : s;
    }, 0);
    // No tax on a loss-making pool.
    var stcgAmt   = gross > 0 ? Math.round(gross * stcgRate / 100) : 0;
    var afterTax  = gross - stcgAmt;
    // The allotted-PAN bonus is carved out of the AGGREGATE after-tax amount
    // (not recomputed per PAN from scratch) so bonusRate=0 reproduces today's
    // net to the rupee, with zero rounding drift. panBonuses below then
    // divides bonusTotal back among allotted PANs pro-rata by their own gain
    // -- the same "distribute a shared total by individual contribution"
    // technique brokerageByCategory already uses, just one level deeper.
    // Guarded on afterTax > 0, so a loss-making category never carves out a
    // bonus -- the allotted-PAN bonus is profit-only by construction.
    var bonusTotal = (bonusRate > 0 && afterTax > 0) ? Math.round(afterTax * bonusRate / 100) : 0;
    // A LOSS is distributed exactly like a profit: split evenly across every
    // applicant (see perPan/remainder below), same as a positive net. Nobody
    // gets an extra bonus cut out of it (bonusTotal is already 0 whenever
    // afterTax <= 0, see above) -- only the equal split applies to a loss.
    var net       = afterTax - bonusTotal - brokerageAmt;
    var total     = catAllots.length;
    var perPan    = total > 0 ? Math.floor(net / total) : 0;
    var remainder = net - perPan * total;   // integer rupees, 0 .. total-1
    var allotted  = catAllots.filter(function(a){ return a.status === 'allotted'; }).length;
    return { gross: gross, stcgAmt: stcgAmt, afterTax: afterTax, bonusTotal: bonusTotal,
             net: net, total: total, perPan: perPan, remainder: remainder, allotted: allotted };
  },

  // Amount per PAN with the remainder distributed deterministically:
  // the first `remainder` PANs (sorted by id) each get one extra rupee.
  panAmounts: function(catAllots, stcgRate, brokerageAmt, bonusRate) {
    var m = this.category(catAllots, stcgRate, brokerageAmt, bonusRate);
    var sorted = catAllots.slice().sort(function(a, b){ return String(a.id).localeCompare(String(b.id)); });
    var out = {};
    for (var i = 0; i < sorted.length; i++) {
      out[sorted[i].id] = m.perPan + (i < m.remainder ? 1 : 0);
    }
    return out;
  },

  // Aggregate per-PAN amounts by member. panToMember(panId) -> memberId | null.
  // Returns { [memberId]: { pans, share } } where the shares sum to net.
  // This is the equal POOL share only — it does NOT include a PAN's personal
  // allotted-PAN bonus; see panBonuses/memberBonuses for that, added on top.
  memberShares: function(catAllots, stcgRate, brokerageAmt, panToMember, bonusRate) {
    var amounts = this.panAmounts(catAllots, stcgRate, brokerageAmt, bonusRate);
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

  // Each ALLOTTED PAN's personal share of the category's bonusTotal, pro-rata
  // by their own gain -- someone whose gain was twice another's gets twice the
  // bonus. The last (by id, for determinism) allotted PAN absorbs the
  // rounding remainder, same pattern as brokerageByCategory. Non-allotted
  // PANs, and PANs with a zero/negative gain, get 0 -- there is nothing of
  // theirs to reward.
  panBonuses: function(catAllots, stcgRate, brokerageAmt, bonusRate) {
    var m = this.category(catAllots, stcgRate, brokerageAmt, bonusRate);
    var out = {};
    catAllots.forEach(function(a){ out[a.id] = 0; });
    if (m.bonusTotal <= 0 || m.gross <= 0) return out;
    var eligible = catAllots.filter(function(a){ return a.status === 'allotted' && (a.gain || 0) > 0; });
    var sorted = eligible.slice().sort(function(a, b){ return String(a.id).localeCompare(String(b.id)); });
    var assigned = 0;
    sorted.forEach(function(a, i) {
      var share = (i === sorted.length - 1)
        ? m.bonusTotal - assigned
        : Math.round(m.bonusTotal * (a.gain || 0) / m.gross);
      out[a.id] = share;
      assigned += share;
    });
    return out;
  },

  // Aggregate panBonuses by member -- the personal bonus a member should
  // receive ON TOP OF their memberShares pool share (added, never substituted).
  memberBonuses: function(catAllots, stcgRate, brokerageAmt, bonusRate, panToMember) {
    var amounts = this.panBonuses(catAllots, stcgRate, brokerageAmt, bonusRate);
    var out = {};
    catAllots.forEach(function(a) {
      var mid = panToMember(a.pan);
      if (mid == null) return;
      out[mid] = (out[mid] || 0) + (amounts[a.id] || 0);
    });
    return out;
  },
};
window.PoolMath = PoolMath;
// groupNetProfit is exported below, once it is defined.

// Rate resolution used by EVERY profit aggregate. Once a pool is finalized it
// carries the STCG/brokerage rates used at that moment, so the dashboard, ledger
// and leaderboard must all price a pool's profit with those captured rates.
// Unfinalized pools (no row / null rates) fall back to the current local
// settings, matching the Profit Pool screen's pre-finalize preview.
function ratesForIpo(ipoId) {
  var pool = _pools.find(function(p){ return p.ipo === ipoId; });
  return {
    stcg:  pool && pool.stcgRate  != null ? pool.stcgRate  : parseFloat(localStorage.getItem('stcg')       || '15'),
    brok:  pool && pool.brokerage != null ? pool.brokerage : parseFloat(localStorage.getItem('brokerage')  || '0'),
    bonus: pool && pool.bonusRate != null ? pool.bonusRate : parseFloat(localStorage.getItem('allotBonus') || '0'),
  };
}

// Brokerage is ONE flat charge per IPO — Settings calls it "flat amount
// deducted per IPO sell" — but profit is pooled per category. The flat amount
// used to be handed to every category in full, so a Mainboard IPO with Retail,
// sHNI and bHNI paid it three times over.
//
// Splitting it pro-rata by each category's gross deducts it exactly once,
// whatever the category count, and charges it where the money actually was.
// The parts sum EXACTLY to the flat amount: the last category absorbs the
// rounding, the same technique panAmounts uses for per-PAN remainders.
function brokerageByCategory(ipoId, brokerageAmt) {
  var brok  = Number(brokerageAmt) || 0;
  var gross = {};
  _allotments.forEach(function(a) {
    if (a.ipo !== ipoId) return;
    if (gross[a.category] == null) gross[a.category] = 0;
    if (a.status === 'allotted') gross[a.category] += (a.gain || 0);
  });

  var cats = Object.keys(gross);
  var out  = {};
  if (!cats.length) return out;

  // Only categories that actually made money can carry a share of the charge.
  // If none did, spread it evenly — every net floors at 0 either way.
  var basis = cats.filter(function(c){ return gross[c] > 0; });
  if (!basis.length) basis = cats;

  var totalGross = basis.reduce(function(s, c){ return s + Math.max(0, gross[c]); }, 0);
  var assigned   = 0;
  basis.forEach(function(c, i) {
    var share = (i === basis.length - 1)
      ? brok - assigned
      : (totalGross > 0 ? Math.round(brok * gross[c] / totalGross)
                        : Math.floor(brok / basis.length));
    out[c]   = share;
    assigned += share;
  });
  cats.forEach(function(c){ if (out[c] == null) out[c] = 0; });
  return out;
}

// Rates to price ONE category of one IPO: that IPO's STCG rate, plus this
// category's share of its single flat brokerage charge. Every per-category
// PoolMath call should resolve its rates through here rather than passing the
// raw flat brokerage, which is what caused the multiple-charge bug.
//
// bonus (the allotted-PAN bonus %) is passed through unchanged, not split like
// brokerage: it is a PERCENTAGE applied to each category's own after-tax
// gross, not a flat rupee amount shared across categories, so there is
// nothing to divide.
function ratesForCategory(ipoId, category) {
  var r = ratesForIpo(ipoId);
  return { stcg: r.stcg, brok: brokerageByCategory(ipoId, r.brok)[category] || 0, bonus: r.bonus };
}

// Total REALISED profit across a set of allotments, grouped by (ipo,
// category) so STCG and brokerage are applied per category exactly as the
// pool screen does. Each group is priced with its own IPO's finalized rates
// via ratesForCategory.
//
// This is net + bonusTotal, not just net: the allotted-PAN bonus doesn't
// leave the family, it's just paid directly to whoever was allotted instead
// of flowing through the equal pool split. Summing only `net` here would
// make "Total Profit" silently shrink by every bonus paid out, understating
// what the family actually earned by the exact amount that went straight to
// allottees instead of through the pool.
function groupNetProfit(allots) {
  var groups = {};
  allots.forEach(function(a) {
    var key = a.ipo + '|' + a.category;
    (groups[key] = groups[key] || []).push(a);
  });
  return Object.keys(groups).reduce(function(sum, k) {
    var head = groups[k][0];
    var r = ratesForCategory(head.ipo, head.category);
    var m = PoolMath.category(groups[k], r.stcg, r.brok, r.bonus);
    return sum + m.net + m.bonusTotal;
  }, 0);
}
window.groupNetProfit     = groupNetProfit;
window.ratesForIpo        = ratesForIpo;
window.ratesForCategory   = ratesForCategory;
window.brokerageByCategory = brokerageByCategory;

// ── Computed aggregates ───────────────────────────────────────────────────────

function computeKpis() {
  var allotted  = _allotments.filter(function(a){ return a.status === 'allotted'; });
  var totalNet   = groupNetProfit(_allotments);
  // Invested = capital actually deployed. Only allotted applications tie up money;
  // non-allotted ASBA applications are refunded, so they don't count. Uses the
  // row's own invest (shares x cut-off price) rather than a flat lot value, so
  // an HNI allotted 14 lots is not counted as one.
  var invested   = allotted.reduce(function(s, a){ return s + (a.invest || 0); }, 0);
  var pendingSettlements = _settlements.filter(function(s){ return s.status === 'Pending'; });
  // Counts are IPO-level, not PAN-level: an IPO counts as "applied" if any PAN
  // applied to it, and as "allotted" if at least one PAN got an allotment there.
  var appliedIpos  = new Set(_allotments.map(function(a){ return a.ipo; }));
  var allottedIpos = new Set(allotted.map(function(a){ return a.ipo; }));
  return {
    applied:       appliedIpos.size,
    applications:  _allotments.length,
    allotments:    allottedIpos.size,
    allotmentRows: allotted.length,
    allotRate:     appliedIpos.size > 0
                     ? +((allottedIpos.size / appliedIpos.size * 100).toFixed(1))
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

// Per-category breakdown (Retail / sHNI / bHNI / SME) across every IPO, for the
// dashboard's category charts and report. Same PoolMath net as everywhere else
// (grouped per ipo+category via groupNetProfit), so the category nets sum to the
// pool's total profit. Only categories with at least one application appear.
function computeCategoryStats() {
  var CATS = ['Retail', 'sHNI', 'bHNI', 'SME'];
  return CATS.map(function(cat) {
    var apps     = _allotments.filter(function(a){ return a.category === cat; });
    var allotted = apps.filter(function(a){ return a.status === 'allotted'; });
    var ipos     = new Set(apps.map(function(a){ return a.ipo; }));
    var gross    = allotted.reduce(function(s, a){ return s + (a.gain || 0); }, 0);
    var invested = allotted.reduce(function(s, a){ return s + (a.invest || 0); }, 0);
    var net = groupNetProfit(apps);
    return {
      cat:      cat,
      ipos:     ipos.size,
      applied:  apps.length,
      allotted: allotted.length,
      allotRate: apps.length > 0 ? +((allotted.length / apps.length) * 100).toFixed(1) : 0,
      gross:    gross,
      net:      net,
      invested: invested,
      roi:      invested > 0 ? +(((net) / invested) * 100).toFixed(1) : 0,
    };
  }).filter(function(c){ return c.applied > 0; });
}

// Per-member profit totalled across EVERY IPO, ranked highest first. Reuses the
// same PoolMath.memberShares split the Profit Pool screen uses, and the same
// rate resolution (finalized pool rates when present, else the local defaults),
// so a member's leaderboard total equals the sum of their pool shares --
// PLUS their personal allotted-PAN bonus (memberBonuses), since that money is
// theirs too, just paid outside the equal pool split.
function computeMemberProfits() {
  var panToMember = function(panId) {
    var p = _pans.find(function(x){ return x.id === panId; });
    return p ? p.member : null;
  };

  var totals = {};   // memberId -> { profit, pans }
  _ipos.forEach(function(ipo) {
    var ipoAllots = _allotments.filter(function(a){ return a.ipo === ipo.id; });
    if (!ipoAllots.length) return;

    var cats = {};
    ipoAllots.forEach(function(a){ (cats[a.category] = cats[a.category] || []).push(a); });
    Object.keys(cats).forEach(function(cat) {
      var r = ratesForCategory(ipo.id, cat);
      var shares  = PoolMath.memberShares(cats[cat], r.stcg, r.brok, panToMember, r.bonus);
      var bonuses = PoolMath.memberBonuses(cats[cat], r.stcg, r.brok, r.bonus, panToMember);
      Object.keys(shares).forEach(function(mid) {
        if (!totals[mid]) totals[mid] = { profit: 0, pans: 0 };
        totals[mid].profit += shares[mid].share;
        totals[mid].pans   += shares[mid].pans;
      });
      Object.keys(bonuses).forEach(function(mid) {
        if (!totals[mid]) totals[mid] = { profit: 0, pans: 0 };
        totals[mid].profit += bonuses[mid];
      });
    });
  });

  return _members.map(function(m) {
    var t = totals[m.id] || { profit: 0, pans: 0 };
    return { id: m.id, name: m.name, avatarHue: m.avatarHue, you: m.you,
             profit: Math.round(t.profit), pans: t.pans };
  }).sort(function(a, b){ return b.profit - a.profit; });
}

// Same leaderboard, one row per PAN instead of rolled up by family/member --
// lets the admin see exactly which PAN is carrying a member's total (relevant
// once the allotted-PAN bonus makes individual PANs earn different amounts
// within the same family). Reuses the identical per-category math as
// computeMemberProfits, just keyed by PAN id instead of aggregated by member.
function computePanProfits() {
  var totals = {};   // panId -> { profit, apps }
  _ipos.forEach(function(ipo) {
    var ipoAllots = _allotments.filter(function(a){ return a.ipo === ipo.id; });
    if (!ipoAllots.length) return;

    var cats = {};
    ipoAllots.forEach(function(a){ (cats[a.category] = cats[a.category] || []).push(a); });
    Object.keys(cats).forEach(function(cat) {
      var r = ratesForCategory(ipo.id, cat);
      var amounts = PoolMath.panAmounts(cats[cat], r.stcg, r.brok, r.bonus);
      var bonuses = PoolMath.panBonuses(cats[cat], r.stcg, r.brok, r.bonus);
      cats[cat].forEach(function(a) {
        if (!totals[a.id]) totals[a.id] = { profit: 0, apps: 0 };
        totals[a.id].profit += (amounts[a.id] || 0) + (bonuses[a.id] || 0);
        totals[a.id].apps++;
      });
    });
  });

  return _pans.map(function(p) {
    var t = totals[p.id] || { profit: 0, apps: 0 };
    var m = _members.find(function(x){ return x.id === p.member; });
    return { id: p.id, pan: p.pan, holder: p.holder, memberName: m ? m.name : '',
             avatarHue: m ? m.avatarHue : 200, you: !!(m && m.you),
             profit: Math.round(t.profit), apps: t.apps };
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
    sb.from('allotments').select('*, applications!inner(ipo_id, pan_id, category, lots)'),
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
    categoryStats: computeCategoryStats(),
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
          upi_id:     fields.upiId       || null,
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
          .update({ name: fields.name, email: fields.email || null, phone: fields.phone || null, upi_id: fields.upiId || null })
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
          lot_value:     fields.lotValue  || deriveLotValue(fields.lotSize, fields.bandHigh),
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
        // Keep lot_value in step with its two inputs, so correcting a price or
        // lot size on an existing IPO also repairs invested/ROI.
        if (fields.lotValue != null) {
          updates.lot_value = fields.lotValue;
        } else if (fields.lotSize != null || fields.bandHigh != null) {
          var cur = _ipos.find(function(i){ return i.id === id; }) || {};
          var lv  = deriveLotValue(fields.lotSize  != null ? fields.lotSize  : cur.lotSize,
                                   fields.bandHigh != null ? fields.bandHigh : cur.bandHigh);
          if (lv != null) updates.lot_value = lv;
        }
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
          // Category lives on the application, not the allotment — update it there
          // when the admin re-categorised the applicant (e.g. Retail → sHNI).
          if (c.category != null && c.appId) {
            var prev = _allotments.find(function(x){ return x.id === c.id; });
            if (!prev || prev.category !== c.category) {
              var catRes = await window.sb.from('applications').update({ category: c.category }).eq('id', c.appId).select();
              if (catRes.error) throw catRes.error;
              if (!catRes.data || catRes.data.length === 0) throw new Error('Save failed — no rows updated (check admin permissions).');
            }
          }
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
        // Best-effort: if migration 003/009 (stcg_rate/brokerage/bonus_rate
        // columns) hasn't been applied yet, finalize still succeeds and falls
        // back to local settings for display.
        if (rates) {
          var { error: rateErr } = await window.sb.from('profit_pools')
            .update({ stcg_rate: rates.stcgRate, brokerage: rates.brokerage, bonus_rate: rates.bonusRate })
            .eq('id', pool.id);
          if (rateErr) console.warn('[IPOPool] pool rate columns missing — run migrations 003/009:', rateErr.message);
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

  // Every mutation already ends by calling loadDB() itself, so the admin who
  // just made a change already sees fresh data through a normal re-render --
  // no remount needed. Mark when that happens so the realtime listener (whose
  // job is to catch changes made on OTHER devices) can skip the redundant,
  // visually jarring full-screen remount it would otherwise trigger for the
  // very client that just wrote the data. A multi-row save (e.g. bulk
  // allotment edits) fires one realtime event per row, each far enough apart
  // to dodge the short debounce below, so without this every row previously
  // meant one more flicker.
  Object.keys(window.DB.mutations).forEach(function(name) {
    var orig = window.DB.mutations[name];
    window.DB.mutations[name] = function() {
      window.__lastLocalWriteAt = Date.now();
      var result = orig.apply(this, arguments);
      if (result && typeof result.then === 'function') {
        result.then(function(){ window.__lastLocalWriteAt = Date.now(); }, function(){});
      }
      return result;
    };
  });
}

window.loadDB = loadDB;

// Money formatter exposed globally so the anonymous member portal (which never
// runs loadDB, so has no window.DB) can format rupees the same way.
window.fmtINR = fmtINR;

// ── Settlement payment helpers ────────────────────────────────────────────────
// Build a UPI deep link (upi://pay?...) that pre-fills the payee VPA, name,
// amount and note. Opens GPay / PhonePe / Paytm etc. on a phone. `am` is omitted
// for non-positive amounts (some apps reject am=0). Every value is URL-encoded.
function buildUpiUri(opts) {
  opts = opts || {};
  var vpa = (opts.vpa || '').trim();
  if (!vpa) return '';
  var parts = ['pa=' + encodeURIComponent(vpa)];
  if (opts.name) parts.push('pn=' + encodeURIComponent(opts.name));
  var amt = Number(opts.amount);
  if (amt > 0) parts.push('am=' + encodeURIComponent(amt.toFixed(2)));
  parts.push('cu=INR');
  if (opts.note) parts.push('tn=' + encodeURIComponent(opts.note));
  return 'upi://pay?' + parts.join('&');
}

// Build a WhatsApp click-to-chat link for a phone number with a prefilled text.
// Keeps only digits; assumes a 10-digit Indian number gets a 91 country code.
function waReminder(phone, text) {
  var digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) digits = '91' + digits;
  return 'https://wa.me/' + digits + (text ? '?text=' + encodeURIComponent(text) : '');
}

window.buildUpiUri = buildUpiUri;
window.waReminder  = waReminder;

// ── Apply-link share message ──────────────────────────────────────────────────
// Smallest lots that qualify for a category, given one lot's value (lot_size ×
// cut-off price). Kept here so the admin share message and the member apply
// form agree on the numbers.
//
// Mainboard: Retail has no floor (1 lot); the NII entry (sHNI) and the sHNI/bHNI
// split are both VALUE-based — the fewest lots whose combined value crosses the
// SEBI rupee floor for that bucket.
//
// SME, since SEBI's ICDR amendment effective 1 Jul 2025: the Individual/NII
// boundary is a FIXED LOT COUNT, not value-based. Individual (formerly "Retail
// Individual Investor") applications are capped at 2 lots; 3 lots or more is
// NII regardless of what that comes to in rupees. The bHNI split above NII stays
// value-based (₹10L) on both boards — max() with the value floor covers the
// edge case where a low lot value would otherwise cross ₹10L before 3 lots.
var APPLY_CAT_FLOOR = { sHNI: 200000, bHNI: 1000000 };
var SME_NII_MIN_LOTS       = 3;  // SEBI: SME NII applications are 3 lots or more
var SME_INDIVIDUAL_MAX_LOTS = 2; // SEBI: SME Individual Investors apply for up to 2 lots
function catMinLots(cat, lotValue, isSME) {
  if (cat === 'Retail' || cat === 'SME') return 1;
  var valueFloor = function(rupees) {
    return lotValue ? Math.floor(rupees / lotValue) + 1 : 1;
  };
  if (cat === 'sHNI') {
    var floor = valueFloor(APPLY_CAT_FLOOR.sHNI);
    return isSME ? Math.max(SME_NII_MIN_LOTS, floor) : floor;
  }
  if (cat === 'bHNI') return valueFloor(APPLY_CAT_FLOOR.bHNI);
  return 1;
}

// Build the ready-to-send message the admin copies for an IPO: the IPO name,
// price/lot, the number of lots + shares to apply per category (Retail/Individual,
// sHNI, bHNI — same three-way split for SME as Mainboard since SEBI's 1 Jul 2025
// SME rule), and the apply deep link.
function buildApplyMessage(ip) {
  if (!ip) return '';
  var url      = window.applyLinkFor ? window.applyLinkFor(ip.id) : '';
  var name     = ip.name || ip.short || 'IPO';
  var isSME    = ip.type === 'SME';
  var lotSize  = Number(ip.lotSize)  || 0;
  var price    = Number(ip.bandHigh) || 0;
  var lotValue = Number(ip.lotValue) || (lotSize * price) || 0;
  var nf = function (n) { return Number(n).toLocaleString('en-IN'); };

  var lines = [];
  lines.push('📈 ' + name + (ip.type ? ' · ' + ip.type : ''));
  if (price)   lines.push('Price ₹' + nf(price) + (lotSize ? ' · 1 lot = ' + nf(lotSize) + ' shares' : ''));
  lines.push('');

  lines.push('How many to apply per category:');
  ['Retail', 'sHNI', 'bHNI'].forEach(function (cat) {
    var isSmeRetail = isSME && cat === 'Retail';
    // SME's Individual bucket is a fixed 2 lots (SEBI), not a 1-lot floor with
    // no ceiling like Mainboard Retail — show the actual application size, not
    // a misleading 1-lot minimum that wouldn't even cross the ₹2L requirement.
    var m      = isSmeRetail ? SME_INDIVIDUAL_MAX_LOTS : catMinLots(cat, lotValue, isSME);
    var shares = m * lotSize;
    var amt    = m * lotValue;
    var label  = isSmeRetail ? 'Individual' : cat;
    var lotsNote = isSmeRetail ? m + ' lots (fixed)' : m + ' lot' + (m === 1 ? '' : 's');
    lines.push('• ' + label + ' — ' + lotsNote
      + (lotSize ? ' · ' + nf(shares) + ' shares' : '')
      + (amt ? ' (' + fmtINR(amt, { compact: true }) + ')' : ''));
  });
  lines.push('');
  lines.push('👉 Once you apply in your Demat, open this link and fill in your application details:');
  lines.push(url);
  // Members had no way back into the app once an apply link went stale, so
  // hand them a bookmarkable link to their own profits every time.
  if (window.memberHomeLink) {
    lines.push('');
    lines.push('💰 Check your profits any time: ' + window.memberHomeLink());
  }
  return lines.join('\n');
}

window.catMinLots            = catMinLots;
window.SME_INDIVIDUAL_MAX_LOTS = SME_INDIVIDUAL_MAX_LOTS;
window.SME_NII_MIN_LOTS        = SME_NII_MIN_LOTS;
window.buildApplyMessage = buildApplyMessage;

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
  ipoApplicants: async function (loginPan, ipoId) {
    var res = await window.sb.rpc('ipo_applicants', { p_login_pan: loginPan, p_ipo: ipoId });
    if (res.error) throw res.error;
    return res.data || [];   // [{ pan_id, holder, pan_masked, member_name, category, lots, status, shares, sell_price, gain }]
  },
};

})();
