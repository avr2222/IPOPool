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
    };
  });
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
    return { id: r.id, ipo: r.ipo_id, status: r.status };
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

// ── Computed aggregates ───────────────────────────────────────────────────────

function computeKpis() {
  var allotted  = _allotments.filter(function(a){ return a.status === 'allotted'; });
  var stcgRate  = parseFloat(localStorage.getItem('stcg')      || '15');
  var brok      = parseFloat(localStorage.getItem('brokerage') || '0');
  var totalGross = allotted.reduce(function(s,a){ return s + a.gain; }, 0);
  var totalNet   = Math.max(0, totalGross - Math.round(totalGross * stcgRate / 100) - brok);
  var invested   = _allotments.reduce(function(s, a) {
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
  var stcgRate = parseFloat(localStorage.getItem('stcg')      || '15');
  var brok     = parseFloat(localStorage.getItem('brokerage') || '0');

  // Monthly profit trend from paid settlements
  var byMonth = {};
  _settlements.filter(function(s){ return s.status === 'Paid' && s.date; })
    .forEach(function(s) {
      var m = s.date.slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + s.amount;
    });
  var months = Object.keys(byMonth).sort().slice(-7);
  var monthlyProfit = months.length
    ? months.map(function(m){ return { label: m.slice(5), value: byMonth[m] }; })
    : [{ label: '—', value: 0 }];

  // SME vs Mainboard
  function netOf(gain) { return Math.max(0, gain - Math.round(gain * stcgRate / 100) - brok); }
  var smeGross  = _allotments.filter(function(a){ return a.status === 'allotted' && a.category === 'SME'; })
                              .reduce(function(s,a){ return s + a.gain; }, 0);
  var mainGross = _allotments.filter(function(a){ return a.status === 'allotted' && a.category !== 'SME'; })
                              .reduce(function(s,a){ return s + a.gain; }, 0);

  // Allotment history (last 6 closed/listed IPOs)
  var allotHistory = _ipos
    .filter(function(i){ return i.status === 'Listed' || i.status === 'Closed'; })
    .slice(0, 6)
    .map(function(i) {
      return {
        label:   i.short,
        applied: _allotments.filter(function(a){ return a.ipo === i.id; }).length,
        allot:   _allotments.filter(function(a){ return a.ipo === i.id && a.status === 'allotted'; }).length,
      };
    });

  return {
    monthlyProfit: monthlyProfit,
    smeVsMain:     { sme: netOf(smeGross), mainboard: netOf(mainGross) },
    allotHistory:  allotHistory,
  };
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

  [membersRes, pansRes, iposRes, allotRes, poolsRes, settleRes].forEach(function(r) {
    if (r.error) console.error('[IPOPool DB]', r.error.message);
  });

  _members     = txMembers    (membersRes.data  || []);
  _pans        = txPans       (pansRes.data     || []);
  _ipos        = txIpos       (iposRes.data     || []);
  _allotments  = txAllotments (allotRes.data    || []);
  _pools       = txPools      (poolsRes.data    || []);
  _settlements = txSettlements(settleRes.data   || []);

  var charts = computeCharts();

  window.DB = {
    fmtINR:       fmtINR,
    initials:     initials,
    members:      _members,
    pans:         _pans,
    ipos:         _ipos,
    allotments:   _allotments,
    pools:        _pools,
    settlements:  _settlements,
    kpis:         computeKpis(),
    monthlyProfit: charts.monthlyProfit,
    smeVsMain:    charts.smeVsMain,
    allotHistory: charts.allotHistory,

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
        var { error } = await window.sb.from('members').delete().eq('id', id);
        if (error) throw error;
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
        var { error } = await window.sb.from('pan_accounts').delete().eq('id', id);
        if (error) throw error;
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
        if (fields.listDate      != null) updates.list_date     = fields.listDate;
        if (fields.allotDate     != null) updates.allot_date    = fields.allotDate;
        if (fields.closeDate     != null) updates.close_date    = fields.closeDate;
        var { data, error } = await window.sb.from('ipos').update(updates).eq('id', id).select().single();
        if (error) throw error;
        var t = txIpos([data])[0];
        _ipos = _ipos.map(function(i){ return i.id === id ? t : i; });
        window.DB.ipos = _ipos;
        return t;
      },

      async deleteIpo(id) {
        var { error } = await window.sb.from('ipos').delete().eq('id', id);
        if (error) throw error;
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
              { ipo_id: ipoId, pan_id: row.panId, category: row.category, lots: 1 },
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

        // Ensure a profit_pool row exists for this IPO
        await window.sb.from('profit_pools')
          .upsert({ ipo_id: ipoId, status: 'Distributing' }, { onConflict: 'ipo_id' });

        await loadDB();
      },

      // Save changed statuses for an IPO's allotments
      // changes: [{ id: allotmentId, status, shares, gain }]
      async saveAllotmentChanges(changes) {
        for (var i = 0; i < changes.length; i++) {
          var c = changes[i];
          var upd = { status: c.status, shares: c.shares || 0, gain: c.gain || 0, checked_at: new Date().toISOString() };
          if (c.sellPrice != null) upd.sell_price = c.sellPrice;
          var { error } = await window.sb.from('allotments').update(upd).eq('id', c.id);
          if (error) throw error;
        }
        // Ensure a profit_pool row exists for each affected IPO so the Pool screen can show it
        var ipoIds = new Set(changes.map(function(c) {
          var a = _allotments.find(function(x){ return x.id === c.id; });
          return a ? a.ipo : null;
        }).filter(Boolean));
        for (var ipoId of ipoIds) {
          await window.sb.from('profit_pools')
            .upsert({ ipo_id: ipoId, status: 'Distributing' }, { onConflict: 'ipo_id' });
        }
        await loadDB();
      },

      async removeApplicant(allotmentId) {
        var allot = _allotments.find(function(a) { return a.id === allotmentId; });
        if (!allot) throw new Error('Allotment not found');
        var { error: ae } = await window.sb.from('allotments').delete().eq('id', allotmentId);
        if (ae) throw ae;
        var { error: ape } = await window.sb.from('applications').delete().eq('id', allot.appId);
        if (ape) throw ape;
        await loadDB();
      },

      // ─── Settlements ─────────────────────────────────────────────────────────
      // Generate settlement rows for an IPO from the current pool math
      // rows: [{ memberId, category, pans, amount }]
      async createSettlements(ipoId, rows) {
        var pool = _pools.find(function(p){ return p.ipo === ipoId; });
        if (!pool) {
          // Create pool first
          var { data: poolData, error: poolErr } = await window.sb.from('profit_pools')
            .upsert({ ipo_id: ipoId, status: 'Distributing' }, { onConflict: 'ipo_id' })
            .select().single();
          if (poolErr) throw poolErr;
          pool = txPools([poolData])[0];
        }
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
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
        await loadDB();
      },

      async markSettlementPaid(settlementId) {
        var today = new Date().toISOString().slice(0, 10);
        var { error } = await window.sb.from('settlements')
          .update({ status: 'Paid', paid_date: today })
          .eq('id', settlementId);
        if (error) throw error;
        _settlements = _settlements.map(function(s) {
          return s.id === settlementId ? Object.assign({}, s, { status: 'Paid', date: today }) : s;
        });
        window.DB.settlements = _settlements;
        window.DB.kpis        = computeKpis();
      },

      async markPoolSettled(ipoId) {
        var pool = _pools.find(function(p){ return p.ipo === ipoId; });
        if (!pool) return;
        var { error } = await window.sb.from('profit_pools').update({ status: 'Settled' }).eq('id', pool.id);
        if (error) throw error;
        _pools = _pools.map(function(p){ return p.ipo === ipoId ? Object.assign({}, p, { status: 'Settled' }) : p; });
        window.DB.pools = _pools;
      },
    },
  };
}

window.loadDB = loadDB;

})();
