(function(){
  'use strict';

  let initialized = false;

  function loadCatalog(){
    const mount = document.getElementById('catalog-mount');
    if(!mount) return false;
    if(initialized && mount.querySelector('#cbid-cat-inner')) return true;
    initialized = true;

    mount.innerHTML = `
      <div id="cbid-cat-inner">
        <div class="cat-topbar">
          <div class="cat-brand">
            <svg width="22" height="22" viewBox="0 0 44 44" fill="none" aria-hidden="true">
              <rect x="3" y="12" width="30" height="20" rx="3" stroke="#fff" stroke-width="2.5"/>
              <rect x="33.5" y="18" width="5" height="8" rx="1.5" fill="#fff"/>
              <path d="M22.5 15L16 24h5L19.5 30 28 21h-5.5l2-6z" fill="#F39C12"/>
            </svg>
            Catálogo de Productos
          </div>
          <div class="cat-searchbar">
            <svg class="cat-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
              <path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input type="text" id="cat-buscar" placeholder="Buscar producto o marca..." aria-label="Buscar producto">
            <button type="button" id="cat-limpiar" class="cat-clear-btn" aria-label="Limpiar búsqueda" hidden>&times;</button>
          </div>
          <div class="cat-sortbox">
            <label for="cat-orden" class="sr-only">Ordenar</label>
            <select id="cat-orden">
              <option value="relevancia">Ordenar: Relevancia</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="nombre-asc">Nombre: A-Z</option>
              <option value="nombre-desc">Nombre: Z-A</option>
            </select>
          </div>
        </div>
        <div class="cat-layout">
          <aside class="cat-sidebar">
            <h2>Categorías</h2>
            <ul class="cat-list" id="cat-categorias"></ul>
          </aside>
          <main class="cat-content">
            <div class="cat-head">
              <p id="cat-resultados" class="cat-results"></p>
            </div>
            <div id="cat-estado" class="cat-state" hidden></div>
            <div class="cat-grid" id="cat-productos"></div>
            <nav class="cat-pager" id="cat-paginacion" aria-label="Paginación"></nav>
          </main>
        </div>
        <div class="cat-modal-bd" id="cat-modal-bd">
          <div class="cat-modal-box" role="dialog" aria-modal="true" aria-labelledby="cat-modal-title">
            <button type="button" class="cat-modal-close" id="cat-modal-close" aria-label="Cerrar">&times;</button>
            <div class="cat-modal-img"><img id="cm-img" src="" alt=""></div>
            <div class="cat-modal-body">
              <p class="cat-modal-eyebrow" id="cm-brand"></p>
              <h2 class="cat-modal-title" id="cat-modal-title"></h2>
              <p class="cat-modal-ref" id="cm-ref"></p>
              <table class="cat-spec-table">
                <tr><td>Precio</td><td class="cat-modal-price" id="cm-precio"></td></tr>
                <tr><td>Disponibilidad</td><td id="cm-stock"></td></tr>
                <tr><td>Categoría</td><td id="cm-cat"></td></tr>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    initCatalog();
    return true;
  }
 /* ============================================================
     CAMBIO DE API DE CATALOGO 
  ============================================================ */
  function initCatalog(){
    const API_BASE = 'https://sistema.centrodebaterias.com/sys_mbo/ArticuloController/get_art_articulo/1/';
    const IMG = 'https://sistema.centrodebaterias.com/sys_mbo/uploads/articulos/';
    const PH  = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="220" viewBox="0 0 300 220"><rect width="300" height="220" fill="#F0F2F5"/><rect x="115" y="84" width="70" height="46" rx="6" fill="none" stroke="#8FA3B1" stroke-width="2.4"/><rect x="183" y="99" width="9" height="16" rx="2" fill="#8FA3B1"/><text x="150" y="158" font-family="Arial,sans-serif" font-size="13" fill="#8FA3B1" text-anchor="middle">Sin imagen</text></svg>');
    const PER_PAGE = 12;

    const st = { productos:[], filtrados:[], categoria:'', orden:'relevancia', pagina:1 };
    const el = {
      categorias: document.getElementById('cat-categorias'),
      grid: document.getElementById('cat-productos'),
      paginacion: document.getElementById('cat-paginacion'),
      buscar: document.getElementById('cat-buscar'),
      limpiar: document.getElementById('cat-limpiar'),
      orden: document.getElementById('cat-orden'),
      resultados: document.getElementById('cat-resultados'),
      estado: document.getElementById('cat-estado')
    };

    function timestampId(){
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      return d.getFullYear() +
        pad(d.getMonth() + 1) +
        pad(d.getDate()) +
        pad(d.getHours()) +
        pad(d.getMinutes()) +
        pad(d.getSeconds());
    }

    function apiUrl(){
      return API_BASE + timestampId();
    }

    async function cargar(){
      skeleton();
      try{
        const res = await fetch(apiUrl(), { cache: 'no-store' });
        if(!res.ok) throw new Error('HTTP ' + res.status);
        st.productos = await res.json();
        buildCats();
        render();
      }catch(e){ errorState(); }
    }

    function skeleton(){
      let h = '';
      for(let i=0;i<8;i++) h += '<div class="skel-card"><div class="skel-img"></div><div class="skel-line"></div><div class="skel-line short"></div></div>';
      el.grid.innerHTML = h; el.paginacion.innerHTML = ''; el.resultados.textContent = '';
    }

    function errorState(){
      el.grid.innerHTML = ''; el.estado.hidden = false;
      el.estado.innerHTML = 'No pudimos cargar el catálogo. Revisa tu conexión e intenta de nuevo.<br><button id="cat-retry">Reintentar</button>';
      document.getElementById('cat-retry').addEventListener('click', cargar);
    }

    function buildCats(){
      const cats = [...new Set(st.productos.map(p=>p.cat_descripcion).filter(Boolean))];
      let h = '<li><button type="button" class="cat-item active" data-cat=""><span class="cat-dot"></span>Todas</button></li>';
      cats.forEach(c => { h += '<li><button type="button" class="cat-item" data-cat="'+c+'"><span class="cat-dot"></span>'+c+'</button></li>'; });
      el.categorias.innerHTML = h;
      el.categorias.querySelectorAll('.cat-item').forEach(btn => {
        btn.addEventListener('click', function(){
          el.categorias.querySelectorAll('.cat-item').forEach(x=>x.classList.remove('active'));
          this.classList.add('active'); st.categoria = this.dataset.cat; st.pagina = 1; render();
        });
      });
    }

    function gaugeInfo(q){ q=Number(q)||0; if(q<=0)return{level:'empty',label:'Agotado'}; if(q<5)return{level:'low',label:'Pocas unidades'}; if(q<15)return{level:'medium',label:'Disponible'}; return{level:'high',label:'Stock alto'}; }
    function gaugeHTML(q,big){
      const g=gaugeInfo(q);
      const cls=big?'gauge gauge--lg':'gauge';
      return '<span class="'+cls+'" role="img" aria-label="'+g.label+'">' +
        '<span class="gauge-body"><span class="gauge-fill" data-level="'+g.level+'"></span></span>' +
        '<span class="gauge-cap"></span></span><span class="gauge-label gauge-label--'+g.level+'">'+g.label+'</span>';
    }
    function fmtPrice(v){ return (parseFloat(v)||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
    function esc(s){ return (s||'').replace(/"/g,'&quot;'); }

    function sort(list){
      const o=list.slice();
      if(st.orden==='precio-asc') o.sort((a,b)=>(parseFloat(a.art_precio)||0)-(parseFloat(b.art_precio)||0));
      else if(st.orden==='precio-desc') o.sort((a,b)=>(parseFloat(b.art_precio)||0)-(parseFloat(a.art_precio)||0));
      else if(st.orden==='nombre-asc') o.sort((a,b)=>(a.art_descripcion||'').localeCompare(b.art_descripcion||''));
      else if(st.orden==='nombre-desc') o.sort((a,b)=>(b.art_descripcion||'').localeCompare(a.art_descripcion||''));
      return o;
    }

    function render(){
      const txt = el.buscar.value.trim().toLowerCase();
      el.limpiar.hidden = txt.length === 0;
      let f = st.productos.filter(p => {
        const okC = !st.categoria || p.cat_descripcion===st.categoria;
        const okT = (p.art_descripcion||'').toLowerCase().includes(txt)||(p.mar_descripcion||'').toLowerCase().includes(txt);
        return okC && okT;
      });
      f = sort(f); st.filtrados = f; el.estado.hidden = true;
      if(f.length===0){
        el.grid.innerHTML = ''; el.paginacion.innerHTML = ''; el.resultados.textContent = '';
        el.estado.hidden = false; el.estado.innerHTML = 'No encontramos productos con esos filtros.<br>Prueba con otra categoría o búsqueda.';
        return;
      }
      const totalPgs = Math.max(1, Math.ceil(f.length/PER_PAGE));
      if(st.pagina > totalPgs) st.pagina = totalPgs;
      const ini = (st.pagina-1)*PER_PAGE;
      const pg = f.slice(ini, ini+PER_PAGE);
      let h = '';
      pg.forEach((p,i)=>{
        const idx=ini+i;
        const imgSrc=p.art_imgName?(IMG+p.art_imgName):PH;
        const t=esc(p.art_descripcion);
        h += '<article class="prod-card"><span class="prod-accent"></span>' +
          '<button type="button" class="img-btn" data-idx="'+idx+'" aria-label="Ver detalle de '+t+'">' +
            '<img src="'+imgSrc+'" alt="'+t+'" loading="lazy" data-fallback-src="'+PH+'">' +
            '<span class="zoom-hint" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="white" stroke-width="2"/><path d="M21 21l-4.3-4.3" stroke="white" stroke-width="2" stroke-linecap="round"/></svg></span>' +
          '</button>' +
          '<div class="prod-body">' +
            '<p class="prod-eyebrow">'+(p.mar_descripcion||'Sin marca')+'</p>' +
            '<button type="button" class="prod-title-btn" data-idx="'+idx+'">'+(p.art_descripcion||'')+'</button>' +
            (p.art_referencia?'<p class="prod-ref">Ref. '+p.art_referencia+'</p>':'') +
            '<div class="prod-price-row"><span class="prod-price">$'+fmtPrice(p.art_precio)+'</span>'+gaugeHTML(p.art_qty)+'</div>' +
          '</div></article>';
      });
      el.grid.innerHTML = h;
      el.grid.querySelectorAll('img[data-fallback-src]').forEach(img => {
        img.addEventListener('error', function(){
          this.src = this.dataset.fallbackSrc;
        }, { once: true });
      });
      el.grid.querySelectorAll('.img-btn, .prod-title-btn').forEach(btn=>{
        btn.addEventListener('click', function(){ openModal(parseInt(this.dataset.idx,10)); });
      });
      el.resultados.innerHTML = '<strong>'+f.length+'</strong> producto'+(f.length===1?'':'s')+' encontrado'+(f.length===1?'':'s');
      renderPager(totalPgs);
    }

    function renderPager(total){
      if(total<=1){ el.paginacion.innerHTML=''; return; }
      const list = total<=7 ? Array.from({length:total},(_,i)=>i+1) : (function(){
        const p=[1];
        if(st.pagina>4) p.push('...');
        const s=Math.max(2,st.pagina-1), e=Math.min(total-1,st.pagina+1);
        for(let i=s;i<=e;i++) p.push(i);
        if(st.pagina<total-3) p.push('...');
        p.push(total); return p;
      })();
      let h='<button type="button" data-pg="prev"'+(st.pagina===1?' disabled':'')+' aria-label="Anterior">‹</button>';
      list.forEach(p=>{ if(p==='...') h+='<span class="ellipsis">…</span>'; else h+='<button type="button" data-pg="'+p+'" class="'+(p===st.pagina?'active':'')+'">'+p+'</button>'; });
      h+='<button type="button" data-pg="next"'+(st.pagina===total?' disabled':'')+' aria-label="Siguiente">›</button>';
      el.paginacion.innerHTML = h;
      el.paginacion.querySelectorAll('button').forEach(btn=>{
        btn.addEventListener('click', function(){
          const v=this.dataset.pg;
          if(v==='prev') st.pagina=Math.max(1,st.pagina-1);
          else if(v==='next') st.pagina=Math.min(total,st.pagina+1);
          else st.pagina=parseInt(v,10);
          render();
          document.querySelector('#cbid-cat-inner .cat-content').scrollIntoView({behavior:'smooth',block:'start'});
        });
      });
    }

    /* Modal */
    const mod = {
      bd: document.getElementById('cat-modal-bd'),
      close: document.getElementById('cat-modal-close'),
      img: document.getElementById('cm-img'),
      brand: document.getElementById('cm-brand'),
      title: document.getElementById('cat-modal-title'),
      ref: document.getElementById('cm-ref'),
      precio: document.getElementById('cm-precio'),
      stock: document.getElementById('cm-stock'),
      cat: document.getElementById('cm-cat'),
      last: null
    };

    function openModal(idx){
      const p=st.filtrados[idx]; if(!p) return;
      mod.last = document.activeElement;
      mod.img.src = p.art_imgName?(IMG+p.art_imgName):PH;
      mod.img.alt = p.art_descripcion||'';
      mod.img.onerror = function(){ mod.img.src=PH; };
      mod.brand.textContent = p.mar_descripcion||'Sin marca';
      mod.title.textContent = p.art_descripcion||'';
      mod.ref.textContent = p.art_referencia?('Ref. '+p.art_referencia):'';
      mod.precio.textContent = '$'+fmtPrice(p.art_precio);
      mod.stock.innerHTML = gaugeHTML(p.art_qty, true);
      mod.cat.textContent = p.cat_descripcion||'—';
      mod.bd.classList.add('open'); document.body.classList.add('is-modal-open');
      mod.close.focus();
    }
    function closeModal(){
      mod.bd.classList.remove('open'); document.body.classList.remove('is-modal-open');
      if(mod.last) mod.last.focus();
    }
    mod.close.addEventListener('click', closeModal);
    mod.bd.addEventListener('click', function(e){ if(e.target===mod.bd) closeModal(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape'&&mod.bd.classList.contains('open')) closeModal(); });

    /* Search & sort */
    let t;
    el.buscar.addEventListener('input', function(){ clearTimeout(t); t=setTimeout(()=>{ st.pagina=1; render(); }, 200); });
    el.limpiar.addEventListener('click', function(){ el.buscar.value=''; el.buscar.focus(); st.pagina=1; render(); });
    el.orden.addEventListener('change', function(){ st.orden=this.value; st.pagina=1; render(); });

    cargar();
  }
  window.CBIDCatalog = { load: loadCatalog };
  window.loadCatalog = loadCatalog;
})();
