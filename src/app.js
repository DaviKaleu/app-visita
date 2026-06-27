(function(){
  'use strict';

  const CFG = window.TOP_CONFIG || {};
  const OWNER_ADMIN_EMAILS = (CFG.OWNER_ADMIN_EMAILS || ['davikaleu1537@gmail.com']).map(e=>String(e||'').trim().toLowerCase()).filter(Boolean);
  const state = {
    session: null,
    user: null,
    profile: null,
    company: null,
    renderSettings: null,
    tabs: [],
    clients: [],
    projects: [],
    services: [],
    transactions: [],
    inventoryItems: [],
    payrollRecords: [],
    payrollEmployees: [],
    suppliers: [],
    materialCatalog: [],
    current: 'leaderboard',
    imageBase64: '',
    imageName: '',
    adminProfiles: [],
    companyId: null,
    companyContext: null,
    companyRoles: [],
    companyPermissions: [],
    adminActingUserId: localStorage.getItem('tp_admin_acting_user_id') || '',
    planRequests: [],
    renderUsage: [],
    uiTheme: localStorage.getItem('tp_theme') || 'dark',
    designer: { projectId:'', selectedId:'', mode:'3d', camera:'orbit', orbitYaw:-28, orbitPitch:42, showGrid:false, showMeasures:true, snap:true, scale:0.18, dragging:null, orbiting:false },
    tabDrafts: {},
    saving:false,
    lastDbError:null
  };



  const APP_VERSION = 'V114';
  const COMPANY_TABLES = new Set(['clients','projects','services','transactions','inventory_items','payroll_employees','payroll_records','suppliers','user_company_settings','plan_requests','render_usage','security_logs']);
  const TEAM_ROLES = [
    {id:'owner', label:'Dono', desc:'Acesso total, configurações, equipe e dados sensíveis.'},
    {id:'manager', label:'Gerente', desc:'Operação completa sem remover o dono.'},
    {id:'seller', label:'Vendedor', desc:'Clientes, projetos, orçamentos, contratos e serviços.'},
    {id:'finance', label:'Financeiro', desc:'Entradas, saídas, pagamentos e folha.'},
    {id:'stock', label:'Estoque / compras', desc:'Estoque, fornecedores e compras.'},
    {id:'installer', label:'Montagem', desc:'Serviços atribuídos, status e conclusão.'}
  ];
  const TAB_PERMISSIONS = {
    leaderboard:'dashboard.read', clients:'clients.read', projects:'projects.read', budget:'budgets.read', contracts:'contracts.read',
    production:'production.read', services:'services.read', finance:'finance.read', inventory:'inventory.read', suppliers:'suppliers.read',
    payroll:'payroll.read', render:'render.use', company:'company.read', admin:'members.manage'
  };

  const CATALOG = [
    {code:2,factor:0.8,name:'Aereo até 0,70 cm'},
    {code:3,factor:1.4,name:'Balcão de divisão com modulos'},
    {code:4,factor:1.0,name:'Balcão de divisão só revestimento'},
    {code:5,factor:1.3,name:'Balcão pia c/ Gavetas'},
    {code:6,factor:1.0,name:'Balcão pia s/ Gavetas'},
    {code:7,factor:1.2,name:'Bi-Cama'},
    {code:8,factor:0.4,name:'Cabeceira de Cama'},
    {code:9,factor:0.5,name:'Cama tipo caixote'},
    {code:10,factor:0.7,name:'Closet até 4 Gavetas e 4 sapateiras'},
    {code:11,factor:0.75,name:'Closet até 8 gavetas e 8 sapateiras'},
    {code:12,factor:1.3,name:'Comoda 4 gavetas'},
    {code:13,factor:1.3,name:'Comoda 6  gavetas  e 1 porta'},
    {code:14,factor:1.4,name:'Criado mudo'},
    {code:15,factor:0.8,name:'Dispensa (vassouras) c/ portas'},
    {code:16,factor:0.8,name:'Estante (prateleiras) c/ Portas'},
    {code:17,factor:0.75,name:'Estante (prateleiras) s/ Portas'},
    {code:18,factor:1.2,name:'Gabinete Banheiro c/ nicho'},
    {code:19,factor:1.0,name:'Gabinete Banheiro s/ nicho'},
    {code:20,factor:1.6,name:'Gaveteiro volante'},
    {code:21,factor:1.0,name:'Mesa com gavetas engrossada'},
    {code:22,factor:0.9,name:'Mesa sem gaveta c/ engrosso'},
    {code:23,factor:0.8,name:'Mesa sem gaveta sem engrosso'},
    {code:24,factor:1.4,name:'Movel duplo (tipo tarumã)'},
    {code:25,factor:0.6,name:'Nichos de 20 a 40 cm s/ divisão'},
    {code:26,factor:0.3,name:'Painel'},
    {code:27,factor:1.0,name:'Paneleiro'},
    {code:28,factor:0.3,name:'Parede'},
    {code:29,factor:1.0,name:'Penteadeira acima de 4 gavetas'},
    {code:30,factor:0.9,name:'Penteadeira até 4 gavetas'},
    {code:31,factor:0.4,name:'Prateleira'},
    {code:32,factor:1.2,name:'Rack c/ 2  gavetas a cima de 1,60 mt c/ engrosso'},
    {code:33,factor:1.0,name:'Rack c/ 2  gavetas a cima de 1,60 mt s/ engrosso'},
    {code:34,factor:1.0,name:'Rack c/ 2 gavetas até 1,60 mt s c/ engrosso'},
    {code:35,factor:0.9,name:'Rack c/ 2 gavetas até 1,60 mt s s/ engrosso'},
    {code:36,factor:0.75,name:'Roupeiro até 4 gavetas e 4 sapateiras'},
    {code:37,factor:0.8,name:'Roupeiro até 8 gavetas e 8 sapateiras'},
    {code:38,factor:0.7,name:'Roupeiro sem gaveta e sapateira'},
    {code:39,factor:0.8,name:'Sapateira articulada'},
    {code:40,factor:0.75,name:'Sapateira deslizante até 16'}
  ];

  const DEFAULT_INVENTORY_ITEMS = [
    {item_name:'MDF Branco TX 15 mm', category:'MDF', unit:'chapa', min_qty:0, variant_text:'cor: Branco TX; espessura: 15 mm'},
    {item_name:'MDF Branco TX 18 mm', category:'MDF', unit:'chapa', min_qty:0, variant_text:'cor: Branco TX; espessura: 18 mm'},
    {item_name:'MDF Plomo 15 mm', category:'MDF', unit:'chapa', min_qty:0, variant_text:'cor: Plomo; espessura: 15 mm'},
    {item_name:'MDF Ópera Micro 15 mm', category:'MDF', unit:'chapa', min_qty:0, variant_text:'cor: Ópera Micro; espessura: 15 mm'},
    {item_name:'MDF Chumbo 15 mm', category:'MDF', unit:'chapa', min_qty:0, variant_text:'cor: Chumbo; espessura: 15 mm'},
    {item_name:'MDF Carvalho Treviso 15 mm', category:'MDF', unit:'chapa', min_qty:0, variant_text:'cor: Carvalho Treviso; espessura: 15 mm'},
    {item_name:'MDF Roble Catedral 15 mm', category:'MDF', unit:'chapa', min_qty:0, variant_text:'cor: Roble Catedral; espessura: 15 mm'},
    {item_name:'Fita Branco TX 22 mm', category:'Fita de borda', unit:'rolo', min_qty:0, variant_text:'cor: Branco TX; largura: 22 mm'},
    {item_name:'Fita Plomo 22 mm', category:'Fita de borda', unit:'rolo', min_qty:0, variant_text:'cor: Plomo; largura: 22 mm'},
    {item_name:'Fita Ópera Micro 22 mm', category:'Fita de borda', unit:'rolo', min_qty:0, variant_text:'cor: Ópera Micro; largura: 22 mm'},
    {item_name:'Fita Chumbo 22 mm', category:'Fita de borda', unit:'rolo', min_qty:0, variant_text:'cor: Chumbo; largura: 22 mm'},
    {item_name:'Fita Carvalho Treviso 22 mm', category:'Fita de borda', unit:'rolo', min_qty:0, variant_text:'cor: Carvalho Treviso; largura: 22 mm'},
    {item_name:'Fita Roble Catedral 22 mm', category:'Fita de borda', unit:'rolo', min_qty:0, variant_text:'cor: Roble Catedral; largura: 22 mm'},
    {item_name:'Parafuso 4x16', category:'Parafuso', unit:'caixa', min_qty:0, variant_text:'medida: 4x16'},
    {item_name:'Parafuso 4x25', category:'Parafuso', unit:'caixa', min_qty:0, variant_text:'medida: 4x25'},
    {item_name:'Parafuso 4x40', category:'Parafuso', unit:'caixa', min_qty:0, variant_text:'medida: 4x40'},
    {item_name:'Dobradiça reta com amortecedor', category:'Dobradiça', unit:'un', min_qty:0, variant_text:'tipo: reta; amortecedor: sim'},
    {item_name:'Dobradiça curva com amortecedor', category:'Dobradiça', unit:'un', min_qty:0, variant_text:'tipo: curva; amortecedor: sim'},
    {item_name:'Dobradiça super curva com amortecedor', category:'Dobradiça', unit:'un', min_qty:0, variant_text:'tipo: super curva; amortecedor: sim'},
    {item_name:'Corrediça telescópica 400 mm', category:'Corrediça', unit:'par', min_qty:0, variant_text:'tipo: telescópica; tamanho: 400 mm'},
    {item_name:'Corrediça telescópica 450 mm', category:'Corrediça', unit:'par', min_qty:0, variant_text:'tipo: telescópica; tamanho: 450 mm'},
    {item_name:'Corrediça telescópica 500 mm', category:'Corrediça', unit:'par', min_qty:0, variant_text:'tipo: telescópica; tamanho: 500 mm'},
    {item_name:'Pistão 60N', category:'Pistão', unit:'un', min_qty:0, variant_text:'força: 60N'},
    {item_name:'Pistão 80N', category:'Pistão', unit:'un', min_qty:0, variant_text:'força: 80N'},
    {item_name:'Pistão 100N', category:'Pistão', unit:'un', min_qty:0, variant_text:'força: 100N'},
    {item_name:'Perfil gola preto', category:'Perfil', unit:'barra', min_qty:0, variant_text:'tipo: gola; cor: preto'},
    {item_name:'Perfil cava 45°', category:'Perfil', unit:'barra', min_qty:0, variant_text:'tipo: cava 45°'},
    {item_name:'Cabideiro cromado', category:'Cabideiro', unit:'barra', min_qty:0, variant_text:'acabamento: cromado'},
    {item_name:'Suporte para cabideiro', category:'Cabideiro', unit:'un', min_qty:0, variant_text:'tipo: suporte'},
    {item_name:'Bucha 6 mm', category:'Bucha', unit:'un', min_qty:0, variant_text:'medida: 6 mm'},
    {item_name:'Bucha 8 mm', category:'Bucha', unit:'un', min_qty:0, variant_text:'medida: 8 mm'},
    {item_name:'Silicone transparente', category:'Adesivo/vedação', unit:'un', min_qty:0, variant_text:'cor: transparente'},
    {item_name:'PU branco', category:'Adesivo/vedação', unit:'un', min_qty:0, variant_text:'cor: branco'},
    {item_name:'Cola branca', category:'Cola', unit:'un', min_qty:0, variant_text:'tipo: branca'},
    {item_name:'Cola instantânea', category:'Cola', unit:'un', min_qty:0, variant_text:'tipo: instantânea'},
    {item_name:'Tapa Furo Branco TX', category:'Tapa furo', unit:'cartela', min_qty:0, variant_text:'cor: Branco TX'},
    {item_name:'Tapa Furo Plomo', category:'Tapa furo', unit:'cartela', min_qty:0, variant_text:'cor: Plomo'},
    {item_name:'Tapa Furo Ópera Micro', category:'Tapa furo', unit:'cartela', min_qty:0, variant_text:'cor: Ópera Micro'},
    {item_name:'Tapa Furo Chumbo', category:'Tapa furo', unit:'cartela', min_qty:0, variant_text:'cor: Chumbo'},
    {item_name:'Tapa Furo Carvalho Treviso', category:'Tapa furo', unit:'cartela', min_qty:0, variant_text:'cor: Carvalho Treviso'},
    {item_name:'Tapa Furo Roble Catedral', category:'Tapa furo', unit:'cartela', min_qty:0, variant_text:'cor: Roble Catedral'},
    {item_name:'Pistão Inverso 60N', category:'Pistão inverso', unit:'un', min_qty:0, variant_text:'tipo: inverso; força: 60N'},
    {item_name:'Pistão Inverso 80N', category:'Pistão inverso', unit:'un', min_qty:0, variant_text:'tipo: inverso; força: 80N'},
    {item_name:'Pistão Inverso 100N', category:'Pistão inverso', unit:'un', min_qty:0, variant_text:'tipo: inverso; força: 100N'}
  ];

  const RENDER_PLANS = {
    inicial: { id:'inicial', name:'Plano Inicial', limit:10, desc:'10 renders por dia' },
    profissional: { id:'profissional', name:'Plano Melhor', limit:50, desc:'50 renders por dia' }
  };

  const MATERIALS = [
    // Berneck - referências do portfólio enviado
    'Berneck • Roble Catedral Grann','Berneck • Carvalho Japandi Micro','Berneck • Nogal Artezzano Grann','Berneck • Lana Vel','Berneck • Ópera Micro','Berneck • Basalto Rust','Berneck • Taupe Micro','Berneck • Baru Micro','Berneck • Mostrato Micro','Berneck • Nero Rust','Berneck • Linho Grigio Vel','Berneck • Cinza Argila TX','Berneck • Cinza Cristal TX','Berneck • Cinza Cobalto Vel','Berneck • Sky Vel','Berneck • Azul TX','Berneck • Denim Vel','Berneck • Terraza Micro','Berneck • Volakas Micro','Berneck • Branco TX','Berneck • Branco Design','Berneck • Super White Micro','Berneck • Ovo TX','Berneck • Nude Vel','Berneck • Metallic Suede TX','Berneck • Panamá Vel','Berneck • Rugine TX','Berneck • Milenial Micro','Berneck • Ceramik Micro',
    // Arauco 2024 - referências do catálogo enviado
    'Arauco • Cristalina Matt','Arauco • Jalapão Matt','Arauco • Petar Bold','Arauco • Maragogi Matt','Arauco • Atlântica Trend','Arauco • Cerrado Bold','Arauco • Maraú Bold','Arauco • Orla Bold','Arauco • Verde Jade Bold','Arauco • Jequitibá Trend','Arauco • Louro Freijó Trend','Arauco • Louro Freijó Poro','Arauco • Cumaru Trend','Arauco • Jatobá Brasileiro Trend','Arauco • Ipê Real Trend','Arauco • Pau Ferro Trend','Arauco • Sucupira Trend','Arauco • Nova Imbuia Poro','Arauco • Tabaco Poro','Arauco • Escarlate Trend','Arauco • Carvalho Poro','Arauco • Bambu Matt','Arauco • Áureo Matt','Arauco • Ameixa Negra Matt','Arauco • Cinza Cristal TX','Arauco • Cinza Cristal Chess','Arauco • Beton Matt','Arauco • Cacao','Arauco • Camelo','Arauco • Sal Rosa','Arauco • Gris','Arauco • Lord','Arauco • Sálvia','Arauco • Reali','Arauco • Cinza Puro','Arauco • Orvalho','Arauco • Oceano','Arauco • Canela','Arauco • Lino Piombo','Arauco • Damasco',
    // materiais genéricos/produção
    'Branco TX','Branco Diamante','Nude Berneck','Opera Micro','Plomo Berneck','Roble Catedral','Cinza/Chumbo','Preto','Madeirado','MDF Cru','Vidro/Espelho','Pedra Preto São Gabriel','Granito Ouro Preto'
  ];

  const LIBRARY = [
    {group:'COZINHA', items:[
      ['balcao1','balcão inferior 1 porta','Balcão inferior',600,720,550,1,0,1,0],
      ['balcao2','balcão inferior 2 portas','Balcão inferior',1200,720,550,2,0,1,0],
      ['balcaogav','balcão com gavetas','Gaveteiro',800,720,550,0,3,1,0],
      ['balcaop','balcão pia','Balcão pia',1200,720,550,2,2,1,0],
      ['gaveteiro','gaveteiro','Gaveteiro',600,720,500,0,4,0,0],
      ['aereo1','armário aéreo 1 porta','Armário aéreo',600,700,320,1,0,1,1],
      ['aereo2','armário aéreo 2 portas','Armário aéreo',1200,700,320,2,0,1,1],
      ['basculante','armário basculante','Basculante',1200,350,320,1,0,0,1],
      ['torre','torre quente','Torre quente',700,2200,550,2,1,3,0],
      ['paneleiro','paneleiro','Paneleiro',700,2200,550,2,0,4,0],
      ['nicho','nicho aberto','Nicho',600,350,300,0,0,1,1],
      ['prateleira','prateleira','Prateleira',900,40,250,0,0,0,1],
      ['bancada','bancada','Bancada',1800,40,600,0,0,0,0]
    ]},
    {group:'QUARTO', items:[
      ['roup2','guarda-roupa 2 portas','Guarda-roupa',1200,2200,550,2,2,4,0],
      ['roup3','guarda-roupa 3 portas','Guarda-roupa',1800,2200,550,3,2,6,0],
      ['roupgav','guarda-roupa com gavetas','Guarda-roupa',2000,2200,550,4,4,6,0],
      ['criado','criado-mudo','Criado-mudo',450,550,400,1,1,1,0],
      ['painelcama','painel de cama','Painel',1600,1200,30,0,0,0,1],
      ['pratq','prateleira','Prateleira',900,40,250,0,0,0,1]
    ]},
    {group:'SALA', items:[
      ['paineltv','painel de TV','Painel',2200,1800,40,0,0,0,1],
      ['rack','rack','Rack',1800,500,450,2,2,1,0],
      ['nichos','nicho','Nicho',500,500,300,0,0,2,1],
      ['prats','prateleira','Prateleira',1200,40,250,0,0,0,1],
      ['cristaleira','cristaleira','Cristaleira',800,2000,400,2,0,4,0]
    ]},
    {group:'BANHEIRO', items:[
      ['gabban','gabinete inferior','Gabinete banheiro',800,600,480,2,1,0,0],
      ['espelheira','armário espelheira','Espelheira',800,700,180,2,0,1,1],
      ['nichoban','nicho','Nicho',400,400,150,0,0,1,1],
      ['bancadaban','bancada','Bancada',900,40,500,0,0,0,0]
    ]},
    {group:'PERSONALIZADO', items:[
      ['modvazio','módulo vazio','Módulo vazio',800,700,500,0,0,0,0],
      ['coluna','coluna','Coluna',100,2200,550,0,0,0,0],
      ['divisoria','divisória','Divisória',15,700,500,0,0,0,0],
      ['porta','porta','Porta',500,700,18,1,0,0,0],
      ['gaveta','gaveta','Gaveta',500,180,450,0,1,0,0],
      ['prateleirap','prateleira','Prateleira',700,15,450,0,0,0,0]
    ]},
    {group:'ELETROS / VÃOS TÉCNICOS', items:[
      ['vaoGeladeira','vão para geladeira','Vão técnico / referência',820,2100,720,0,0,0,0],
      ['forno','forno embutido','Eletrodoméstico / referência',600,600,560,0,0,0,0],
      ['microondas','micro-ondas','Eletrodoméstico / referência',600,380,400,0,0,0,1],
      ['lavaLoucas','lava-louças','Eletrodoméstico / referência',600,820,600,0,0,0,0],
      ['tanque','tanque','Ponto hidráulico / referência',600,180,500,0,0,0,0],
      ['bancadaPedra','bancada de pedra','Bancada técnica',1800,45,600,0,0,0,0]
    ]},
    {group:'AMBIENTE / REFERÊNCIA', items:[
      ['janela','janela','Janela / referência',900,500,40,0,0,0,1],
      ['portaamb','porta do ambiente','Porta / referência',800,2100,60,0,0,0,0],
      ['geladeira','geladeira','Eletrodoméstico / referência',740,1850,700,0,0,0,0],
      ['fogao','cooktop/fogão','Eletrodoméstico / referência',600,120,520,0,0,0,0],
      ['maquina','máquina de lavar','Eletrodoméstico / referência',650,850,650,0,0,0,0],
      ['cuba','pia/cuba','Imagem plana / cuba',500,1,420,0,0,0,0],
      ['coifa','coifa','Eletrodoméstico / referência',800,450,350,0,0,0,1],
      ['tomada','tomada','Ponto elétrico / referência',90,90,20,0,0,0,1],
      ['hidraulico','ponto hidráulico','Ponto hidráulico / referência',110,110,20,0,0,0,1]
    ]}
  ];

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const moneyFmt = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' });
  const dateFmt = new Intl.DateTimeFormat('pt-BR');

  function configured(){
    return CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && !String(CFG.SUPABASE_URL).includes('SEU-PROJETO') && !String(CFG.SUPABASE_ANON_KEY).includes('SUA_CHAVE');
  }
  function base(){ return String(CFG.SUPABASE_URL || '').replace(/\/$/,''); }
  function authBase(){ return base() + '/auth/v1'; }
  function restBase(){ return base() + '/rest/v1'; }
  function apiHeaders(extra){
    const token = state.session && state.session.access_token ? state.session.access_token : CFG.SUPABASE_ANON_KEY;
    return Object.assign({'apikey': CFG.SUPABASE_ANON_KEY,'Authorization': 'Bearer ' + token,'Content-Type': 'application/json'}, extra || {});
  }
  function html(v){ return String(v == null ? '' : v).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s])); }
  function cleanText(v, maxLength){
    maxLength = maxLength || 300;
    return String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }
  function cleanLongText(v, maxLength){
    maxLength = maxLength || 3000;
    return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').trim().slice(0, maxLength);
  }
  function cleanPhone(v){ return String(v == null ? '' : v).replace(/[^0-9+()\-\s]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30); }
  function safeImageSrc(v){
    const src = String(v == null ? '' : v).trim();
    if(!src) return '';
    if(/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(src)) return src;
    if(/^https:\/\//i.test(src) || /^assets\//i.test(src) || /^\.\/?assets\//i.test(src) || /^blob:/i.test(src)) return src;
    return '';
  }
  function safeExternalUrl(v){
    try{ const u = new URL(String(v||''), location.href); return u.protocol === 'https:' ? u.href : ''; }catch(_){ return ''; }
  }
  function assertSafeFile(file, maxMb){
    if(!file) throw new Error('Arquivo não selecionado.');
    if(!/^image\//i.test(file.type||'')) throw new Error('Envie apenas imagens.');
    if(file.size > (maxMb||8) * 1024 * 1024) throw new Error('Imagem muito pesada. Use uma imagem menor.');
  }
  function imageFileToDataUrl(file, opts){
    opts = Object.assign({ maxWidth:1400, maxHeight:1400, quality:.82, type:'image/webp' }, opts || {});
    return new Promise((resolve, reject)=>{
      try{ assertSafeFile(file, opts.maxMb || 8); }catch(err){ reject(err); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Imagem inválida.'));
        img.onload = () => {
          const scale = Math.min(1, opts.maxWidth / Math.max(1, img.width), opts.maxHeight / Math.max(1, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL(opts.type, opts.quality));
        };
        img.src = String(reader.result||'');
      };
      reader.readAsDataURL(file);
    });
  }
  function num(v){ return Number(v || 0) || 0; }
  function clamp(v,min,max){ v=num(v); return Math.max(min, Math.min(max, v)); }
  function money(v){ return moneyFmt.format(num(v)); }
  function today(){ return new Date().toISOString().slice(0,10); }
  function fmtDate(v){ if(!v) return '-'; const d = new Date(v + (String(v).length===10?'T00:00:00':'')); return isNaN(d) ? '-' : dateFmt.format(d); }
  function normalizeInventoryName(v){ return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' '); }
  function monthKey(d){ return d.toISOString().slice(0,7); }
  function uid(){ return 'id_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
  function showOnly(id){ ['bootScreen','setupScreen','authScreen','pendingScreen','app'].forEach(x => { const el=$('#'+x); if(el) el.classList.add('hidden'); }); const target=$('#'+id); if(target) target.classList.remove('hidden'); }
  function emergencyScreen(title, detail){
    try{
      const content = $('#content');
      if(content) content.innerHTML = `<div class="notice redline"><b>${html(title||'Erro ao abrir')}</b><br>${html(detail||'Erro desconhecido.')}<br><br><button class="ghost" onclick="localStorage.removeItem('tp_session'); location.reload()">Limpar login salvo</button> <button class="ghost" onclick="location.reload()">Recarregar</button></div>`;
      showOnly('app');
    }catch(_){
      alert((title||'Erro') + ': ' + (detail||''));
    }
  }
  function withTimeout(promise, ms, message){
    let timer;
    const timeout = new Promise((_, reject)=>{ timer=setTimeout(()=>reject(new Error(message || 'Tempo limite atingido.')), ms); });
    return Promise.race([promise, timeout]).finally(()=>clearTimeout(timer));
  }
  window.addEventListener('error', e => emergencyScreen('Erro no JavaScript', e.message || String(e.error||'')));
  window.addEventListener('unhandledrejection', e => emergencyScreen('Erro ao carregar dados', (e.reason && e.reason.message) || String(e.reason||'')));
  function setMsg(id, msg, type){ const el = $(id); if(!el) return; el.className = 'message ' + (type||''); el.textContent = msg || ''; }
  function toast(msg, type){ const el = $('#toast'); el.textContent = msg; el.className = 'toast ' + (type || ''); clearTimeout(window.__toastTimer); window.__toastTimer = setTimeout(()=>el.classList.add('hidden'), 4200); }
  function setCloud(ok, text){ const el = $('#cloudStatus'); el.textContent = text || (ok ? 'Nuvem conectada' : 'Sem conexão'); el.className = 'pill ' + (ok ? 'ok' : 'red'); }
  function statusBadge(s){ const key = String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,''); return `<span class="status ${key}">${html(s||'-')}</span>`; }
  function getClient(id){ return state.clients.find(x=>x.id===id) || {}; }
  function getProject(id){ return state.projects.find(x=>x.id===id) || {}; }
  function getService(id){ return state.services.find(x=>x.id===id) || {}; }
  function normalizedTeamRoles(roles){
    const allowed = new Set(TEAM_ROLES.map(r=>r.id));
    const arr = Array.isArray(roles) ? roles : String(roles||'').split(',');
    const clean = arr.map(r=>String(r||'').trim().toLowerCase()).filter(r=>allowed.has(r));
    return Array.from(new Set(clean));
  }
  function roleLabel(role){ const found=TEAM_ROLES.find(r=>r.id===role); return found ? found.label : role; }
  function rolesText(roles){ const clean=normalizedTeamRoles(roles); return clean.length ? clean.map(roleLabel).join(' + ') : 'Sem cargo'; }
  function hasPerm(permission){
    if(!permission) return true;
    if(state.profile && state.profile.active && state.profile.role === 'admin' && !(state.companyPermissions||[]).length) return true;
    return (state.companyPermissions||[]).includes(permission) || (state.companyRoles||[]).includes('owner');
  }
  function hasAnyPerm(list){ return (list||[]).some(hasPerm); }
  function isAdmin(){ return !!(state.profile && state.profile.active && (state.profile.role === 'admin' || hasPerm('members.manage'))); }
  function isOwnerEmail(email){ return OWNER_ADMIN_EMAILS.includes(String(email||'').trim().toLowerCase()); }
  function effectiveUserId(){ return (isAdmin() && state.adminActingUserId) ? state.adminActingUserId : (state.user && state.user.id); }
  function effectiveProfile(){ return (state.adminProfiles||[]).find(u=>u.id===state.adminActingUserId) || {}; }
  function effectiveUserLabel(){ const p=effectiveProfile(); if(isAdmin() && state.adminActingUserId) return p.name || p.email || 'usuário selecionado'; return state.profile ? (state.profile.name || state.profile.email || 'usuário') : 'usuário'; }
  function companySettingsFilter(){ return state.companyId && !state.adminActingUserId ? 'company_id=eq.' + encodeURIComponent(state.companyId) : 'user_id=eq.' + encodeURIComponent(effectiveUserId()); }
  function adminContextBanner(){
    if(!isAdmin() || !state.adminActingUserId) return '';
    const p=effectiveProfile();
    return `<div class="notice goldline adminContext no-print"><b>Modo administrador:</b> você está acessando os dados de <b>${html(p.name||p.email||state.adminActingUserId)}</b> para fazer ajustes. Novos registros criados agora ficarão vinculados a essa conta. <button class="ghost mini" onclick="TP.stopAccessUser()">Voltar para minha conta</button></div>`;
  }
  function parseJsonish(v, fallback){ if(Array.isArray(v) || (v && typeof v==='object')) return v; try{return JSON.parse(v || '');}catch(_){return fallback;} }
  function friendlyDbError(err){
    const raw=String((err && err.message) || err || 'Erro desconhecido');
    const low=raw.toLowerCase();
    if(low.includes('jwt') || low.includes('token') || low.includes('expired')) return 'Sua sessão expirou. Saia e entre novamente.';
    if(low.includes('failed to fetch') || low.includes('network') || low.includes('connection') || low.includes('abort') || low.includes('timeout')) return 'Falha de conexão com a nuvem. Confira internet e Supabase.';
    if(low.includes('permission') || low.includes('policy') || low.includes('row-level') || low.includes('rls')) return 'Sem permissão para salvar este dado. Confira usuário/liberação e políticas do Supabase.';
    if(low.includes('does not exist') || low.includes('schema cache') || low.includes('column') || low.includes('relation')) return 'Banco desatualizado. Rode a migration mais recente no Supabase.';
    if(low.includes('duplicate') || low.includes('unique')) return 'Registro duplicado. Confira se este dado já existe.';
    return raw;
  }
  async function runAction(fn, okMsg){
    try{ const r=await fn(); if(okMsg) toast(okMsg); return r; }
    catch(err){ console.error(err); state.lastDbError=err; setCloud(false,'Erro na nuvem'); toast(friendlyDbError(err),'red'); return null; }
  }
  async function safeSelect(table, query, fallback){
    try{ return await select(table, query); }
    catch(err){ console.warn('Falha ao carregar '+table, err); state.lastDbError=err; return fallback==null ? [] : fallback; }
  }
  function optionTag(value,label,selected){ return `<option value="${html(value)}" ${String(selected||'')===String(value)?'selected':''}>${html(label)}</option>`; }
  const STATUS = {
    client:[['ativo','Ativo'],['inativo','Inativo']],
    budget:[['rascunho','Rascunho'],['enviado','Enviado'],['negociacao','Em negociação'],['aprovado','Aprovado'],['recusado','Recusado']],
    project:[['em_criacao','Em criação'],['aguardando_aprovacao','Aguardando aprovação'],['aprovado','Aprovado']],
    production:[['nao_iniciado','Não iniciado'],['em_producao','Em produção'],['aguardando_material','Aguardando material'],['finalizado','Finalizado'],['entregue','Entregue']],
    service:[['aguardando_inicio','Aguardando início'],['em_andamento','Em andamento'],['entregue','Entregue'],['finalizado','Finalizado'],['cancelado','Cancelado']]
  };
  function statusOptions(group,selected){ return (STATUS[group]||[]).map(([v,l])=>optionTag(v,l,selected)).join(''); }
  function normalizeStatus(group,value){
    let v=String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'_').replace(/[^a-z0-9_]+/g,'_');
    const map={
      orcamento:'rascunho', orcando:'rascunho', orçando:'rascunho', orçamento:'rascunho', aberto:'rascunho',
      em_negociacao:'negociacao', negociacao:'negociacao', negociando:'negociacao',
      fechado:'aprovado', pago:'finalizado', producao:'em_producao', andamento:'em_andamento', em_andamento:'em_andamento',
      aguardando_inicio:'aguardando_inicio', aguardando_incio:'aguardando_inicio', nao_iniciado:'nao_iniciado', não_iniciado:'nao_iniciado',
      em_criacao:'em_criacao', criacao:'em_criacao', aguardando_aprovacao:'aguardando_aprovacao',
      entregue:'entregue', finalizado:'finalizado', cancelado:'cancelado', recusado:'recusado', ativo:'ativo', inativo:'inativo'
    };
    v=map[v]||v;
    const allowed=(STATUS[group]||[]).map(x=>x[0]);
    if(allowed.includes(v)) return v;
    return allowed[0] || v;
  }
  function statusLabel(group,value){ const v=normalizeStatus(group,value); const found=(STATUS[group]||[]).find(x=>x[0]===v); return found?found[1]:(value||'-'); }
  function statusBadge2(group,value){ const v=normalizeStatus(group,value); return `<span class="status ${html(v)}">${html(statusLabel(group,v))}</span>`; }

  async function rawFetch(url, options){
    const finalUrl = String(url || '');
    if(!/^https:\/\//i.test(finalUrl) && !finalUrl.startsWith(restBase()) && !finalUrl.startsWith(authBase())){
      throw new Error('URL insegura bloqueada. Use HTTPS.');
    }
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), 25000);
    const opts = Object.assign({}, options || {}, { signal: controller.signal });
    let res;
    try{ res = await fetch(url, opts); }
    catch(e){ if(e && e.name==='AbortError') throw new Error('A conexão com o Supabase demorou demais. Confira sua internet, URL/key do Supabase ou limpe o login salvo.'); throw e; }
    finally{ clearTimeout(timer); }
    const text = await res.text();
    let data = null;
    try{ data = text ? JSON.parse(text) : null; }catch(_){ data = text; }
    if(!res.ok){
      const msg = data && (data.msg || data.message || data.error_description || data.error) ? (data.msg || data.message || data.error_description || data.error) : ('Erro HTTP ' + res.status);
      throw new Error(friendlyDbError(msg));
    }
    return data;
  }
  async function authFetch(path, body){ return rawFetch(authBase() + path, { method:'POST', headers:apiHeaders({Authorization:'Bearer '+CFG.SUPABASE_ANON_KEY}), body:JSON.stringify(body || {}) }); }
  async function rest(path, options){ return rawFetch(restBase() + path, Object.assign({ headers:apiHeaders() }, options || {})); }
  async function select(table, query){ return rest('/' + table + '?' + (query || 'select=*'), { method:'GET' }); }
  function withCompanyScope(table, obj){
    if(!state.companyId || !COMPANY_TABLES.has(table) || !obj) return obj;
    const add = (row) => row && typeof row === 'object' && !Array.isArray(row) && row.company_id == null ? Object.assign({ company_id: state.companyId }, row) : row;
    return Array.isArray(obj) ? obj.map(add) : add(obj);
  }
  async function insert(table, obj){ return rest('/' + table, { method:'POST', headers:apiHeaders({'Prefer':'return=representation'}), body:JSON.stringify(withCompanyScope(table,obj)) }); }
  async function update(table, filter, obj){ return rest('/' + table + '?' + filter, { method:'PATCH', headers:apiHeaders({'Prefer':'return=representation'}), body:JSON.stringify(obj) }); }
  async function removeRow(table, filter){ return rest('/' + table + '?' + filter, { method:'DELETE' }); }
  async function rpc(name, obj){ return rest('/rpc/' + name, { method:'POST', body:JSON.stringify(obj || {}) }); }
  async function logAction(action, details){ try{ await insert('security_logs', { action, details:details||{}, actor_id:state.user && state.user.id }); }catch(_){ } }

  function saveSession(data){ if(!data) return; state.session = data; state.user = data.user || state.user; try{ localStorage.setItem('tp_session', JSON.stringify(data)); }catch(_){ } }
  function readStoredSession(){ try{ const s = JSON.parse(localStorage.getItem('tp_session') || 'null'); if(s && s.access_token){ state.session=s; state.user=s.user; return true; } }catch(_){ } return false; }
  async function refreshSessionIfNeeded(){
    if(!state.session || !state.session.refresh_token) return false;
    const expiresAt = state.session.expires_at ? Number(state.session.expires_at) * 1000 : 0;
    if(expiresAt && expiresAt - Date.now() > 60000) return true;
    try{ const data = await authFetch('/token?grant_type=refresh_token', { refresh_token: state.session.refresh_token }); saveSession(data); return true; }
    catch(_){ localStorage.removeItem('tp_session'); state.session = null; state.user = null; return false; }
  }
  async function logout(){ try{ if(state.session) await rawFetch(authBase() + '/logout', { method:'POST', headers:apiHeaders() }); }catch(_){ } localStorage.removeItem('tp_session'); localStorage.removeItem('tp_admin_acting_user_id'); state.adminActingUserId=''; state.session = null; state.user = null; state.profile = null; showOnly('authScreen'); }

  async function loadProfile(){
    if(!state.user || !state.user.id) throw new Error('Usuário não encontrado na sessão.');
    const rows = await select('profiles', 'select=*&id=eq.' + encodeURIComponent(state.user.id));
    state.profile = rows && rows[0] ? rows[0] : null;
    return state.profile;
  }
  async function tryOwnerSelfRepair(){
    if(!state.user || !isOwnerEmail(state.user.email)) return false;
    try{
      const rows = await rpc('tp_owner_self_repair', {});
      state.profile = Array.isArray(rows) ? rows[0] : rows;
      return !!state.profile;
    }catch(err){
      console.warn('Autorreparo admin indisponível. Rode migration_v103.sql.', err);
      return false;
    }
  }



  async function loadCompanyContext(){
    state.companyId = null;
    state.companyContext = null;
    state.companyRoles = [];
    state.companyPermissions = [];
    try{
      const data = await rpc('tp_my_company_context', {});
      const ctx = Array.isArray(data) ? data[0] : data;
      if(ctx && ctx.company_id){
        state.companyContext = ctx;
        state.companyId = ctx.company_id;
        state.companyRoles = normalizedTeamRoles(ctx.roles || []);
        state.companyPermissions = Array.isArray(ctx.permissions) ? ctx.permissions.map(String) : [];
      }
    }catch(err){
      console.warn('Contexto de empresa V114 indisponível. Rode supabase/migration_v114_company_roles_permissions.sql.', err);
    }
    return state.companyContext;
  }

  function defaultTabs(){
    return [
      {tab_key:'leaderboard',title:'Dashboard / Estatísticas',description:'Resumo simples da operação da empresa.',icon:'IN',enabled:true,admin_only:false,order_index:10},
      {tab_key:'clients',title:'Clientes',description:'Cadastro e pesquisa de clientes.',icon:'CL',enabled:true,admin_only:false,order_index:20},
      {tab_key:'projects',title:'Projetos',description:'Organize projetos, imagens e dados técnicos.',icon:'PR',enabled:true,admin_only:false,order_index:30},
      {tab_key:'budget',title:'Orçamentos',description:'Monte, revise e gere orçamento com base em um projeto.',icon:'OR',enabled:true,admin_only:false,order_index:40},
      {tab_key:'contracts',title:'Contratos',description:'Gere contratos após aprovação do orçamento.',icon:'CT',enabled:true,admin_only:false,order_index:50},
      {tab_key:'production',title:'Produção',description:'Acompanhe a produção após orçamento aprovado.',icon:'PD',enabled:true,admin_only:false,order_index:55},
      {tab_key:'services',title:'Serviços',description:'Acompanhe execução, equipe e entrega.',icon:'SV',enabled:true,admin_only:false,order_index:60},
      {tab_key:'finance',title:'Financeiro',description:'Controle entradas, saídas e fornecedor.',icon:'FI',enabled:true,admin_only:false,order_index:70},
      {tab_key:'inventory',title:'Estoque',description:'Controle itens, variantes e estoque mínimo.',icon:'ES',enabled:true,admin_only:false,order_index:80},
      {tab_key:'suppliers',title:'Fornecedores',description:'Cadastro simples de lojas e fornecedores.',icon:'FO',enabled:true,admin_only:false,order_index:85},
      {tab_key:'payroll',title:'Funcionários',description:'Funcionários e valores por serviço.',icon:'FU',enabled:true,admin_only:false,order_index:90},
      {tab_key:'render',title:'Renderização',description:'Integração opcional e separada via API externa.',icon:'AI',enabled:false,admin_only:false,order_index:110},
      {tab_key:'company',title:'Empresa',description:'Dados oficiais, documentos, preços e equipe de acesso.',icon:'EM',enabled:true,admin_only:false,order_index:120},
      {tab_key:'admin',title:'Admin',description:'Área técnica: abas, integração e auditoria.',icon:'AD',enabled:true,admin_only:true,order_index:130}
    ];
  }
  function mergeTabs(dbTabs){
    const base=defaultTabs(); const map=new Map(base.map(t=>[t.tab_key,t]));
    (dbTabs||[]).forEach(t=>map.set(t.tab_key,Object.assign({},map.get(t.tab_key)||{},t)));
    return Array.from(map.values()).sort((a,b)=>num(a.order_index)-num(b.order_index));
  }
  async function loadAll(){
    setCloud(false, 'Carregando...');
    await loadProfile();
    if(!state.profile){
      try{
        await insert('profiles', { id: state.user.id, email: state.user.email || '', name: state.user.email || '', role:'user', active:false });
      }catch(err){
        console.warn('Não foi possível criar perfil pelo cliente, tentando função segura.', err);
        try{ await rpc('tp_ensure_current_profile', {}); }catch(_){ }
      }
      await loadProfile();
    }
    if((!state.profile || !state.profile.active) && isOwnerEmail(state.user.email)){
      await tryOwnerSelfRepair();
      await loadProfile().catch(()=>null);
    }
    if(!state.profile || !state.profile.active){ showOnly('pendingScreen'); return false; }
    await loadCompanyContext();
    if(!isAdmin()) { state.adminActingUserId=''; localStorage.removeItem('tp_admin_acting_user_id'); }
    const dataUserId = effectiveUserId();
    const uidFilter = encodeURIComponent(dataUserId);
    const own = 'created_by=eq.' + uidFilter;
    const companyFilter = state.companyId && !state.adminActingUserId ? 'company_id=eq.' + encodeURIComponent(state.companyId) : own;
    const companySettingsQuery = state.companyId && !state.adminActingUserId ? 'select=*&company_id=eq.' + encodeURIComponent(state.companyId) + '&limit=1' : 'select=*&user_id=eq.' + uidFilter;
    const planQuery = isAdmin() ? 'select=*&order=created_at.desc' : (state.companyId ? 'select=*&company_id=eq.' + encodeURIComponent(state.companyId) + '&order=created_at.desc' : 'select=*&user_id=eq.' + uidFilter + '&order=created_at.desc');
    const usageQuery = isAdmin() ? 'select=*&usage_date=eq.' + today() : (state.companyId ? 'select=*&company_id=eq.' + encodeURIComponent(state.companyId) + '&usage_date=eq.' + today() : 'select=*&user_id=eq.' + uidFilter + '&usage_date=eq.' + today());
    const [company, tabs, clients, projects, services, transactions, planRequests, renderUsage, inventory, payrollEmployees, payrollRecords, suppliers, materials] = await Promise.all([
      safeSelect('user_company_settings', companySettingsQuery),
      safeSelect('tab_settings', 'select=*&order=order_index.asc', defaultTabs()),
      safeSelect('clients', 'select=*&' + companyFilter + '&order=created_at.desc'),
      safeSelect('projects', 'select=*&' + companyFilter + '&order=created_at.desc'),
      safeSelect('services', 'select=*&' + companyFilter + '&order=created_at.desc'),
      safeSelect('transactions', 'select=*&' + companyFilter + '&order=transaction_date.desc,created_at.desc'),
      safeSelect('plan_requests', planQuery),
      safeSelect('render_usage', usageQuery),
      safeSelect('inventory_items', 'select=*&' + companyFilter + '&order=item_name.asc'),
      safeSelect('payroll_employees', 'select=*&' + companyFilter + '&order=name.asc'),
      safeSelect('payroll_records', 'select=*&' + companyFilter + '&order=period_start.desc,created_at.desc'),
      safeSelect('suppliers', 'select=*&' + companyFilter + '&order=name.asc'),
      safeSelect('material_catalog', 'select=*&order=category.asc,name.asc')
    ]);
    if(!company[0]){
      try{ const created = await insert('user_company_settings', Object.assign(defaultCompany(), { user_id: dataUserId })); state.company = Object.assign(defaultCompany(), created && created[0] || {}); }
      catch(_){ state.company = defaultCompany(); }
    } else state.company = Object.assign(defaultCompany(), company[0]);
    state.tabs = mergeTabs(tabs);
    state.clients = (clients || []).map(c=>Object.assign({},c,{status:normalizeStatus('client',c.status)}));
    state.projects = (projects || []).map(p => Object.assign({}, p, {
      status: normalizeStatus('budget', p.status),
      project_status: normalizeStatus('project', p.project_status || p.project_status_v103 || p.status),
      production_status: normalizeStatus('production', p.production_status || (String(p.status).toLowerCase().includes('producao')?'em_producao':'nao_iniciado')),
      budget_items: parseJsonish(p.budget_items, []),
      design_data: parseJsonish(p.design_data, null),
      pieces_data: parseJsonish(p.pieces_data, [])
    }));
    state.services = (services || []).map(s=>Object.assign({},s,{status:normalizeStatus('service',s.status)}));
    state.transactions = transactions || [];
    state.planRequests = planRequests || [];
    state.renderUsage = renderUsage || [];
    state.inventoryItems = inventory || [];
    await ensureInventoryPresetIfEmpty();
    state.payrollEmployees = payrollEmployees || [];
    state.payrollRecords = payrollRecords || [];
    state.suppliers = suppliers || [];
    state.materialCatalog = materials || [];
    try{ const rs = await safeSelect('render_settings','select=*&id=eq.true'); state.renderSettings = rs[0] || {}; }catch(_){ state.renderSettings = {}; }
    setCloud(true, state.lastDbError ? 'Nuvem conectada com avisos' : 'Nuvem conectada');
    return true;
  }

  function defaultCompany(){ return { company_name:'Top Planejados', document_number:'', responsible_name:'', phone:'', whatsapp:'', instagram:'', address:'', pix_key:'', contract_city:'Porto Velho - RO', price_white:850, price_white_wood:950, price_wood:1100, card_factor:1.30, default_discount:0, entry_pct:50, delivery_pct:50, logo_url:'assets/logo-top-planejados.png', quote_primary_color:'#111111', quote_secondary_color:'#8b8b8b', quote_accent_color:'#dc2626', quote_text_color:'#111827', quote_title:'ORÇAMENTO DE SERVIÇO', quote_valid_days:7, quote_warranty:'Garantia de um ano. Garantia não válida para contato dos móveis com água. A garantia fica atrelada à inspeção técnica para avaliar defeito de fabricação ou mau uso.', quote_footer_note:'', contract_model:'comercial', receipt_model:'comercial' }; }
  function priceByColor(color){ color=String(color||'branco'); if(color==='branco_madeirado') return num(state.company.price_white_wood||950); if(color==='madeirado') return num(state.company.price_wood||1100); return num(state.company.price_white||850); }
  function colorName(color){ if(color==='branco_madeirado') return 'Branco com madeirado'; if(color==='madeirado') return 'Madeirado'; return 'Branco'; }
  function paymentName(p){
    p=String(p||'dinheiro');
    if(p==='cartao') return 'Cartão';
    if(p==='fechamento') return '100% à vista no fechamento';
    if(p==='fornecedor_entrega') return '50% à vista no fornecedor/loja e 50% à vista na entrega';
    if(p==='entrega') return '100% à vista na entrega';
    return 'Dinheiro/Pix';
  }
  function supplierSplitText(){ return '50% de entrada para compra de material no fornecedor/loja, podendo seguir a condição de pagamento/cartão combinada diretamente com a loja/fornecedor, e 50% à vista na entrega do serviço. O saldo da entrega não é parcelado, salvo novo acordo por escrito.'; }
  function budgetPaymentPlainText(p){
    const note=String((p&&p.budget_payment_note)||'').trim();
    if(note) return note;
    const entry=num(p&&p.entry_pct), delivery=num(p&&p.delivery_pct);
    if(entry===50 && delivery===50) return '50% à vista no fechamento/entrada e 50% à vista na entrega.';
    if(entry===100 && delivery===0) return '100% à vista no fechamento.';
    if(entry===0 && delivery===100) return '100% à vista na entrega.';
    if(entry || delivery) return `${entry}% de entrada e ${delivery}% na entrega.`;
    return 'Conforme combinado.';
  }
  function isAutoBudgetNote(v){ return /orçamento criado sem projeto obrigatório/i.test(String(v||'')); }
  function cleanDocNote(v){ const t=String(v||'').trim(); return isAutoBudgetNote(t) ? '' : t; }
  function operationData(projectId){
    const project=getProject(projectId||'');
    const client=getClient(project.client_id||'');
    const service=(state.services||[]).find(s=>s.project_id===project.id)||{};
    const company=state.company||defaultCompany();
    const totals=project.id ? projectTotal(project) : {subtotal:0,discount:0,final:0,entry:0,delivery:0,entryPct:50,deliveryPct:50};
    const items=Array.isArray(project.budget_items)?project.budget_items:[];
    const tx=(state.transactions||[]).filter(t=>t.project_id===project.id || t.service_id===service.id);
    return {company,client,project,service,items,totals,transactions:tx};
  }
  function tabClearTitle(key, fallback){
    const map={leaderboard:'Dashboard / Estatísticas',clients:'Clientes',budget:'Orçamentos',projects:'Projetos',contracts:'Contratos',production:'Produção',services:'Serviços',finance:'Financeiro',inventory:'Estoque',suppliers:'Fornecedores',payroll:'Funcionários',render:'Renderização',company:'Empresa',admin:'Admin'};
    return map[key]||fallback||key;
  }
  function tabClearDesc(key, fallback){
    const map={leaderboard:'Resumo simples da operação: orçamentos, produção, serviços, financeiro e alertas.',clients:'Cadastro principal dos clientes da Top.',budget:'Monte orçamento com base em um projeto vinculado ao cliente.',projects:'Organize projetos, imagens e informações técnicas.',contracts:'Gere contratos somente após aprovação do orçamento.',production:'Acompanhe material, fabricação, finalização e entrega.',services:'Acompanhe execução, equipe e entrega.',finance:'Controle entradas, despesas, compras e fornecedor.',inventory:'Controle itens, variantes e alertas de estoque mínimo.',suppliers:'Cadastro simples de fornecedores e lojas.',payroll:'Funcionários e valores a receber por serviço fechado.',render:'Renderização opcional via API externa no futuro.',company:'Dados oficiais, documentos, preços e equipe de acesso ao sistema.',admin:'Área técnica para abas, integração e auditoria.'};
    return map[key]||fallback||'';
  }
  function planInfo(id){ return RENDER_PLANS[id] || RENDER_PLANS.inicial; }
  function planLabel(id){ const p = planInfo(id); return p.name + ' (' + p.desc + ')'; }
  function activeRenderPlan(){ return (state.planRequests||[]).find(p => p.user_id === state.user.id && ['ativo','aprovado','pago'].includes(String(p.status||'').toLowerCase())) || null; }
  function pendingRenderPlan(){ return (state.planRequests||[]).find(p => p.user_id === state.user.id && ['solicitado','pendente','aguardando'].includes(String(p.status||'').toLowerCase())) || null; }
  function todayRenderUsed(){ return (state.renderUsage||[]).filter(u => u.user_id === state.user.id && String(u.usage_date||'').slice(0,10) === today()).reduce((a,b)=>a+num(b.usage_count),0); }
  function payFactor(payment){ return payment==='cartao' ? num(state.company.card_factor||1.3) : 1; }
  function itemArea(it){ return num(it.qty)*(num(it.width)/1000)*(num(it.height)/1000)*num(it.factor); }
  function itemTotal(it){ const manual=num(it.total)||num(it.value)||num(it.subtotal); if(manual>0) return manual; return itemArea(it)*priceByColor(it.color)*payFactor(it.payment); }
  function projectSubtotal(p){ const items=(p.budget_items||[]); const sum=items.reduce((a,it)=>a+itemTotal(it),0); return sum || num(p.budget_value) || 0; }
  function projectM2(p){ return (p.budget_items||[]).reduce((a,it)=>a+itemArea(it),0); }
  function pctValue(value, fallback){ return value === 0 || value === '0' || (value != null && String(value).trim() !== '') ? num(value) : num(fallback || 0); }
  function projectTotal(p){ const sub = projectSubtotal(p); const discount = num(p.budget_discount || 0); const final = Math.max(0, sub-discount); const entryPct = pctValue(p.entry_pct, state.company.entry_pct || 50); const deliveryPct = pctValue(p.delivery_pct, state.company.delivery_pct || 50); return {subtotal:sub, discount, final, entry:final*(entryPct/100), delivery:final*(deliveryPct/100), entryPct, deliveryPct}; }
  function quoteProjectOptions(selected){ return '<option value="">Novo orçamento / sem projeto selecionado</option>' + state.projects.map(p=>`<option value="${p.id}" ${selected===p.id?'selected':''}>${html(p.name)} — ${html(getClient(p.client_id).name||'sem cliente')}</option>`).join(''); }
  function catalogOptions(selected){ return CATALOG.map(c=>`<option value="${c.code}" ${String(selected)===String(c.code)?'selected':''}>${c.code} - ${html(c.name)} | Fator ${c.factor}</option>`).join(''); }
  function materialOptions(selected){ return MATERIALS.map(m=>`<option ${selected===m?'selected':''}>${html(m)}</option>`).join(''); }
  function materialHex(m){
    const key=String(m||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const map=[
      ['roble catedral','#b78351'],['carvalho japandi','#d8bd96'],['nogal artezzano','#77584b'],['lana','#c8c4b6'],['opera','#6f716d'],['basalto','#6c7170'],['taupe','#94846b'],['baru','#d8cca0'],['mostrato','#b88344'],['nero','#151719'],['linho grigio','#6d6a61'],['cinza argila','#d9ded2'],['cinza cristal','#d5d6d4'],['cinza cobalto','#aeb0aa'],['sky','#8eb4de'],['azul','#0f526d'],['denim','#5b5b75'],['terraza','#eeeeec'],['volakas','#f0e4dc'],['super white','#ffffff'],['ovo','#c4b09c'],['nude','#c6beb1'],['metallic suede','#ada0a0'],['panama','#9e9290'],['rugine','#573229'],['milenial','#bd9781'],['ceramik','#af7868'],
      ['cristalina','#f7ecd8'],['jalapao','#9d5638'],['petar','#1e2020'],['maragogi','#cddacb'],['atlantica','#c27b38'],['cerrado','#a87943'],['marau','#eadfbb'],['orla','#b79c75'],['verde jade','#91aaa0'],['jequitiba','#c59b70'],['louro freijo','#b58655'],['cumaru','#a06f4e'],['jatoba brasileiro','#a96039'],['ipe real','#8b6541'],['pau ferro','#4b2f27'],['sucupira','#634135'],['nova imbuia','#7b4b31'],['tabaco','#6f3a28'],['escarlate','#8f3c31'],['carvalho','#dfc399'],['bambu','#e1c05a'],['aureo','#d5ad4f'],['ameixa negra','#2b1c22'],['beton','#9f9c91'],['cacao','#563021'],['camelo','#b79061'],['sal rosa','#e5d0cb'],['gris','#716a62'],['lord','#4c4c4b'],['salvia','#b7c6b8'],['reali','#d8c8ad'],['cinza puro','#c4c8c3'],['orvalho','#dadcd7'],['oceano','#075c61'],['canela','#7d6a58'],['lino piombo','#676761'],['damasco','#e7ae84'],
      ['branco diamante','#f8f9f7'],['branco tx','#f7f8f5'],['plomo','#5f6672'],['chumbo','#5f6672'],['preto sao gabriel','#181714'],['granito ouro preto','#25201b'],['pedra','#2e2c28'],['vidro','#c7d2fe'],['espelho','#c7d2fe'],['cru','#d4a373'],['madeirado','#a87943'],['preto','#111827']
    ];
    const found=map.find(([name])=>key.includes(name));
    return found ? found[1] : '#f8fafc';
  }
  function materialIsWood(m){ const key=String(m||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); return /(roble|carvalho|nogal|madeir|atlantica|cerrado|marau|orla|jequitiba|louro|freijo|cumaru|jatoba|ipe|pau ferro|sucupira|imbuia|tabaco|escarlate|bambu|canela|jatoba|catedral|japandi)/.test(key); }
  function materialTextureUrl(m){ const key=String(m||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); if(key.includes('roble catedral') || key === 'roble catedral') return 'assets/material-roble-catedral.jpg'; return ''; }
  function budgetColorFromMaterial(m){ m=String(m||'').toLowerCase(); if(m.includes('madeir') || m.includes('roble')) return 'madeirado'; if(m.includes('nude') || m.includes('opera') || m.includes('plomo') || m.includes('chumbo')) return 'branco_madeirado'; return 'branco'; }
  function isEnvironmentModule(m){ const t=String((m&&m.type)||'').toLowerCase(); const k=String((m&&m.key)||'').toLowerCase(); return t.includes('referência') || t.includes('eletrodoméstico') || t.includes('ponto elétrico') || t.includes('ponto hidráulico') || ['janela','portaamb','geladeira','fogao','maquina','cuba','coifa','tomada','hidraulico','vaoGeladeira','forno','microondas','lavaLoucas','tanque'].includes(k); }
  function moduleKindClass(m){ if(isEnvironmentModule(m)) return 'envItem'; const t=String((m&&m.type)||'').toLowerCase(); if(t.includes('aéreo')||t.includes('basculante')||t.includes('nicho')||t.includes('painel')) return 'wallItem'; if(t.includes('torre')||t.includes('paneleiro')||t.includes('guarda')) return 'tallItem'; return 'baseItem'; }
  function isCountertop(m){ const t=String((m&&m.type)||'').toLowerCase(); const k=String((m&&m.key)||'').toLowerCase(); return k.includes('bancada') || t.includes('bancada') || String((m&&m.ext)||'').toLowerCase().includes('pedra') || String((m&&m.name)||'').toLowerCase().includes('bancada'); }
  function isSinkModule(m){ const k=String((m&&m.key)||'').toLowerCase(); const t=String((m&&m.type)||'').toLowerCase(); const n=String((m&&m.name)||'').toLowerCase(); return k==='cuba' || n.includes('cuba') || n.includes('pia/cuba') || t.includes('ponto hidráulico / referência'); }
  function overlaps1D(a1,a2,b1,b2){ return a1 < b2 && a2 > b1; }
  function sinkAttachedToCounter(design,counter){ return (design.modules||[]).find(s=>isSinkModule(s) && overlaps1D(num(s.x),num(s.x)+num(s.w), num(counter.x),num(counter.x)+num(counter.w)) && overlaps1D(num(s.z||0),num(s.z||0)+num(s.d||0), num(counter.z||0),num(counter.z||0)+num(counter.d||0)) && Math.abs(num(s.y)-num(counter.y))<260); }
  function hexToRgb(hex){ const clean=String(hex||'').replace('#',''); const full=clean.length===3?clean.split('').map(x=>x+x).join(''):clean.padEnd(6,'0'); const int=parseInt(full,16); return {r:(int>>16)&255,g:(int>>8)&255,b:int&255}; }
  function rgbToHex(r,g,b){ return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); }
  function shade(hex,pct){ const {r,g,b}=hexToRgb(hex); const f=pct/100; return rgbToHex(r+(255-r)*f, g+(255-g)*f, b+(255-b)*f); }
  function materialVars(material, grain){ const base=materialHex(material); const grain1=shade(base,14); const grain2=shade(base,-12); const grainDir=(String(grain||'Vertical').toLowerCase()==='horizontal'?'90deg':'0deg'); return {base, grain1, grain2, grainDir}; }
  function cssTexture(material, grain){
    const dir=String(grain||'Vertical').toLowerCase()==='horizontal'?'90deg':'0deg';
    const img=materialTextureUrl(material);
    if(img) return `url("${img}"), linear-gradient(${dir}, rgba(255,255,255,.10), rgba(0,0,0,.06))`;
    if(materialIsWood(material)) return `repeating-linear-gradient(${dir}, rgba(255,255,255,.16) 0 2px, rgba(0,0,0,.04) 2px 5px, rgba(255,255,255,.06) 5px 11px, rgba(0,0,0,.03) 11px 17px), linear-gradient(${dir}, var(--frontLight), var(--front), var(--frontDark), var(--front))`;
    return `linear-gradient(90deg,rgba(255,255,255,.20),transparent 38%,rgba(0,0,0,.05)), linear-gradient(${dir}, var(--frontLight), var(--front), var(--frontDark))`;
  }
  function materialBody(m){ return (m && !isEnvironmentModule(m) && !isCountertop(m)) ? (m.inner || 'Branco TX') : (m.ext || 'Branco TX'); }
  function materialFront(m){ return (m && !isEnvironmentModule(m)) ? (m.ext || 'Branco TX') : (m.ext || 'Branco TX'); }
  function materialSide(m){ return (m && m.sideExt && !isEnvironmentModule(m) && !isCountertop(m)) ? (m.ext || 'Branco TX') : materialBody(m); }
  function textureSizeFor(material){ return materialTextureUrl(material) ? '80px auto' : (materialIsWood(material) ? '38px 100%,100% 100%' : '100% 100%'); }
  function moduleTextureStyle(m){
    const ext=materialVars(materialFront(m), m.grain); const inner=materialVars(materialBody(m), m.grain);
    const frontBg=cssTexture(materialFront(m),m.grain); const innerBg=cssTexture(materialBody(m),m.grain);
    return `--front:${ext.base};--frontLight:${ext.grain1};--frontDark:${ext.grain2};--innerFace:${inner.base};--innerLight:${inner.grain1};--innerDark:${inner.grain2};--grainDir:${ext.grainDir};--grainDirInner:${inner.grainDir};--frontTexture:${frontBg};--innerTexture:${innerBg};--frontTextureSize:${textureSizeFor(materialFront(m))};--innerTextureSize:${textureSizeFor(materialBody(m))};background-image:${innerBg};background-size:${textureSizeFor(materialBody(m))};background-position:center;`;
  }
  function drawerHeightsMm(m){ const drawers=Math.max(0,Math.floor(num(m.drawers))); if(!drawers) return []; const custom=String(m.drawerHeights||'').split(',').map(x=>num(x.trim())).filter(Boolean); if(custom.length>=drawers){ const arr=custom.slice(0,drawers); const total=arr.reduce((a,b)=>a+b,0)||drawers; return arr.map(v=>Math.max(80,v/total*Math.max(120,total/drawers))); } return Array.from({length:drawers},()=>100); }
  function drawerHeightsPx(m,totalH){ const drawers=Math.max(0,Math.floor(num(m.drawers))); if(!drawers) return []; const custom=String(m.drawerHeights||'').split(',').map(x=>num(x.trim())).filter(Boolean); if(custom.length>=drawers){ const arr=custom.slice(0,drawers); const total=arr.reduce((a,b)=>a+b,0)||drawers; return arr.map(v=>Math.max(16,Math.round(totalH*(v/total)))); } return Array.from({length:drawers},()=>Math.round(totalH/drawers)); }
  function resolveHandleSide(pref, i, count, kind='door'){
    const side=(pref||'auto').toLowerCase();
    if(kind==='drawer'){
      if(side==='left'||side==='right'||side==='center') return side;
      return 'center';
    }
    if(side==='left'||side==='right'||side==='center') return side;
    if(count<=1) return 'right';
    return i < Math.ceil(count/2) ? 'right' : 'left';
  }
  function doorLeafHinge(i, doors, handleSide){
    const hs=resolveHandleSide(handleSide, i, doors, 'door');
    if(hs==='left') return 'right';
    if(hs==='right') return 'left';
    return i < Math.ceil(doors/2) ? 'left' : 'right';
  }
  function doorHandleX(i, leafW, doors, handleSide){
    const hs=resolveHandleSide(handleSide, i, doors, 'door');
    if(hs==='left') return Math.round(leafW*i + leafW*0.16);
    if(hs==='center') return Math.round(leafW*i + leafW*0.50);
    return Math.round(leafW*i + leafW*0.84);
  }
  function drawerHandleStart(sectionW, handleSide){
    const hs=resolveHandleSide(handleSide, 0, 1, 'drawer');
    if(hs==='left') return Math.round(sectionW*0.10);
    if(hs==='right') return Math.round(sectionW*0.38);
    return Math.round(sectionW*0.24);
  }

  function tabAllowedByPermission(key){
    if(key === 'designer') return false;
    const perm = TAB_PERMISSIONS[key];
    return !perm || hasPerm(perm);
  }
  function isUserVisibleTab(t){ return !!t.enabled && t.tab_key !== 'admin' && tabAllowedByPermission(t.tab_key); }
  function availableTabs(){
    const clean=(state.tabs||[]).filter(t=>t.tab_key!=='designer');
    if(isAdmin()) return clean.filter(t=>tabAllowedByPermission(t.tab_key) || t.tab_key==='admin').sort((a,b)=>num(a.order_index)-num(b.order_index));
    return clean.filter(t => isUserVisibleTab(t)).sort((a,b)=>num(a.order_index)-num(b.order_index));
  }
  function tabByKey(key){ return state.tabs.find(t => t.tab_key === key) || {}; }
  function ensureCurrentTab(){ const tabs = availableTabs(); if(!tabs.some(t=>t.tab_key===state.current)) state.current = tabs[0] ? tabs[0].tab_key : 'leaderboard'; }
  function applyTheme(){
    document.body.classList.toggle('theme-white', state.uiTheme==='white');
    const btn=$('#themeBtn'); if(btn) btn.textContent = state.uiTheme==='white' ? 'Modo escuro' : 'Modo white';
  }
  function toggleTheme(){ state.uiTheme = state.uiTheme==='white' ? 'dark' : 'white'; localStorage.setItem('tp_theme', state.uiTheme); applyTheme(); }
  function updateTabSearchOptions(){ const dl=$('#tabList'); if(!dl) return; dl.innerHTML=availableTabs().map(t=>`<option value="${html(tabClearTitle(t.tab_key,t.title))}" data-key="${html(t.tab_key)}"></option>`).join(''); }
  function bindTabSearch(){ const input=$('#tabSearch'); if(!input) return; input.addEventListener('keydown', e=>{ if(e.key!=='Enter') return; e.preventDefault(); const q=String(input.value||'').trim().toLowerCase(); if(!q) return; const found=availableTabs().find(t=>String(tabClearTitle(t.tab_key,t.title)||'').toLowerCase().includes(q)||String(t.tab_key||'').toLowerCase().includes(q)||String(tabClearDesc(t.tab_key,t.description)||'').toLowerCase().includes(q)); if(found){ state.current=found.tab_key; input.value=''; render(); } else toast('Aba não encontrada.', 'red'); }); }


  function saveCurrentTabDraft(){
    const content=$('#content'); if(!content || !state.current) return;
    const data={};
    content.querySelectorAll('input,select,textarea').forEach(el=>{
      if(!el.id || el.type==='file') return;
      data[el.id] = el.type==='checkbox' ? !!el.checked : el.value;
    });
    state.tabDrafts[state.current]=data;
  }
  function restoreCurrentTabDraft(){
    const data=state.tabDrafts[state.current]; if(!data) return;
    Object.keys(data).forEach(id=>{
      const el=$('#'+id); if(!el) return;
      if(el.type==='checkbox') el.checked=!!data[id]; else el.value=data[id];
      if(id==='projectImageUrl') updateProjectImagePreview(el.value);
    });
  }

  function renderNav(){
    ensureCurrentTab();
    $('#sideName').textContent = state.profile.name || state.profile.email || 'Usuário';
    $('#sideRole').textContent = state.adminActingUserId ? 'Administrador • acesso assistido' : (state.companyRoles && state.companyRoles.length ? rolesText(state.companyRoles) : (isAdmin() ? 'Administrador' : 'Usuário ativo'));
    const tabs=availableTabs().slice().sort((a,b)=>num(a.order_index)-num(b.order_index));
    const groupLabel=(key)=> ['leaderboard','clients','projects','budget','contracts','production','services','finance'].includes(key)?'Operação':(['inventory','suppliers','payroll'].includes(key)?'Controle interno':(['render'].includes(key)?'Ferramentas':(key==='company'?'Configurações':'Admin')));
    let last='';
    $('#nav').innerHTML = tabs.map(t => {
      const hiddenForUsers = isAdmin() && !isUserVisibleTab(t) && t.tab_key !== 'admin';
      const adminTab = t.tab_key === 'admin';
      const group=groupLabel(t.tab_key);
      const header=group!==last ? `<div class="navGroup">${group}</div>` : '';
      last=group;
      const cls = [state.current===t.tab_key?'active':'', hiddenForUsers?'userHidden':'', adminTab?'adminPermanent':''].filter(Boolean).join(' ');
      const title = hiddenForUsers ? (tabClearDesc(t.tab_key,t.description) + ' | Oculta para usuários comuns') : tabClearDesc(t.tab_key,t.description);
      return `${header}<button data-tab="${html(t.tab_key)}" class="${cls}" title="${html(title)}"><span class="ico">${html(t.icon)}</span>${html(tabClearTitle(t.tab_key,t.title))}${hiddenForUsers?'<span class="navOffBadge">oculta</span>':''}</button>`;
    }).join('');
    $$('#nav button').forEach(btn => { btn.addEventListener('mouseenter', ()=>showHelp(btn.dataset.tab)); btn.addEventListener('click', ()=>openTab(btn.dataset.tab)); });
    updateTabSearchOptions();
    showHelp(state.current);
  }
  function showHelp(key){ const t = tabByKey(key); $('#helpTitle').textContent = tabClearTitle(key,t.title||'Aba'); $('#helpText').textContent = tabClearDesc(key,t.description||''); }
  function openTab(key){ saveCurrentTabDraft(); state.current = key; render(); }

  function render(){
    applyTheme();
    renderNav();
    const t = tabByKey(state.current);
    $('#pageTitle').textContent = tabClearTitle(state.current,t.title || 'Top Planejados');
    $('#pageSubtitle').textContent = tabClearDesc(state.current,t.description || '');
    const map = { leaderboard:renderLeaderboard, company:renderCompany, clients:renderClients, projects:renderProjects, budget:renderBudget, designer:renderDesigner, production:renderProduction, services:renderServices, finance:renderFinance, inventory:renderInventory, suppliers:renderSuppliers, payroll:renderPayroll, contracts:renderContracts, render:renderRenderLab, admin:renderAdmin };
    const fn = map[state.current] || renderLeaderboard;
    $('#content').innerHTML = adminContextBanner() + fn();
    bindCurrent();
    restoreCurrentTabDraft();
  }

  function closedStatuses(){ return ['entregue','finalizado']; }
  function isStoreCreditTx(t){ const type=String(t.type||'').toLowerCase(); const cat=String(t.category||'').toLowerCase(); return type==='credito_loja' || cat.includes('credito loja') || cat.includes('crédito loja') || cat.includes('fornecedor'); }
  function isPayrollTx(t){ return String(t.category||'').toUpperCase().startsWith('FOLHA_SERVICO_') || String(t.description||'').toLowerCase().includes('folha de pagamento'); }
  function payrollPaidTotal(){ return (state.services||[]).reduce((total,sv)=> total + serviceEmployeeIds(sv).filter(id=>payrollPaidForServiceEmployee(sv,id)).reduce((sum,id)=>sum+servicePayrollAmountForEmployee(sv,id),0),0); }
  function txValueClass(t){ return t.type==='entrada'?'green':(t.type==='saida'?'red':'blue'); }
  function txTypeLabel(t){ return t.type==='credito_loja'?'crédito loja':(t.type||'-'); }
  function stats(){
    const now = new Date(); const curMonth = monthKey(now); const prev = new Date(now.getFullYear(), now.getMonth()-1, 1); const prevMonth = monthKey(prev);
    const entrada = state.transactions.filter(t=>t.type==='entrada').reduce((a,b)=>a+num(b.amount),0);
    const saida = state.transactions.filter(t=>t.type==='saida' && !isPayrollTx(t)).reduce((a,b)=>a+num(b.amount),0);
    const storeCredit = state.transactions.filter(isStoreCreditTx).reduce((a,b)=>a+num(b.amount),0);
    const curEntrada = state.transactions.filter(t=>t.type==='entrada' && String(t.transaction_date||'').slice(0,7)===curMonth).reduce((a,b)=>a+num(b.amount),0);
    const prevEntrada = state.transactions.filter(t=>t.type==='entrada' && String(t.transaction_date||'').slice(0,7)===prevMonth).reduce((a,b)=>a+num(b.amount),0);
    const growth = prevEntrada > 0 ? ((curEntrada-prevEntrada)/prevEntrada)*100 : (curEntrada>0?100:0);
    const closed = state.services.filter(s=>closedStatuses().includes(normalizeStatus('service',s.status))); 
    const orcandoList = state.projects.filter(p=>['rascunho','enviado','negociacao'].includes(normalizeStatus('budget',p.status))); 
    const cancelados = state.services.filter(s=>normalizeStatus('service',s.status)==='cancelado');
    const closedValue = closed.reduce((a,b)=>a+num(b.value),0);
    const ticket = closed.length ? closedValue/closed.length : 0;
    const orcando = orcandoList.length;
    const orcandoValue = orcandoList.reduce((a,b)=>a+(projectTotal(b).final||num(b.budget_value)),0);
    const openProjects = state.projects.filter(p=>['em_criacao','aguardando_aprovacao','aprovado'].includes(normalizeStatus('project',p.project_status))).length;
    const projectPipeline = state.projects.filter(p=>['rascunho','enviado','negociacao','aprovado'].includes(normalizeStatus('budget',p.status))).reduce((a,b)=>a+num(b.budget_value),0);
    const pipeline = orcandoValue + projectPipeline;
    const profit = entrada-saida;
    const margin = entrada ? (profit/entrada)*100 : 0;
    const totalDeals = closed.length + orcandoList.length + cancelados.length;
    const conversion = totalDeals ? (closed.length/totalDeals)*100 : 0;
    const overdue = state.projects.filter(p=>p.delivery_deadline && new Date(p.delivery_deadline+'T00:00:00') < new Date(new Date().toISOString().slice(0,10)+'T00:00:00') && !['entregue','finalizado'].includes(normalizeStatus('production',p.production_status))).length;
    return {entrada, saida, storeCredit, payrollPaid:payrollPaidTotal(), profit, curEntrada, prevEntrada, growth, closedCount:closed.length, closedValue, ticket, pipeline, orcando, orcandoValue, openProjects, margin, conversion, overdue};
  }
  function statusBars(){
    const items = STATUS.service.map(([st,label])=>({st,label,n: state.services.filter(s=>normalizeStatus('service',s.status)===st).length}));
    const max = Math.max(1, ...items.map(x=>x.n));
    return `<div class="barlist">${items.map(x=>`<div class="baritem"><div>${statusBadge2('service',x.st)} <b>${x.n}</b></div><div class="barline"><span style="width:${Math.round((x.n/max)*100)}%"></span></div></div>`).join('')}</div>`;
  }
  function renderLeaderboard(){
    const s=stats();
    const openBudgets=state.projects.filter(p=>['rascunho','enviado','negociacao'].includes(normalizeStatus('budget',p.status))).length;
    const approved=state.projects.filter(p=>normalizeStatus('budget',p.status)==='aprovado').length;
    const running=state.services.filter(x=>['aguardando_inicio','em_andamento'].includes(normalizeStatus('service',x.status))).length;
    const delivered=state.services.filter(x=>['entregue','finalizado'].includes(normalizeStatus('service',x.status))).length;
    const pendingPayroll=(state.services||[]).reduce((a,sv)=>a+serviceEmployeeIds(sv).filter(id=>servicePayrollReleased(sv) && !servicePayrollPaidMap(sv)[id]).reduce((b,id)=>b+servicePayrollAmountForEmployee(sv,id),0),0);
    const lowStock=(state.inventoryItems||[]).filter(i=>num(i.current_qty)<=num(i.min_qty)).length;
    const recentBudgets=state.projects.slice(0,5).map(p=>[html(getClient(p.client_id).name||'-'), html(p.name||'-'), money(projectTotal(p).final||p.budget_value), statusBadge2('budget',p.status||'rascunho'), `<button class="ghost mini" onclick="TP.openProjectBudget('${p.id}')">Abrir</button>`]);
    return `<div class="clearHero card"><div><span class="badge">V111 Layout e Estoque</span><h2>Fluxo da ${html((state.company&&state.company.company_name)||'Top Planejados')}</h2><p>Use o sistema de forma linear: cadastra o cliente, cria o projeto, monta o orçamento, aprova, gera contrato, acompanha serviço e fecha no financeiro.</p></div><div class="flowSteps"><button onclick="TP.openTabKey('clients')">1 Cliente</button><button onclick="TP.openTabKey('projects')">2 Projeto</button><button onclick="TP.openTabKey('budget')">3 Orçamento</button><button onclick="TP.openTabKey('contracts')">4 Contrato</button><button onclick="TP.openTabKey('services')">5 Serviço</button><button onclick="TP.openTabKey('finance')">6 Financeiro</button></div></div>
    <div class="grid clearStats">
      <div class="card stat"><div class="label">Orçamentos em aberto</div><div class="value orange">${openBudgets}</div><div class="sub">Projetos ainda em negociação</div></div>
      <div class="card stat"><div class="label">Aprovados / produção</div><div class="value blue">${approved}</div><div class="sub">Prontos para contrato/serviço</div></div>
      <div class="card stat"><div class="label">Serviços em andamento</div><div class="value">${running}</div><div class="sub">Execução ativa</div></div>
      <div class="card stat"><div class="label">Entregues/finalizados</div><div class="value green">${delivered}</div><div class="sub">Serviços concluídos</div></div>
      <div class="card stat"><div class="label">Recebido no mês</div><div class="value green">${money(s.curEntrada)}</div><div class="sub">Entradas reais</div></div>
      <div class="card stat"><div class="label">Saídas totais</div><div class="value red">${money(s.saida)}</div><div class="sub">Custos e despesas</div></div>
      <div class="card stat"><div class="label">Saldo fornecedor</div><div class="value blue">${money(s.storeCredit)}</div><div class="sub">Crédito/loja cadastrado</div></div>
      <div class="card stat"><div class="label">Funcionários pendentes</div><div class="value orange">${money(pendingPayroll)}</div><div class="sub">A pagar pela folha</div></div>
      <div class="card stat"><div class="label">Valor pago a funcionários</div><div class="value green">${money(s.payrollPaid)}</div><div class="sub">Controle separado das saídas</div></div>
      <div class="card stat"><div class="label">Estoque baixo</div><div class="value ${lowStock?'red':'green'}">${lowStock}</div><div class="sub">Itens abaixo do mínimo</div></div>
    </div>
    <div class="grid2" style="margin-top:14px"><div class="card"><h3>Orçamentos recentes</h3>${table(['Cliente','Projeto','Valor','Status','Ação'], recentBudgets)}</div><div class="card"><h3>Próximas ações</h3><div class="clearChecklist"><div><b>1.</b> Cliente cadastrado?</div><div><b>2.</b> Projeto criado, se for necessário?</div><div><b>3.</b> Orçamento com itens revisados?</div><div><b>4.</b> PDF enviado e aprovado?</div><div><b>5.</b> Contrato, serviço e financeiro acompanhando?</div></div></div></div>`;
  }



  function table(head, rows){ if(!rows || !rows.length) return '<div class="empty">Nenhum registro ainda.</div>'; return `<div class="table-wrap"><table class="table"><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
  function clientOptions(selected){ return '<option value="">Selecione</option>' + state.clients.map(c=>`<option value="${c.id}" ${selected===c.id?'selected':''}>${html(c.name)}</option>`).join(''); }
  function projectOptions(selected){ return '<option value="">Opcional</option>' + state.projects.map(p=>`<option value="${p.id}" ${selected===p.id?'selected':''}>${html(p.name)}</option>`).join(''); }
  function clientBudgetDetailsHtml(clientId){
    const c=getClient(clientId||'');
    if(!c.id) return '<div class="notice"><b>Nenhum cliente selecionado</b><br><span class="muted small">Selecione um cliente para puxar nome, telefone, CPF/CNPJ e endereço para o orçamento.</span></div>';
    const parts=[];
    if(c.phone) parts.push('Telefone: '+html(c.phone));
    if(c.document_number) parts.push('CPF/CNPJ: '+html(c.document_number));
    if(c.city) parts.push('Cidade: '+html(c.city));
    if(c.address) parts.push('Endereço: '+html(c.address));
    if(c.notes) parts.push('Obs.: '+html(c.notes));
    return `<div class="notice greenline"><b>${html(c.name||'Cliente')}</b><br><span class="muted small">${parts.length?parts.join('<br>'):'Dados básicos do cliente selecionado.'}</span></div>`;
  }
  function serviceOptions(selected){ return '<option value="">Opcional</option>' + state.services.map(s=>`<option value="${s.id}" ${selected===s.id?'selected':''}>${html(s.title)}</option>`).join(''); }
  function supplierOptions(selected){ return '<option value="">Sem fornecedor</option>' + (state.suppliers||[]).map(f=>`<option value="${f.id}" ${selected===f.id?'selected':''}>${html(f.name)}</option>`).join(''); }
  function payrollEmployeeOptions(selected){ return '<option value="">Sem funcionário</option>' + (state.payrollEmployees||[]).filter(e=>e.active!==false).map(e=>`<option value="${e.id}" ${selected===e.id?'selected':''}>${html(e.name)}</option>`).join(''); }
  function payrollEmployeeMultiOptions(selectedIds){ selectedIds=selectedIds||[]; return (state.payrollEmployees||[]).filter(e=>e.active!==false).map(e=>`<option value="${e.id}" ${selectedIds.includes(e.id)?'selected':''}>${html(e.name)}</option>`).join(''); }
  function selectedValues(id){
    const el=$('#'+id); if(!el) return [];
    const checks = el.querySelectorAll ? Array.from(el.querySelectorAll('input[type="checkbox"]:checked')) : [];
    if(checks.length) return checks.map(c=>c.value).filter(Boolean);
    if(el.matches && el.matches('input[type="checkbox"]')) return el.checked && el.value ? [el.value] : [];
    return Array.from(el.selectedOptions||[]).map(o=>o.value).filter(Boolean);
  }
  function payrollEmployeeChecklist(selectedIds){
    selectedIds=selectedIds||[];
    const list=(state.payrollEmployees||[]).filter(e=>e.active!==false);
    if(!list.length) return '<div class="empty small">Cadastre funcionários na aba Folha de pagamento.</div>';
    return `<div id="serviceEmployees" class="employeeChecklist">${list.map(e=>`<label class="employeeCheck"><input type="checkbox" value="${e.id}" ${selectedIds.includes(e.id)?'checked':''}> <span>${html(e.name)}</span></label>`).join('')}</div>`;
  }
  function getPayrollEmployee(id){ return (state.payrollEmployees||[]).find(e=>e.id===id) || {}; }
  function payrollEligibleStatuses(){ return ['em_andamento','entregue','finalizado']; }
  function servicePayrollReleased(s){ const st=normalizeStatus('service',s.status); if(String(s.payroll_release_mode||'status')==='entregue') return st==='entregue' || st==='finalizado'; return payrollEligibleStatuses().includes(st); }
  function serviceEmployeeIds(s){ let ids=s&&s.payroll_employee_ids; if(typeof ids==='string'){ try{ ids=JSON.parse(ids); }catch(_){ ids=[]; } } if(!Array.isArray(ids)) ids=[]; if((!ids.length) && s && s.payroll_employee_id) ids=[s.payroll_employee_id]; return ids.filter(Boolean); }
  function servicePayrollPaidMap(s){ let map=s&&s.payroll_paid_map; if(typeof map==='string'){ try{ map=JSON.parse(map); }catch(_){ map={}; } } return map && typeof map==='object' && !Array.isArray(map) ? map : {}; }
  function servicePayrollAmountForEmployee(s, employeeId){ const e=getPayrollEmployee(employeeId); if(!e.id) return 0; const mode=String(e.payment_mode||'percentual'); if(mode==='valor_servico') return num(e.service_fixed_value); return num(s.value) * num(e.percent_value) / 100; }
  function servicePayrollTotal(s){ return serviceEmployeeIds(s).reduce((a,id)=>a+servicePayrollAmountForEmployee(s,id),0); }
  function payrollPaidForServiceEmployee(s, employeeId){ const map=servicePayrollPaidMap(s); if(map[employeeId]===true) return true; return !!(s.payroll_employee_id===employeeId && s.payroll_paid); }
  function payrollPaidForService(s){ const ids=serviceEmployeeIds(s); return ids.length ? ids.every(id=>payrollPaidForServiceEmployee(s,id)) : !!s.payroll_paid; }
  function employeePayrollSummary(employeeId){ const list=(state.services||[]).filter(s=>serviceEmployeeIds(s).includes(employeeId) && servicePayrollReleased(s)); const total=list.reduce((a,s)=>a+servicePayrollAmountForEmployee(s,employeeId),0); const paid=list.filter(s=>payrollPaidForServiceEmployee(s,employeeId)).reduce((a,s)=>a+servicePayrollAmountForEmployee(s,employeeId),0); return {list,total,paid,pending:total-paid}; }

  function documentModelPreviewHtml(c){
    const comp=Object.assign(defaultCompany(), c||{});
    const logo=comp.logo_url ? `<img src="${html(comp.logo_url)}" alt="Logo">` : '<b>LOGO</b>';
    return `<div class="docPreviewReal" style="--doc-primary:${html(comp.quote_primary_color||'#111111')};--doc-secondary:${html(comp.quote_secondary_color||'#8b8b8b')};--doc-accent:${html(comp.quote_accent_color||'#dc2626')};--doc-text:${html(comp.quote_text_color||'#111827')}"><div class="docPreviewHeader"><div class="docPreviewLogo">${logo}</div><div><b>${html(comp.company_name||'Top Planejados')}</b><span>Contrato / recibo</span></div></div><div class="docPreviewBody"><p><b>Cliente:</b> Nome do cliente</p><p><b>Serviço:</b> Móveis planejados</p><div class="docPreviewTotal">R$ 0,00</div></div><div class="docPreviewFoot">Assinatura da empresa &nbsp;&nbsp; | &nbsp;&nbsp; Assinatura do cliente</div></div>`;
  }
  function docColors(comp){ comp=Object.assign(defaultCompany(), comp||{}); return {primary:comp.quote_primary_color||'#111111', secondary:comp.quote_secondary_color||'#8b8b8b', accent:comp.quote_accent_color||'#dc2626', text:comp.quote_text_color||'#111827'}; }
  function contractLogoHtml(comp){ return comp.logo_url ? `<img class="contractLogo" src="${html(comp.logo_url)}">` : `<div class="contractLogoFallback">TP</div>`; }
  function contractStyleAttr(comp){ const c=docColors(comp); return `style="--doc-primary:${html(c.primary)};--doc-secondary:${html(c.secondary)};--doc-accent:${html(c.accent)};--doc-text:${html(c.text)}"`; }
  function contractHeaderHtml(comp,title,sub){ return `<div class="contractHeader"><div class="contractHeaderBg"></div>${contractLogoHtml(comp)}<div><h1>${html(title)}</h1><b>${html(comp.company_name||'Top Planejados')}</b><br><span>${html(comp.phone||comp.whatsapp||'')} ${comp.instagram?'• '+html(comp.instagram):''}</span><br><small>${html(comp.address||'')}</small></div></div>`; }
  function contractPartiesHtml(comp,c){ return `<div class="contractMeta"><div><b>Contratada</b><br>${html(comp.company_name||'Top Planejados')}<br>CPF/CNPJ: ${html(comp.document_number||'-')}<br>Responsável: ${html(comp.responsible_name||'-')}<br>Endereço: ${html(comp.address||'-')}</div><div><b>Contratante</b><br>${html(c.name||'Cliente selecionado')}<br>CPF/CNPJ: ${html(c.document_number||'-')}<br>Telefone: ${html(c.phone||'-')}<br>Endereço: ${html(c.address||'-')} ${c.city?' - '+html(c.city):''}</div></div>`; }
  function sectionHtml(title,body){ return `<section class="contractSection"><h2>${html(title)}</h2>${body}</section>`; }
  function syncReceiptPaymentFromContract(force){ const cp=$('#contractPayment'), rp=$('#receiptPayment'); if(!cp||!rp) return; const cur=String(rp.value||'').trim().toLowerCase(); if(force || !state.receiptPaymentTouched || cur==='' || cur==='pix') rp.value=cp.value.trim() || 'PIX'; }
  function contractPrintCss(){ return `body{font-family:Arial;padding:20px;color:#111;background:#f3f4f6}.contract{max-width:900px;margin:auto;background:#fff;padding:0;line-height:1.55}.contractDoc{background:#fff;color:var(--doc-text,#111827);border-radius:14px;overflow:hidden;border:1px solid #e5e7eb}.contractHeader{position:relative;display:flex;gap:18px;align-items:center;padding:22px 24px;color:#fff;background:var(--doc-primary,#111)}.contractHeaderBg{position:absolute;left:0;right:0;bottom:-18px;height:42px;background:var(--doc-secondary,#999);opacity:.38;border-radius:0 0 50% 50%}.contractHeader>*:not(.contractHeaderBg){position:relative;z-index:2}.contractLogo{width:86px;height:86px;object-fit:contain;background:#fff;border-radius:12px;padding:8px}.contractLogoFallback{width:86px;height:86px;background:#fff;color:var(--doc-primary,#111);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:28px;border-radius:12px}.contractHeader h1{font-size:24px;margin:0;color:#fff}.contractHeader b{color:#fff}.contractMeta,.paymentCards,.contractSigs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 24px}.contractMeta>div,.paymentCards>div{border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fff}.contractSection{margin:18px 24px}.contract h2{font-size:16px;margin:0 0 8px;color:var(--doc-primary,#111);border-bottom:2px solid var(--doc-accent,#dc2626);padding-bottom:5px}.contract table{width:100%;border-collapse:collapse}.contract td,.contract th{border:1px solid #ddd;padding:7px}.receiptValue{font-size:30px;font-weight:900;margin:18px 24px;padding:18px;border:2px solid var(--doc-accent,#dc2626);border-radius:14px;text-align:center;color:var(--doc-primary,#111);background:#f9fafb}.contractCity{margin:24px}.contractSigs{margin-top:42px;text-align:center}.annexProjectImage{max-width:100%;max-height:260px;object-fit:contain}.annexGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.model-formal .contractHeader{background:#fff;color:var(--doc-text,#111);border-bottom:4px solid var(--doc-primary,#111)}.model-formal .contractHeader h1,.model-formal .contractHeader b{color:var(--doc-primary,#111)}.model-formal .contractHeader span,.model-formal .contractHeader small{color:var(--doc-text,#111)}.model-formal .contractHeaderBg{display:none}.model-compacto .contractHeader{padding:14px;background:var(--doc-primary,#111)}.model-compacto .contractLogo,.model-compacto .contractLogoFallback{width:64px;height:64px}.printBtn{position:fixed;right:18px;top:18px;padding:10px 14px}.receiptSheet{background:#fff;color:var(--doc-text,#111827);border:1px solid #d1d5db;border-radius:14px;overflow:hidden;max-width:920px;margin:auto;font-family:Arial,sans-serif}.receiptTop{display:grid;grid-template-columns:90px 1fr 180px;gap:14px;align-items:center;padding:18px 22px;background:linear-gradient(135deg,var(--doc-primary,#111),var(--doc-secondary,#555));color:#fff}.receiptTop h1{margin:0;font-size:24px;color:#fff}.receiptTop p{margin:4px 0 0;color:#f8fafc}.receiptLogo{width:78px;height:78px;object-fit:contain;background:#fff;border-radius:12px;padding:8px}.receiptLogoFallback{width:78px;height:78px;display:flex;align-items:center;justify-content:center;background:#fff;color:var(--doc-primary,#111);border-radius:12px;font-weight:900;font-size:26px}.receiptAmountBox{background:#fff;color:var(--doc-primary,#111);border-radius:12px;padding:14px;text-align:center;font-size:22px;font-weight:900}.receiptTable{width:calc(100% - 44px);margin:18px 22px;border-collapse:collapse;background:#fff}.receiptTable th{background:var(--doc-secondary,#777);color:#fff;text-align:left;padding:9px}.receiptTable td{border:1px solid #d1d5db;padding:8px;vertical-align:top}.receiptItems th{background:var(--doc-primary,#111)}.receiptStrong{font-size:18px;font-weight:900;color:var(--doc-primary,#111)}.receiptDeclaration{margin:18px 22px;border-left:4px solid var(--doc-accent,#dc2626);background:#f8fafc;padding:12px;line-height:1.5}.receiptSigs{display:grid;grid-template-columns:1fr 1fr;gap:22px;text-align:center;margin:42px 22px 24px}@media print{body{background:#fff;padding:0}.printBtn{display:none}.contract{padding:0}.contractDoc{border:0}}`; }

  function domSafe(v){ return String(v||'').replace(/[^a-zA-Z0-9_-]/g,'_'); }
  function roleBadges(roles){
    const clean=normalizedTeamRoles(roles);
    return clean.length ? clean.map(r=>`<span class="badge roleBadge">${html(roleLabel(r))}</span>`).join(' ') : '<span class="muted small">sem cargo</span>';
  }
  function teamRoleChecks(userId, roles){
    const current=new Set(normalizedTeamRoles(roles));
    const safe=domSafe(userId);
    return `<div class="roleChecks">${TEAM_ROLES.map(r=>`<label class="check roleCheck" title="${html(r.desc)}"><input id="team_role_${safe}_${r.id}" type="checkbox" ${current.has(r.id)?'checked':''}> ${html(r.label)}</label>`).join('')}</div>`;
  }
  function renderCompanyTeamAccess(){
    if(!hasPerm('members.manage')){
      return `<div class="card" style="margin-top:14px"><h3>Equipe e acesso ao sistema</h3><div class="notice">Aqui ficam os acessos dos funcionários. Seu cargo atual não permite liberar pessoas nem alterar cargos.</div></div>`;
    }
    const users=(state.adminProfiles||[]);
    const rows=users.map(u=>{
      const owner=isOwnerEmail(u.email||'');
      const roles=normalizedTeamRoles(u.roles || (u.role==='admin'?['owner']:['seller']));
      const safe=domSafe(u.id);
      const active = u.company_active == null ? !!u.active : !!u.company_active;
      const status = active ? '<span class="status ativo">liberado</span>' : '<span class="status recusado">bloqueado</span>';
      const controls = owner ? '<span class="badge adminKeep">conta principal protegida</span>' : `<label class="check"><input id="team_active_${safe}" type="checkbox" ${active?'checked':''}> acesso liberado</label>${teamRoleChecks(u.id,roles)}<button class="primary mini" onclick="TP.saveCompanyMemberRoles('${u.id}')">Salvar cargos</button>`;
      return [html(u.name||'-'), html(u.email||'-'), status, roleBadges(roles), `<div class="teamControls">${controls}</div>`];
    });
    return `<div class="card" style="margin-top:14px"><div class="toolbar"><h3>Equipe e acesso ao sistema</h3><button class="ghost" onclick="TP.loadAdminUsers()">Recarregar usuários</button></div><div class="notice goldline"><b>Não confundir:</b> esta área libera acesso ao sistema e define cargos. A aba <b>Funcionários</b> continua sendo folha/valor por serviço. Para adicionar alguém novo, a pessoa cria acesso na tela de login e depois você libera aqui.</div>${table(['Nome','E-mail','Acesso','Cargos','Gerenciar'], rows)}</div>`;
  }

  function renderCompany(){
    const c = state.company || defaultCompany();
    const model = c.contract_model || 'comercial';
    const receiptModel = c.receipt_model || 'comercial';
    return `<div class="grid2"><div class="card form"><h3>Dados oficiais da empresa</h3><div class="notice goldline">Esses dados alimentam orçamento, contrato, recibo e documentos da operação.</div><form id="companyForm"><label>Nome da empresa</label><input id="companyName" value="${html(c.company_name)}"><label>CPF/CNPJ</label><input id="companyDoc" value="${html(c.document_number)}"><label>Responsável</label><input id="companyResponsible" value="${html(c.responsible_name)}"><label>Telefone</label><input id="companyPhone" value="${html(c.phone)}"><label>WhatsApp</label><input id="companyWhatsapp" value="${html(c.whatsapp)}"><label>Instagram</label><input id="companyInstagram" value="${html(c.instagram)}"><label>Endereço</label><input id="companyAddress" value="${html(c.address)}"><label>Chave PIX</label><input id="companyPix" value="${html(c.pix_key)}"><label>Cidade do contrato/orçamento</label><input id="companyCity" value="${html(c.contract_city)}"><button class="primary" type="submit">Salvar empresa</button></form></div><div class="card form"><h3>Documentos da empresa</h3><div class="notice">Escolha logo, cores e modelo. A prévia abaixo fica parecida com o contrato/recibo real.</div><label>Logo da empresa</label><input id="companyLogoFile" type="file" accept="image/*"><input id="companyLogo" value="${html(c.logo_url||'')}" placeholder="Cole uma URL/base64 ou envie uma imagem acima"><div class="form-grid"><div><label>Cor principal</label><input id="quotePrimary" type="color" value="${html(c.quote_primary_color||'#111111')}"></div><div><label>Cor secundária/onda</label><input id="quoteSecondary" type="color" value="${html(c.quote_secondary_color||'#8b8b8b')}"></div><div><label>Cor de destaque</label><input id="quoteAccent" type="color" value="${html(c.quote_accent_color||'#dc2626')}"></div><div><label>Cor do texto</label><input id="quoteText" type="color" value="${html(c.quote_text_color||'#111827')}"></div></div><div class="form-grid"><div><label>Modelo do contrato</label><select id="contractModel"><option value="comercial" ${model==='comercial'?'selected':''}>Comercial com cabeçalho</option><option value="formal" ${model==='formal'?'selected':''}>Formal limpo</option><option value="compacto" ${model==='compacto'?'selected':''}>Compacto simples</option></select></div><div><label>Modelo do recibo</label><select id="receiptModel"><option value="comercial" ${receiptModel==='comercial'?'selected':''}>Comercial com valor destacado</option><option value="formal" ${receiptModel==='formal'?'selected':''}>Formal limpo</option><option value="compacto" ${receiptModel==='compacto'?'selected':''}>Compacto simples</option></select></div></div><label>Título padrão do orçamento</label><input id="quoteTitle" value="${html(c.quote_title||'ORÇAMENTO DE SERVIÇO')}"><div class="form-grid"><div><label>Validade do orçamento em dias</label><input id="quoteValidDays" type="number" value="${html(c.quote_valid_days||7)}"></div><div><label>Cidade</label><input value="${html(c.contract_city||'')}" disabled></div></div><label>Texto de garantia</label><textarea id="quoteWarranty">${html(c.quote_warranty||defaultCompany().quote_warranty)}</textarea><label>Observação final personalizada</label><textarea id="quoteFooterNote" placeholder="Ex: orçamento sujeito a alteração após medição técnica...">${html(c.quote_footer_note||'')}</textarea>${documentModelPreviewHtml(c)}<p class="muted small">Depois de alterar, clique em <b>Salvar personalização</b> para gravar dados e layout.</p><button class="primary" type="button" onclick="document.getElementById('companyForm').requestSubmit()">Salvar personalização</button></div></div><div class="grid2" style="margin-top:14px"><div class="card form"><h3>Valores por metro da planilha</h3><div class="notice">Mesma lógica da planilha antiga: <b>quantidade × largura(mm) × altura(mm) convertido para m² × fator do móvel × valor por metro × forma de pagamento</b>.</div><form id="priceForm"><label>Branco</label><input id="priceWhite" type="number" step="0.01" value="${html(c.price_white)}"><label>Branco com madeirado</label><input id="priceWhiteWood" type="number" step="0.01" value="${html(c.price_white_wood)}"><label>Madeirado</label><input id="priceWood" type="number" step="0.01" value="${html(c.price_wood)}"><label>Multiplicador cartão</label><input id="cardFactor" type="number" step="0.01" value="${html(c.card_factor)}"><div class="form-grid"><div><label>% entrada padrão</label><input id="entryPct" type="number" value="${html(c.entry_pct)}"></div><div><label>% entrega padrão</label><input id="deliveryPct" type="number" value="${html(c.delivery_pct)}"></div></div><button class="primary" type="submit">Salvar preços</button></form></div><div class="card"><h3>Catálogo de fatores</h3><div class="table-wrap compact-table"><table class="table"><thead><tr><th>Cód.</th><th>Móvel</th><th>Fator</th></tr></thead><tbody>${CATALOG.map(ca=>`<tr><td>${ca.code}</td><td>${html(ca.name)}</td><td><b>${ca.factor}</b></td></tr>`).join('')}</tbody></table></div></div></div>${renderCompanyTeamAccess()}`;
  }

  function renderClients(){
    const rows = state.clients.map(c=>[`<button class="linkRow" onclick="TP.editClient('${c.id}')"><b>${html(c.name)}</b></button>`, html(c.document_number||'-'), html(c.phone||'-'), html(c.city||'-'), statusBadge2('client',c.status), fmtDate((c.created_at||'').slice(0,10)), `<div class="row-actions"><button class="ghost mini" onclick="TP.editClient('${c.id}')">Editar</button><button class="success mini" onclick="TP.openClientBudget('${c.id}')">Orçamento</button><button class="danger mini" onclick="TP.deleteClient('${c.id}')">Excluir</button></div>`]);
    return `<div class="split"><div class="card form"><h3 id="clientFormTitle">Novo cliente</h3><div class="notice">Cadastre o cliente uma vez. Orçamentos, contratos, serviços e financeiro vão usar esse cadastro.</div><form id="clientForm"><input type="hidden" id="clientId"><label>Nome</label><input id="clientName" required><label>CPF/CNPJ do cliente</label><input id="clientDoc" placeholder="000.000.000-00"><label>Telefone/WhatsApp</label><input id="clientPhone"><label>Cidade</label><input id="clientCity" value="Porto Velho - RO"><label>Endereço</label><input id="clientAddress"><label>Origem do cliente</label><input id="clientSource" placeholder="Instagram, indicação, WhatsApp..."><label>Status</label><select id="clientStatus">${statusOptions('client','ativo')}</select><label>Observações</label><textarea id="clientNotes"></textarea><div class="row-actions"><button class="primary" type="submit">Salvar cliente</button><button class="ghost" type="button" onclick="TP.clearClientForm()">Limpar</button></div></form></div><div class="card"><div class="toolbar"><h3>Clientes cadastrados</h3><input class="search" id="clientSearch" placeholder="Pesquisar cliente..."></div><div id="clientTable">${table(['Nome','CPF/CNPJ','Telefone','Cidade','Status','Cadastro','Ações'], rows)}</div></div></div>`;
  }

  function projectImages(p){
    const raw=String((p&&p.project_image_url)||'').trim();
    if(!raw) return [];
    return raw.split(/\n|\|\|/).map(x=>x.trim()).filter(Boolean);
  }

  function clientBudgetProjects(clientId, excludeProjectId){
    if(!clientId) return [];
    return (state.projects||[]).filter(p=>String(p.client_id)===String(clientId) && String(p.id)!==String(excludeProjectId||'') && Array.isArray(p.budget_items) && p.budget_items.length);
  }
  function clientBudgetItems(clientId, excludeProjectId){
    const projects=clientBudgetProjects(clientId, excludeProjectId);
    const out=[];
    projects.forEach(p=>{ (p.budget_items||[]).forEach(it=>out.push(Object.assign({}, it, {source_project_id:p.id, source_project_name:p.name||'Orçamento'}))); });
    return out;
  }
  function clientBudgetItemsSummaryHtml(clientId, excludeProjectId){
    const items=clientBudgetItems(clientId, excludeProjectId);
    if(!clientId) return '<div class="notice">Selecione um cliente para ver se ele já possui móveis/orçamentos vinculados.</div>';
    if(!items.length) return '<div class="notice">Este cliente ainda não possui móveis em orçamentos anteriores.</div>';
    const rows=items.slice(0,12).map(it=>[html(it.desc||it.name||'Móvel'), num(it.qty)||1, `${Math.round(num(it.width)||0)} x ${Math.round(num(it.height)||0)} mm`, html(it.source_project_name||'-')]);
    const more=items.length>12?`<p class="muted small">+ ${items.length-12} item(ns) ocultos nesta prévia.</p>`:'';
    return `<div class="notice greenline"><b>${items.length} móvel(is) encontrados para este cliente.</b><br><span class="muted small">Ao marcar a opção abaixo, esses móveis serão puxados para este projeto ao salvar.</span></div>${table(['Móvel','Qtd','Medida','Origem'],rows)}${more}`;
  }
  function updateProjectClientBudgetBox(clientId){
    const box=$('#projectClientBudgetBox'); if(!box) return;
    const exclude=($('#projectId')&&$('#projectId').value)||'';
    box.innerHTML=clientBudgetItemsSummaryHtml(clientId, exclude);
    const check=$('#projectImportClientItems'); if(check) check.checked=!!clientBudgetItems(clientId, exclude).length && !exclude;
  }
  function importItemsForProject(clientId, excludeProjectId, currentItems){
    const existing=Array.isArray(currentItems)?currentItems.slice():[];
    const seen=new Set(existing.map(it=>[String(it.desc||it.name||''),Math.round(num(it.width)||0),Math.round(num(it.height)||0),String(it.code||'')].join('|')));
    clientBudgetItems(clientId, excludeProjectId).forEach(it=>{
      const key=[String(it.desc||it.name||''),Math.round(num(it.width)||0),Math.round(num(it.height)||0),String(it.code||'')].join('|');
      if(seen.has(key)) return;
      seen.add(key);
      const clean=Object.assign({}, it, {id:uid(), note:(it.note||'') + (it.source_project_name ? ' | puxado de '+it.source_project_name : '')});
      delete clean.source_project_id; delete clean.source_project_name; existing.push(clean);
    });
    return existing;
  }

  function renderProjects(){
    const rows = state.projects.map(p=>{
      const items=(p.budget_items||[]).length;
      const projectStatusSelect = `<select class="miniInput statusMini" onchange="TP.updateProjectStatus('${p.id}',this.value)">${statusOptions('project',p.project_status)}</select>`;
      const budgetStatusSelect = `<select class="miniInput statusMini" onchange="TP.updateBudgetStatus('${p.id}',this.value)">${statusOptions('budget',p.status)}</select>`;
      return [
        `<button class="linkRow" onclick="TP.editProject('${p.id}')"><b>${html(p.name)}</b></button>`,
        html(getClient(p.client_id).name||'-'),
        html(p.environment||'-'),
        projectImages(p).length?'<span class="badge green">'+projectImages(p).length+' imagem(ns)</span>':'<span class="muted small">sem imagem</span>',
        items?'<span class="badge green">'+items+' móvel(is)</span>':'<span class="muted small">sem móveis</span>',
        projectStatusSelect,
        budgetStatusSelect,
        `<div class="row-actions"><button class="ghost mini" onclick="TP.editProject('${p.id}')">Editar</button><button class="ghost mini" onclick="TP.openProjectBudget('${p.id}')">Orçamento</button><button class="danger mini" onclick="TP.deleteProject('${p.id}')">Excluir</button></div>`
      ];
    });
    const firstClient = (state.clients[0]&&state.clients[0].id)||'';
    return `<div class="split"><div class="card form"><h3 id="projectFormTitle">Novo projeto</h3><div class="notice">O projeto guarda cliente, ambiente, anexos e dados técnicos. O orçamento será montado depois, sempre vinculado a este projeto.</div><form id="projectForm"><input type="hidden" id="projectId"><label>Cliente</label><select id="projectClient" required>${clientOptions(firstClient)}</select><label>Título do projeto</label><input id="projectName" required placeholder="Ex: Cozinha, Quarto casal, Escritório..."><label>Ambiente</label><select id="projectEnv"><option>Cozinha</option><option>Quarto</option><option>Banheiro</option><option>Sala</option><option>Escritório</option><option>Área gourmet</option><option>Lavanderia</option><option>Outro</option></select><label>Cores/materiais</label><input id="projectColors" placeholder="Branco TX, Nude, Preto São Gabriel..."><label>Imagens do projeto</label><div class="dropzone compact"><b>Importar imagens do projeto</b><br><span class="muted">Pode adicionar mais de uma imagem, uma por vez.</span><br><input id="projectImageFile" type="file" accept="image/*"></div><textarea id="projectImageUrl" placeholder="As imagens importadas aparecem aqui. Uma URL/base64 por linha."></textarea><div id="projectImagePreview" class="project-image-preview multi"></div><label>Status do projeto</label><select id="projectStatus">${statusOptions('project','em_criacao')}</select><label>Observações técnicas</label><textarea id="projectNotes"></textarea><div class="row-actions"><button class="primary" type="submit">Salvar projeto</button><button class="ghost" type="button" onclick="TP.clearProjectForm()">Limpar</button></div></form></div><div class="card"><div class="toolbar"><h3>Projetos</h3><input class="search" id="projectSearch" placeholder="Pesquisar projeto..."></div><div class="notice greenline">Agora você pode alterar <b>Status do projeto</b> e <b>Status do orçamento</b> direto na tabela, sem entrar em editar.</div><div id="projectTable">${table(['Projeto','Cliente','Ambiente','Imagens','Móveis','Status projeto','Status orçamento','Ações'], rows)}</div></div></div>`;
  }

  function selectedBudgetProject(){ const id = $('#budgetProject') ? $('#budgetProject').value : state.budgetProjectId; return getProject(id); }
  function renderBudget(){
    const pid = state.budgetProjectId || '';
    const data=operationData(pid); const p=data.project, c=data.client, tt=data.totals, items=data.items;
    return `<div class="clearFlow card"><div><span class="badge">Fluxo da ${html((state.company&&state.company.company_name)||'Top Planejados')}</span><h3>Cliente → Projeto → Orçamento → Aprovação → Contrato</h3><p class="muted">O orçamento volta a ser gerado com base em um projeto. Crie ou selecione o projeto primeiro para puxar cliente, ambiente, imagens e dados técnicos corretamente.</p></div><div class="row-actions"><button class="ghost" onclick="TP.openTabKey('projects')">Criar/abrir projeto</button><button class="ghost" onclick="TP.openTabKey('contracts')">Contratos</button></div></div>
    <div class="card form" style="margin-top:14px"><h3>1. Selecione o projeto do orçamento</h3><div class="form-grid"><div><label>Projeto / orçamento base</label><select id="budgetProject">${quoteProjectOptions(pid)}</select><p class="muted small">Obrigatório. O orçamento puxa os dados do cliente e do ambiente pelo projeto selecionado.</p></div><div><label>Cliente vinculado</label><div id="budgetClientDetails">${p.id ? clientBudgetDetailsHtml(c.id) : '<div class="notice redline">Selecione um projeto para carregar o cliente.</div>'}</div></div><div><label>Total atual</label><div class="notice greenline"><b>${money(tt.final)}</b><br><span class="muted small">Subtotal ${money(tt.subtotal)} • Entrada ${money(tt.entry)} • Entrega ${money(tt.delivery)}</span></div></div></div></div>
    ${!p.id ? `<div class="card" style="margin-top:14px"><h3>Orçamento precisa de projeto</h3><div class="notice goldline">Para evitar dados soltos e contrato errado, crie um projeto primeiro. Depois volte aqui e monte o orçamento com os móveis.</div><button class="primary" onclick="TP.openTabKey('projects')">Ir para Projetos</button></div>` : `<div class="grid2" style="margin-top:14px"><div class="card form"><h3>2. Adicionar item</h3><div class="notice">Móvel vinculado ao projeto <b>${html(p.name||'-')}</b> e ao cliente <b>${html(c.name||'-')}</b>.</div><label>Móvel da tabela</label><select id="iCatalog">${catalogOptions('')}</select><div class="form-grid compactInputs"><div><label>Qtd.</label><input id="iQty" type="number" value="1"></div><div><label>Largura mm</label><input id="iWidth" type="number" step="1" value="1000"></div><div><label>Altura mm</label><input id="iHeight" type="number" step="1" value="1000"></div><div><label>Fator</label><input id="iFactor" type="number" step="0.01" value="${CATALOG[0].factor}"></div><div><label>Cor / tipo</label><select id="iColor"><option value="branco">Branco</option><option value="branco_madeirado">Branco com madeirado</option><option value="madeirado">Madeirado</option></select></div><div><label>Pagamento do item</label><select id="iPayment">${budgetPaymentSelectOptions('dinheiro')}</select></div></div><label>Observação do item</label><input id="iNote" placeholder="Ex: puxador perfil, sem pedra/cuba..."><button class="primary" onclick="TP.addBudgetItem()">Adicionar item ao orçamento</button></div><div class="card form"><h3>3. Status, pagamento e prazo</h3><form id="budgetFieldsForm"><label>Status do orçamento</label><select id="budgetStatus">${statusOptions('budget',p.status||'rascunho')}</select><div class="form-grid compactInputs"><div><label>Desconto R$</label><input id="bDiscount" type="number" step="0.01" value="${html(p.budget_discount||0)}"></div><div><label>% entrada</label><input id="bEntry" type="number" value="${html(pctValue(p.entry_pct, state.company.entry_pct || 50))}"></div><div><label>% entrega</label><input id="bDelivery" type="number" value="${html(pctValue(p.delivery_pct, state.company.delivery_pct || 50))}"></div><div><label>Início do prazo</label><input id="bStart" type="date" value="${html(p.contract_start || today())}"></div><div><label>Prazo em dias</label><input id="bDays" type="number" value="${html(p.delivery_days || 30)}"></div></div><label>Modelos rápidos de pagamento</label><select id="budgetPaymentPreset" onchange="TP.applyPaymentPreset('budget')">${paymentPresetOptions(paymentPresetFromProject(p))}</select><div class="row-actions" style="margin:8px 0"><button type="button" class="ghost" onclick="TP.setPaymentSplit(100,0,'100% à vista no fechamento.')">100% no fechamento</button><button type="button" class="ghost" onclick="TP.setPaymentSplit(50,50,'50% à vista no fechamento + 50% à vista na entrega.')">50/50</button><button type="button" class="ghost" onclick="TP.setSupplierSplit()">50% fornecedor/loja + entrega</button><button type="button" class="ghost" onclick="TP.setPaymentSplit(0,100,'100% à vista na entrega.')">Na entrega</button></div><label>Forma/observação de pagamento</label><textarea id="bPaymentNote" placeholder="Condição comercial do orçamento">${html(p.budget_payment_note||'')}</textarea><div class="row-actions"><button class="primary" type="submit">Salvar orçamento</button><button class="success" type="button" onclick="TP.markBudgetApproved('${p.id}')">Marcar aprovado</button><button class="ghost" type="button" onclick="TP.exportBudgetHtml()">Gerar PDF</button></div></form></div></div><div class="card" style="margin-top:14px"><div class="toolbar"><h3>4. Itens editáveis do orçamento</h3><span class="badge">edite direto na tabela e clique salvar</span></div>${budgetItemsTable(p, items)}</div>`}`;
  }
  function budgetItemsTable(p, items){
    if(!items.length) return '<div class="empty">Nenhum item no orçamento ainda.</div>';
    const rows = items.map(it=>{
      const id=String(it.id); const esc=id.replace(/[^a-zA-Z0-9_-]/g,'_');
      return [
        `<input class="miniInput wide" id="bi_desc_${esc}" value="${html(it.desc||it.name||'')}">`,
        `<input class="miniInput tiny" type="number" id="bi_qty_${esc}" value="${html(num(it.qty)||1)}">`,
        `<input class="miniInput small" type="number" id="bi_w_${esc}" value="${html(Math.round(num(it.width)))}"> x <input class="miniInput small" type="number" id="bi_h_${esc}" value="${html(Math.round(num(it.height)))}">`,
        `<input class="miniInput tiny" type="number" step="0.01" id="bi_factor_${esc}" value="${html(num(it.factor)||1)}">`,
        `<select class="miniInput" id="bi_color_${esc}"><option value="branco" ${it.color==='branco'?'selected':''}>Branco</option><option value="branco_madeirado" ${it.color==='branco_madeirado'?'selected':''}>Branco/madeirado</option><option value="madeirado" ${it.color==='madeirado'?'selected':''}>Madeirado</option></select>`,
        `<select class="miniInput paymentMini" id="bi_payment_${esc}">${budgetPaymentSelectOptions(it.payment||'dinheiro')}</select>`,
        money(itemTotal(it)),
        `<div class="row-actions nowrap"><button class="ghost mini" onclick="TP.updateBudgetItem('${p.id}','${id}')">Salvar</button><button class="ghost mini" onclick="TP.duplicateBudgetItem('${p.id}','${id}')">Duplicar</button><button class="danger mini" onclick="TP.removeBudgetItem('${p.id}','${id}')">Remover</button></div>`
      ];
    });
    return table(['Móvel','Qtd','Medidas','Fator','Cor','Pagamento','Total','Ações'], rows);
  }


  function renderProduction(){
    const approved=(state.projects||[]).filter(p=>normalizeStatus('budget',p.status)==='aprovado' || ['em_producao','aguardando_material','finalizado','entregue'].includes(normalizeStatus('production',p.production_status)));
    const rows=approved.map(p=>[html(p.name), html(getClient(p.client_id).name||'-'), html(p.environment||'-'), money(projectTotal(p).final||p.budget_value), statusBadge2('production',p.production_status||'nao_iniciado'), `<div class="row-actions"><button class="ghost mini" onclick="TP.openProjectBudget('${p.id}')">Orçamento</button><button class="ghost mini" onclick="TP.setProductionStatus('${p.id}','em_producao')">Em produção</button><button class="warning mini" onclick="TP.setProductionStatus('${p.id}','aguardando_material')">Aguard. material</button><button class="success mini" onclick="TP.setProductionStatus('${p.id}','entregue')">Entregue</button></div>`]);
    return `<div class="card"><div class="toolbar"><h3>Produção</h3><input class="search" id="productionSearch" placeholder="Pesquisar produção..."></div><div class="notice">Aqui aparecem orçamentos aprovados. Campos como fornecedor, material comprado e entrega ficam nesta etapa, não no começo do orçamento.</div><div id="productionTable">${table(['Projeto','Cliente','Ambiente','Valor aprovado','Status produção','Ações'], rows)}</div></div>`;
  }
  function renderSuppliers(){
    const rows=(state.suppliers||[]).map(f=>[html(f.name), html(f.phone||'-'), html(f.material_type||'-'), html(f.address||'-'), html(f.notes||'-'), `<div class="row-actions"><button class="ghost mini" onclick="TP.editSupplier('${f.id}')">Editar</button><button class="danger mini" onclick="TP.deleteSupplier('${f.id}')">Excluir</button></div>`]);
    return `<div class="split"><div class="card form"><h3 id="supplierFormTitle">Novo fornecedor</h3><form id="supplierForm"><input type="hidden" id="supplierId"><label>Nome</label><input id="supplierName" required placeholder="Ex: Madeireira, loja de ferragens"><label>Telefone</label><input id="supplierPhone"><label>Endereço</label><input id="supplierAddress"><label>Tipo de material fornecido</label><input id="supplierType" placeholder="MDF, ferragens, pedras, acessórios..."><label>Observações</label><textarea id="supplierNotes"></textarea><div class="row-actions"><button class="primary" type="submit">Salvar fornecedor</button><button class="ghost" type="button" onclick="TP.clearSupplierForm()">Limpar</button></div></form></div><div class="card"><div class="toolbar"><h3>Fornecedores</h3><input class="search" id="supplierSearch" placeholder="Pesquisar fornecedor..."></div><div id="supplierTable">${table(['Nome','Telefone','Material','Endereço','Obs.','Ações'], rows)}</div></div></div>`;
  }
  function renderServices(){
    const rows = state.services.map(s=>{ const ids=serviceEmployeeIds(s); const names=ids.map(id=>getPayrollEmployee(id).name).filter(Boolean); const pay=servicePayrollTotal(s); return [`<button class="linkRow" onclick="TP.editService('${s.id}')"><b>${html(s.title)}</b></button>`, html(getClient(s.client_id).name||'-'), html(getProject(s.project_id).name||'-'), names.length?names.map(html).join('<br>'):'-', money(s.value), money(s.cost), fmtDate(s.started_at), fmtDate(s.closed_at), statusBadge2('service',s.status), pay?`${String(s.payroll_release_mode||'status')==='entregue'?'<span class="muted small">só na entrega</span><br>':''}${payrollPaidForService(s)?'<span class="status entregue">equipe paga</span>':'<span class="status aguardando_inicio">há pendências</span>'}<br><b>${money(pay)}</b>`:'-', `<div class="row-actions"><button class="ghost mini" onclick="TP.editService('${s.id}')">Editar</button><button class="success mini" onclick="TP.markServiceDelivered('${s.id}')">Entregue</button><button class="danger mini" onclick="TP.deleteService('${s.id}')">Excluir</button></div>`]; });
    return `<div class="split"><div class="card form"><h3 id="serviceFormTitle">Novo serviço</h3><div class="notice">Serviço acompanha execução e equipe. Ele deve nascer de um orçamento aprovado ou ser vinculado a um projeto existente.</div><form id="serviceForm"><input type="hidden" id="serviceId"><label>Cliente</label><select id="serviceClient" required>${clientOptions()}</select><label>Projeto vinculado</label><select id="serviceProject">${projectOptions()}</select><label>Título do serviço</label><input id="serviceTitle" required placeholder="Ex: Cozinha cliente X"><label>Status</label><select id="serviceStatus">${statusOptions('service','aguardando_inicio')}</select><label>Equipe que recebe por este serviço</label>${payrollEmployeeChecklist([])}<p class="muted small">Marque todos os funcionários que recebem por este serviço. Cada um entra separado em Funcionários.</p><label class="check wideCheck"><input id="servicePayOnDelivery" type="checkbox"> funcionários recebem somente quando o serviço for entregue</label><div class="form-grid"><div><label>Valor</label><input id="serviceValue" type="number" step="0.01" value="0"></div><div><label>Custo</label><input id="serviceCost" type="number" step="0.01" value="0"></div><div><label>Início</label><input id="serviceStart" type="date" value="${today()}"></div><div><label>Entregue/finalizado em</label><input id="serviceClose" type="date"></div></div><label>Observações</label><textarea id="serviceNotes"></textarea><div class="row-actions"><button class="primary" type="submit">Salvar serviço</button><button class="ghost" type="button" onclick="TP.clearServiceForm()">Limpar</button></div></form></div><div class="card"><div class="toolbar"><h3>Serviços</h3><input class="search" id="serviceSearch" placeholder="Pesquisar serviço..."></div><div id="serviceTable">${table(['Serviço','Cliente','Projeto','Equipe','Valor','Custo','Início','Fim','Status','Funcionários','Ações'], rows)}</div></div></div>`;
  }

  function renderFinance(){
    const rows = state.transactions.map(t=>[fmtDate(t.transaction_date), statusBadge(txTypeLabel(t)), html(t.category||'-'), html(t.description||'-'), html(((state.suppliers||[]).find(f=>f.id===t.supplier_id)||{}).name||t.supplier||'-'), html(t.payment_method||'-'), `<b class="${txValueClass(t)}">${money(t.amount)}</b>`, t.receipt_url?'<span class="badge green">com anexo</span>':'-', `<button class="danger mini" onclick="TP.deleteTx('${t.id}')">Excluir</button>`]);
    const s=stats();
    return `<div class="grid2 financeClear"><div class="card form"><h3>Movimentação financeira</h3><div class="notice goldline">Use este formulário para entrada de cliente, despesa/compra ou crédito no fornecedor. O fornecedor e o comprovante são opcionais.</div><form id="txForm"><div class="form-grid"><div><label>Tipo</label><select id="txType"><option value="entrada">entrada de cliente</option><option value="saida">saída/despesa/compra</option><option value="credito_loja">crédito na loja / fornecedor</option></select></div><div><label>Data</label><input id="txDate" type="date" value="${today()}"></div><div><label>Fornecedor</label><select id="txSupplier">${supplierOptions('')}</select></div><div><label>Forma de pagamento</label><select id="txPayment"><option>Pix</option><option>Dinheiro</option><option>Cartão</option><option>Transferência</option><option>Boleto</option><option>Saldo fornecedor</option></select></div></div><label>Descrição</label><input id="txDescription" required placeholder="Ex: compra de parafusos, entrada do cliente, crédito na loja"><div class="form-grid"><div><label>Valor total</label><input id="txAmount" type="number" step="0.01" required value="0"></div><div><label>Categoria</label><input id="txCategory" placeholder="material, ferragem, entrada cliente..."></div></div><div class="form-grid"><div><label>Projeto</label><select id="txProject">${projectOptions()}</select></div><div><label>Serviço</label><select id="txService">${serviceOptions()}</select></div></div><label>Observações</label><textarea id="txNotes" placeholder="Detalhes da compra, número do cupom, condições..."></textarea><label>Anexo do cupom/comprovante</label><input id="txReceiptFile" type="file" accept="image/*"><input id="txReceiptUrl" placeholder="Anexo em base64/URL"><button class="primary" type="submit">Salvar movimentação</button></form></div><div class="card form"><h3>Comprar usando saldo do fornecedor</h3><div class="notice redline">Use quando comprar material descontando do crédito que a Top já tem no fornecedor.</div><div class="stat"><div class="label">Saldo atual no fornecedor</div><div class="value blue">${money(s.storeCredit)}</div><div class="sub">Créditos menos compras descontadas</div></div><form id="providerPurchaseForm"><div class="form-grid"><div><label>Data</label><input id="providerDate" type="date" value="${today()}"></div><div><label>Fornecedor / loja</label><select id="providerSupplier">${supplierOptions('')}</select></div></div><label>Descrição da compra</label><input id="providerDesc" placeholder="Ex: chapa MDF, corrediças, fita de borda..."><label>Valor descontado do saldo</label><input id="providerAmount" type="number" step="0.01" value="0"><div class="form-grid"><div><label>Projeto</label><select id="providerProject">${projectOptions()}</select></div><div><label>Serviço</label><select id="providerService">${serviceOptions()}</select></div></div><label>Anexo do cupom/comprovante</label><input id="providerReceiptFile" type="file" accept="image/*"><input id="providerReceiptUrl" placeholder="Anexo em base64/URL"><button class="danger" type="submit">Descontar do saldo</button></form></div></div><div class="card" style="margin-top:14px"><h3>Histórico financeiro</h3>${table(['Data','Tipo','Categoria','Descrição','Fornecedor','Pagamento','Valor','Anexo','Ações'], rows)}</div>`;
  }

  function inventoryNumberText(value){ const n=num(value); return n>0 ? String(n).replace('.',',') : ''; }
  function inventoryCostText(value){ const n=num(value); return n>0 ? money(n) : ''; }
  function inventoryStatus(it){ const q=num(it.current_qty), min=num(it.min_qty); if(!q && !min) return '<span class="status">sem qtd.</span>'; if(min>0 && q<=min) return '<span class="status cancelado">baixo</span>'; if(q<=0) return '<span class="status cancelado">zerado</span>'; return '<span class="status entregue">ok</span>'; }
  function inventoryVariantText(it){
    const raw = it && (it.variant_text || it.variants || '');
    if(!raw) return '';
    if(typeof raw === 'string'){
      if(raw === '[object Object]') return '';
      try{ const obj=JSON.parse(raw); if(obj && typeof obj==='object') return Object.entries(obj).map(([k,v])=>`${k}: ${v}`).join('; '); }catch(_){ }
      return raw;
    }
    if(typeof raw === 'object') return Object.entries(raw).map(([k,v])=>`${k}: ${v}`).join('; ');
    return String(raw||'');
  }
  function renderInventory(){
    const rows=(state.inventoryItems||[]).map(it=>{
      const infoParts=[html(it.category||'-'), inventoryVariantText(it)?html(inventoryVariantText(it)):'', it.supplier?('Fornecedor: '+html(it.supplier)):'', num(it.avg_cost)>0?('Custo: '+inventoryCostText(it.avg_cost)):''].filter(Boolean);
      const info=infoParts.map((x,i)=>i===0?x:`<span class="muted small">${x}</span>`).join('<br>');
      return [
        `<div class="row-actions nowrap"><button class="ghost mini" onclick="TP.editInventoryItem('${it.id}')">Editar</button><button class="danger mini" onclick="TP.deleteInventoryItem('${it.id}')">Excluir</button></div>`,
        `<button class="linkRow" onclick="TP.editInventoryItem('${it.id}')"><b>${html(it.item_name)}</b></button><div class="muted small">clique para editar</div>`,
        `<span>${info}</span>`,
        html(it.unit||'un'),
        `${inventoryNumberText(it.current_qty)||'-'}${inventoryNumberText(it.min_qty)?' / mín. '+inventoryNumberText(it.min_qty):''}`,
        inventoryStatus(it)
      ];
    });
    return `<div class="split inventoryLayout"><div class="card form compactCard"><h3 id="inventoryFormTitle">Novo item de estoque</h3><div class="notice goldline compactNotice">Clique no item da tabela para editar rápido. A lista padrão entra sem quantidade, mínimo e custo.</div><form id="inventoryForm"><input type="hidden" id="inventoryId"><label>Item</label><input id="inventoryName" required placeholder="Ex: Chapa MDF Plomo"><div class="form-grid compactInputs"><div><label>Categoria</label><input id="inventoryCategory" placeholder="MDF, ferragem..."></div><div><label>Unidade</label><input id="inventoryUnit" value="un" placeholder="un, chapa, par..."></div><div><label>Quantidade atual</label><input id="inventoryQty" type="number" step="0.01" placeholder="em branco"></div><div><label>Estoque mínimo</label><input id="inventoryMin" type="number" step="0.01" placeholder="em branco"></div><div><label>Custo médio</label><input id="inventoryCost" type="number" step="0.01" placeholder="em branco"></div><div><label>Fornecedor</label><input id="inventorySupplier" placeholder="Nome da loja"></div></div><label>Variantes</label><textarea id="inventoryVariants" placeholder="Ex: cor: Branco TX; espessura: 15mm"></textarea><label>Observações</label><textarea id="inventoryNotes"></textarea><div class="row-actions"><button class="primary" type="submit">Salvar item</button><button class="ghost" type="button" onclick="TP.clearInventoryForm()">Limpar</button></div></form><div class="quickParts"><button class="primary mini" type="button" onclick="TP.seedDefaultInventory()">Adicionar lista padrão</button><button class="ghost mini" onclick="TP.prefillInventory('MDF Branco TX 15 mm','MDF','chapa')">+ MDF Branco TX</button><button class="ghost mini" onclick="TP.prefillInventory('Corrediça telescópica 450 mm','Corrediça','par')">+ Corrediça</button><button class="ghost mini" onclick="TP.prefillInventory('Dobradiça reta com amortecedor','Dobradiça','un')">+ Dobradiça</button></div><div class="dangerZone"><button class="danger" type="button" onclick="TP.clearAllInventory()">Limpar estoque</button><span class="muted small">Apaga todos os itens do estoque desta conta após confirmação.</span></div></div><div class="card compactCard"><div class="toolbar"><h3>Controle de estoque</h3><input class="search" id="inventorySearch" placeholder="Pesquisar estoque..."></div><div id="inventoryTable" class="clickableTable">${table(['Ações','Item','Categoria / variantes','Un.','Qtd / mínimo','Status'], rows)}</div></div></div>`;
  }
  function payrollStatus(pr){ return String(pr.status||'pendente').toLowerCase()==='pago' ? '<span class="status entregue">pago</span>' : '<span class="status orcando">pendente</span>'; }
  function renderPayroll(){
    const employees=state.payrollEmployees||[];
    const totalPending=employees.reduce((a,e)=>a+employeePayrollSummary(e.id).pending,0);
    const totalPaid=employees.reduce((a,e)=>a+employeePayrollSummary(e.id).paid,0);
    const employeeRows=employees.map(e=>{ const sum=employeePayrollSummary(e.id); return [html(e.name), e.payment_mode==='valor_servico' ? `Valor por serviço: <b>${money(e.service_fixed_value)}</b>` : `Comissão: <b>${num(e.percent_value).toFixed(2).replace('.',',')}%</b>`, sum.list.length, `<b>${money(sum.pending)}</b>`, money(sum.paid), `<div class="row-actions"><button class="ghost mini" onclick="TP.editPayrollEmployee('${e.id}')">Editar</button><button class="danger mini" onclick="TP.deletePayrollEmployee('${e.id}')">Excluir</button></div>`]; });
    const serviceRows=[];
    employees.forEach(e=>{ const sum=employeePayrollSummary(e.id); sum.list.forEach(s=>{ const amount=servicePayrollAmountForEmployee(s,e.id); const isPaid=payrollPaidForServiceEmployee(s,e.id); serviceRows.push([html(e.name), html(s.title), html(getClient(s.client_id).name||'-'), statusBadge2('service',s.status), money(s.value), `<b>${money(amount)}</b>`, isPaid?'<span class="status entregue">pago</span>':'<span class="status aguardando_inicio">faltando pagar</span>', isPaid?`<button class="warning mini" onclick="TP.markServicePayrollPending('${s.id}','${e.id}')">Voltar pendente</button>`:`<button class="success mini" onclick="TP.markServicePayrollPaid('${s.id}','${e.id}')">Pagar</button>`]); }); });
    return `<div class="split"><div class="card form"><h3 id="payrollFormTitle">Cadastrar funcionário</h3><div class="notice goldline">Cadastre só o funcionário e a regra. O valor a receber é gerado automaticamente pelos serviços <b>em andamento, entregues e finalizados</b> onde ele faz parte da equipe.</div><form id="payrollForm"><input type="hidden" id="payrollEmployeeId"><label>Nome do funcionário</label><input id="payrollEmployeeName" required placeholder="Ex: Davi"><label>Regra de pagamento</label><select id="payrollEmployeeMode"><option value="percentual">% em cima do valor do serviço</option><option value="valor_servico">valor fixo por serviço</option></select><div class="form-grid"><div><label>Porcentagem %</label><input id="payrollEmployeePercent" type="number" step="0.01" value="0"></div><div><label>Valor fixo por serviço</label><input id="payrollEmployeeFixed" type="number" step="0.01" value="0"></div></div><label>Observações</label><textarea id="payrollEmployeeNotes" placeholder="Ex: montador, ajudante, acabamento..."></textarea><div class="row-actions"><button class="primary" type="submit">Salvar funcionário</button><button class="ghost" type="button" onclick="TP.clearPayrollForm()">Limpar</button></div></form><div class="notice" style="margin-top:12px">Para aparecer aqui, vá em <b>Serviços</b>, selecione a equipe do serviço e salve. Cada funcionário terá status pago/pendente separado.</div></div><div class="card"><h3>Resumo da folha</h3><div class="grid"><div class="card stat"><div class="label">A pagar</div><div class="value orange">${money(totalPending)}</div><div class="sub">Serviços ainda pendentes</div></div><div class="card stat"><div class="label">Já pago</div><div class="value green">${money(totalPaid)}</div><div class="sub">Controlado separado das saídas</div></div></div><h3 style="margin-top:14px">Funcionários</h3>${table(['Funcionário','Regra','Serviços','A receber','Pago','Ações'], employeeRows)}</div></div><div class="card" style="margin-top:14px"><h3>Serviços por funcionário</h3>${table(['Funcionário','Serviço','Cliente','Status serviço','Valor serviço','Valor a receber','Pagamento','Ação'], serviceRows)}</div>`;
  }
  function defaultContractClauses(){
    const comp=state.company||defaultCompany();
    return [
      'O serviço será executado conforme projeto/orçamento aprovado, medidas conferidas, materiais especificados e observações registradas no sistema.',
      'Alterações solicitadas após aprovação do orçamento poderão gerar acréscimo de valor e alteração do prazo de entrega.',
      'O prazo de entrega começa a contar após aprovação final, confirmação do pagamento inicial e disponibilidade dos materiais necessários.',
      'A garantia cobre defeitos de fabricação e montagem, não cobrindo mau uso, umidade, infiltração, contato direto com água, alterações feitas por terceiros ou danos causados após a entrega.',
      (comp.quote_warranty||defaultCompany().quote_warranty||'').trim()
    ].filter(Boolean).join('\n\n');
  }
  function addContractClause(){ const el=$('#contractClauses'); if(!el) return; const base=el.value.trim(); el.value = base + (base?'\n\n':'') + 'Nova cláusula: descreva aqui a condição combinada com o cliente.'; el.focus(); }
  function removeContractClause(){ const el=$('#contractClauses'); if(!el) return; const parts=String(el.value||'').split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean); parts.pop(); el.value=parts.join('\n\n'); }
  function resetContractClauses(){ const el=$('#contractClauses'); if(el) el.value=defaultContractClauses(); }
  function importContractModelFile(e){ const file=e&&e.target&&e.target.files&&e.target.files[0]; if(!file) return; const r=new FileReader(); r.onload=()=>{ const el=$('#contractClauses'); if(el){ el.value=String(r.result||'').trim(); toast('Modelo de contrato importado. Revise antes de gerar.'); } }; r.readAsText(file); }
  function contractClausesHtml(){ const raw=($('#contractClauses')&&$('#contractClauses').value.trim())||defaultContractClauses(); const parts=raw.split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean); if(!parts.length) return ''; return sectionHtml('Cláusulas e condições', parts.map((txt,i)=>`<p><b>${i+1}.</b> ${html(txt).replace(/\n/g,'<br>')}</p>`).join('')); }
  function paymentPresetOptions(selected){ selected=String(selected||''); const opts=[['','Selecione uma condição...'],['pix_dinheiro','Dinheiro/Pix'],['cartao','Cartão'],['50_50','50% à vista no fechamento + 50% à vista na entrega'],['fornecedor_entrega','50% entrada no fornecedor/loja + 50% à vista na entrega'],['100_fechamento','100% à vista no fechamento'],['100_entrega','100% à vista na entrega']]; return opts.map(o=>`<option value="${o[0]}" ${selected===o[0]?'selected':''}>${html(o[1])}</option>`).join(''); }
  function paymentPresetFromProject(p){ const note=String((p&&p.budget_payment_note)||'').toLowerCase(); const e=Math.round(num(p&&p.entry_pct)); const d=Math.round(num(p&&p.delivery_pct)); if(note.includes('fornecedor')||note.includes('loja')) return 'fornecedor_entrega'; if(e===100&&d===0) return '100_fechamento'; if(e===0&&d===100) return '100_entrega'; if(e===50&&d===50) return '50_50'; if(note.includes('cart')) return 'cartao'; if(note.includes('pix')||note.includes('dinheiro')) return 'pix_dinheiro'; return ''; }
  function budgetPaymentSelectOptions(selected){ selected=String(selected||'dinheiro'); const opts=[['dinheiro','Dinheiro/Pix'],['cartao','Cartão'],['50_50','50% no fechamento + 50% na entrega'],['fornecedor_entrega','50% fornecedor/loja + 50% entrega'],['fechamento','100% no fechamento'],['entrega','100% na entrega']]; return opts.map(o=>`<option value="${o[0]}" ${selected===o[0]?'selected':''}>${html(o[1])}</option>`).join(''); }
  function applyPaymentPreset(targetPrefix){ const el=$('#'+targetPrefix+'PaymentPreset'); if(!el) return; const v=el.value; if(targetPrefix==='contract'){ if(v==='50_50') setContractSplit(50,50,'50% à vista no fechamento + 50% à vista na entrega.'); else if(v==='fornecedor_entrega') setContractSplit(50,50,supplierSplitText()); else if(v==='100_fechamento') setContractSplit(100,0,'100% à vista no fechamento.'); else if(v==='100_entrega') setContractSplit(0,100,'100% à vista na entrega.'); else if(v==='cartao'){ const pay=$('#contractPayment'); if(pay) pay.value='Cartão conforme condição combinada.'; } else if(v==='pix_dinheiro'){ const pay=$('#contractPayment'); if(pay) pay.value='Dinheiro/Pix.'; } syncReceiptPaymentFromContract(true); return; } if(v==='50_50') setPaymentSplit(50,50,'50% à vista no fechamento + 50% à vista na entrega.'); else if(v==='fornecedor_entrega') setSupplierSplit(); else if(v==='100_fechamento') setPaymentSplit(100,0,'100% à vista no fechamento.'); else if(v==='100_entrega') setPaymentSplit(0,100,'100% à vista na entrega.'); else if(v==='cartao'){ if($('#bPaymentNote')) $('#bPaymentNote').value='Cartão conforme condição combinada.'; } else if(v==='pix_dinheiro'){ if($('#bPaymentNote')) $('#bPaymentNote').value='Dinheiro/Pix.'; } if(targetPrefix==='budget') queueBudgetFieldsAutosave(); }

  function renderContracts(){
    const defaultProject = getProject(state.budgetProjectId || (state.projects[0] && state.projects[0].id) || '');
    const defaultClient = getClient(defaultProject.client_id || (state.clients[0] && state.clients[0].id) || '');
    const ttDefault = defaultProject.id ? projectTotal(defaultProject) : {final:0};
    const defaultValue = ttDefault.final || num(defaultProject.budget_value) || 0;
    const receiptPay = defaultProject.budget_payment_note || 'PIX';
    return `<div class="grid2 contractWorkspace"><div class="card form no-print"><h3>Gerar contrato</h3><div class="notice goldline">Selecione o projeto/orçamento aprovado. O contrato puxa cliente, itens, imagens, prazo e dados oficiais da empresa.</div><label>Cliente</label><select id="contractClient">${clientOptions(defaultClient.id)}</select><label>Projeto / orçamento base</label><select id="contractProject">${quoteProjectOptions(defaultProject.id)}</select><label>Nome que aparecerá no contrato</label><input id="contractProjectName" value="${html(defaultProject.name||'')}" placeholder="Ex: Móveis planejados cozinha e quarto"><label>Ambientes do contrato</label><textarea id="contractEnvironments" placeholder="Ex: Cozinha planejada&#10;Quarto casal">${html(defaultProject.environment||'')}</textarea><label>Serviço</label><select id="contractService">${serviceOptions()}</select><div class="form-grid"><div><label>Valor total</label><input id="contractValue" type="number" step="0.01" value="${html(defaultValue.toFixed(2))}"></div><div><label>Desconto em R$</label><input id="contractDiscount" type="number" step="0.01" value="${html(defaultProject.budget_discount||0)}"></div><div><label>% entrada</label><input id="contractEntryPct" type="number" value="${html(defaultProject.entry_pct || state.company.entry_pct || 50)}"></div><div><label>% entrega</label><input id="contractDeliveryPct" type="number" value="${html(defaultProject.delivery_pct || state.company.delivery_pct || 50)}"></div><div><label>Início do prazo</label><input id="contractStart" type="date" value="${html(defaultProject.contract_start || today())}"></div><div><label>Prazo de entrega em dias</label><input id="contractDays" type="number" value="${html(defaultProject.delivery_days || 30)}"></div></div><label>Modelos rápidos de pagamento</label><select id="contractPaymentPreset" onchange="TP.applyPaymentPreset('contract')">${paymentPresetOptions('')}</select><div class="row-actions"><button class="ghost" onclick="TP.setContractSplit(100,0,'100% à vista no fechamento.')">100% no fechamento</button><button class="ghost" onclick="TP.setContractSplit(50,50,'50% à vista no fechamento + 50% à vista na entrega.')">50/50</button><button class="ghost" onclick="TP.setContractSupplierSplit()">50% fornecedor/loja + entrega</button><button class="ghost" onclick="TP.setContractSplit(0,100,'100% à vista na entrega.')">Tudo na entrega</button></div><label>Forma de pagamento</label><textarea id="contractPayment" rows="3">${html(defaultProject.budget_payment_note||'PIX, dinheiro, cartão ou conforme combinado')}</textarea><label>Observações contratuais</label><textarea id="contractNotes" placeholder="Inclua detalhes específicos do projeto..."></textarea><div class="card softPanel"><h4>Cláusulas do contrato</h4><p class="muted small">Você pode editar, apagar, adicionar cláusulas ou importar um modelo em texto. Cada parágrafo separado por linha em branco vira uma cláusula.</p><textarea id="contractClauses" rows="9">${html(defaultContractClauses())}</textarea><div class="row-actions"><button class="ghost mini" type="button" onclick="TP.addContractClause()">Adicionar cláusula</button><button class="warning mini" type="button" onclick="TP.removeContractClause()">Remover última</button><button class="ghost mini" type="button" onclick="TP.resetContractClauses()">Restaurar padrão</button><label class="ghost mini fileButton">Importar modelo<input id="contractModelFile" type="file" accept=".txt,.md,text/plain" hidden></label></div></div><div class="form-grid"><div><label>Valor recebido para recibo</label><input id="receiptAmount" type="number" step="0.01" value="${html(defaultValue.toFixed(2))}"></div><div><label>Forma de pagamento do recibo</label><input id="receiptPayment" value="${html(receiptPay)}"></div></div><div class="row-actions"><button class="ghost" type="button" onclick="TP.syncReceiptPaymentFromContract(true)">Usar pagamento do contrato no recibo</button></div><label>Referente ao recibo</label><input id="receiptReference" value="${html(defaultProject.name||'Serviço de móveis planejados')}" placeholder="Ex: entrada dos móveis planejados da cozinha"><div class="row-actions"><button class="primary" onclick="TP.generateContract()">Gerar contrato</button><button class="ghost" onclick="TP.printContractPdf()">Gerar PDF do contrato</button><button class="success" onclick="TP.generateReceipt()">Gerar recibo</button><button class="ghost" onclick="TP.printReceiptPdf()">PDF do recibo</button></div><div class="notice" style="margin-top:12px">Dica: modelo visual, logo e cores ficam em <b>Configurações &gt; Documentos da empresa</b>. As cláusulas são ajustadas aqui antes de gerar.</div></div><div class="card"><div id="contractOutput" class="contract clearContract"><h1>Contrato</h1><p class="muted">Selecione cliente, projeto ou serviço e clique em gerar.</p></div></div></div>`;
  }

  function renderRenderLab(){
    const rs = state.renderSettings || {};
    return `<div class="grid2"><div class="card form"><h3>Render API</h3><div class="notice goldline">Ferramenta reservada para integração futura. Não interfere no fluxo principal da Top e não possui planos de venda dentro do app.</div><label>Imagem do projeto</label><div class="dropzone"><b>Enviar imagem do projeto</b><br><span class="muted">PNG ou JPG</span><br><input id="renderFile" type="file" accept="image/*"></div><div class="form-grid"><div><label>Tipo de ambiente</label><select id="renderEnvironment"><option>Cozinha planejada</option><option>Quarto planejado</option><option>Banheiro planejado</option><option>Sala / painel</option><option>Área gourmet</option><option>Outro</option></select></div><div><label>Qualidade</label><select id="renderQuality"><option>Realista premium</option><option>Catálogo comercial</option><option>Foto imobiliária</option></select></div><div><label>Iluminação</label><select id="renderLight"><option>Natural suave</option><option>LED quente</option><option>LED neutro</option></select></div><div><label>Fidelidade</label><select id="renderFidelity"><option>Preservar 100% do projeto</option><option>Melhorar realismo sem mudar design</option></select></div></div><label>Materiais principais</label><input id="renderMaterials" placeholder="Branco TX, Nude, pedra Preto São Gabriel..."><label>Instruções extras</label><textarea id="renderExtra" placeholder="Não alterar medidas, layout, materiais ou proporções."></textarea><div class="row-actions"><button class="primary" onclick="TP.generateRenderPrompt()">Gerar prompt técnico</button><button class="ghost" onclick="TP.callRenderApi()">Testar API</button></div><p class="muted small">Endpoint/proxy: ${html(rs.public_endpoint || 'não configurado')}</p></div><div class="card"><h3>Prévia / Prompt</h3><div id="renderPreview" class="render-preview">Envie uma imagem para pré-visualizar aqui.</div><textarea id="renderPrompt" class="copyarea" placeholder="O prompt técnico aparecerá aqui."></textarea><div class="notice redline" style="margin-top:12px"><b>Segurança:</b> chave secreta de API não deve ficar no navegador. Use proxy/Edge Function.</div></div></div>`;
  }


  function emptyDesign(project){ return { envName:(project&&project.name)||'Ambiente', roomType:(project&&project.environment)||'Cozinha', width:3000, height:2600, depth:600, wallColor:'#f1f5f9', floorColor:'#d6d3d1', bgColor:'#ffffff', showGrid:false, showMeasures:true, snap:true, modules:[], pieces:[] }; }
  function activeDesignerProjectId(){ return state.designer.projectId || ($('#designProject') && $('#designProject').value) || (state.projects[0] && state.projects[0].id) || ''; }
  function normalizeDesignObject(design, project){
    const base=emptyDesign(project || {});
    const d=Object.assign(base, parseJsonish(design,null) || {});
    d.modules = Array.isArray(d.modules) ? d.modules : [];
    d.pieces = Array.isArray(d.pieces) ? d.pieces : [];
    d.width=num(d.width)||base.width; d.height=num(d.height)||base.height; d.depth=num(d.depth)||base.depth;
    d.showMeasures = d.showMeasures!==false;
    d.snap = d.snap!==false;
    return d;
  }
  function currentDesign(){ const pid=activeDesignerProjectId(); if(pid) state.designer.projectId=pid; const p = getProject(pid); if(!p.id) return emptyDesign(); return normalizeDesignObject(p.design_data, p); }
  async function saveCurrentDesignObject(design){
    const pid=activeDesignerProjectId(); const p = getProject(pid);
    if(!p.id){ alert('Selecione um projeto antes de salvar o ambiente.'); throw new Error('Selecione um projeto.'); }
    state.designer.projectId=pid;
    const clean=normalizeDesignObject(design, p);
    const pieces=generatePiecesFromDesign(clean);
    clean.pieces = Array.isArray(clean.pieces) ? clean.pieces : [];
    const idx=state.projects.findIndex(x=>x.id===pid);
    if(idx>=0){ state.projects[idx]=Object.assign({}, state.projects[idx], { design_data:clean, pieces_data:pieces }); }
    try{
      await update('projects','id=eq.'+pid,{ design_data:clean, pieces_data:pieces });
    }catch(err){
      console.error(err);
      alert('Não consegui salvar no banco. Rode a migration mais recente e confira sua conexão. Erro: '+(err.message||err));
      throw err;
    }
    return clean;
  }
  function makeModule(model){
    const env = /referência|eletrodoméstico|ponto/i.test(model[2]);
    const m = { id:uid(), key:model[0], name:model[1], type:model[2], w:model[3], h:model[4], d:model[5], x:60, y:Math.max(0,2600-model[4]), z:0, ext: env ? 'Cinza/Chumbo' : 'Branco TX', inner:'Branco TX', color: env ? '#cbd5e1' : materialHex('Branco TX'), thickness:15, grain:'Vertical', handle: env ? 'sem puxador' : 'puxador externo', doorType:'sobreposta', doors:model[6], drawers:model[7], shelves:model[8], columns:model[9], socle:0, gap:2, obs:'', drawerHeights:'', openDoors:false, openDrawers:false, locked:false, internalDrawers: (model[0]==='roupgav' || ((String(model[2]||'').toLowerCase().includes('guarda-roupa')) && Number(model[7]||0)>0)), sideExt:false, tamponamento:'nenhum', handleSide:'auto' };
    if(model[0]==='geladeira'||model[0]==='vaoGeladeira'||model[0]==='lavaLoucas') m.color='#d8dee9';
    if(model[0]==='janela') m.color='#bfdbfe';
    if(model[0]==='portaamb') m.color='#d6a35f';
    if(model[0]==='fogao'||model[0]==='coifa'||model[0]==='forno'||model[0]==='microondas') m.color='#1f2937';
    if(model[0]==='bancadaPedra') { m.ext='Pedra Preto São Gabriel'; m.inner='Pedra Preto São Gabriel'; m.color='#242018'; }
    if(model[0]==='tanque') m.color='#e5e7eb';
    if(moduleKindClass(m)==='baseItem') m.socle=80;
    return m;
  }
  function moduleById(design,id){ return (design.modules||[]).find(m=>m.id===id) || null; }
  function selectedModule(design){ return moduleById(design,state.designer.selectedId) || null; }
  function moduleRect(m){ return {x:num(m.x), y:num(m.y), w:num(m.w), h:num(m.h), r:num(m.x)+num(m.w), b:num(m.y)+num(m.h)}; }
  function rectsOverlap(a,b,pad){ pad=num(pad); return a.x < b.r-pad && a.r > b.x+pad && a.y < b.b-pad && a.b > b.y+pad; }
  function clampModule(design,m){ m.x = clamp(m.x, 0, Math.max(0,num(design.width)-num(m.w))); m.y = clamp(m.y, 0, Math.max(0,num(design.height)-num(m.h))); return m; }
  function smartSnap(design,m,oldPos){
    if(!m) return m;
    if(state.designer.mode==='top') return topSnap(design,m,oldPos);
    const tol = 24;
    if(design.snap){ m.x=Math.round(num(m.x)/50)*50; m.y=Math.round(num(m.y)/50)*50; }
    const floorY = num(design.height)-num(m.h);
    if(Math.abs(num(m.y)-floorY)<=tol) m.y=floorY;
    if(Math.abs(num(m.y))<=tol && moduleKindClass(m)==='wallItem') m.y=0;
    clampModule(design,m);
    for(const o of (design.modules||[])){
      if(!o || o.id===m.id) continue;
      const a=moduleRect(m), b=moduleRect(o);
      const verticalTouch = a.b > b.y-tol && a.y < b.b+tol;
      const horizontalTouch = a.r > b.x-tol && a.x < b.r+tol;
      if(verticalTouch){
        if(Math.abs(a.x-b.r)<=tol) m.x=b.r;
        if(Math.abs(a.r-b.x)<=tol) m.x=b.x-a.w;
        if(Math.abs((a.x+a.w/2)-(b.x+b.w/2))<=tol) m.x=b.x+(b.w-a.w)/2;
      }
      if(horizontalTouch){
        if(Math.abs(a.y-b.b)<=tol) m.y=b.b;
        if(Math.abs(a.b-b.y)<=tol) m.y=b.y-a.h;
        if(Math.abs(a.y-b.y)<=tol) m.y=b.y;
        if(Math.abs(a.b-b.b)<=tol) m.y=b.b-a.h;
      }
      clampModule(design,m);
    }
    const blocker = (design.modules||[]).find(o=>o && o.id!==m.id && rectsOverlap(moduleRect(m), moduleRect(o), 2));
    if(blocker){
      const b=moduleRect(blocker), a=moduleRect(m);
      const candidates=[
        {x:b.r,y:m.y},{x:b.x-a.w,y:m.y},{x:m.x,y:b.y-a.h},{x:m.x,y:b.b}
      ].map(c=>({x:clamp(c.x,0,Math.max(0,num(design.width)-a.w)),y:clamp(c.y,0,Math.max(0,num(design.height)-a.h))}));
      const valid=candidates.filter(c=>!(design.modules||[]).some(o=>o.id!==m.id && rectsOverlap({x:c.x,y:c.y,w:a.w,h:a.h,r:c.x+a.w,b:c.y+a.h}, moduleRect(o), 2)));
      if(valid.length){ const cur=oldPos||{x:a.x,y:a.y}; valid.sort((p,q)=>(Math.abs(p.x-cur.x)+Math.abs(p.y-cur.y))-(Math.abs(q.x-cur.x)+Math.abs(q.y-cur.y))); m.x=valid[0].x; m.y=valid[0].y; }
      else if(oldPos){ m.x=oldPos.x; m.y=oldPos.y; }
    }
    clampModule(design,m); return m;
  }
  function designerModeLabel(){ const m=state.designer.mode; if(m==='top') return 'Planta superior'; if(m==='2d') return 'Vista frontal técnica'; return 'Ambiente 3D orbital'; }
  function viewButton(mode,label){ return `<button class="${state.designer.mode===mode?'primary':'ghost'}" onclick="TP.setDesignerMode('${mode}')">${label}</button>`; }
  function designerRibbonHtml(design){
    const selected=selectedModule(design);
    return `<div class="promobRibbon"><div class="ribbonGroup"><b>Visualização</b>${viewButton('3d','3D orbital')}${viewButton('2d','Frontal')}${viewButton('top','Planta')}</div><div class="ribbonGroup"><b>Precisão</b><button class="${design.snap?'primary':'ghost'}" onclick="TP.toggleDesignerOption('snap')">Snap</button><button class="${design.showGrid?'primary':'ghost'}" onclick="TP.toggleDesignerOption('showGrid')">Grade</button><button class="${design.showMeasures?'primary':'ghost'}" onclick="TP.toggleDesignerOption('showMeasures')">Cotas</button></div><div class="ribbonGroup"><b>Zoom</b><button class="ghost" onclick="TP.setDesignerZoom(-0.03)">−</button><span class="zoomBadge">${Math.round((state.designer.scale||0.18)*100/0.18)}%</span><button class="ghost" onclick="TP.setDesignerZoom(0.03)">+</button><button class="ghost" onclick="TP.fitDesignerZoom()">Ajustar</button></div><div class="ribbonGroup"><b>Selecionado</b><button class="ghost" ${selected?'':'disabled'} onclick="TP.alignDesigner('floor')">Chão</button><button class="ghost" ${selected?'':'disabled'} onclick="TP.alignDesigner('top')">Topo</button><button class="ghost" ${selected?'':'disabled'} onclick="TP.alignDesigner('center')">Centro</button><button class="ghost" ${selected?'':'disabled'} onclick="TP.duplicateDesignerModule()">Duplicar</button><button class="danger" ${selected?'':'disabled'} onclick="TP.deleteDesignerModule()">Excluir</button></div></div>`;
  }
  function designerFlowHtml(){ return `<div class="designerFlow"><span>1 Cliente/projeto</span><span>2 Ambiente</span><span>3 Fixos</span><span>4 Módulos</span><span>5 Cotas</span><span>6 Peças</span><span>7 Orçamento</span><span>8 Render API</span></div>`; }
  function snapGuidesHtml(design, scale){
    const m=selectedModule(design); if(!m || state.designer.mode==='top') return '';
    const x=Math.round(num(m.x)*scale), y=Math.round(num(m.y)*scale), w=Math.round(num(m.w)*scale), h=Math.round(num(m.h)*scale);
    return `<div class="guideLine v" style="left:${x}px"></div><div class="guideLine v soft" style="left:${x+w}px"></div><div class="guideLine h" style="top:${y}px"></div><div class="guideLine h soft" style="top:${y+h}px"></div>`;
  }
  function dimensionRulersHtml(design, scale, wPx, hPx){
    if(!design.showMeasures) return '';
    const stepMm=500, stepPx=Math.max(1,Math.round(stepMm*scale));
    let ticks='<div class="rulerTop">';
    for(let x=0;x<=wPx;x+=stepPx){ ticks+=`<span style="left:${x}px"><i></i>${Math.round(x/scale)}</span>`; }
    ticks+='</div><div class="rulerLeft">';
    for(let y=0;y<=hPx;y+=stepPx){ ticks+=`<span style="top:${y}px"><i></i>${Math.round(y/scale)}</span>`; }
    ticks+='</div>'; return ticks;
  }
  function drawTopFace(m, scale){
    const k=String(m.key||'');
    if(k==='tomada'||k==='hidraulico') return '<div class="topPoint">●</div>';
    const label=isEnvironmentModule(m)?m.name:m.type;
    return `<div class="topFootprint ${isEnvironmentModule(m)?'env':''}"><div class="topFrontTape"></div><div class="topDepthShade"></div><b>${html(label)}</b><small>${Math.round(m.w)} x ${Math.round(m.d)} mm</small></div>`;
  }
  function topSnap(design,m,oldPos){
    const tol=24;
    if(design.snap){ m.x=Math.round(num(m.x)/50)*50; m.z=Math.round(num(m.z||0)/50)*50; }
    m.x=clamp(m.x,0,Math.max(0,num(design.width)-num(m.w))); m.z=clamp(num(m.z||0),0,Math.max(0,num(design.depth)-num(m.d)));
    for(const o of (design.modules||[])){
      if(!o || o.id===m.id) continue;
      const a={x:num(m.x),z:num(m.z||0),w:num(m.w),d:num(m.d),r:num(m.x)+num(m.w),b:num(m.z||0)+num(m.d)};
      const b={x:num(o.x),z:num(o.z||0),w:num(o.w),d:num(o.d),r:num(o.x)+num(o.w),b:num(o.z||0)+num(o.d)};
      const depthTouch = a.b > b.z-tol && a.z < b.b+tol;
      const widthTouch = a.r > b.x-tol && a.x < b.r+tol;
      if(depthTouch){ if(Math.abs(a.x-b.r)<=tol) m.x=b.r; if(Math.abs(a.r-b.x)<=tol) m.x=b.x-a.w; }
      if(widthTouch){ if(Math.abs(a.z-b.b)<=tol) m.z=b.b; if(Math.abs(a.b-b.z)<=tol) m.z=b.z-a.d; }
    }
    m.x=clamp(m.x,0,Math.max(0,num(design.width)-num(m.w))); m.z=clamp(num(m.z||0),0,Math.max(0,num(design.depth)-num(m.d))); return m;
  }
  function frontWorkArea(m, totalH){
    const defaultSocle=(moduleKindClass(m)==='baseItem'||moduleKindClass(m)==='tallItem')?80:0;
    const soclePx=Math.max(0, Math.min(totalH-4, Math.round((num(m.socle)||defaultSocle) * (totalH/Math.max(1,num(m.h)||totalH)))));
    const faceH=Math.max(16, totalH-soclePx);
    return { top:0, height:faceH, socle:soclePx };
  }
  function renderDoorSet(sectionX, sectionW, sectionY, sectionH, doors, handleType, doorType, isOpen, handleSide){
    let out=''; const leafW=sectionW/Math.max(1,doors); const isBasc=String(doorType||'').toLowerCase()==='basculante';
    for(let i=0;i<doors;i++){
      const left=Math.round(sectionX + leafW*i), width=Math.round(leafW), top=Math.round(sectionY), height=Math.round(sectionH);
      if(isOpen){
        if(isBasc){
          out += `<div class="doorLeaf open basculante" style="left:${left}px;top:${Math.round(sectionY-sectionH*.34)}px;width:${width}px;height:${height}px"></div>`;
        } else {
          const hinge=doorLeafHinge(i, doors, handleSide);
          const shift=hinge==='left' ? Math.round(-leafW*.82) : Math.round(leafW*.82);
          out += `<div class="doorLeaf open ${hinge}" style="left:${left+shift}px;top:${top}px;width:${width}px;height:${height}px"></div>`;
        }
      } else {
        out += `<div class="doorLeaf" style="left:${left}px;top:${top}px;width:${width}px;height:${height}px"></div>`;
      }
      // puxadores não são desenhados no projeto, apenas registrados nas propriedades
      if(!isOpen && i<doors-1) out += `<div class="designerLineV" style="left:${Math.round(sectionX + leafW*(i+1))}px;top:${top}px;height:${height}px"></div>`;
    }
    return out;
  }
  function renderDrawerStack(sectionX, sectionW, sectionY, sectionH, m){
    const heights=drawerHeightsPx(m, sectionH); let out=''; let cur=sectionY;
    heights.forEach((dh,i)=>{
      const frontH=(i===heights.length-1)?(sectionY+sectionH-cur):dh;
      const open = !!m.openDrawers;
      const dx = open ? Math.round(sectionW*.18) : 0;
      out += `<div class="drawerLeaf ${open?'open':''}" style="left:${Math.round(sectionX+dx)}px;top:${Math.round(cur)}px;width:${Math.round(sectionW)}px;height:${Math.round(frontH)}px"></div>`;
      if(i>0 && !open) out += `<div class="designerLineH" style="left:${Math.round(sectionX)}px;right:auto;width:${Math.round(sectionW)}px;top:${Math.round(cur)}px"></div>`;
      cur += frontH;
    });
    return out;
  }
  function renderOpenInterior(m, w, h, topY){
    topY=Math.round(topY||0);
    let out=`<div class="innerBox" style="top:${topY}px;height:${Math.round(h)}px"></div>`;
    const shelves=Math.max(0,Math.floor(num(m.shelves)));
    const cols=Math.max(0,Math.floor(num(m.columns)));
    for(let i=1;i<=cols;i++) out += `<div class="designerLineV soft" style="left:${Math.round(w/(cols+1)*i)}px;top:${topY}px;height:${Math.round(h)}px"></div>`;
    for(let i=1;i<=shelves;i++) out += `<div class="designerLineH soft" style="top:${Math.round(topY + h/(shelves+1)*i)}px"></div>`;
    return out;
  }
  function renderInternalDrawerBank(m, totalW, totalH, topY){
    topY=Math.round(topY||0);
    const bankW=Math.round(Math.min(totalW*0.32, Math.max(92, totalW*0.26)));
    const bankX=10;
    const bankY=topY+12;
    const bankH=Math.max(42, totalH-24);
    let out=`<div class="innerBox openSection" style="left:${bankX}px;top:${bankY}px;width:${bankW}px;height:${bankH}px"></div>`;
    const heights=drawerHeightsPx(m, bankH-10);
    let cur=bankY+5;
    heights.forEach((dh,i)=>{
      const frontH=(i===heights.length-1)?(bankY+bankH-5-cur):dh;
      out += `<div class="internalDrawerFront" style="left:${bankX+6}px;top:${Math.round(cur)}px;width:${bankW-12}px;height:${Math.round(frontH)}px"></div>`;
      cur += frontH;
    });
    const mainX=bankX+bankW+10;
    const mainW=Math.max(40,totalW-mainX-10);
    out += `<div class="innerBox openSection" style="left:${mainX}px;top:${bankY}px;width:${mainW}px;height:${bankH}px"></div>`;
    out += `<div class="designerLineV soft" style="left:${mainX}px;top:${bankY}px;height:${bankH}px"></div>`;
    out += `<div class="wardrobeRail" style="left:${mainX+10}px;top:${Math.round(bankY+bankH*0.16)}px;width:${Math.max(20,mainW-20)}px"></div>`;
    out += `<div class="wardrobeDrop" style="left:${Math.round(mainX+mainW*0.22)}px;top:${Math.round(bankY+bankH*0.16)}px;height:${Math.round(bankH*0.52)}px"></div>`;
    out += `<div class="wardrobeDrop" style="left:${Math.round(mainX+mainW*0.52)}px;top:${Math.round(bankY+bankH*0.16)}px;height:${Math.round(bankH*0.52)}px"></div>`;
    out += `<div class="wardrobeShelf" style="left:${mainX+10}px;top:${Math.round(bankY+bankH*0.76)}px;width:${Math.max(20,mainW-20)}px"></div>`;
    return out;
  }
  function drawFace(m, scale){
    const w = Math.max(20, Math.round(num(m.w)*scale));
    const h = Math.max(20, Math.round(num(m.h)*scale));
    const area = frontWorkArea(m,h);
    const fy = area.top, fh = area.height;
    let out='<div class="moduleFrontGloss"></div>';
    const sideBand = (!!m.sideExt) ? Math.max(4, Math.round(w*0.028)) : 0;
    if(sideBand){ out += `<div class="frontSideColor left" style="width:${sideBand}px"></div><div class="frontSideColor right" style="width:${sideBand}px"></div>`; }
    const tamp = String(m.tamponamento||'nenhum');
    if(tamp==='esquerdo' || tamp==='ambos'){ out += `<div class="tamponPanel left"></div>`; }
    if(tamp==='direito' || tamp==='ambos'){ out += `<div class="tamponPanel right"></div>`; }
    const doors = Math.max(0, Math.floor(num(m.doors)));
    const drawers = Math.max(0, Math.floor(num(m.drawers)));
    const shelves = Math.max(0, Math.floor(num(m.shelves)));
    const cols = Math.max(0, Math.floor(num(m.columns)));
    if(isEnvironmentModule(m)){
      const k=String(m.key||'');
      if(k==='janela') return '<div class="envWindow"><span></span><span></span></div><div class="designerLabel dark">janela</div>';
      if(k==='portaamb') return '<div class="envDoor"><span></span></div><div class="designerLabel">porta</div>';
      if(k==='geladeira') return '<div class="envFridge"><span></span><span></span></div><div class="designerLabel">geladeira</div>';
      if(k==='cuba') return '<div class="sinkImageFlat"><img src="assets/sink-stainless.png" alt="cuba inox"></div>';
      if(k==='tomada'||k==='hidraulico') return '<div class="envPoint">●</div>';
      return '<div class="envAppliance"></div>';
    }
    const handleType=m.handle||'puxador externo';
    if(!doors && !drawers){
      out += renderOpenInterior(m,w,fh,fy);
      out += `<div class="frontEdgeTape top" style="top:${fy}px"></div><div class="frontEdgeTape left" style="top:${fy}px;height:${fh}px"></div><div class="frontEdgeTape right" style="top:${fy}px;height:${fh}px"></div><div class="frontEdgeTape bottom" style="top:${fy+fh-2}px"></div>`;
    } else if(doors>0 && drawers>0){
      out += `<div class="frontSkin" style="top:${fy}px;height:${fh}px"></div>`;
      if(m.internalDrawers || m.key==='roupgav' || (String(m.type||'').toLowerCase().includes('guarda-roupa') && drawers>0)){
        out += renderDoorSet(0, w, fy, fh, Math.max(1,doors), handleType, m.doorType, !!m.openDoors, m.handleSide);
        if(m.openDoors){ out += renderInternalDrawerBank(m, w, fh, fy); }
      } else {
        const drawerSection=Math.max(Math.round(w*0.36), Math.min(Math.round(w*0.48), 80+drawers*26));
        const doorSection=Math.max(120,w-drawerSection);
        out += `<div class="designerLineV" style="left:${doorSection}px;top:${fy}px;height:${fh}px"></div>`;
        out += renderDoorSet(0, doorSection, fy, fh, Math.max(1,doors), handleType, m.doorType, !!m.openDoors, m.handleSide);
        out += renderDrawerStack(doorSection, w-doorSection, fy, fh, m);
        if(m.openDoors){ out += renderOpenInterior({shelves,columns:cols}, doorSection, fh, fy); }
      }
    } else if(drawers>0){
      out += `<div class="frontSkin" style="top:${fy}px;height:${fh}px"></div>`;
      out += renderDrawerStack(0, w, fy, fh, m);
    } else {
      out += `<div class="frontSkin" style="top:${fy}px;height:${fh}px"></div>`;
      out += renderDoorSet(0, w, fy, fh, Math.max(1,doors), handleType, m.doorType, !!m.openDoors, m.handleSide);
      if(m.openDoors){ out += renderOpenInterior(m,w,fh,fy); }
    }
    if(num(m.socle)>0 || moduleKindClass(m)==='baseItem' || moduleKindClass(m)==='tallItem') out+=`<div class="socle" style="height:${Math.max(5,area.socle)}px"></div>`;
    return out;
  }
  function stageViewForModule(m, design, scale, mode, camera){
    if(mode==='top') return {x:num(m.x), y:num(m.z||0)+46, w:num(m.w), h:num(m.d), depth:0, z:0};
    if(mode==='2d') return {x:num(m.x), y:num(m.y), w:num(m.w), h:num(m.h), depth:0, z:0};
    return {x:num(m.x), y:num(m.y), w:num(m.w), h:num(m.h), depth:Math.max(10,Math.round(num(m.d)*scale*0.34)), z:Math.round(num(m.z||0)*scale*0.72)};
  }
  function moduleRenderPriority(m){
    if(isSinkModule(m)) return 13000;
    if(isCountertop(m)) return 12000;
    if(isEnvironmentModule(m)) return 11000;
    return 0;
  }
  function designerStage3dContent(design, scale, wPx, hPx){
    const W=num(design.width)||3000, H=num(design.height)||2600, D=num(design.depth)||900;
    const yawDeg=num(state.designer.orbitYaw||-28);
    const yaw=yawDeg*Math.PI/180;
    const orbitPitch=num(state.designer.orbitPitch||42);
    const pitchFactor=clamp(orbitPitch/60, .30, 1.25);
    const viewLift=(48-orbitPitch)*5.4;
    const cx=wPx/2, top=96 + viewLift;
    const cos=Math.cos(yaw), sin=Math.sin(yaw);
    const depthTilt=.42*pitchFactor;
    function pr(x,y,z){
      const xr=(x-W/2)*cos + (z-D/2)*sin;
      const zr=-(x-W/2)*sin + (z-D/2)*cos;
      return {x:cx + xr*scale, y:top + y*scale - zr*scale*depthTilt, z:zr};
    }
    function lerp(a,b,t){ return a+(b-a)*t; }
    function bi(a,b,c,d,u,v){ return {x:lerp(lerp(a.x,b.x,u),lerp(d.x,c.x,u),v), y:lerp(lerp(a.y,b.y,u),lerp(d.y,c.y,u),v)}; }
    function pts(arr){ return arr.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '); }
    function poly(arr,fill,stroke,cls,op){ return `<polygon class="${cls||''}" points="${pts(arr)}" fill="${fill}" stroke="${stroke||'rgba(15,23,42,.38)'}" stroke-width="1" opacity="${op==null?1:op}"/>`; }
    function line(a,b,cls,w){ return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" class="${cls||'svgCut'}" ${w?`stroke-width="${w}"`:''}/>`; }
    function textEl(x,y,t,cls){ return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls||'svgLabel'}">${html(t)}</text>`; }
    function shadeHex(mat,p){ return shade(materialHex(mat),p); }
    function safeId(v){ return 'mat_'+String(v||'mat').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
    const usedMaterials=Array.from(new Set((design.modules||[]).flatMap(m=>[m.ext||'Branco TX',m.inner||'Branco TX']).concat(['Branco TX'])));
    function materialPatternDefs(){
      return usedMaterials.map(mat=>{
        const id=safeId(mat); const base=materialHex(mat), light=shade(base,16), dark=shade(base,-14); const img=materialTextureUrl(mat);
        if(img) return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="72" height="160"><rect width="72" height="160" fill="${base}"/><image href="${img}" x="0" y="0" width="72" height="160" preserveAspectRatio="xMidYMid slice" opacity=".96"/><path d="M9 0 C20 38 16 74 27 160 M42 0 C54 44 49 94 62 160" stroke="rgba(255,255,255,.18)" stroke-width="1.2" fill="none"/></pattern>`;
        if(materialIsWood(mat)) return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="54" height="150"><rect width="54" height="150" fill="${base}"/><path d="M8 0 C20 34 16 78 26 150 M32 0 C44 36 38 88 50 150 M2 0 C8 50 6 98 13 150" stroke="${shade(light,6)}" stroke-width="1.1" opacity=".58" fill="none"/><path d="M17 0 C10 46 24 78 19 150 M45 0 C38 52 53 95 47 150" stroke="${dark}" stroke-width="1" opacity=".32" fill="none"/><path d="M0 22 H54 M0 91 H54" stroke="rgba(255,255,255,.08)" stroke-width="1"/></pattern>`;
        return `<linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`;
      }).join('');
    }
    function fillFor(mat){ return `url(#${safeId(mat)})`; }
    const pad=70;
    const svgW=wPx+pad*2, svgH=hPx+Math.max(190,D*scale*.55);
    const defs=`<defs><filter id="softShadow" x="-20%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="9" stdDeviation="7" flood-color="#000" flood-opacity=".24"/></filter><linearGradient id="wallV69" x1="0" x2="1"><stop offset="0" stop-color="${shade(design.wallColor||'#f1f5f9',8)}"/><stop offset="1" stop-color="${shade(design.wallColor||'#f1f5f9',-6)}"/></linearGradient><linearGradient id="floorV69" y1="0" y2="1"><stop offset="0" stop-color="${shade(design.floorColor||'#d6d3d1',8)}"/><stop offset="1" stop-color="${shade(design.floorColor||'#d6d3d1',-12)}"/></linearGradient><pattern id="sinkPng" patternUnits="objectBoundingBox" width="1" height="1"><image href="assets/sink-stainless.png" x="0" y="0" width="1" height="1" preserveAspectRatio="xMidYMid meet"/></pattern>${materialPatternDefs()}</defs>`;
    let out=`<svg class="designer3dSvg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">${defs}<rect width="100%" height="100%" fill="${html(design.bgColor||'#08111f')}"/>`;
    out+=`<g transform="translate(${pad},0)">`;
    const floor=[pr(0,H,0),pr(W,H,0),pr(W,H,D),pr(0,H,D)];
    const back=[pr(0,0,0),pr(W,0,0),pr(W,H,0),pr(0,H,0)];
    const left=[pr(0,0,0),pr(0,H,0),pr(0,H,D),pr(0,0,D)];
    const right=[pr(W,0,0),pr(W,H,0),pr(W,H,D),pr(W,0,D)];
    out += poly(back,'url(#wallV69)','#b6beca','wallPoly',1);
    out += poly(left,shade(design.wallColor||'#f1f5f9',-4),'#cbd5e1','sideWallPoly',.98);
    out += poly(right,shade(design.wallColor||'#f1f5f9',-6),'#cbd5e1','sideWallPoly',.98);
    out += poly(floor,'url(#floorV69)','#a8a29e','floorPoly',1);
    function moduleDepthKey(m){ const centerX=num(m.x)+num(m.w)/2, centerZ=num(m.z||0)+num(m.d)/2; return (-(centerX-W/2)*sin + (centerZ-D/2)*cos); }
    const mods=(design.modules||[]).slice().sort((a,b)=>{ const pa=moduleRenderPriority(a), pb=moduleRenderPriority(b); if(pa!==pb) return pa-pb; return moduleDepthKey(b)-moduleDepthKey(a); });
    mods.forEach(m=>{
      const x=num(m.x), y=num(m.y), z=num(m.z||0), w=num(m.w), h=num(m.h), d=num(m.d);
      const p000=pr(x,y,z), p100=pr(x+w,y,z), p110=pr(x+w,y+h,z), p010=pr(x,y+h,z);
      const p001=pr(x,y,z+d), p101=pr(x+w,y,z+d), p111=pr(x+w,y+h,z+d), p011=pr(x,y+h,z+d);
      const showBottom = orbitPitch < 48;
      const ext=materialFront(m)||'Branco TX'; const body=materialBody(m)||'Branco TX'; const sideMat=materialSide(m)||body; const isEnv=isEnvironmentModule(m); const sel=state.designer.selectedId===m.id;
      const doors=Math.max(0,Math.floor(num(m.doors))), drawers=Math.max(0,Math.floor(num(m.drawers))), shelves=Math.max(0,Math.floor(num(m.shelves))), cols=Math.max(0,Math.floor(num(m.columns)));
      const openCabinet = !isEnv && !isCountertop(m) && doors===0 && drawers===0;
      const cls=(sel?'svgModule selected':'svgModule') + (openCabinet?' openCabinet3d':'');
      out+=`<g class="designerModule ${cls}" data-id="${m.id}" filter="url(#softShadow)">`;
      if(isSinkModule(m)){
        const s0=pr(x,y,z), s1=pr(x+w,y,z), s2=pr(x+w,y,z+d), s3=pr(x,y,z+d);
        out+=poly([s0,s1,s2,s3], 'url(#sinkPng)', 'rgba(15,23,42,.38)', 'sinkImagePoly', .98);
        out+=`<title>${html(m.name||'cuba')}</title>`;
        out+='</g>'; return;
      }
      if(showBottom){
        out+=poly([p010,p110,p111,p011], materialIsWood(body)?fillFor(body):shadeHex(body,-8),'rgba(15,23,42,.48)',openCabinet?'bottomFace bodyFace openBodyFace':'bottomFace bodyFace',openCabinet ? .72 : 1);
      }else{
        out+=poly([p000,p100,p101,p001], materialIsWood(body)?fillFor(body):shadeHex(body,16),'rgba(15,23,42,.45)',openCabinet?'topFace bodyFace openBodyFace':'topFace bodyFace',openCabinet ? .72 : 1);
      }
      const sideFill=isCountertop(m)?shadeHex(ext,-14):(materialIsWood(sideMat)?shadeHex(sideMat,-14):shadeHex(sideMat,-30));
      out+=poly([p100,p110,p111,p101], sideFill,'rgba(15,23,42,.9)',openCabinet?'sideFace bodyFace openBodyFace':'sideFace bodyFace',1);
      out+=line(p101,p111,'svgCut sideEdgeStrong',2);
      out+=line(p100,p101,'svgCut sideEdgeStrong',1.6);
      out+=line(p110,p111,'svgCut sideEdgeStrong',1.6);
      out+=line(p100,p110,'svgCut sideEdgeStrong',1.2);
      if(!isEnv && !isCountertop(m)){
        const tape=Math.min(28, Math.max(12, num(m.thickness)||15));
        const pt0=pr(x,y,Math.max(z,z+d-tape)), pt1=pr(x+w,y,Math.max(z,z+d-tape));
        const ps0=pr(x+w,y,Math.max(z,z+d-tape)), ps1=pr(x+w,y+h,Math.max(z,z+d-tape));
        out+=poly([p001,p101,pt1,pt0], fillFor(ext),'rgba(15,23,42,.48)','edgeTapeFace topTapeFace',openCabinet ? .72 : .98);
        out+=poly([p101,p111,ps1,ps0], fillFor(ext),'rgba(15,23,42,.55)','edgeTapeFace sideTapeFace',openCabinet ? .72 : .98);
      }
      const openedFront = !isEnv && !isCountertop(m) && !!m.openDoors && doors>0;
      out+=poly([p001,p101,p111,p011], isCountertop(m) ? shadeHex(ext,2) : ((openCabinet || openedFront) ? (materialIsWood(body)?fillFor(body):shadeHex(body,8)) : fillFor(ext)), openedFront ? 'rgba(15,23,42,.38)' : (openCabinet ? fillFor(ext) : 'rgba(15,23,42,.65)'), (openCabinet || openedFront) ? 'frontFace openFrontFace' : 'frontFace', (openCabinet || openedFront) ? .92 : 1);
      const tamp=String(m.tamponamento||'nenhum');
      const tp=Math.max(14, Math.min(28, (num(m.thickness)||15)));
      if(!isEnv && !isCountertop(m) && (tamp==='esquerdo' || tamp==='ambos')){ const tA=pr(x-tp,y,z+d), tB=pr(x,y,z+d), tC=pr(x,y+h,z+d), tD=pr(x-tp,y+h,z+d); out+=poly([tA,tB,tC,tD], fillFor(ext), 'rgba(15,23,42,.55)', 'tamponFace', .98); }
      if(!isEnv && !isCountertop(m) && (tamp==='direito' || tamp==='ambos')){ const tA=pr(x+w,y,z+d), tB=pr(x+w+tp,y,z+d), tC=pr(x+w+tp,y+h,z+d), tD=pr(x+w,y+h,z+d); out+=poly([tA,tB,tC,tD], fillFor(ext), 'rgba(15,23,42,.55)', 'tamponFace', .98); }
      if(isCountertop(m)){
        const sink=sinkAttachedToCounter(design,m);
        out+=poly([p001,p101,p111,p011], shadeHex(ext,-3), 'rgba(15,23,42,.75)', 'counterFront', 1);
        if(!showBottom) out+=poly([p000,p100,p101,p001], shadeHex(ext,8), 'rgba(15,23,42,.55)', 'counterTop', 1);
        if(sink){
          const su0=clamp((num(sink.x)-x)/Math.max(1,w), .10, .78), su1=clamp((num(sink.x)+num(sink.w)-x)/Math.max(1,w), .22, .92);
          const sv0=clamp((num(sink.z||0)-z)/Math.max(1,d), .08, .76), sv1=clamp((num(sink.z||0)+num(sink.d)-z)/Math.max(1,d), .18, .92);
          const t0=bi(p000,p100,p101,p001,su0,sv0), t1=bi(p000,p100,p101,p001,su1,sv0), t2=bi(p000,p100,p101,p001,su1,sv1), t3=bi(p000,p100,p101,p001,su0,sv1);
          out+=poly([t0,t1,t2,t3], 'url(#sinkPng)', 'rgba(15,23,42,.55)', 'sinkCut sinkImagePoly', 1);
        }
      }
      const fp=(u,v)=>bi(p001,p101,p111,p011,u,v);
      if(!isEnv){
        const handle=m.handle||'puxador externo';
        const zFront=z+d;
        const defaultSocle=(moduleKindClass(m)==='baseItem'||moduleKindClass(m)==='tallItem')?80:0;
        const faceHmm=Math.max(60,h-Math.max(0,(num(m.socle)||defaultSocle)));
        const faceRatio=clamp(faceHmm/Math.max(1,h), .28, 1);
        const faceBottomY=y+faceHmm;
        const drawOpenDoorLeaf=(u0,u1,hingeSide)=>{
          const open=Math.min(640,Math.max(320,d*1.1));
          const x0=x+w*u0, x1=x+w*u1;
          const slim=Math.max(16, Math.min(34, (x1-x0)*0.18));
          if(String(m.doorType||'').toLowerCase()==='basculante'){
            const a=pr(x0,y,zFront+10), b=pr(x1,y,zFront+10), c=pr(x1,Math.max(0,y-faceHmm*.72),zFront+open), dd=pr(x0,Math.max(0,y-faceHmm*.72),zFront+open);
            out+=poly([a,b,c,dd], fillFor(ext),'rgba(15,23,42,.7)','openDoor openBasculante',.98);
                        return;
          }
          if(hingeSide==='left'){
            const a=pr(x0,y,zFront+8), b=pr(x0+slim,y,zFront+open), c=pr(x0+slim,faceBottomY,zFront+open), dd=pr(x0,faceBottomY,zFront+8);
            out+=poly([a,b,c,dd], fillFor(ext),'rgba(15,23,42,.7)','openDoor',.98);
          }else{
            const a=pr(x1,y,zFront+8), b=pr(x1-slim,y,zFront+open), c=pr(x1-slim,faceBottomY,zFront+open), dd=pr(x1,faceBottomY,zFront+8);
            out+=poly([a,b,c,dd], fillFor(ext),'rgba(15,23,42,.7)','openDoor',.98);
          }
        };
        const drawOpenDrawerBox=(u0,u1,v0,v1)=>{
          const x0=x+w*u0, x1=x+w*u1, y0=y+faceHmm*v0, y1=y+faceHmm*v1, extOut=Math.min(460,Math.max(180,d*.72));
          const a=pr(x0,y0,zFront+extOut), b=pr(x1,y0,zFront+extOut), c=pr(x1,y1,zFront+extOut), dd=pr(x0,y1,zFront+extOut);
          const s1=pr(x0,y0,zFront+10), s2=pr(x1,y0,zFront+10);
          out+=poly([s1,s2,b,a], shadeHex(ext,-8),'rgba(15,23,42,.45)','openDrawerTop',.98);
          out+=poly([a,b,c,dd], fillFor(ext),'rgba(15,23,42,.7)','openDrawerFront',.98);
                  };
        const mapV=v=>v*faceRatio;
        const drawV=u=>{ out+=line(fp(u,0),fp(u,faceRatio),'svgCut'); };
        const drawH=(v,u0=0,u1=1,soft=false)=>{ out+=line(fp(u0,mapV(v)),fp(u1,mapV(v)),soft?'svgCut soft':'svgCut'); };
        const handleSidePref=(m.handleSide||'auto');
        const doorHandleU=(idx,count,totalU=1)=>{ const leaf=totalU/Math.max(1,count); return doorHandleX(idx, leaf, count, handleSidePref)/Math.max(1,totalU===1?1:1); };
        const drawHandleV=(u,v0=.38,v1=.58)=>{};
        const drawHandleH=(u0,u1,v)=>{};
        const drawerHandleRange=(startU,endU)=>{ const width=(endU-startU); const side=resolveHandleSide(handleSidePref,0,1,'drawer'); if(side==='left') return [startU+width*.10,startU+width*.46]; if(side==='right') return [startU+width*.54,startU+width*.90]; return [startU+width*.24,startU+width*.76]; };

        if(doors>0 && drawers>0){
          if(m.internalDrawers || m.key==='roupgav' || (String(m.type||'').toLowerCase().includes('guarda-roupa') && drawers>0)){
            for(let i=1;i<doors;i++) drawV(i/doors);
            if(m.openDoors){
              const bankU=.32;
              out+=line(fp(bankU,0),fp(bankU,faceRatio),'svgCut soft');
              const hs=drawerHeightsPx(m,1000); const total=hs.reduce((a,b)=>a+b,0)||1; let cur=0;
              hs.forEach((hh,i)=>{ const v0=cur/total, v1=(cur+hh)/total; if(i>0) drawH(v0,0,bankU,true); cur+=hh; });
              out+=line(fp(bankU+.03,mapV(.14)), fp(.94,mapV(.14)), 'svgCut soft');
              out+=line(fp(bankU+.18,mapV(.14)), fp(bankU+.18,mapV(.76)), 'svgCut soft');
              out+=line(fp(bankU+.48,mapV(.14)), fp(bankU+.48,mapV(.76)), 'svgCut soft');
              out+=line(fp(bankU+.03,mapV(.76)), fp(.94,mapV(.76)), 'svgCut soft');
            }
          } else {
            const doorU=.64; drawV(doorU);
            for(let i=1;i<doors;i++) drawV((doorU/doors)*i);
            const hs=drawerHeightsPx(m,1000); const total=hs.reduce((a,b)=>a+b,0)||1; let cur=0;
            hs.forEach((hh,i)=>{ const v0=cur/total, v1=(cur+hh)/total; if(i>0) drawH(v0,doorU,1,false); cur+=hh; });
            if(m.openDoors){ for(let i=1;i<=cols;i++) out+=line(fp((doorU/(cols+1))*i,0),fp((doorU/(cols+1))*i,faceRatio),'svgCut soft'); if(shelves>0){ for(let i=1;i<=shelves;i++) drawH(i/(shelves+1),0,doorU,true); } }
          }
        } else if(drawers>0){
          const hs=drawerHeightsPx(m,1000); const total=hs.reduce((a,b)=>a+b,0)||1; let cur=0;
          hs.forEach((hh,i)=>{ const v0=cur/total, v1=(cur+hh)/total; if(i>0) drawH(v0); cur+=hh; });
        } else if(doors>0){
          for(let i=1;i<doors;i++) drawV(i/doors);
          if(m.openDoors){ for(let i=1;i<=cols;i++) out+=line(fp(i/(cols+1),0),fp(i/(cols+1),faceRatio),'svgCut soft'); if(shelves>0){ for(let i=1;i<=shelves;i++) drawH(i/(shelves+1),0,1,true); } if(!cols && !shelves && String(m.type||'').toLowerCase().includes('guarda')){ drawV(.33); drawV(.66); drawH(.16,0,1,true); out+=line(fp(.08,mapV(.2)),fp(.92,mapV(.2)),'svgCut soft'); } }
        } else {
          for(let i=1;i<=cols;i++) out+=line(fp(i/(cols+1),0),fp(i/(cols+1),faceRatio),'svgCut soft');
          for(let i=1;i<=shelves;i++) drawH(i/(shelves+1),0,1,true);
        }
        if(m.openDoors && doors>0){
          const doorU=(drawers>0?0.64:1); const leaf=doorU/Math.max(1,doors);
          for(let i=0;i<doors;i++){ drawOpenDoorLeaf(i*leaf,(i+1)*leaf, doorLeafHinge(i, doors, handleSidePref)); }
        }
        if(m.openDrawers && drawers>0){
          const startU=(doors>0?0.64:0), endU=1; const hs=drawerHeightsPx(m,1000); const total=hs.reduce((a,b)=>a+b,0)||1; let cur=0;
          hs.forEach(hh=>{ const v0=cur/total, v1=(cur+hh)/total; drawOpenDrawerBox(startU,endU,v0,v1); cur+=hh; });
        }
        if(num(m.socle)>0 || moduleKindClass(m)==='baseItem'||moduleKindClass(m)==='tallItem'){
          const v0=faceRatio; out+=poly([fp(0,v0),fp(1,v0),fp(1,1),fp(0,1)],'#111827','rgba(0,0,0,.35)','svgSoclePoly',.98);
        }
      }
      const label=fp(.04,.10); out+=textEl(label.x,label.y,m.name,'svgLabel');
      out+='</g>';
    });
    if(design.showMeasures){
      out+=`<text x="${pad+14}" y="${svgH-30}" class="svgMeasure">Ambiente: ${Math.round(W)} x ${Math.round(H)} x ${Math.round(D)} mm</text>`;
    }
    out+='</g></svg>';
    return out;
  }
  function designerStageHtml(design){
    const scale = state.designer.scale || 0.18;
    const mode = state.designer.mode || '3d';
    const isTop = mode === 'top';
    const wPx = Math.max(840, Math.round(num(design.width)*scale));
    const hPx = isTop ? Math.max(360, Math.round(num(design.depth)*scale)+90) : Math.max(500, Math.round(num(design.height)*scale));
    const dPx=Math.max(130, Math.round(num(design.depth)*scale*.9));
    let out = `<div class="designerStageWrap pro"><div class="stageHint"><b>${designerModeLabel()}</b> • no 3D arraste o fundo para girar • setas movem o móvel selecionado • frontal/planta são melhores para posicionar</div>`;
    if(mode==='3d'){
      out += `<div class="orbitViewport svgOrbit" id="designerOrbitViewport"><div id="designerStage" class="designerStageSvgHost" data-scale="${scale}">${designerStage3dContent(design,scale,wPx,hPx)}</div></div></div>`;
      return out;
    }
    const cls = isTop ? 'designerStage modeTop' : 'designerStage mode2d';
    out += `<div id="designerStage" class="${cls} " data-scale="${scale}" style="width:${wPx}px;height:${hPx}px;background:${html(design.bgColor||'#fff')};--wall:${html(design.wallColor)};--floor:${html(design.floorColor)};--depthpx:${dPx}px">`;
    if(isTop){
      out += `<div class="topRoom"><div class="topBackWall">parede principal</div><div class="topFloorLabel">profundidade ${Math.round(design.depth)} mm</div></div>`;
      (design.modules||[]).slice().sort((a,b)=>moduleRenderPriority(a)-moduleRenderPriority(b)||num(a.x)-num(b.x)||num(a.y)-num(b.y)).forEach(m=>{
        const view=stageViewForModule(m, design, scale, mode, 'orbit');
        const x=Math.round(view.x*scale), y=Math.round(view.y*scale), mw=Math.max(22,Math.round(view.w*scale)), mh=Math.max(16,Math.round(view.h*scale));
        const sel = state.designer.selectedId===m.id?'selected':''; const kind=moduleKindClass(m);
        out += `<div class="designerModule topModule ${kind} ${sel}" data-id="${m.id}" title="${html(m.name)}" style="left:${x}px;top:${y}px;width:${mw}px;height:${mh}px;${moduleTextureStyle(m)}border-color:${materialHex(m.ext)};--depth:0px">${drawTopFace(m,scale)}</div>`;
      });
      if(design.showMeasures) out += `<div class="measure measureW">largura ${Math.round(design.width)} mm</div><div class="measure measureD">prof. ${Math.round(design.depth)} mm</div>`;
    } else {
      out += `<div class="wallPlane"></div><div class="floorLine"></div>${dimensionRulersHtml(design,scale,wPx,hPx)}${snapGuidesHtml(design,scale)}`;
      (design.modules||[]).slice().sort((a,b)=>moduleRenderPriority(a)-moduleRenderPriority(b)||num(a.x)-num(b.x)||num(a.y)-num(b.y)).forEach(m=>{
        const view=stageViewForModule(m, design, scale, mode, 'orbit');
        const x=Math.round(view.x*scale), y=Math.round(view.y*scale), mw=Math.max(22,Math.round(view.w*scale)), mh=Math.max(22,Math.round(view.h*scale));
        const sel = state.designer.selectedId===m.id?'selected':''; const kind=moduleKindClass(m);
        out += `<div class="designerModule ${kind} ${sel}" data-id="${m.id}" title="${html(m.name)}" style="left:${x}px;top:${y}px;width:${mw}px;height:${mh}px;${moduleTextureStyle(m)}border-color:${materialHex(m.ext)};--depth:0px">${drawFace(m,scale)}<div class="designerLabel">${html(m.name)}<br><span>${html(m.ext)} / ${html(m.inner)}</span></div><div class="designerSize">${Math.round(m.w)} x ${Math.round(m.h)} x ${Math.round(m.d)} mm</div></div>`;
      });
      if(design.showMeasures) out += `<div class="measure measureW">largura ${Math.round(design.width)} mm</div><div class="measure measureH">altura ${Math.round(design.height)} mm</div>`;
    }
    out += '</div></div>';
    return out;
  }
  function libraryHtml(){ return LIBRARY.map(g=>`<h4>${g.group}</h4><div class="moduleBtns">${g.items.map(it=>`<button class="ghost libitem" draggable="true" data-key="${it[0]}">${html(it[1])}</button>`).join('')}</div>`).join(''); }
  function designerPropertiesHtml(design){
    const m = selectedModule(design);
    if(!m) return `<div class="card form propPanel"><h3>Propriedades</h3><p class="muted">Clique em um móvel ou arraste um modelo para o ambiente.</p></div>`;
    return `<div class="card form propPanel"><h3>Móvel selecionado</h3><label>Nome do móvel</label><input id="dmName" value="${html(m.name)}"><label>Tipo</label><input id="dmType" value="${html(m.type)}"><div class="form-grid"><div><label>Largura</label><input id="dmW" type="number" value="${html(m.w)}"></div><div><label>Altura</label><input id="dmH" type="number" value="${html(m.h)}"></div><div><label>Profundidade</label><input id="dmD" type="number" value="${html(m.d)}"></div><div><label>Espessura MDF</label><input id="dmThick" type="number" value="${html(m.thickness||15)}"></div><div><label>Posição X</label><input id="dmX" type="number" value="${html(m.x)}"></div><div><label>Posição Y</label><input id="dmY" type="number" value="${html(m.y)}"></div><div><label>Posição Z</label><input id="dmZ" type="number" value="${html(m.z||0)}"></div><div><label>Folga</label><input id="dmGap" type="number" value="${html(m.gap||2)}"></div></div><label>Material externo</label><select id="dmExt">${materialOptions(m.ext)}</select><label>Material interno</label><select id="dmInner">${materialOptions(m.inner)}</select><div class="form-grid"><div><label class="check"><input id="dmSideExt" type="checkbox" ${m.sideExt?'checked':''}> laterais na cor externa</label></div><div><label>Tamponamento</label><select id="dmTampon"><option ${(!m.tamponamento||m.tamponamento==='nenhum')?'selected':''}>nenhum</option><option ${(m.tamponamento==='esquerdo')?'selected':''}>esquerdo</option><option ${(m.tamponamento==='direito')?'selected':''}>direito</option><option ${(m.tamponamento==='ambos')?'selected':''}>ambos</option></select></div></div><label>Cor visual</label><input id="dmColor" type="color" value="${html(m.color || materialHex(m.ext))}"><div class="form-grid"><div><label>Sentido do veio</label><select id="dmGrain"><option ${m.grain==='Vertical'?'selected':''}>Vertical</option><option ${m.grain==='Horizontal'?'selected':''}>Horizontal</option><option ${m.grain==='Livre'?'selected':''}>Livre</option></select></div><div><label>Puxador</label><select id="dmHandle"><option ${m.handle==='puxador externo'?'selected':''}>puxador externo</option><option ${m.handle==='puxador cava'?'selected':''}>puxador cava</option><option ${m.handle==='perfil gola'?'selected':''}>perfil gola</option><option ${m.handle==='sem puxador'?'selected':''}>sem puxador</option></select></div><div><label>Lado do puxador</label><select id="dmHandleSide"><option value="auto" ${(m.handleSide||'auto')==='auto'?'selected':''}>auto</option><option value="left" ${(m.handleSide||'auto')==='left'?'selected':''}>esquerda</option><option value="right" ${(m.handleSide||'auto')==='right'?'selected':''}>direita</option><option value="center" ${(m.handleSide||'auto')==='center'?'selected':''}>centro</option></select></div><div><label>Tipo de porta</label><select id="dmDoorType"><option ${m.doorType==='sobreposta'?'selected':''}>sobreposta</option><option ${m.doorType==='interna'?'selected':''}>interna</option><option ${m.doorType==='basculante'?'selected':''}>basculante</option></select></div><div><label>Rodapé/soclo</label><input id="dmSocle" type="number" value="${html(m.socle||0)}"></div><div><label>Portas</label><input id="dmDoors" type="number" value="${html(m.doors||0)}"></div><div><label>Gavetas</label><input id="dmDrawers" type="number" value="${html(m.drawers||0)}"></div><div><label>Prateleiras</label><input id="dmShelves" type="number" value="${html(m.shelves||0)}"></div><div><label>Colunas/divisões</label><input id="dmColumns" type="number" value="${html(m.columns||0)}"></div></div><div class="quickParts"><button class="ghost mini" onclick="TP.changeDesignerCount('doors',1)">+ porta</button><button class="ghost mini" onclick="TP.changeDesignerCount('drawers',1)">+ gaveta</button><button class="ghost mini" onclick="TP.changeDesignerCount('shelves',1)">+ prateleira</button><button class="ghost mini" onclick="TP.changeDesignerCount('columns',1)">+ divisão</button></div><label>Alturas das gavetas</label><input id="dmDrawerHeights" value="${html(m.drawerHeights||'')}" placeholder="Ex: 150,200,250"><div class="quickParts"><button class="ghost mini" onclick="TP.toggleDesignerOpen('openDoors')">${m.openDoors?'Fechar portas':'Abrir portas'}</button><button class="ghost mini" onclick="TP.toggleDesignerOpen('openDrawers')">${m.openDrawers?'Fechar gavetas':'Abrir gavetas'}</button></div><label>Observações</label><textarea id="dmObs">${html(m.obs||'')}</textarea><div class="row-actions"><button class="primary" onclick="TP.applyDesignerModule()">Aplicar</button><button class="ghost" onclick="TP.duplicateDesignerModule()">Duplicar</button><button class="danger" onclick="TP.deleteDesignerModule()">Excluir</button></div><div class="designerNudges"><button class="ghost" onclick="TP.moveDesigner(-50,0)">←</button><button class="ghost" onclick="TP.moveDesigner(50,0)">→</button><button class="ghost" onclick="TP.moveDesigner(0,-50)">↑</button><button class="ghost" onclick="TP.moveDesigner(0,50)">↓</button><button class="ghost" onclick="TP.alignDesigner('floor')">Chão</button><button class="ghost" onclick="TP.alignDesigner('top')">Topo</button><button class="ghost" onclick="TP.alignDesigner('center')">Centralizar</button></div></div>`;
  }
  function piecesTableHtml(pieces){
    if(!pieces || !pieces.length) return '<div class="empty">Gere a lista de peças para aparecer aqui.</div>';
    return table(['Peça','Largura','Altura','Qtd','Esp.','Material','Veio','Obs'], pieces.map(pc=>[html(pc.name), Math.round(pc.width)+' mm', Math.round(pc.height)+' mm', pc.qty, pc.thickness+' mm', html(pc.material), html(pc.grain), html(pc.obs||'')]));
  }
  function renderDesigner(){
    const pid = state.designer.projectId || (state.projects[0] && state.projects[0].id) || ''; state.designer.projectId = pid;
    const p = getProject(pid); const design = currentDesign();
    return `${designerFlowHtml()}<div class="designerTop card form"><div class="designerHeaderPro"><div><h3>Projeto 3D Pro</h3><p class="muted small">Fluxo inspirado em softwares profissionais: ambiente → itens fixos → módulos → cotas → peças → orçamento. Não copia código proprietário.</p></div><div class="modeChip">${designerModeLabel()}</div></div><div class="form-grid"><div><label>Cliente/projeto</label><select id="designProject">${quoteProjectOptions(pid)}</select></div><div><label>Nome do ambiente</label><input id="envName" value="${html(design.envName)}"></div><div><label>Tipo de ambiente</label><select id="roomType"><option ${design.roomType==='Cozinha'?'selected':''}>Cozinha</option><option ${design.roomType==='Quarto'?'selected':''}>Quarto</option><option ${design.roomType==='Banheiro'?'selected':''}>Banheiro</option><option ${design.roomType==='Sala'?'selected':''}>Sala</option><option ${design.roomType==='Escritório'?'selected':''}>Escritório</option><option ${design.roomType==='Área gourmet'?'selected':''}>Área gourmet</option><option ${design.roomType==='Lavanderia'?'selected':''}>Lavanderia</option></select></div><div><label>Medidas do ambiente em mm</label><div class="inline-trio"><input id="envW" type="number" value="${html(design.width)}" title="largura"><input id="envH" type="number" value="${html(design.height)}" title="altura"><input id="envD" type="number" value="${html(design.depth)}" title="profundidade"></div></div><div><label>Pintar parede</label><input id="wallColor" type="color" value="${html(design.wallColor)}" title="Pintar parede"></div><div><label>Pintar piso</label><input id="floorColor" type="color" value="${html(design.floorColor)}" title="Pintar piso"></div><div><label>Cor de fundo</label><input id="bgColor" type="color" value="${html(design.bgColor)}" title="Cor de fundo"></div><div><label>Opções</label><div class="row-actions"><label class="check"><input id="showGrid" type="checkbox" ${design.showGrid?'checked':''}> grade técnica</label><label class="check"><input id="showMeasures" type="checkbox" ${design.showMeasures?'checked':''}> medidas</label><label class="check"><input id="snapGrid" type="checkbox" ${design.snap?'checked':''}> encaixe</label></div></div></div>${designerRibbonHtml(design)}<div class="row-actions" style="margin-top:10px"><button class="primary" onclick="TP.saveDesignerEnvironment()">Salvar ambiente</button><button class="ghost" onclick="TP.addKitchenPreset()">Montar cozinha exemplo</button><button class="ghost" onclick="TP.generatePiecesForCurrentDesign()">Gerar lista de peças</button><button class="ghost" onclick="TP.designerToBudget()">Gerar orçamento deste projeto</button><button class="ghost" onclick="TP.exportDesignerPng()">Salvar imagem PNG</button><button class="ghost" onclick="TP.exportDesignerSvg()">Exportar SVG</button><button class="ghost" onclick="TP.printDesignerProject()">Exportar PDF</button><button class="danger" onclick="TP.clearDesignerEnvironment()">Limpar ambiente</button></div></div>
    <div class="designerShell"><div class="card catalogPanel"><h3>Biblioteca de móveis</h3><p class="muted small">Arraste para o ambiente ou clique para adicionar.</p>${libraryHtml()}</div><div class="designerWorkspace"><div class="card"><h3>${html(p.name || 'Projeto 3D')}</h3>${p.id ? designerStageHtml(design) : '<div class="empty">Crie um projeto primeiro.</div>'}</div><div class="card" style="margin-top:14px"><h3>Lista de peças</h3>${piecesTableHtml(generatePiecesFromDesign(design))}</div></div>${designerPropertiesHtml(design)}</div>`;
  }


  function normalizePieceName(name){
    let n=String(name||'');
    n=n.replace(/ - lateral direita/gi,' - lateral esquerda');
    n=n.replace(/ - tampo superior/gi,' - base inferior');
    return n;
  }
  function aggregatePieces(pieces){
    const map=new Map();
    (pieces||[]).forEach(pc=>{
      const name=normalizePieceName(pc.name);
      const key=[name, Math.round(num(pc.width)), Math.round(num(pc.height)), num(pc.thickness)||0, pc.material||'', pc.grain||'', pc.obs||''].join('|');
      if(!map.has(key)) map.set(key, Object.assign({}, pc, {name, qty:0}));
      map.get(key).qty += num(pc.qty)||1;
    });
    return Array.from(map.values());
  }
  function generatePiecesFromDesign(design){
    const pieces=[]; const t=15;
    (design.modules||[]).forEach(m=>{
      if(isEnvironmentModule(m)) return;
      const thick = num(m.thickness)||t, w=num(m.w), h=num(m.h), d=num(m.d), base=m.name||'Módulo';
      function add(n,width,height,qty,material,obs){ if(width>0 && height>0) pieces.push({ id:uid(), module_id:m.id, name:base+' - '+n, width:Math.round(width), height:Math.round(height), qty:qty||1, thickness:thick, material:material||m.inner, color:material||m.inner, grain:m.grain||'Livre', obs:obs || ('Prof. '+Math.round(d)+' mm | '+(m.handle||'')) }); }
      if(String(m.type).toLowerCase().includes('painel') || String(m.type).toLowerCase().includes('bancada') || String(m.type).toLowerCase().includes('prateleira')){ add(m.type,w,h,num(m.qty)||1,m.ext,m.obs); return; }
      add('lateral esquerda', d, h, 1, m.inner); add('lateral direita', d, h, 1, m.inner); add('base inferior', Math.max(1,w-(2*thick)), d, 1, m.inner); add('tampo superior', Math.max(1,w-(2*thick)), d, 1, m.inner); add('fundo', w, h, 1, 'MDF 3mm / fundo');
      const shelves = Math.floor(num(m.shelves)); for(let i=0;i<shelves;i++) add('prateleira '+(i+1), Math.max(1,w-(2*thick)), Math.max(1,d-5), 1, m.inner);
      const cols = Math.floor(num(m.columns)); for(let i=0;i<cols;i++) add('divisão vertical '+(i+1), Math.max(1,d-5), Math.max(1,h-(2*thick)), 1, m.inner);
      const doors = Math.floor(num(m.doors)); for(let i=0;i<doors;i++) add('porta '+(i+1), Math.max(1,Math.floor(w/Math.max(1,doors))-num(m.gap||2)), Math.max(1,h-num(m.gap||2)*2), 1, m.ext, m.doorType);
      const drawers = Math.floor(num(m.drawers)); const custom = String(m.drawerHeights||'').split(',').map(x=>num(x.trim())).filter(Boolean); for(let i=0;i<drawers;i++){ const gh = custom[i] || Math.floor(h/Math.max(1,drawers)); add('frente gaveta '+(i+1), Math.max(1,w-6), Math.max(1,gh-4), 1, m.ext); add('lateral gaveta '+(i+1), Math.max(1,d-60), Math.max(1,gh-40), 2, m.inner); add('traseiro gaveta '+(i+1), Math.max(1,w-80), Math.max(1,gh-40), 1, m.inner); add('fundo gaveta '+(i+1), Math.max(1,w-80), Math.max(1,d-80), 1, 'MDF 6mm'); }
    });
    return aggregatePieces(pieces);
  }

  function renderAdmin(){
    if(!isAdmin()) return '<div class="notice redline">Somente administradores podem acessar esta aba.</div>';
    const usersRows = (state.adminProfiles||[]).map(u=>{
      const owner = isOwnerEmail(u.email||'');
      const roleBadge = roleBadges(u.roles || (u.role==='admin'?['owner']:['seller']));
      const activeBadge = `<span class="status ${u.active?'ativo':'recusado'}">${u.active?'liberado':'bloqueado'}</span>`;
      const profileBadge = u.has_profile===false?'<span class="status recusado">sem perfil</span>':'<span class="status ativo">perfil ok</span>';
      const isCurrentAccess = state.adminActingUserId === u.id;
      const accessBtn = isCurrentAccess ? `<button class="warning mini" onclick="TP.stopAccessUser()">Sair do acesso</button>` : `<button class="ghost mini" onclick="TP.accessUserData('${u.id}')">Acessar dados</button>`;
      const actions = `<div class="row-actions adminUserActions">
            ${accessBtn}
            ${owner?'<span class="badge adminKeep">admin principal protegido</span>':(u.active?`<button class="warning mini" onclick="TP.deactivateUser('${u.id}')">Bloquear</button>`:`<button class="success mini" onclick="TP.activateUser('${u.id}')">Liberar</button>`)}
            ${owner?'':(u.role==='admin'?`<button class="ghost mini" onclick="TP.makeUserRegular('${u.id}')">Tornar usuário</button>`:`<button class="primary mini" onclick="TP.makeUserAdmin('${u.id}')">Tornar admin</button>`)}
          </div>`;
      return [html(u.name||'-'), html(u.email||'-'), roleBadge, activeBadge, profileBadge, fmtDate((u.created_at||'').slice(0,10)), actions];
    });
    const tabs = state.tabs.slice().sort((a,b)=>num(a.order_index)-num(b.order_index)).map(t=>{
      const lockedAdmin = t.tab_key==='admin';
      const visible = isUserVisibleTab(t);
      const rowCls = visible ? 'toggle-row' : 'toggle-row userHiddenRow';
      const badge = lockedAdmin ? '<span class="badge adminKeep">sempre admin</span>' : (visible ? '<span class="badge okBadge">visível</span>' : '<span class="badge offBadge">oculta</span>');
      const control = lockedAdmin ? '<span class="muted small">Aba fixa do administrador.</span>' : `<label class="switch"><input type="checkbox" ${t.enabled?'checked':''} onchange="TP.toggleUserTab('${t.tab_key}',this.checked)"><span class="slider"></span></label>`;
      return `<div class="${rowCls}"><div><b>${html(tabClearTitle(t.tab_key,t.title))}</b><div class="muted small">${html(tabClearDesc(t.tab_key,t.description))}</div><span class="badge">${html(t.tab_key)}</span> ${badge}</div><div class="row-actions">${control}</div></div>`;
    }).join('');
    const rs = state.renderSettings || {};
    return `<div class="grid2"><div class="card"><h3>Abas visíveis</h3><div class="notice">Controle visual das abas. A segurança real dos cargos fica na aba <b>Empresa</b> e nas policies do Supabase.</div>${tabs}</div><div class="card"><h3>Usuários</h3><div class="notice goldline">Área técnica. Para liberar funcionários e definir múltiplos cargos, use <b>Empresa → Equipe e acesso ao sistema</b>.</div><button class="ghost" onclick="TP.loadAdminUsers()">Recarregar usuários</button><div id="usersTable" style="margin-top:12px">${table(['Nome','E-mail','Cargo','Acesso','Perfil','Criado em','Ações'], usersRows)}</div></div></div><div class="grid2" style="margin-top:14px"><div class="card"><h3>Dados da operação</h3><p>Use a aba <b>Configurações</b> para manter os dados oficiais da empresa, valores por metro e padrões dos documentos.</p><div class="badge-list"><span class="badge">Preço branco: ${money(state.company.price_white)}</span><span class="badge">Cartão: ${state.company.card_factor}</span><span class="badge">Fatores: ${CATALOG.length}</span></div></div><div class="card form"><h3>Render API interna</h3><form id="renderSettingsForm"><label>Fornecedor / modo</label><input id="renderProvider" value="${html(rs.provider||'proxy-interno') }"><label>Endpoint público/proxy</label><input id="renderEndpoint" value="${html(rs.public_endpoint||'')}" placeholder="https://seu-endpoint/render"><label>Referência da API Key</label><input id="renderKeyRef" value="${html(rs.api_key_reference||'')}" placeholder="Chave salva no backend/proxy"><label>Pronto para uso?</label><select id="renderReady"><option value="false" ${!rs.ready?'selected':''}>Não</option><option value="true" ${rs.ready?'selected':''}>Sim</option></select><label>Notas internas</label><textarea id="renderNotes">${html(rs.admin_notes||'')}</textarea><button class="primary" type="submit">Salvar integração</button></form></div></div>`;
  }


  function bindCurrent(){
    if($('#clientForm')) $('#clientForm').addEventListener('submit', e=>runAction(()=>saveClient(e)));
    if($('#projectForm')) $('#projectForm').addEventListener('submit', e=>runAction(()=>saveProject(e)));
    if($('#serviceForm')) $('#serviceForm').addEventListener('submit', e=>runAction(()=>saveService(e)));
    if($('#txForm')) $('#txForm').addEventListener('submit', e=>runAction(()=>saveTx(e)));
    if($('#providerPurchaseForm')) $('#providerPurchaseForm').addEventListener('submit', e=>runAction(()=>saveProviderPurchase(e)));
    if($('#inventoryForm')) $('#inventoryForm').addEventListener('submit', e=>runAction(()=>saveInventoryItem(e)));
    if($('#supplierForm')) $('#supplierForm').addEventListener('submit', e=>runAction(()=>saveSupplier(e)));
    if($('#payrollForm')) $('#payrollForm').addEventListener('submit', e=>runAction(()=>savePayrollEmployee(e)));
    if($('#serviceProject')) $('#serviceProject').addEventListener('change', syncServiceFromProject);
    if($('#payrollService')) $('#payrollService').addEventListener('change', syncPayrollFromService);
    if($('#payrollType')) $('#payrollType').addEventListener('change', updatePayrollCalc);
    ['payrollPercent','payrollFixed','payrollBase'].forEach(id=>{ const el=$('#'+id); if(el) el.addEventListener('input', updatePayrollCalc); });
    if($('#companyForm')) $('#companyForm').addEventListener('submit', e=>runAction(()=>saveCompany(e)));
    if($('#companyLogoFile')) $('#companyLogoFile').addEventListener('change', readCompanyLogoFile);
    if($('#priceForm')) $('#priceForm').addEventListener('submit', e=>runAction(()=>savePrices(e)));
    if($('#budgetFieldsForm')) $('#budgetFieldsForm').addEventListener('submit', e=>runAction(()=>saveBudgetFields(e)));
    if($('#quickBudgetForm')) $('#quickBudgetForm').addEventListener('submit', e=>runAction(()=>createQuickBudget(e)));
    if($('#quickBudgetClient')) $('#quickBudgetClient').addEventListener('change', e=>previewBudgetClient(e.target.value));
    if($('#budgetClientPicker')) $('#budgetClientPicker').addEventListener('change', e=>{ state.quickBudgetClientId=e.target.value; const box=$('#budgetClientDetails'); if(box) box.innerHTML=clientBudgetDetailsHtml(e.target.value); const q=$('#quickBudgetClient'); if(q) q.value=e.target.value; });
    if($('#quickItemCatalog')) $('#quickItemCatalog').addEventListener('change', e=>{ const c=CATALOG.find(x=>String(x.code)===String(e.target.value)); if(c && $('#quickItemFactor')) $('#quickItemFactor').value=c.factor; });
    if($('#renderSettingsForm')) $('#renderSettingsForm').addEventListener('submit', e=>runAction(()=>saveRenderSettings(e)));
    enableEnterNext($('#content'));
    if($('#clientSearch')) $('#clientSearch').addEventListener('input', e=>filterRows('#clientTable', e.target.value));
    if($('#projectSearch')) $('#projectSearch').addEventListener('input', e=>filterRows('#projectTable', e.target.value));
    if($('#projectImageFile')) $('#projectImageFile').addEventListener('change', readProjectImageFile);
    if($('#projectImageUrl')) $('#projectImageUrl').addEventListener('input', e=>updateProjectImagePreview(e.target.value));
    if($('#serviceSearch')) $('#serviceSearch').addEventListener('input', e=>filterRows('#serviceTable', e.target.value));
    if($('#inventorySearch')) $('#inventorySearch').addEventListener('input', e=>filterRows('#inventoryTable', e.target.value));
    if($('#supplierSearch')) $('#supplierSearch').addEventListener('input', e=>filterRows('#supplierTable', e.target.value));
    if($('#productionSearch')) $('#productionSearch').addEventListener('input', e=>filterRows('#productionTable', e.target.value));
    if($('#txReceiptFile')) $('#txReceiptFile').addEventListener('change', readTxReceiptFile);
    if($('#providerReceiptFile')) $('#providerReceiptFile').addEventListener('change', readProviderReceiptFile);
    if($('#renderFile')) $('#renderFile').addEventListener('change', readRenderFile);
    if($('#budgetProject')) $('#budgetProject').addEventListener('change', e=>{ state.budgetProjectId=e.target.value; render(); });
    if($('#contractProject')) $('#contractProject').addEventListener('change', syncContractFromProject);
    if($('#contractService')) $('#contractService').addEventListener('change', syncContractFromService);
    if($('#contractPayment')) $('#contractPayment').addEventListener('input', ()=>syncReceiptPaymentFromContract(false));
    if($('#contractModelFile')) $('#contractModelFile').addEventListener('change', importContractModelFile);
    if($('#receiptPayment')) $('#receiptPayment').addEventListener('input', ()=>{ state.receiptPaymentTouched=true; });
    if($('#iCatalog')) $('#iCatalog').addEventListener('change', e=>{ const c=CATALOG.find(x=>String(x.code)===String(e.target.value)); if(c && $('#iFactor')) $('#iFactor').value=c.factor; });
    bindDesignerEvents();
  }
  function enableEnterNext(root){
    const scope = root || document;
    $$('.enter-next-bound').forEach(el=>el.classList.remove('enter-next-bound'));
    Array.from(scope.querySelectorAll('input,select')).forEach(el=>{
      if(el.classList.contains('enter-next-bound')) return;
      el.classList.add('enter-next-bound');
      el.addEventListener('keydown', e=>{
        if(e.key !== 'Enter' || e.ctrlKey || e.altKey) return;
        const container = el.closest('form') || el.closest('.card') || document;
        const fields = Array.from(container.querySelectorAll('input,select,textarea,button')).filter(x=>!x.disabled && x.type !== 'hidden' && x.offsetParent !== null);
        const i = fields.indexOf(el); const next = fields[i + (e.shiftKey ? -1 : 1)];
        if(i >= 0 && next){ e.preventDefault(); next.focus(); if(next.select) next.select(); }
      });
    });
  }
  async function requestRenderPlan(planId){
    const plan = planInfo(planId);
    const active = activeRenderPlan();
    if(active && active.plan_id === planId){ toast('Este plano já está ativo.'); return; }
    await insert('plan_requests',{ user_id:state.user.id, plan_id:plan.id, plan_name:plan.name, daily_limit:plan.limit, status:'solicitado' });
    await logAction('plano_render_solicitado',{plan_id:plan.id}); await afterSave('Plano solicitado. O administrador precisa aprovar.');
  }
  async function updatePlanStatus(id,status){ await update('plan_requests','id=eq.'+id,{status}); await logAction('plano_render_status',{id,status}); await afterSave('Plano atualizado.'); }
  async function trackRenderUsage(){
    const plan = activeRenderPlan(); if(!plan) return;
    const row = (state.renderUsage||[]).find(u=>u.user_id===state.user.id && String(u.usage_date||'').slice(0,10)===today());
    if(row) await update('render_usage','id=eq.'+row.id,{usage_count:num(row.usage_count)+1});
    else await insert('render_usage',{ user_id:state.user.id, plan_request_id:plan.id, usage_date:today(), usage_count:1 });
  }
  function filterRows(container, q){ q = String(q||'').toLowerCase(); $$(container + ' tbody tr').forEach(tr => tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none'); }
  let syncTimer=null;
  async function afterSave(msg){
    toast(msg || 'Salvo com sucesso.');
    setCloud(true,'Salvo. Atualizando tela...');
    if(syncTimer) clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>{
      loadAll().then(()=>{ if(document.activeElement && ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) { setCloud(true,'Nuvem conectada'); return; } render(); }).catch(err=>{ console.error(err); setCloud(false,'Erro na nuvem'); toast('Salvo, mas a atualização da tela falhou. Aperte Atualizar.', 'red'); });
    },300);
  }

  async function saveClient(e){
    e.preventDefault();
    const id = $('#clientId').value;
    const obj = { name:cleanText($('#clientName').value,100), document_number:cleanText(($('#clientDoc')?$('#clientDoc').value:''),40), phone:cleanPhone($('#clientPhone').value), city:cleanText($('#clientCity').value,80), address:cleanText($('#clientAddress').value,180), source:cleanText($('#clientSource').value,80), status:normalizeStatus('client',$('#clientStatus').value), notes:cleanLongText($('#clientNotes').value,1200), created_by:effectiveUserId() };
    if(!obj.name){ toast('Informe o nome do cliente.', 'red'); return; }
    try{
      if(id) await update('clients','id=eq.'+id,obj); else await insert('clients',obj);
    }catch(err){
      const msg=String(err && err.message || err || '');
      if(msg.includes('document_number') || msg.includes('schema cache') || msg.includes('column')){
        const fallback={ name:obj.name, phone:obj.phone, city:obj.city, address:obj.address, source:obj.source, status:obj.status, notes:obj.notes, created_by:obj.created_by };
        if(id) await update('clients','id=eq.'+id,fallback); else await insert('clients',fallback);
        alert('Cliente salvo, mas seu banco ainda não tem todos os campos novos. Rode a migration_v103.sql para liberar CPF/CNPJ e demais melhorias.');
      }else{ throw err; }
    }
    await logAction(id?'cliente_atualizado':'cliente_criado',{id,name:obj.name}); await afterSave('Cliente salvo.');
  }
  async function saveProject(e){
    e.preventDefault();
    const id = $('#projectId').value; const cur=getProject(id);
    let budgetItems=Array.isArray(cur.budget_items)?cur.budget_items.slice():[];
    const temp=Object.assign({}, cur, {budget_items:budgetItems, budget_discount:num(cur.budget_discount||0), entry_pct:cur.entry_pct||state.company.entry_pct, delivery_pct:cur.delivery_pct||state.company.delivery_pct});
    const safeProjectImages = (($('#projectImageUrl')?$('#projectImageUrl').value:'') || '').split(/\n|\|\|/).map(safeImageSrc).filter(Boolean).join('\n');
    const obj = { client_id:$('#projectClient').value || null, name:cleanText($('#projectName').value,120), environment:cleanText($('#projectEnv').value,60), colors:cleanText($('#projectColors').value,200), project_image_url:safeProjectImages, project_status:normalizeStatus('project',$('#projectStatus').value||'em_criacao'), status:cur.status||'rascunho', budget_value:projectTotal(temp).final || num(cur.budget_value||0), budget_items:budgetItems, budget_discount:num(cur.budget_discount||0), delivery_days:num(cur.delivery_days||30)||30, production_status:cur.production_status||'nao_iniciado', notes:cleanLongText($('#projectNotes').value,1800), created_by:effectiveUserId() };
    if(!obj.client_id){ toast('Selecione o cliente do projeto.', 'red'); return; }
    if(!obj.name){ toast('Informe o título do projeto.', 'red'); return; }
    try{ if(id) await update('projects','id=eq.'+id,obj); else await insert('projects',obj); }
    catch(err){
      if(String(err.message||err).includes('project_status') || String(err.message||err).includes('production_status')){
        const fallback=Object.assign({},obj,{status:obj.status||'rascunho'}); delete fallback.project_status; delete fallback.production_status;
        if(id) await update('projects','id=eq.'+id,fallback); else await insert('projects',fallback);
        toast('Projeto salvo. Rode a migration_v103.sql para liberar os novos status separados.', 'red');
      } else throw err;
    }
    await logAction(id?'projeto_atualizado':'projeto_criado',{id,name:obj.name,items:budgetItems.length}); await afterSave('Projeto salvo.');
  }

  function syncServiceFromProject(){
    const p=getProject($('#serviceProject') ? $('#serviceProject').value : '');
    if(!p || !p.id) return;
    const c=getClient(p.client_id);
    if(c.id && $('#serviceClient')) $('#serviceClient').value=c.id;
    if($('#serviceTitle') && !$('#serviceTitle').value.trim()) $('#serviceTitle').value=p.name || '';
    const val=projectTotal(p).final || num(p.budget_value);
    if($('#serviceValue')) $('#serviceValue').value=num(val).toFixed(2);
    if($('#serviceCost')) $('#serviceCost').value=num(p.cost_value||0).toFixed(2);
    toast('Valor do projeto puxado para o serviço.');
  }
  async function markServiceDelivered(id){ const s=getService(id); if(!s.id) return; await update('services','id=eq.'+id,{status:'entregue', closed_at: today()}); await afterSave('Serviço marcado como entregue.'); }
  async function saveService(e){
    e.preventDefault(); const id = $('#serviceId').value;
    const employeeIds=selectedValues('serviceEmployees');
    const obj = { client_id:$('#serviceClient').value || null, project_id:$('#serviceProject').value || null, title:cleanText($('#serviceTitle').value,140), status:normalizeStatus('service',$('#serviceStatus').value), value:num($('#serviceValue').value), cost:num($('#serviceCost').value), started_at:$('#serviceStart').value || null, closed_at:$('#serviceClose').value || (['entregue','finalizado'].includes(normalizeStatus('service',$('#serviceStatus').value)) ? today() : null), notes:cleanLongText($('#serviceNotes').value,1500), payroll_employee_id:employeeIds[0]||null, payroll_employee_ids:employeeIds, payroll_release_mode:($('#servicePayOnDelivery')&&$('#servicePayOnDelivery').checked?'entregue':'status'), created_by:effectiveUserId() };
    let rows; if(id) rows = await update('services','id=eq.'+id,obj); else rows = await insert('services',obj);
    const saved = rows && rows[0] ? rows[0] : Object.assign({id}, obj);
    await syncAutoServiceTransactions(saved);
    await logAction(id?'servico_atualizado':'servico_criado',{id:saved.id,title:obj.title,status:obj.status}); await afterSave('Serviço salvo.');
  }
  async function syncAutoServiceTransactions(s){
    if(!s || !s.id) return;
    try{ await removeRow('transactions','service_id=eq.'+s.id+'&category=eq.AUTO_SERVICO'); }catch(_){ }
    const status = String(s.status||'').toLowerCase();
    if(['entregue','finalizado'].includes(normalizeStatus('service',status))){
      if(num(s.value)>0) await insert('transactions',{ type:'entrada', category:'AUTO_SERVICO', description:'AUTO: Serviço '+status+' - '+s.title, amount:num(s.value), transaction_date:s.closed_at || today(), project_id:s.project_id, service_id:s.id, created_by:effectiveUserId() });
      if(num(s.cost)>0) await insert('transactions',{ type:'saida', category:'AUTO_SERVICO', description:'AUTO: Custo do serviço - '+s.title, amount:num(s.cost), transaction_date:s.closed_at || today(), project_id:s.project_id, service_id:s.id, created_by:effectiveUserId() });
    }
  }
  async function readTxReceiptFile(e){ const file=e.target.files && e.target.files[0]; if(!file) return; try{ const val=await imageFileToDataUrl(file,{maxWidth:1400,maxHeight:1400,quality:.78,type:'image/webp',maxMb:8}); if($('#txReceiptUrl')) $('#txReceiptUrl').value=val; toast('Comprovante otimizado. Clique em salvar movimentação.'); }catch(err){ toast(err.message || 'Não foi possível anexar o comprovante.', 'red'); } finally{ if(e.target) e.target.value=''; } }
  async function readProviderReceiptFile(e){ const file=e.target.files && e.target.files[0]; if(!file) return; try{ const val=await imageFileToDataUrl(file,{maxWidth:1400,maxHeight:1400,quality:.78,type:'image/webp',maxMb:8}); if($('#providerReceiptUrl')) $('#providerReceiptUrl').value=val; toast('Cupom otimizado. Clique em descontar do saldo.'); }catch(err){ toast(err.message || 'Não foi possível anexar o cupom.', 'red'); } finally{ if(e.target) e.target.value=''; } }
  async function saveTx(e){
    e.preventDefault();
    const txType=$('#txType').value;
    const supplierId=$('#txSupplier') ? $('#txSupplier').value : null;
    const supplierName=supplierId ? (((state.suppliers||[]).find(f=>f.id===supplierId)||{}).name||'') : '';
    const obj = { type:txType, category:(cleanText($('#txCategory').value,80) || (txType==='credito_loja'?'Crédito loja/fornecedor':'')), description:cleanText($('#txDescription').value,180), amount:num($('#txAmount').value), transaction_date:$('#txDate').value || today(), project_id:$('#txProject').value || null, service_id:$('#txService').value || null, supplier_id:supplierId||null, supplier:cleanText(supplierName,120), payment_method:cleanText(($('#txPayment')&&$('#txPayment').value)||'',60), notes:cleanLongText(($('#txNotes')&&$('#txNotes').value)||'',1200), receipt_url:safeImageSrc(($('#txReceiptUrl')&&$('#txReceiptUrl').value)||''), created_by:effectiveUserId() };
    if(!obj.description){ toast('Informe uma descrição.', 'red'); return; }
    if(!obj.amount || obj.amount<=0){ toast('Informe um valor maior que zero.', 'red'); return; }
    try{ await insert('transactions',obj); }
    catch(err){
      const msg=String(err.message||err);
      if(msg.includes('supplier_id')||msg.includes('payment_method')||msg.includes('receipt_url')||msg.includes('notes')){
        const fallback={ type:obj.type, category:obj.category, description:obj.description, amount:obj.amount, transaction_date:obj.transaction_date, project_id:obj.project_id, service_id:obj.service_id, created_by:obj.created_by };
        await insert('transactions', fallback);
        toast('Movimentação salva. Rode a migration_v103.sql para liberar fornecedor, pagamento e anexos.', 'red');
      } else throw err;
    }
    await logAction('financeiro_criado',obj);
    await afterSave(txType==='credito_loja' ? 'Crédito no fornecedor salvo.' : 'Movimentação salva.');
  }

  async function saveProviderPurchase(e){
    e.preventDefault();
    const amount=num($('#providerAmount').value);
    if(!amount || amount<=0){ toast('Informe o valor descontado do fornecedor.', 'red'); return; }
    const supplierId=($('#providerSupplier')&&$('#providerSupplier').value)||'';
    const supplierObj=(state.suppliers||[]).find(f=>f.id===supplierId)||{};
    const supplier=supplierObj.name || 'Fornecedor';
    const desc=cleanText(($('#providerDesc').value||'Compra descontada do saldo'),160);
    const obj={ type:'credito_loja', category:'USO_CREDITO_FORNECEDOR', description:`Compra no fornecedor: ${cleanText(supplier,120)} - ${desc}`, amount:-Math.abs(amount), transaction_date:$('#providerDate').value||today(), supplier_id:supplierId||null, supplier:cleanText(supplier,120), payment_method:'Saldo fornecedor', receipt_url:safeImageSrc(($('#providerReceiptUrl')&&$('#providerReceiptUrl').value)||''), project_id:$('#providerProject').value||null, service_id:$('#providerService').value||null, created_by:effectiveUserId() };
    try{ await insert('transactions',obj); }
    catch(err){
      const msg=String(err.message||err);
      if(msg.includes('supplier_id')||msg.includes('payment_method')||msg.includes('receipt_url')){
        const fallback={ type:obj.type, category:obj.category, description:obj.description, amount:obj.amount, transaction_date:obj.transaction_date, project_id:obj.project_id, service_id:obj.service_id, created_by:obj.created_by };
        await insert('transactions',fallback);
        toast('Compra salva. Rode a migration_v103.sql para liberar fornecedor e anexo nesta área.', 'red');
      } else throw err;
    }
    await logAction('saldo_fornecedor_usado',obj);
    await afterSave('Compra descontada do saldo do fornecedor.');
  }
  async function seedDefaultInventory(force){
    if(!force && !confirm('Adicionar lista padrão de itens de marcenaria ao estoque? Itens já existentes não serão duplicados.')) return;
    const existing = new Set((state.inventoryItems||[]).map(i=>normalizeInventoryName(i.item_name)));
    const missing = DEFAULT_INVENTORY_ITEMS.filter(i=>!existing.has(normalizeInventoryName(i.item_name)));
    if(!missing.length){ toast('A lista padrão já está no estoque.'); return; }
    setCloud(false, 'Adicionando itens...');
    const payloads = missing.map(i=>Object.assign({current_qty:0, min_qty:0, avg_cost:0, supplier:'', notes:'Item padrão editável sem quantidade/mínimo/custo.', created_by:effectiveUserId()}, i));
    try{
      await insert('inventory_items', payloads);
      localStorage.setItem('tp_inventory_seed_done_'+effectiveUserId(),'1');
      await afterSave(missing.length + ' itens padrão adicionados ao estoque.');
    }catch(err){
      console.error(err);
      toast('Não consegui adicionar todos os itens. Confira a migration de estoque e a conexão.', 'red');
      setCloud(false, 'Erro na nuvem');
    }
  }

  async function ensureInventoryPresetIfEmpty(){
    if((state.inventoryItems||[]).length) return;
    if(localStorage.getItem('tp_inventory_seed_done_'+effectiveUserId())==='1' || localStorage.getItem('tp_inventory_seed_skip_'+effectiveUserId())==='1') return;
    try{
      const payloads = DEFAULT_INVENTORY_ITEMS.map(i=>Object.assign({current_qty:0, min_qty:0, avg_cost:0, supplier:'', notes:'Item padrão editável sem quantidade/mínimo/custo.', created_by:effectiveUserId()}, i));
      await insert('inventory_items', payloads);
      const uidFilter = encodeURIComponent(effectiveUserId());
      state.inventoryItems = await safeSelect('inventory_items', 'select=*&created_by=eq.' + uidFilter + '&order=item_name.asc');
      localStorage.setItem('tp_inventory_seed_done_'+effectiveUserId(),'1');
      toast('Lista padrão de estoque adicionada. Você pode editar quantidades e fornecedores.');
    }catch(err){
      console.warn('Não foi possível pré-carregar estoque padrão', err);
      localStorage.setItem('tp_inventory_seed_skip_'+effectiveUserId(),'1');
    }
  }

  function prefillInventory(name,category,unit){ if($('#inventoryName')) $('#inventoryName').value=name; if($('#inventoryCategory')) $('#inventoryCategory').value=category; if($('#inventoryUnit')) $('#inventoryUnit').value=unit; }
  function previewBudgetClient(clientId){ state.quickBudgetClientId=clientId||''; const box=$('#quickClientDetails'); if(box) box.innerHTML=clientBudgetDetailsHtml(state.quickBudgetClientId); }
  function openClientBudget(clientId){ state.quickBudgetClientId=clientId||''; state.current='projects'; render(); setTimeout(()=>toast('Crie ou selecione um projeto para este cliente. Depois abra o orçamento pelo projeto.'),50); }
  function clearInventoryForm(){ if($('#inventoryForm')) $('#inventoryForm').reset(); if($('#inventoryId')) $('#inventoryId').value=''; if($('#inventoryFormTitle')) $('#inventoryFormTitle').textContent='Novo item de estoque'; }
  function editInventoryItem(id){ const it=(state.inventoryItems||[]).find(x=>x.id===id)||{}; fill({inventoryId:'id',inventoryName:'item_name',inventoryCategory:'category',inventoryUnit:'unit',inventoryQty:'current_qty',inventoryMin:'min_qty',inventoryCost:'avg_cost',inventorySupplier:'supplier',inventoryVariants:'variant_text',inventoryNotes:'notes'},it); ['inventoryQty','inventoryMin','inventoryCost'].forEach(field=>{ const el=$('#'+field); if(el && num(el.value)===0) el.value=''; }); if($('#inventoryFormTitle')) $('#inventoryFormTitle').textContent='Editar item de estoque'; }
  async function saveInventoryItem(e){
    e.preventDefault(); const id=$('#inventoryId').value;
    const obj={ item_name:cleanText($('#inventoryName').value,140), category:cleanText($('#inventoryCategory').value,80), unit:cleanText($('#inventoryUnit').value,30)||'un', current_qty:num($('#inventoryQty').value), min_qty:num($('#inventoryMin').value), avg_cost:num($('#inventoryCost').value), supplier:cleanText($('#inventorySupplier').value,120), variant_text:cleanLongText(($('#inventoryVariants')&&$('#inventoryVariants').value)||'',800), notes:cleanLongText($('#inventoryNotes').value,1200), created_by:effectiveUserId() };
    if(!obj.item_name){ toast('Informe o nome do item.', 'red'); return; }
    try{ if(id) await update('inventory_items','id=eq.'+id,obj); else await insert('inventory_items',obj); }
    catch(err){
      if(String(err.message||err).includes('variant_text')){ const fallback=Object.assign({},obj); delete fallback.variant_text; if(id) await update('inventory_items','id=eq.'+id,fallback); else await insert('inventory_items',fallback); toast('Item salvo. Rode a migration_v103.sql para liberar variantes.', 'red'); }
      else throw err;
    }
    await afterSave('Item de estoque salvo.');
  }
  async function deleteInventoryItem(id){ if(!confirm('Excluir item de estoque?')) return; await removeRow('inventory_items','id=eq.'+id); await afterSave('Item excluído.'); }
async function clearInventoryIds(ids){
  const cleanIds = (ids || []).filter(Boolean);
  for(let i=0;i<cleanIds.length;i+=40){
    const chunk = cleanIds.slice(i,i+40).map(id => encodeURIComponent(id));
    if(!chunk.length) continue;
    try{
      await removeRow('inventory_items','id=in.(' + chunk.join(',') + ')');
    }catch(batchErr){
      console.warn('Falha ao limpar estoque em lote. Tentando item por item.', batchErr);
      for(const id of chunk){
        await removeRow('inventory_items','id=eq.' + id);
      }
    }
  }
}
async function clearAllInventory(){
  const items = (state.inventoryItems || []).filter(item => item && item.id);
  if(!items.length){ toast('Estoque já está vazio.'); return; }
  if(!confirm('Limpar TODO o estoque? Isso apagará ' + items.length + ' item(ns).')) return;
  if(!confirm('Confirma mesmo? Essa ação não tem volta.')) return;
  await clearInventoryIds(items.map(item => item.id));
  localStorage.removeItem('tp_inventory_seed_done_' + effectiveUserId());
  localStorage.setItem('tp_inventory_seed_skip_' + effectiveUserId(), '1');
  state.inventoryItems = [];
  await logAction('estoque_limpo', { total: items.length });
  await afterSave(items.length + ' item(ns) removido(s) do estoque.');
}
  function clearPayrollForm(){ if($('#payrollForm')) $('#payrollForm').reset(); if($('#payrollEmployeeId')) $('#payrollEmployeeId').value=''; if($('#payrollFormTitle')) $('#payrollFormTitle').textContent='Cadastrar funcionário'; }
  function editPayrollEmployee(id){ const e=getPayrollEmployee(id); fill({payrollEmployeeId:'id',payrollEmployeeName:'name',payrollEmployeeMode:'payment_mode',payrollEmployeePercent:'percent_value',payrollEmployeeFixed:'service_fixed_value',payrollEmployeeNotes:'notes'},e); if($('#payrollFormTitle')) $('#payrollFormTitle').textContent='Editar funcionário'; }
  async function savePayrollEmployee(ev){ ev.preventDefault(); const id=$('#payrollEmployeeId').value; const obj={ name:cleanText($('#payrollEmployeeName').value,120), payment_mode:cleanText($('#payrollEmployeeMode').value,40), percent_value:num($('#payrollEmployeePercent').value), service_fixed_value:num($('#payrollEmployeeFixed').value), notes:cleanLongText($('#payrollEmployeeNotes').value,1200), active:true, created_by:effectiveUserId() }; if(!obj.name){ toast('Informe o nome do funcionário.', 'red'); return; } if(id) await update('payroll_employees','id=eq.'+id,obj); else await insert('payroll_employees',obj); await afterSave('Funcionário salvo. Agora vincule ele na aba Serviços.'); }
  async function deletePayrollEmployee(id){ if(!confirm('Excluir funcionário da folha? Ele será removido da equipe dos serviços.')) return; try{ for(const s of state.services||[]){ const ids=serviceEmployeeIds(s); if(ids.includes(id)){ const nextIds=ids.filter(x=>x!==id); const paid=servicePayrollPaidMap(s); delete paid[id]; await update('services','id=eq.'+s.id,{payroll_employee_id:nextIds[0]||null,payroll_employee_ids:nextIds,payroll_paid_map:paid,payroll_paid:nextIds.length?nextIds.every(empId=>paid[empId]===true):false}); } } }catch(_){ } await removeRow('payroll_employees','id=eq.'+id); await afterSave('Funcionário excluído.'); }
  async function syncPayrollServiceTransaction(service, employeeId){
    if(!service || !service.id || !employeeId) return;
    const cat='FOLHA_SERVICO_'+service.id+'_'+employeeId;
    try{ await removeRow('transactions','category=eq.'+encodeURIComponent(cat)); }catch(_){ }
    // V111: pagamento de funcionário não entra mais em Saídas. O valor é controlado em estatística própria.
  }
  async function markServicePayrollPaid(serviceId, employeeId){ const service=getService(serviceId); if(!service.id || !employeeId) return; const ids=serviceEmployeeIds(service); const paid=servicePayrollPaidMap(service); paid[employeeId]=true; const allPaid=ids.length?ids.every(id=>paid[id]===true):false; const patch={payroll_paid_map:paid,payroll_paid:allPaid,payroll_paid_at:today()}; const rows=await update('services','id=eq.'+serviceId,patch); const updated=rows&&rows[0]?rows[0]:Object.assign({},service,patch); await syncPayrollServiceTransaction(updated, employeeId); await afterSave('Pagamento deste funcionário marcado como pago.'); }
  async function markServicePayrollPending(serviceId, employeeId){ const service=getService(serviceId); if(!service.id || !employeeId) return; const paid=servicePayrollPaidMap(service); paid[employeeId]=false; const patch={payroll_paid_map:paid,payroll_paid:false,payroll_paid_at:null}; const rows=await update('services','id=eq.'+serviceId,patch); const updated=rows&&rows[0]?rows[0]:Object.assign({},service,patch); await syncPayrollServiceTransaction(updated, employeeId); await afterSave('Pagamento deste funcionário voltou para pendente.'); }
  function syncPayrollFromService(){ }
  function updatePayrollCalc(){ }
  function editPayroll(id){ editPayrollEmployee(id); }
  async function savePayroll(e){ return savePayrollEmployee(e); }
  async function markPayrollPaid(id){ const s=getService(id); return markServicePayrollPaid(id, serviceEmployeeIds(s)[0]); }
  async function markPayrollPending(id){ const s=getService(id); return markServicePayrollPending(id, serviceEmployeeIds(s)[0]); }
  async function deletePayroll(id){ return deletePayrollEmployee(id); }
  async function saveCompany(e){ e.preventDefault(); const obj = { company_name:cleanText($('#companyName').value,140), document_number:cleanText($('#companyDoc').value,40), responsible_name:cleanText($('#companyResponsible').value,120), phone:cleanPhone($('#companyPhone').value), whatsapp:cleanPhone($('#companyWhatsapp').value), instagram:cleanText($('#companyInstagram').value,80), address:cleanText($('#companyAddress').value,180), pix_key:cleanText($('#companyPix').value,140), contract_city:cleanText($('#companyCity').value,80), logo_url:safeImageSrc(($('#companyLogo')?$('#companyLogo').value:'')), quote_primary_color:($('#quotePrimary')?$('#quotePrimary').value:'#111111'), quote_secondary_color:($('#quoteSecondary')?$('#quoteSecondary').value:'#8b8b8b'), quote_accent_color:($('#quoteAccent')?$('#quoteAccent').value:'#dc2626'), quote_text_color:($('#quoteText')?$('#quoteText').value:'#111827'), quote_title:cleanText(($('#quoteTitle')?$('#quoteTitle').value:'ORÇAMENTO DE SERVIÇO'),120), quote_valid_days:num($('#quoteValidDays')?$('#quoteValidDays').value:7)||7, quote_warranty:cleanLongText(($('#quoteWarranty')?$('#quoteWarranty').value:''),1200), quote_footer_note:cleanLongText(($('#quoteFooterNote')?$('#quoteFooterNote').value:''),1200), contract_model:cleanText(($('#contractModel')?$('#contractModel').value:'comercial'),40), receipt_model:cleanText(($('#receiptModel')?$('#receiptModel').value:'comercial'),40) }; await update('user_company_settings',companySettingsFilter(),obj); await logAction('empresa_atualizada',{}); await afterSave('Dados da empresa, modelo de contrato e recibo salvos.'); }
  async function readCompanyLogoFile(e){ const file=e.target.files && e.target.files[0]; if(!file) return; try{ const val=await imageFileToDataUrl(file,{maxWidth:1400,maxHeight:1400,quality:.96,type:'image/png',maxMb:8}); const img=$('#companyLogo'); if(img) img.value=val; toast('Logo importada em PNG com melhor qualidade. Clique em Salvar empresa.'); }catch(err){ toast(err.message || 'Não foi possível importar a logo.', 'red'); } finally{ if(e.target) e.target.value=''; } }
  function updateProjectImagePreview(value){ const box=$('#projectImagePreview'); if(!box) return; const imgs=String(value||'').split(/\n|\|\|/).map(safeImageSrc).filter(Boolean); box.innerHTML=imgs.map((src,i)=>`<figure><img loading="lazy" decoding="async" src="${html(src)}" alt="Imagem ${i+1}"><figcaption>Imagem ${i+1}</figcaption></figure>`).join(''); }
  async function readProjectImageFile(e){ const file=e.target.files && e.target.files[0]; if(!file) return; try{ const val=await imageFileToDataUrl(file,{maxWidth:1600,maxHeight:1200,quality:.82,type:'image/webp',maxMb:10}); const input=$('#projectImageUrl'); if(input){ const cur=input.value.trim(); input.value=cur ? cur+'\n'+val : val; updateProjectImagePreview(input.value); } else updateProjectImagePreview(val); toast('Imagem otimizada e adicionada. Clique em Salvar projeto.'); }catch(err){ toast(err.message || 'Não foi possível importar a imagem.', 'red'); } finally{ if(e.target) e.target.value=''; } }
  async function savePrices(e){ e.preventDefault(); const obj = { price_white:num($('#priceWhite').value)||850, price_white_wood:num($('#priceWhiteWood').value)||950, price_wood:num($('#priceWood').value)||1100, card_factor:num($('#cardFactor').value)||1.3, entry_pct:num($('#entryPct').value)||50, delivery_pct:num($('#deliveryPct').value)||50 }; await update('user_company_settings',companySettingsFilter(),obj); await logAction('precos_orcamento_atualizados',obj); await afterSave('Preços do orçamento salvos.'); }
  async function saveRenderSettings(e){ e.preventDefault(); const endpoint=safeExternalUrl($('#renderEndpoint').value); if($('#renderEndpoint').value.trim() && !endpoint){ toast('Endpoint de render bloqueado: use uma URL HTTPS válida.', 'red'); return; } const obj = { provider:cleanText($('#renderProvider').value,80), public_endpoint:endpoint, api_key_reference:cleanText($('#renderKeyRef').value,120), ready:$('#renderReady').value==='true', admin_notes:cleanLongText($('#renderNotes').value,1200) }; await update('render_settings','id=eq.true',obj); await logAction('render_settings_atualizado',{}); await afterSave('Integração de render salva.'); }

  function fill(fields, obj){ Object.keys(fields).forEach(id => { const el = $('#'+id); if(el) el.value = obj[fields[id]] == null ? '' : obj[fields[id]]; }); }
  function clearClientForm(){ $('#clientForm').reset(); $('#clientId').value=''; $('#clientFormTitle').textContent='Novo cliente'; }
  function editClient(id){ const c=getClient(id); fill({clientId:'id',clientName:'name',clientDoc:'document_number',clientPhone:'phone',clientCity:'city',clientAddress:'address',clientSource:'source',clientStatus:'status',clientNotes:'notes'},c); $('#clientFormTitle').textContent='Editar cliente'; }
  async function deleteClient(id){ if(!confirm('Excluir este cliente?')) return; await removeRow('clients','id=eq.'+id); await afterSave('Cliente excluído.'); }
  function clearProjectForm(){ $('#projectForm').reset(); $('#projectId').value=''; updateProjectImagePreview(''); $('#projectFormTitle').textContent='Novo projeto'; }
  function editProject(id){ const p=getProject(id); fill({projectId:'id',projectClient:'client_id',projectName:'name',projectEnv:'environment',projectColors:'colors',projectImageUrl:'project_image_url',projectStatus:'project_status',projectNotes:'notes'},p); updateProjectImagePreview(p.project_image_url||''); $('#projectFormTitle').textContent='Editar projeto'; }
  async function deleteProject(id){ if(!confirm('Excluir este projeto?')) return; await removeRow('projects','id=eq.'+id); await afterSave('Projeto excluído.'); }
  function clearServiceForm(){ $('#serviceForm').reset(); $('#serviceId').value=''; $('#serviceStart').value=today(); const el=$('#serviceEmployees'); if(el){ Array.from(el.querySelectorAll('input[type="checkbox"]')).forEach(c=>c.checked=false); } if($('#servicePayOnDelivery')) $('#servicePayOnDelivery').checked=false; $('#serviceFormTitle').textContent='Novo serviço'; }
  function editService(id){
    const s=getService(id);
    fill({serviceId:'id',serviceClient:'client_id',serviceProject:'project_id',serviceTitle:'title',serviceStatus:'status',serviceValue:'value',serviceCost:'cost',serviceStart:'started_at',serviceClose:'closed_at',serviceNotes:'notes'},s);
    const ids=serviceEmployeeIds(s); const el=$('#serviceEmployees');
    if(el){
      const checks=Array.from(el.querySelectorAll ? el.querySelectorAll('input[type="checkbox"]') : []);
      if(checks.length) checks.forEach(c=>c.checked=ids.includes(c.value));
      else if(el.options) Array.from(el.options).forEach(o=>o.selected=ids.includes(o.value));
    }
    if($('#servicePayOnDelivery')) $('#servicePayOnDelivery').checked=String(s.payroll_release_mode||'status')==='entregue';
    $('#serviceFormTitle').textContent='Editar serviço';
  }
  async function deleteService(id){ if(!confirm('Excluir este serviço?')) return; try{ await removeRow('transactions','service_id=eq.'+id+'&category=eq.AUTO_SERVICO'); }catch(_){ } try{ await removeRow('transactions','category=eq.'+encodeURIComponent('FOLHA_SERVICO_'+id)); }catch(_){ } await removeRow('services','id=eq.'+id); await afterSave('Serviço excluído.'); }
  async function deleteTx(id){ if(!confirm('Excluir esta movimentação?')) return; await removeRow('transactions','id=eq.'+id); await afterSave('Movimentação excluída.'); }

  function clearSupplierForm(){ if($('#supplierForm')) $('#supplierForm').reset(); if($('#supplierId')) $('#supplierId').value=''; if($('#supplierFormTitle')) $('#supplierFormTitle').textContent='Novo fornecedor'; }
  function editSupplier(id){ const f=(state.suppliers||[]).find(x=>x.id===id)||{}; fill({supplierId:'id',supplierName:'name',supplierPhone:'phone',supplierAddress:'address',supplierType:'material_type',supplierNotes:'notes'},f); if($('#supplierFormTitle')) $('#supplierFormTitle').textContent='Editar fornecedor'; }
  async function saveSupplier(e){
    e.preventDefault();
    const id=$('#supplierId').value;
    const obj={ name:cleanText($('#supplierName').value,120), phone:cleanPhone($('#supplierPhone').value), address:cleanText($('#supplierAddress').value,180), material_type:cleanText($('#supplierType').value,100), notes:cleanLongText($('#supplierNotes').value,1200), created_by:effectiveUserId() };
    if(!obj.name){ toast('Informe o nome do fornecedor.', 'red'); return; }
    if(id) await update('suppliers','id=eq.'+id,obj); else await insert('suppliers',obj);
    await afterSave('Fornecedor salvo.');
  }
  async function deleteSupplier(id){ if(!confirm('Excluir fornecedor?')) return; await removeRow('suppliers','id=eq.'+id); await afterSave('Fornecedor excluído.'); }

  function patchProjectLocal(projectId, patch){
    const idx=(state.projects||[]).findIndex(p=>String(p.id)===String(projectId));
    if(idx<0) return;
    const next=Object.assign({}, state.projects[idx], patch||{});
    next.status=normalizeStatus('budget', next.status);
    next.project_status=normalizeStatus('project', next.project_status || next.status);
    next.production_status=normalizeStatus('production', next.production_status || 'nao_iniciado');
    if(Array.isArray(next.budget_items)===false) next.budget_items=parseJsonish(next.budget_items,[]);
    state.projects[idx]=next;
  }

  async function setProductionStatus(projectId,status){
    const p=getProject(projectId); if(!p.id) return;
    const prod=normalizeStatus('production',status);
    const patch={production_status:prod};
    if(prod==='entregue') patch.delivery_deadline = p.delivery_deadline || today();
    await update('projects','id=eq.'+projectId,patch);
    patchProjectLocal(projectId, patch);
    await afterSave('Status de produção atualizado.');
  }
  async function updateProjectStatus(projectId,status){
    const p=getProject(projectId); if(!p.id) return;
    const patch={ project_status: normalizeStatus('project',status) };
    await update('projects','id=eq.'+projectId,patch);
    patchProjectLocal(projectId, patch);
    await afterSave('Status do projeto atualizado.');
  }
  async function updateBudgetStatus(projectId,status){
    const p=getProject(projectId); if(!p.id) return;
    const st=normalizeStatus('budget',status);
    const patch={ status: st };
    if(st==='aprovado'){
      patch.project_status='aprovado';
      patch.production_status=p.production_status||'nao_iniciado';
      patch.budget_value=projectTotal(p).final || p.budget_value || 0;
    }
    await update('projects','id=eq.'+projectId,patch);
    patchProjectLocal(projectId, patch);
    await afterSave('Status do orçamento atualizado.');
  }

  function quickBudgetPaymentConfig(model){
    model = String(model || '50_50');
    if(model==='fornecedor_entrega') return {entry:50, delivery:50, note:supplierSplitText()};
    if(model==='100_fechamento') return {entry:100, delivery:0, note:'100% à vista no fechamento.'};
    if(model==='100_entrega') return {entry:0, delivery:100, note:'100% à vista na entrega.'};
    return {entry:50, delivery:50, note:'50% à vista no fechamento/entrada e 50% à vista na entrega.'};
  }

  function selectedBudgetClientId(){
    return ($('#budgetClientPicker') && $('#budgetClientPicker').value) || ($('#quickBudgetClient') && $('#quickBudgetClient').value) || state.quickBudgetClientId || ((state.clients[0]&&state.clients[0].id)||'');
  }

  async function createBudgetProjectForClient(initialItems){
    const clientId = selectedBudgetClientId();
    if(!clientId){ alert('Selecione um cliente para criar o orçamento.'); return null; }
    const client = getClient(clientId);
    const model = ($('#quickBudgetPaymentModel') && $('#quickBudgetPaymentModel').value) || '50_50';
    const paymentConfig = quickBudgetPaymentConfig(model);
    const name = cleanText(($('#quickBudgetName') && $('#quickBudgetName').value) || ('Orçamento '+(client.name||'cliente')),120);
    const env = ($('#quickBudgetEnv') && $('#quickBudgetEnv').value) || 'Outro';
    const notes = cleanLongText(($('#quickBudgetNotes') && $('#quickBudgetNotes').value) || '',1200);
    const items = Array.isArray(initialItems) ? initialItems : [];
    const tempForTotal={ budget_items:items, budget_discount:0, entry_pct:paymentConfig.entry, delivery_pct:paymentConfig.delivery };
    const obj={
      client_id: clientId,
      name,
      environment: env,
      colors: '',
      status: 'rascunho',
      project_status: 'em_criacao',
      production_status: 'nao_iniciado',
      budget_value: projectTotal(tempForTotal).final,
      cost_value: 0,
      paid_value: 0,
      budget_items: items,
      budget_discount: 0,
      entry_pct: paymentConfig.entry,
      delivery_pct: paymentConfig.delivery,
      budget_payment_note: paymentConfig.note,
      contract_start: today(),
      delivery_days: num($('#quickBudgetDays') && $('#quickBudgetDays').value) || 30,
      notes,
      created_by: effectiveUserId()
    };
    let created;
    try{ created = await insert('projects', obj); }
    catch(err){
      const fallback=Object.assign({},obj); delete fallback.project_status; delete fallback.production_status;
      created = await insert('projects', fallback);
      toast('Orçamento criado. Rode a migration mais recente para liberar os novos status.', 'red');
    }
    const row = Array.isArray(created) ? created[0] : created;
    if(row && row.id) state.budgetProjectId = row.id;
    return row || null;
  }

  async function createQuickBudget(e){
    e.preventDefault();
    const clientId = ($('#quickBudgetClient') && $('#quickBudgetClient').value) || '';
    if(!clientId){ alert('Selecione um cliente para criar o orçamento.'); return; }
    const initialItems=[];
    if($('#quickAddItem') && $('#quickAddItem').checked){
      const code = ($('#quickItemCatalog') && $('#quickItemCatalog').value) || '';
      const cat = CATALOG.find(c=>String(c.code)===String(code)) || CATALOG[0];
      initialItems.push({ id:uid(), code:cat.code, desc:cat.name, name:cat.name, qty:num($('#quickItemQty')&&$('#quickItemQty').value)||1, width:num($('#quickItemWidth')&&$('#quickItemWidth').value)||0, height:num($('#quickItemHeight')&&$('#quickItemHeight').value)||0, factor:num($('#quickItemFactor')&&$('#quickItemFactor').value)||cat.factor, color:($('#quickItemColor')&&$('#quickItemColor').value)||'branco', payment:($('#quickItemPayment')&&$('#quickItemPayment').value)||'dinheiro', note:cleanLongText((($('#quickItemNote')&&$('#quickItemNote').value)||'Móvel vinculado ao cliente no orçamento.'),600) });
    }
    const model = ($('#quickBudgetPaymentModel') && $('#quickBudgetPaymentModel').value) || '50_50';
    const paymentConfig = quickBudgetPaymentConfig(model);
    const tempForTotal={ budget_items:initialItems, budget_discount:0, entry_pct:paymentConfig.entry, delivery_pct:paymentConfig.delivery };
    const obj={
      client_id: clientId,
      name: cleanText((($('#quickBudgetName') && $('#quickBudgetName').value) || 'Orçamento avulso'),120),
      environment: ($('#quickBudgetEnv') && $('#quickBudgetEnv').value) || 'Outro',
      colors: '',
      status: 'rascunho',
      project_status: 'em_criacao',
      production_status: 'nao_iniciado',
      budget_value: projectTotal(tempForTotal).final,
      cost_value: 0,
      paid_value: 0,
      budget_items: initialItems,
      budget_discount: 0,
      entry_pct: paymentConfig.entry,
      delivery_pct: paymentConfig.delivery,
      budget_payment_note: paymentConfig.note,
      contract_start: today(),
      delivery_days: num($('#quickBudgetDays') && $('#quickBudgetDays').value) || 30,
      notes: cleanLongText((($('#quickBudgetNotes') && $('#quickBudgetNotes').value) || ''),1200),
      created_by: effectiveUserId()
    };
    let created;
    try{ created = await insert('projects', obj); }
    catch(err){
      const fallback=Object.assign({},obj); delete fallback.project_status; delete fallback.production_status;
      created = await insert('projects', fallback);
      toast('Orçamento criado. Rode a migration mais recente para liberar os novos status.', 'red');
    }
    const row = Array.isArray(created) ? created[0] : created;
    state.budgetProjectId = row && row.id;
    await afterSave(initialItems.length ? 'Orçamento e projeto automático criados com móvel vinculado ao cliente.' : 'Orçamento e projeto automático criados. Agora adicione os móveis ou imagens no projeto.');
  }

  async function addBudgetItem(){
    const pid = ($('#budgetProject') && $('#budgetProject').value) || state.budgetProjectId || '';
    const p = getProject(pid);
    if(!p.id){ alert('Selecione um projeto antes de adicionar móveis ao orçamento.'); return; }
    const code = $('#iCatalog') ? $('#iCatalog').value : '';
    const cat = CATALOG.find(c=>String(c.code)===String(code)) || CATALOG[0];
    if(!cat){ toast('Tabela de móveis não carregada.', 'red'); return; }
    const item = { id:uid(), code:cat.code, desc:cat.name, name:cat.name, qty:num($('#iQty')&&$('#iQty').value)||1, width:num($('#iWidth')&&$('#iWidth').value)||0, height:num($('#iHeight')&&$('#iHeight').value)||0, factor:num($('#iFactor')&&$('#iFactor').value)||cat.factor, color:($('#iColor')&&$('#iColor').value)||'branco', payment:($('#iPayment')&&$('#iPayment').value)||'dinheiro', note:cleanLongText(($('#iNote')&&$('#iNote').value)||'',600) };
    const items = (p.budget_items||[]).concat([item]);
    const fake = Object.assign({}, p, {budget_items:items, budget_discount:p.budget_discount||0, entry_pct:pctValue(p.entry_pct,state.company.entry_pct), delivery_pct:pctValue(p.delivery_pct,state.company.delivery_pct)});
    const patch={ budget_items:items, budget_value:projectTotal(fake).final };
    await update('projects','id=eq.'+p.id,patch);
    patchProjectLocal(p.id, patch);
    state.budgetProjectId=p.id;
    await afterSave('Item adicionado ao orçamento do projeto.');
  }

  async function saveBudgetItems(pid,items,msg){
    const p=getProject(pid); if(!p.id) return;
    const fake=Object.assign({},p,{budget_items:items});
    const budget_value=projectTotal(fake).final;
    await update('projects','id=eq.'+pid,{ budget_items:items, budget_value });
    const idx=state.projects.findIndex(x=>x.id===pid);
    if(idx>=0) state.projects[idx]=Object.assign({},state.projects[idx],{budget_items:items,budget_value});
    state.budgetProjectId=pid;
    render();
    await afterSave(msg||'Orçamento atualizado.');
  }
  async function updateBudgetItem(pid,itemId){
    const p=getProject(pid); if(!p.id) return;
    const did=budgetItemDomId(itemId);
    const items=(p.budget_items||[]).map(it=>String(it.id)===String(itemId)?Object.assign({},it,{
      desc:($('#bi_desc_'+did)&&$('#bi_desc_'+did).value.trim()) || it.desc || it.name || '',
      name:($('#bi_desc_'+did)&&$('#bi_desc_'+did).value.trim()) || it.name || it.desc || '',
      qty:num($('#bi_qty_'+did)&&$('#bi_qty_'+did).value)||1,
      width:num($('#bi_w_'+did)&&$('#bi_w_'+did).value)||0,
      height:num($('#bi_h_'+did)&&$('#bi_h_'+did).value)||0,
      factor:num($('#bi_factor_'+did)&&$('#bi_factor_'+did).value)||0,
      color:($('#bi_color_'+did)&&$('#bi_color_'+did).value)||it.color||'branco',
      payment:($('#bi_payment_'+did)&&$('#bi_payment_'+did).value)||it.payment||'dinheiro'
    }):it);
    await saveBudgetItems(pid,items,'Item atualizado e orçamento recalculado.');
  }
  async function duplicateBudgetItem(pid,itemId){
    const p=getProject(pid); if(!p.id) return;
    const found=(p.budget_items||[]).find(it=>String(it.id)===String(itemId));
    if(!found){ alert('Item não encontrado.'); return; }
    const copy=Object.assign({},found,{id:uid(), desc:(found.desc||found.name||'Item')+' (cópia)'});
    await saveBudgetItems(pid,(p.budget_items||[]).concat([copy]),'Item duplicado.');
  }
  async function removeBudgetItem(pid,itemId){
    const p=getProject(pid); if(!p.id) return;
    const items=p.budget_items||[];
    const found=items.find(it=>String(it.id)===String(itemId));
    if(!found){ alert('Item não encontrado.'); return; }
    const next=items.filter(it=>String(it.id)!==String(itemId));
    await saveBudgetItems(pid,next,'Item removido do orçamento.');
  }
  async function updateBudgetItemFactor(pid,itemId,value){
    const p=getProject(pid); if(!p.id) return;
    const factor=Math.max(0, num(value)||0);
    const items=(p.budget_items||[]).map(it=>String(it.id)===String(itemId) ? Object.assign({},it,{factor}) : it);
    await saveBudgetItems(pid,items,'Fator do item atualizado.');
  }
  async function markBudgetApproved(pid){
    const p=getProject(pid); if(!p.id) return;
    const total=projectTotal(p).final || p.budget_value || 0;
    const patch={status:'aprovado', project_status:'aprovado', production_status:'nao_iniciado', budget_value:total};
    try{ await update('projects','id=eq.'+pid,patch); patchProjectLocal(pid, patch); }
    catch(err){ const fallback={status:'aprovado', budget_value:total}; await update('projects','id=eq.'+pid,fallback); patchProjectLocal(pid, fallback); toast('Aprovado. Rode migration_v103.sql para separar projeto/produção.', 'red'); }
    const existing=(state.services||[]).find(s=>s.project_id===pid);
    if(!existing){
      try{ await insert('services',{client_id:p.client_id||null, project_id:p.id, title:p.name||'Serviço aprovado', status:'aguardando_inicio', value:total, cost:num(p.cost_value||0), started_at:today(), notes:'Criado automaticamente ao aprovar orçamento.', created_by:effectiveUserId()}); }catch(err){ console.warn('Não criou serviço automático',err); }
    }
    state.budgetProjectId=pid;
    await afterSave('Orçamento aprovado. Produção e serviço foram preparados.');
  }
  let budgetSaveTimer=null;
  function queueBudgetFieldsAutosave(fast){
    if(budgetSaveTimer) clearTimeout(budgetSaveTimer);
    budgetSaveTimer=setTimeout(()=>{ const form=$('#budgetFieldsForm'); if(form) saveBudgetFields({preventDefault(){}}); }, fast ? 80 : 250);
  }
  async function saveBudgetFields(e){ e.preventDefault(); const pid=$('#budgetProject').value; const p=getProject(pid); if(!p.id)return; const budgetStatus=normalizeStatus('budget', ($('#budgetStatus')&&$('#budgetStatus').value)||p.status||'rascunho'); const entryPct=num($('#bEntry').value), deliveryPct=num($('#bDelivery').value); const fake=Object.assign({},p,{ budget_discount:num($('#bDiscount').value), entry_pct:entryPct, delivery_pct:deliveryPct, status:budgetStatus }); const obj={ status:budgetStatus, budget_discount:num($('#bDiscount').value), entry_pct:entryPct, delivery_pct:deliveryPct, budget_payment_note:cleanLongText(($('#bPaymentNote')?$('#bPaymentNote').value:''),1200), contract_start:$('#bStart').value || today(), delivery_days:num($('#bDays').value)||30, budget_value:projectTotal(fake).final }; await update('projects','id=eq.'+pid,obj); patchProjectLocal(pid,obj); state.budgetProjectId=pid; await afterSave('Orçamento atualizado.'); }
  function setPaymentSplit(entry,delivery,note){ if($('#bEntry')) $('#bEntry').value=entry; if($('#bDelivery')) $('#bDelivery').value=delivery; if(note && $('#bPaymentNote')) $('#bPaymentNote').value=note; toast('Forma de pagamento ajustada e salvando.'); queueBudgetFieldsAutosave(true); }
  function setSupplierSplit(){ if($('#bEntry')) $('#bEntry').value=50; if($('#bDelivery')) $('#bDelivery').value=50; if($('#bPaymentNote')) $('#bPaymentNote').value=supplierSplitText(); toast('Modelo 50% fornecedor/loja + 50% entrega aplicado e salvando.'); queueBudgetFieldsAutosave(true); }
  function bindDesignerEvents(){
    if($('#designProject')) $('#designProject').addEventListener('change', e=>{ state.designer.projectId=e.target.value; state.designer.selectedId=''; render(); });
    ['wallColor','floorColor','bgColor'].forEach(id=>{ const el=$('#'+id); if(el) el.addEventListener('input',()=>{ const d=currentDesign(); if($('#wallColor')) d.wallColor=$('#wallColor').value; if($('#floorColor')) d.floorColor=$('#floorColor').value; if($('#bgColor')) d.bgColor=$('#bgColor').value; const st=$('#designerStage'); if(st && st.classList.contains('designerStageSvgHost')){ refreshDesignerSvg(d); } }); });
    $$('.libitem').forEach(btn=>{ btn.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', btn.dataset.key); }); btn.addEventListener('click', ()=>addDesignerModel(btn.dataset.key)); });
    const stage=$('#designerStage');
    if(stage){
      stage.addEventListener('dragover', e=>{ e.preventDefault(); });
      stage.addEventListener('drop', e=>{ e.preventDefault(); const rect=stage.getBoundingClientRect(); addDesignerModel(e.dataTransfer.getData('text/plain'), e.clientX-rect.left, e.clientY-rect.top); });
      stage.addEventListener('click', e=>{ if(e.target===stage || e.target.classList.contains('wallPlane') || e.target.classList.contains('floorPlane') || e.target.classList.contains('leftWallPlane') || e.target.classList.contains('rightWallPlane')){ state.designer.selectedId=''; render(); } });
      if(state.designer.mode==='3d') bindDesignerOrbit(stage);
    }
    $$('.designerModule').forEach(el=>{ el.addEventListener('mousedown', startModuleDrag); el.addEventListener('click', e=>{ e.stopPropagation(); state.designer.selectedId=el.dataset.id; render(); }); });
  }
  function bindDesignerOrbit(stage){
    const viewport=$('#designerOrbitViewport') || stage.parentElement; if(!viewport) return;
    viewport.onmousedown = e=>{
      if(state.designer.mode!=='3d') return;
      if(e.target.closest('.designerModule')) return;
      e.preventDefault();
      const startX=e.clientX, startY=e.clientY; const startYaw=num(state.designer.orbitYaw||-36), startPitch=num(state.designer.orbitPitch||58);
      viewport.classList.add('orbiting');
      function move(ev){
        const yaw = startYaw + (ev.clientX-startX)*0.35;
        const pitch = clamp(startPitch - (ev.clientY-startY)*0.22, -8, 84);
        state.designer.orbitYaw = yaw; state.designer.orbitPitch = pitch;
        const s=$('#designerStage'); if(s && s.classList.contains('designerStageSvgHost')){ const design=currentDesign(); const scale=state.designer.scale||0.18; const wPx=Math.max(840,Math.round(num(design.width)*scale)); const hPx=Math.max(500,Math.round(num(design.height)*scale)); s.innerHTML=designerStage3dContent(design,scale,wPx,hPx); } else if(s){ s.style.setProperty('--orbitYaw', yaw+'deg'); s.style.setProperty('--orbitPitch', pitch+'deg'); }
      }
      function up(){ document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); viewport.classList.remove('orbiting'); render(); }
      document.addEventListener('mousemove',move); document.addEventListener('mouseup',up);
    };
  }
  function bindDesignerKeyboard(){
    if(window.__tpDesignerKeyboard) return; window.__tpDesignerKeyboard=true;
    document.addEventListener('keydown', async e=>{
      if(state.current!=='designer') return;
      const tag=String(document.activeElement && document.activeElement.tagName || '').toLowerCase();
      if(['input','textarea','select','button'].includes(tag) || (document.activeElement && document.activeElement.isContentEditable)) return;
      const design=currentDesign(); const m=selectedModule(design); if(!m) return;
      if(e.key==='Escape'){ state.designer.selectedId=''; render(); return; }
      if((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase()==='d'){ e.preventDefault(); await duplicateDesignerModule(); return; }
      if(e.key==='Delete' || e.key==='Backspace'){ e.preventDefault(); await deleteDesignerModule(false); return; }
      const arrows={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      if(!arrows[e.key]) return;
      e.preventDefault(); const step=e.ctrlKey?1:(e.shiftKey?50:10); await moveDesigner(arrows[e.key][0]*step, arrows[e.key][1]*step, true);
    });
  }
  function findLibraryModel(key){ for(const g of LIBRARY){ const it=g.items.find(x=>x[0]===key); if(it) return it; } return null; }
  async function addDesignerModel(key, px, py){ const model=findLibraryModel(key); if(!model) return; const design=currentDesign(); const m=makeModule(model); const scale=state.designer.scale||0.18; if(px!=null){ m.x = Math.round(px/scale); if(state.designer.mode==='top'){ m.z = Math.max(0, Math.round(py/scale)-46); if(moduleKindClass(m)==='baseItem'||moduleKindClass(m)==='tallItem') m.y = Math.max(0,num(design.height)-num(m.h)); if(moduleKindClass(m)==='wallItem') m.y = Math.round(num(design.height)*.32); } else { m.y = Math.round(py/scale); } } else { m.x = 80 + (design.modules.length%5)*140; m.z = 0; if(moduleKindClass(m)==='wallItem') m.y = Math.round(num(design.height)*.32); else m.y = Math.max(0,num(design.height)-num(m.h)); } smartSnap(design,m); design.modules.push(m); state.designer.selectedId=m.id; await saveCurrentDesignObject(design); await afterSave('Móvel adicionado ao ambiente.'); }
  function snap(v){ const design=currentDesign(); return design.snap ? Math.round(num(v)/50)*50 : num(v); }
  function refreshDesignerSvg(design){ const stage=$('#designerStage'); if(!stage || !stage.classList.contains('designerStageSvgHost')) return false; const scale=state.designer.scale||0.18; const wPx=Math.max(840,Math.round(num(design.width)*scale)); const hPx=Math.max(500,Math.round(num(design.height)*scale)); stage.innerHTML=designerStage3dContent(design,scale,wPx,hPx); return true; }
  function updateModuleDom(id,m){ const scale=state.designer.scale||0.18; const stage=$('#designerStage'); if(stage&&stage.classList.contains('designerStageSvgHost')) return; const el=stage&&stage.querySelector(`[data-id="${id}"]`); if(el){ el.style.left=Math.round(num(m.x)*scale)+'px'; el.style.top=(state.designer.mode==='top'?Math.round((num(m.z||0)+46)*scale):Math.round(num(m.y)*scale))+'px'; } }
  function startModuleDrag(e){ e.preventDefault(); e.stopPropagation(); const id=e.currentTarget.dataset.id; const startX=e.clientX,startY=e.clientY; const design=currentDesign(); const m=moduleById(design,id); if(!m)return; state.designer.selectedId=id; const origX=num(m.x),origY=num(m.y),origZ=num(m.z||0); const oldPos={x:origX,y:origY,z:origZ}; let raf=false; function move(ev){ const scale=state.designer.scale||0.18; if(state.designer.mode==='3d'){ m.x=origX+(ev.clientX-startX)/scale; m.y=origY+(ev.clientY-startY)/scale; } else { m.x=origX+(ev.clientX-startX)/scale; if(state.designer.mode==='top') m.z=origZ+(ev.clientY-startY)/scale; else m.y=origY+(ev.clientY-startY)/scale; } smartSnap(design,m,oldPos); if($('#designerStage')&&$('#designerStage').classList.contains('designerStageSvgHost')){ if(!raf){ raf=true; requestAnimationFrame(()=>{ raf=false; refreshDesignerSvg(design); }); } } else updateModuleDom(id,m); } async function up(){ document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); await saveCurrentDesignObject(design); await loadAll(); render(); } document.addEventListener('mousemove',move); document.addEventListener('mouseup',up); }
  async function saveDesignerEnvironment(){ const design=currentDesign(); Object.assign(design,{ envName:$('#envName').value.trim(), roomType:$('#roomType').value, width:num($('#envW').value)||3000, height:num($('#envH').value)||2600, depth:num($('#envD').value)||600, wallColor:$('#wallColor').value, floorColor:$('#floorColor').value, bgColor:$('#bgColor').value, showGrid:$('#showGrid').checked, showMeasures:$('#showMeasures').checked, snap:$('#snapGrid').checked }); (design.modules||[]).forEach(m=>smartSnap(design,m)); state.designer.showGrid=design.showGrid; await saveCurrentDesignObject(design); await afterSave('Ambiente salvo.'); }
  function readDesignerFormModule(m){ Object.assign(m,{ name:$('#dmName').value.trim(), type:$('#dmType').value.trim(), w:num($('#dmW').value)||m.w, h:num($('#dmH').value)||m.h, d:num($('#dmD').value)||m.d, x:num($('#dmX').value), y:num($('#dmY').value), z:num($('#dmZ').value), ext:$('#dmExt').value, inner:$('#dmInner').value, color:materialHex($('#dmExt').value), thickness:num($('#dmThick').value)||15, grain:$('#dmGrain').value, handle:$('#dmHandle').value, handleSide:($('#dmHandleSide')&&$('#dmHandleSide').value)||'auto', doorType:$('#dmDoorType').value, doors:num($('#dmDoors').value), drawers:num($('#dmDrawers').value), shelves:num($('#dmShelves').value), columns:num($('#dmColumns').value), socle:num($('#dmSocle').value), gap:num($('#dmGap').value), drawerHeights:$('#dmDrawerHeights').value.trim(), obs:$('#dmObs').value.trim(), sideExt:!!($('#dmSideExt')&&$('#dmSideExt').checked), tamponamento:($('#dmTampon')&&$('#dmTampon').value)||'nenhum' }); }
  async function applyDesignerModule(){ const design=currentDesign(); const m=selectedModule(design); if(!m)return; const old={x:num(m.x),y:num(m.y)}; readDesignerFormModule(m); smartSnap(design,m,old); await saveCurrentDesignObject(design); await afterSave('Móvel atualizado.'); }
  async function duplicateDesignerModule(){ const design=currentDesign(); const m=selectedModule(design); if(!m)return; const copy=JSON.parse(JSON.stringify(m)); copy.id=uid(); copy.name=m.name+' cópia'; copy.x=num(m.x)+80; copy.y=num(m.y)+50; smartSnap(design,copy); design.modules.push(copy); state.designer.selectedId=copy.id; await saveCurrentDesignObject(design); await afterSave('Móvel duplicado.'); }
  async function deleteDesignerModule(ask=true){
    const design=currentDesign();
    design.modules = Array.isArray(design.modules) ? design.modules : [];
    let id = state.designer.selectedId;
    if(!id){ const selectedEl=document.querySelector('.designerModule.selected'); if(selectedEl) id=selectedEl.dataset.id; }
    if(!id && design.modules.length===1) id=design.modules[0].id;
    let m = moduleById(design,id);
    if(!m){ alert('Selecione um móvel primeiro. Dica: clique no móvel e depois em Excluir.'); return; }
    if(ask && !confirm('Excluir móvel selecionado?')) return;
    design.modules = design.modules.filter(x=>x && x.id!==m.id);
    design.pieces = [];
    state.designer.selectedId = design.modules[0] ? design.modules[0].id : '';
    await saveCurrentDesignObject(design);
    await loadAll();
    render();
    toast('Móvel excluído.');
  }
  async function moveDesigner(dx,dy,quiet){ const design=currentDesign(); const m=selectedModule(design); if(!m)return; const old={x:num(m.x),y:num(m.y),z:num(m.z||0)}; m.x=num(m.x)+dx; if(state.designer.mode==='top') m.z=num(m.z||0)+dy; else m.y=num(m.y)+dy; smartSnap(design,m,old); await saveCurrentDesignObject(design); if(quiet){ await loadAll(); render(); } else { await afterSave('Móvel movido.'); } }
  async function alignDesigner(where){ const design=currentDesign(); const m=selectedModule(design); if(!m)return; if(where==='floor') m.y=Math.max(0,num(design.height)-num(m.h)); if(where==='top') m.y=0; if(where==='center') m.x=Math.max(0,(num(design.width)-num(m.w))/2); if(where==='wall') m.z=0; smartSnap(design,m); await saveCurrentDesignObject(design); await afterSave('Móvel alinhado.'); }
  async function clearDesignerEnvironment(){
    const design=currentDesign();
    if(!Array.isArray(design.modules) || design.modules.length===0){ toast('Este ambiente já está vazio.'); return; }
    if(!confirm('Limpar todos os móveis deste ambiente?')) return;
    design.modules=[];
    design.pieces=[];
    state.designer.selectedId='';
    await saveCurrentDesignObject(design);
    await loadAll();
    render();
    toast('Ambiente limpo.');
  }
  function setDesignerMode(mode){ state.designer.mode=mode; render(); }
  function setDesignerZoom(delta){ state.designer.scale = clamp((state.designer.scale||0.18)+delta, 0.10, 0.32); render(); }
  function fitDesignerZoom(){ const design=currentDesign(); const maxW=Math.max(1200,num(design.width)); state.designer.scale = maxW>4200 ? 0.14 : maxW>3400 ? 0.16 : 0.18; render(); }
  async function toggleDesignerOption(key){ const design=currentDesign(); design[key]=!design[key]; if(key==='snap') design.snap=!!design[key]; await saveCurrentDesignObject(design); await loadAll(); render(); }
  async function toggleDesignerOpen(field){ const design=currentDesign(); const m=selectedModule(design); if(!m)return; m[field]=!m[field]; await saveCurrentDesignObject(design); await loadAll(); render(); }
  async function changeDesignerCount(field,delta){ const design=currentDesign(); const m=selectedModule(design); if(!m)return; m[field]=Math.max(0, Math.floor(num(m[field]))+delta); await saveCurrentDesignObject(design); await loadAll(); render(); }
  async function addKitchenPreset(){
    const design=currentDesign(); if(!state.designer.projectId){alert('Selecione um projeto.');return;}
    design.width=4200; design.height=2700; design.depth=900; design.roomType='Cozinha'; design.envName=design.envName||'Cozinha planejada profissional'; design.wallColor='#f5f5f4'; design.floorColor='#cbc3b6'; design.bgColor='#ffffff'; design.showMeasures=true; design.showGrid=false; design.snap=true;
    const layout=[
      ['janela',420,260,0,900,520,40,'#bfdbfe'],
      ['balcao1',80,0,0,600,720,550,'#d8b59d'],
      ['balcaop',680,0,0,1200,720,550,'#d8b59d'],
      ['balcaogav',1880,0,0,700,720,550,'#d8b59d'],
      ['lavaLoucas',2580,0,0,600,820,600,'#d8dee9'],
      ['torre',3180,0,0,700,2250,560,'#9a6b3f'],
      ['vaoGeladeira',3500,0,0,650,2100,720,'#d8dee9'],
      ['aereo2',680,560,0,1200,720,320,'#9a6b3f'],
      ['basculante',1880,620,0,700,420,320,'#9a6b3f'],
      ['microondas',3230,820,0,600,380,400,'#1f2937'],
      ['forno',3230,1320,0,600,600,560,'#1f2937'],
      ['fogao',1160,0,0,600,120,520,'#111827'],
      ['cuba',1120,0,0,520,70,430,'#e5e7eb'],
      ['coifa',1080,700,0,750,420,340,'#111827'],
      ['bancadaPedra',80,0,0,3100,45,600,'#242018'],
      ['tomada',3000,1350,0,90,90,20,'#f8fafc'],
      ['hidraulico',1270,1550,0,110,110,20,'#bae6fd']
    ];
    design.modules=[];
    layout.forEach(row=>{
      const found=findLibraryModel(row[0]); if(!found) return; const m=makeModule(found);
      m.x=row[1]; m.y=row[2]; m.z=row[3]; m.w=row[4]; m.h=row[5]; m.d=row[6]; m.color=row[7]||m.color;
      if(moduleKindClass(m)==='baseItem'||moduleKindClass(m)==='tallItem') m.y=Math.max(0,num(design.height)-num(m.h)-80);
      if(row[0]==='bancadaPedra') m.y=Math.max(0,num(design.height)-780);
      if(row[0]==='fogao') m.y=Math.max(0,num(design.height)-850);
      if(row[0]==='cuba'){ m.y=Math.max(0,num(design.height)-781); m.h=1; }
      if(row[0]==='janela') m.y=230;
      if(row[0]==='coifa') m.y=620;
      if(row[0]==='microondas') m.y=820;
      if(row[0]==='forno') m.y=1320;
      m.ext = ['#9a6b3f','#d8b59d'].includes(row[7]) ? 'Roble Catedral' : (row[0]==='bancadaPedra'?'Pedra Preto São Gabriel':(isEnvironmentModule(m)?'Cinza/Chumbo':'Branco TX'));
      m.inner='Branco TX'; design.modules.push(m);
    });
    state.designer.mode='3d';
    await saveCurrentDesignObject(design); await afterSave('Cozinha profissional montada. Use Planta/Frontal/3D para revisar, alinhar e orçar.'); }
  async function generatePiecesForCurrentDesign(){ const design=currentDesign(); const pieces=generatePiecesFromDesign(design); design.pieces=pieces; await saveCurrentDesignObject(design); toast('Lista de peças gerada.'); render(); }
  async function designerToBudget(){ const p=getProject(state.designer.projectId); if(!p.id){alert('Selecione um projeto.');return;} const design=currentDesign(); const validModules=(design.modules||[]).filter(m=>!isEnvironmentModule(m)); if(!validModules.length){alert('Adicione móveis primeiro.');return;} const addItems=validModules.map(m=>({ id:uid(), code:'3D', desc:m.name, qty:1, width:num(m.w), height:num(m.h), factor:1, color:budgetColorFromMaterial(m.ext), payment:'dinheiro', note:'Gerado no Projeto 3D | Prof. '+m.d+' mm | Ext. '+m.ext+' | Int. '+m.inner })); const items=(p.budget_items||[]).concat(addItems); const fake=Object.assign({},p,{budget_items:items}); await update('projects','id=eq.'+p.id,{ budget_items:items, budget_value:projectTotal(fake).final, pieces_data:generatePiecesFromDesign(design) }); state.budgetProjectId=p.id; state.current='budget'; await loadAll(); render(); toast('Itens do Projeto 3D enviados para o orçamento.'); }
  function designerSvgMarkup(design, scale, forcedMode){
    scale=scale||0.22;
    const mode=forcedMode || state.designer.mode || '3d';
    const p=getProject(state.designer.projectId); const c=getClient(p.client_id);
    const W=num(design.width)||3000, H=num(design.height)||2600, D=num(design.depth)||900;
    function safeId(v){ return 'exp_'+String(v||'mat').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
    const mats=Array.from(new Set((design.modules||[]).flatMap(m=>[materialFront(m),materialBody(m)]).filter(Boolean)));
    const defs=[];
    mats.forEach(mat=>{
      const id=safeId(mat), base=materialHex(mat), light=shade(base,16), dark=shade(base,-12), img=materialTextureUrl(mat);
      if(img) defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="72" height="160"><rect width="72" height="160" fill="${base}"/><image href="${img}" x="0" y="0" width="72" height="160" preserveAspectRatio="xMidYMid slice" opacity=".96"/></pattern>`);
      else if(materialIsWood(mat)) defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="54" height="150"><rect width="54" height="150" fill="${base}"/><path d="M8 0 C20 34 16 78 26 150 M32 0 C44 36 38 88 50 150 M2 0 C8 50 6 98 13 150" stroke="${shade(light,6)}" stroke-width="1.1" opacity=".58" fill="none"/><path d="M17 0 C10 46 24 78 19 150 M45 0 C38 52 53 95 47 150" stroke="${dark}" stroke-width="1" opacity=".32" fill="none"/></pattern>`);
      else defs.push(`<linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`);
    });
    function fillFor(mat){ return `url(#${safeId(mat)})`; }
    const title=`<text x="70" y="30" font-family="Arial" font-size="18" font-weight="700" fill="#111827">${html(state.company.company_name||'Top Planejados')}</text><text x="70" y="52" font-family="Arial" font-size="12" fill="#334155">Projeto: ${html(p.name||design.envName)} • Cliente: ${html(c.name||'-')} • ${new Date().toLocaleDateString('pt-BR')}</text>`;
    if(mode==='2d' || mode==='top'){
      const pad=70, wallW=Math.round(W*scale), wallH=(mode==='top'?Math.round(D*scale)+60:Math.round(H*scale)), svgW=wallW+pad*2, svgH=wallH+pad*2+120;
      let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}"><defs><pattern id="exp_sink_png" patternUnits="objectBoundingBox" width="1" height="1"><image href="assets/sink-stainless.png" x="0" y="0" width="1" height="1" preserveAspectRatio="xMidYMid meet"/></pattern>${defs.join('')}</defs><rect width="100%" height="100%" fill="${html(design.bgColor||'#f8fafc')}"/>${title}<g transform="translate(${pad},${pad})">`;
      if(mode==='top'){
        svg+=`<rect x="0" y="0" width="${wallW}" height="${wallH}" fill="#fbfdff" stroke="#64748b"/>`;
        (design.modules||[]).slice().sort((a,b)=>num(a.y)-num(b.y)).forEach(m=>{ const x=num(m.x)*scale, y=(num(m.z||0))*scale+40, mw=Math.max(10,num(m.w)*scale), mh=Math.max(8,num(m.d)*scale); const stroke=state.designer.selectedId===m.id?'#f59e0b':'#111827'; const fill=isEnvironmentModule(m)?'#d7e3f2':(isCountertop(m)?fillFor(materialFront(m)):fillFor(materialFront(m))); svg+=`<rect x="${x}" y="${y}" width="${mw}" height="${mh}" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`; if(isSinkModule(m)){ svg+=`<rect x="${x+mw*.12}" y="${y+mh*.18}" width="${mw*.76}" height="${mh*.56}" fill="#cbd5e1" stroke="#334155"/><line x1="${x+mw*.5}" y1="${y-8}" x2="${x+mw*.5}" y2="${y+mh*.16}" stroke="#334155" stroke-width="2"/><circle cx="${x+mw*.5}" cy="${y-8}" r="4" fill="#64748b"/>`; } svg+=`<text x="${x+4}" y="${y+14}" font-family="Arial" font-size="9" font-weight="700">${html(m.name)}</text>`; });
      } else {
        const floorH=110;
        svg+=`<rect x="0" y="0" width="${wallW}" height="${wallH}" fill="${html(design.wallColor)}" stroke="#64748b"/><polygon points="0,${wallH} ${wallW},${wallH} ${wallW+75},${wallH+floorH} 75,${wallH+floorH}" fill="${html(design.floorColor)}" stroke="#78716c"/>`;
        const sorted=(design.modules||[]).slice().sort((a,b)=>moduleRenderPriority(a)-moduleRenderPriority(b)||num(a.x)-num(b.x)||num(a.y)-num(b.y));
        sorted.forEach(m=>{ const x=num(m.x)*scale, y=num(m.y)*scale, mw=Math.max(8,num(m.w)*scale), mh=Math.max(8,num(m.h)*scale), ext=materialFront(m), body=materialBody(m), stroke=state.designer.selectedId===m.id?'#f59e0b':'#111827';
          if(isEnvironmentModule(m) && !isSinkModule(m)){
            svg+=`<rect x="${x}" y="${y}" width="${mw}" height="${mh}" fill="#d7e3f2" stroke="${stroke}" stroke-width="1.2"/>`;
          } else if(isSinkModule(m)){
            svg+=`<image href="assets/sink-stainless.png" x="${x}" y="${y}" width="${mw}" height="${Math.max(18,mh||mw*.45)}" preserveAspectRatio="xMidYMid meet"/>`;
          } else if(isCountertop(m)){
            svg+=`<rect x="${x}" y="${y}" width="${mw}" height="${mh}" fill="${fillFor(ext)}" stroke="#111" stroke-width="1.3"/><rect x="${x}" y="${y+mh*.72}" width="${mw}" height="${mh*.28}" fill="${shade(materialHex(ext),-18)}" opacity=".96"/>`;
            const sink=sinkAttachedToCounter(design,m); if(sink){ const sx=Math.max(x+10,(num(sink.x)-num(m.x))*scale+x), sw=Math.min(mw-20,num(sink.w)*scale), sy=y+mh*.18, sh=Math.max(16,mh*.42); svg+=`<image href="assets/sink-stainless.png" x="${sx}" y="${sy}" width="${sw}" height="${sh}" preserveAspectRatio="xMidYMid meet"/>`; }
          } else {
            const defaultSocle=(moduleKindClass(m)==='baseItem'||moduleKindClass(m)==='tallItem')?80:0; const soclePx=Math.max(0, Math.min(mh-4, (num(m.socle)||defaultSocle)*scale)); const faceH=Math.max(16,mh-soclePx);
            svg+=`<rect x="${x}" y="${y}" width="${mw}" height="${faceH}" fill="${fillFor(ext)}" stroke="${stroke}" stroke-width="1.4"/>`;
            if(soclePx>0) svg+=`<rect x="${x}" y="${y+faceH}" width="${mw}" height="${soclePx}" fill="#111827" stroke="#111827"/>`;
            svg+=`<rect x="${x}" y="${y}" width="${mw}" height="${faceH}" fill="none" stroke="#111827" stroke-width="1.1"/>`;
            const doors=Math.max(0,Math.floor(num(m.doors))), drawers=Math.max(0,Math.floor(num(m.drawers))); const cols=Math.max(0,Math.floor(num(m.columns))), shelves=Math.max(0,Math.floor(num(m.shelves)));
            const wardrobeInternal=(String(m.type||'').toLowerCase().includes('guarda-roupa') && drawers>0) || m.internalDrawers || m.key==='roupgav';
            if(doors>0 && drawers>0 && !wardrobeInternal){ const doorW=mw*.64; svg+=`<line x1="${x+doorW}" y1="${y}" x2="${x+doorW}" y2="${y+faceH}" stroke="#222"/>`; for(let i=0;i<doors;i++){ const dx=x+(doorW/doors)*i; const dw=doorW/doors; svg+=`<rect x="${dx}" y="${y}" width="${dw}" height="${faceH}" fill="none" stroke="#202020" stroke-width="1"/>`; if(i>0) svg+=`<line x1="${dx}" y1="${y}" x2="${dx}" y2="${y+faceH}" stroke="#222"/>`; } const hs=drawerHeightsPx(m,faceH); let cur=y; hs.forEach((hh,idx)=>{ const yy=cur; svg+=`<rect x="${x+doorW}" y="${yy}" width="${mw-doorW}" height="${hh}" fill="none" stroke="#202020" stroke-width="1"/>`; if(idx>0) svg+=`<line x1="${x+doorW}" y1="${cur}" x2="${x+mw}" y2="${cur}" stroke="#222"/>`; cur+=hh; }); if(m.openDoors){ for(let i=1;i<=cols;i++) svg+=`<line x1="${x+doorW/(cols+1)*i}" y1="${y}" x2="${x+doorW/(cols+1)*i}" y2="${y+faceH}" stroke="#49505b" opacity=".55"/>`; for(let i=1;i<=shelves;i++) svg+=`<line x1="${x}" y1="${y+faceH/(shelves+1)*i}" x2="${x+doorW}" y2="${y+faceH/(shelves+1)*i}" stroke="#49505b" opacity=".55"/>`; } }
            else { if(doors>0){ for(let i=0;i<doors;i++){ const dx=x+mw/doors*i, dw=mw/doors; svg+=`<rect x="${dx}" y="${y}" width="${dw}" height="${faceH}" fill="none" stroke="#202020" stroke-width="1"/>`; if(i>0) svg+=`<line x1="${dx}" y1="${y}" x2="${dx}" y2="${y+faceH}" stroke="#222"/>`; } } if(!wardrobeInternal){ const hs=drawerHeightsPx(m,faceH); let cur=y; hs.forEach((hh,idx)=>{ svg+=`<rect x="${x}" y="${cur}" width="${mw}" height="${hh}" fill="none" stroke="#202020" stroke-width="1"/>`; if(idx>0) svg+=`<line x1="${x}" y1="${cur}" x2="${x+mw}" y2="${cur}" stroke="#222"/>`; cur+=hh; }); } if(m.openDoors){ for(let i=1;i<=cols;i++) svg+=`<line x1="${x+mw/(cols+1)*i}" y1="${y}" x2="${x+mw/(cols+1)*i}" y2="${y+faceH}" stroke="#49505b" opacity=".55"/>`; for(let i=1;i<=shelves;i++) svg+=`<line x1="${x}" y1="${y+faceH/(shelves+1)*i}" x2="${x+mw}" y2="${y+faceH/(shelves+1)*i}" stroke="#49505b" opacity=".55"/>`; } }
          }
          svg+=`<text x="${x+5}" y="${y+16}" font-family="Arial" font-size="10" font-weight="700" fill="#111">${html(m.name)}</text><text x="${x+5}" y="${y+mh-5}" font-family="Arial" font-size="8" fill="#111">${Math.round(m.w)}x${Math.round(m.h)}x${Math.round(m.d)}mm</text>`;
        });
      }
      if(design.showMeasures) svg+=`<text x="${wallW/2-35}" y="${mode==='top'?wallH+20:wallH-10}" font-family="Arial" font-size="12" font-weight="700" fill="#111">${Math.round(mode==='top'?design.width:design.width)} mm</text><text x="${wallW-65}" y="20" font-family="Arial" font-size="12" font-weight="700" fill="#111">${Math.round(mode==='top'?design.depth:design.height)} mm</text>`;
      svg+='</g></svg>'; return svg;
    }
    return designerStage3dContent(design, scale, Math.max(840,Math.round(W*scale)), Math.max(500,Math.round(H*scale)));
  }
  function downloadBlob(name, type, content){ const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href); }
  function exportDesignerSvg(){ const design=currentDesign(); downloadBlob((design.envName||'projeto')+'.svg','image/svg+xml;charset=utf-8',designerSvgMarkup(design,0.22,'2d')); }
  function exportDesignerPng(){ const design=currentDesign(); const svg=designerSvgMarkup(design,0.24,'2d'); const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}); const url=URL.createObjectURL(blob); const img=new Image(); img.onload=()=>{ const canvas=document.createElement('canvas'); canvas.width=img.width; canvas.height=img.height; const ctx=canvas.getContext('2d'); ctx.fillStyle='#f8fafc'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); URL.revokeObjectURL(url); canvas.toBlob(b=>{ const a=document.createElement('a'); const dl=URL.createObjectURL(b); a.href=dl; a.download=(design.envName||'projeto')+'.png'; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(dl); a.remove(); },800); }, 'image/png'); }; img.onerror=()=>{ URL.revokeObjectURL(url); toast('Não foi possível gerar PNG. Use Exportar SVG.', 'red'); }; img.src=url; }
  function printDesignerProject(){ const design=currentDesign(); const p=getProject(state.designer.projectId); const c=getClient(p.client_id); const pieces=generatePiecesFromDesign(design); const rows=pieces.slice(0,120).map(pc=>`<tr><td>${html(pc.name)}</td><td>${Math.round(pc.width)} x ${Math.round(pc.height)} mm</td><td>${pc.qty}</td><td>${html(pc.material)}</td></tr>`).join(''); const win=window.open('','_blank'); win.document.write(`<html><head><title>${html(p.name||design.envName)}</title><style>body{font-family:Arial;padding:26px;color:#111}svg{width:100%;height:auto;border:1px solid #ddd}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:7px;text-align:left}h1{margin-bottom:4px}.muted{color:#555}</style></head><body><h1>${html(state.company.company_name||'Top Planejados')}</h1><p class="muted">Projeto: ${html(p.name||design.envName)} • Cliente: ${html(c.name||'-')} • ${new Date().toLocaleDateString('pt-BR')}</p>${designerSvgMarkup(design,0.22,'2d')}<h2>Lista de peças</h2><table><tr><th>Peça</th><th>Medida</th><th>Qtd</th><th>Material</th></tr>${rows}</table><script>window.print()<\/script></body></html>`); win.document.close(); }

  function quoteLogoHtml(comp){
    const logo=String(comp.logo_url||'').trim();
    if(logo) return `<img class="quoteLogoImg" src="${html(logo)}" alt="logo">`;
    const name=String(comp.company_name||'Top Planejados').trim();
    const initials=name.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase() || 'TP';
    return `<div class="quoteLogoFallback"><b>${html(initials)}</b><span>${html(name)}</span></div>`;
  }
  function quoteCompanyContactHtml(comp){
    return `<div class="quoteContact"><b>${html(comp.company_name||'Top Planejados')}</b><span>${html(comp.address||'')}</span><span>${html(comp.phone||comp.whatsapp||'')}</span><span>${html(comp.instagram||'')}</span><span>${html(comp.document_number||'')}</span></div>`;
  }
  function quoteBudgetAnnexHtml(p,c){
    const imgs=projectImages(p);
    if(!imgs.length) return '';
    return `<div class="quoteAnnexBox"><h2>ANEXOS DO PROJETO</h2><div class="annexGrid">${imgs.map((src,i)=>`<div><img class="annexProjectImage" src="${html(src)}" alt="Imagem do projeto ${i+1}"><p class="small">Imagem ${i+1}</p></div>`).join('')}</div></div>`;
  }
  function quoteItemRows(p){
    const items=p.budget_items||[];
    if(!items.length) return `<tr><td colspan="6">Nenhum item cadastrado.</td></tr>`;
    return items.map((it,i)=>`<tr><td>${i+1}</td><td>${html(it.desc||'Item')}</td><td>${it.qty||1}</td><td>${Math.round(num(it.width)||0)} x ${Math.round(num(it.height)||0)} mm</td><td>${html(colorName(it.color))}</td><td class="right">${money(itemTotal(it))}</td></tr>`).join('');
  }
  function budgetPaymentText(p, tt){
    const pay = budgetPaymentPlainText(p);
    const entry = money(tt.entry), delivery=money(tt.delivery), entryPct=tt.entryPct, deliveryPct=tt.deliveryPct;
    return `Forma de pagamento: ${html(pay)}<br>Entrada/sinal: ${entryPct}% (${entry}) • Saldo na entrega: ${deliveryPct}% (${delivery}).<br>Prazo estimado de entrega: ${num(p.delivery_days)||30} dias úteis após aprovação e confirmação da entrada.`;
  }
  function exportBudgetHtml(){
    const chosenPid = ($('#budgetProject') && $('#budgetProject').value) || state.budgetProjectId;
    state.budgetProjectId = chosenPid;
    const p=getProject(chosenPid); if(!p.id){alert('Selecione um projeto.');return;}
    const data=operationData(p.id); const c=data.client; const comp=data.company; const tt=data.totals; const validDays=num(comp.quote_valid_days||7); const valid=new Date(Date.now()+validDays*86400000);
    const primary=comp.quote_primary_color||'#111827', secondary=comp.quote_secondary_color||'#e5e7eb', accent=comp.quote_accent_color||'#111827', textColor=comp.quote_text_color||'#1f2937';
    const logo = comp.logo_url ? `<img class="logo" src="${html(comp.logo_url)}">` : `<div class="logoFallback"><b>TOP</b><span>PLANEJADOS</span></div>`;
    const items=(p.budget_items||[]).slice(); if(!items.length && num(p.budget_value)>0){ items.push({desc:p.name||'Serviço de móveis planejados', qty:1, total:num(p.budget_value), value:num(p.budget_value)}); } const rows=items.map((it,i)=>{ const total=itemTotal(it); return `<tr><td>${i+1}</td><td>${html(it.desc||it.name||'-')}</td><td>${num(it.qty)||1}</td><td>${money(total/(num(it.qty)||1))}</td><td>${money(total)}</td></tr>`; }).join('');
    const docNote=cleanDocNote(p.notes); const obs = [budgetPaymentText(p,tt), docNote ? 'Obs.: '+html(docNote) : '', comp.quote_footer_note||''].filter(Boolean).join('<br>');
    const annex = quoteBudgetAnnexHtml(p,c);
    const win=window.open('','_blank');
    win.document.write(`<html><head><title>Orçamento ${html(p.name||'')}</title><style>
      @page{size:A4;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:${textColor};margin:0;background:#f3f4f6}.page{width:190mm;min-height:277mm;margin:0 auto 10px;background:#fff;padding:8mm;position:relative}.topBox{border:1px solid ${secondary};display:grid;grid-template-columns:34mm 1fr 70mm;align-items:center;gap:7mm;padding:4mm}.logo{width:31mm;height:31mm;object-fit:contain}.logoFallback{width:31mm;height:31mm;background:${primary};color:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;border-radius:4px}.logoFallback b{font-size:20px}.logoFallback span{font-size:8px}.companyName{font-size:15px;font-weight:800;color:${primary};line-height:1.35}.companyRight{text-align:right;font-size:13px;line-height:1.45}.meta{width:100%;border-collapse:collapse;margin-top:7mm;font-size:13px}.meta td{border:1px solid ${secondary};padding:4mm;text-align:center}.meta b{color:${primary}}.box{width:100%;border-collapse:collapse;margin-top:7mm;font-size:13px}.box th{border:1px solid ${secondary};padding:4mm;text-align:center;background:#fff;font-size:14px}.box td{border:1px solid ${secondary};padding:3mm}.items{width:100%;border-collapse:collapse;margin-top:7mm;font-size:12.5px}.items th{border:1px solid ${secondary};padding:3.5mm;background:#fff;color:${primary};text-align:left}.items td{border:1px solid ${secondary};padding:3mm}.right{text-align:right}.totalLine{margin-top:6mm;border:1px solid ${secondary};padding:4mm;text-align:left;font-size:15px}.totalLine b{font-size:18px;color:${accent}}.obs{border:1px solid ${secondary};margin-top:7mm}.obs h3{text-align:center;margin:0;padding:3.5mm;border-bottom:1px solid ${secondary};font-size:14px}.obs div{padding:4mm;font-size:13px;line-height:1.45}.sigs{display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:18mm}.sig{text-align:center;border-top:1px solid ${secondary};padding-top:4mm;font-size:13px}.pageBreak{page-break-before:always}.annex h2{text-align:center;margin:0 0 10mm}.annex img,.annex svg{max-width:100%;max-height:235mm;object-fit:contain;border:1px solid ${secondary}}.printBtn{position:fixed;right:18px;bottom:18px;z-index:99}@media print{body{background:#fff}.page{margin:0}.printBtn{display:none}}
      </style></head><body><button class="printBtn" onclick="window.print()">Imprimir / salvar PDF</button><section class="page"><div class="topBox">${logo}<div><div class="companyName">${html(comp.company_name||'TOP PLANEJADOS')}</div><div>CNPJ ${html(comp.document_number||'')}</div><div>${html(comp.address||'')}</div></div><div class="companyRight"><div>${html(comp.phone||comp.whatsapp||'')}</div><div>${html(comp.email||'')}</div><div>${html(comp.instagram||'')}</div></div></div><table class="meta"><tr><td><b>Orçamento:</b> ${String(p.id||'').slice(0,8).toUpperCase()}</td><td><b>Data:</b> ${dateFmt.format(new Date())}</td><td><b>Validade:</b> ${dateFmt.format(valid)}</td></tr></table><table class="box"><tr><th colspan="2">Dados do serviço</th></tr><tr><td><b>Cliente</b></td><td>${html(c.name||'-')}</td></tr><tr><td><b>Projeto/Ambiente</b></td><td>${html(p.name||'-')} ${p.environment? ' - '+html(p.environment):''}</td></tr><tr><td><b>Serviço prestado</b></td><td>${html(cleanDocNote(p.notes)||'Móveis planejados conforme itens do orçamento aprovado.')}</td></tr></table><table class="items"><thead><tr><th>#</th><th>Nome</th><th>Qtd.</th><th>Valor</th><th>Subtotal</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Nenhum item cadastrado.</td></tr>'}</tbody></table><div class="totalLine">Total: <b>${money(tt.final)}</b></div><div class="obs"><h3>Observações</h3><div>${obs}</div></div><div class="sigs"><div class="sig">${html(comp.company_name||'TOP PLANEJADOS')}</div><div class="sig">${html(c.name||'Cliente')}</div></div></section>${annex?`<section class="page pageBreak annex"><h2>Anexos do projeto</h2>${annex}</section>`:''}<script>setTimeout(()=>window.print(),450)<\/script></body></html>`);
    win.document.close();
  }
  function openTabKey(key){ saveCurrentTabDraft(); state.current=key; render(); }

  async function toggleUserTab(tab, value){
    if(tab==='admin'){ alert('A aba Admin é fixa para administradores e nunca aparece para usuários comuns.'); render(); return; }
    await update('tab_settings','tab_key=eq.'+encodeURIComponent(tab), { enabled: !!value });
    await logAction('aba_usuario_visibilidade',{tab,visible_for_users:!!value});
    await afterSave(value ? 'Aba liberada para usuários comuns.' : 'Aba ocultada somente para usuários comuns. O admin continuará vendo em vermelho.');
  }
  async function toggleTab(tab, field, value){
    if(field==='admin_only'){ toast('A opção “somente admin” foi removida. Use apenas mostrar/ocultar para usuários.', 'red'); render(); return; }
    if(field==='enabled') return toggleUserTab(tab,value);
    await update('tab_settings','tab_key=eq.'+encodeURIComponent(tab), { [field]: value });
    await logAction('aba_atualizada',{tab,field,value});
    await afterSave('Aba atualizada.');
  }
  async function loadAdminUsers(shouldRender=true){
    if(!isAdmin()) return;
    try{ state.adminProfiles = await rpc('tp_admin_list_users_v3', {}); }
    catch(errV3){
      console.warn('RPC admin v3 indisponível, tentando v2. Rode migration_v114_company_roles_permissions.sql.', errV3);
      try{ state.adminProfiles = await rpc('tp_admin_list_users_v2', {}); }
      catch(errV2){
        console.warn('RPC admin v2 indisponível, tentando lista antiga. Rode migration_v103.sql.', errV2);
        try{ state.adminProfiles = await rpc('tp_admin_list_users', {}); }
        catch(err){ console.warn('RPC admin indisponível, usando profiles direto.', err); state.adminProfiles = await select('profiles','select=*&order=created_at.desc'); }
      }
    }
    if(shouldRender) render();
  }
  async function adminSetUserAccess(id, patch){
    const current=(state.adminProfiles||[]).find(u=>u.id===id)||{};
    if(isOwnerEmail(current.email||'')){ toast('A conta principal não pode ser bloqueada nem rebaixada.', 'red'); return false; }
    const role=patch.role || current.role || 'user';
    const active=Object.prototype.hasOwnProperty.call(patch,'active') ? !!patch.active : !!current.active;
    try{
      await rpc('tp_admin_set_user_access_v2', { p_target_user:id, p_role:role, p_active:active });
    }catch(err){
      console.warn('RPC v2 indisponível, tentando RPC antigo.', err);
      try{ await rpc('tp_admin_set_user_access', { target_user:id, new_role:role, new_active:active }); }
      catch(err2){ throw new Error('Não consegui alterar esse usuário. Rode a migration_v103.sql no Supabase e tente de novo. Detalhe: ' + friendlyDbError(err2.message||err.message)); }
    }
    // V103: a alteração já aparece na tela sem precisar atualizar a página.
    state.adminProfiles = (state.adminProfiles||[]).map(u => u.id===id ? Object.assign({}, u, { role, active, profile_status:'ok' }) : u);
    render();
    // Confere novamente no banco em segundo plano, para manter a lista sincronizada.
    setTimeout(()=>loadAdminUsers(true).catch(err=>console.warn('Falha ao recarregar usuários após alteração.', err)), 600);
    return true;
  }

  async function saveCompanyMemberRoles(id){
    if(!hasPerm('members.manage')){ toast('Sem permissão para gerenciar equipe.', 'red'); return; }
    const safe=domSafe(id);
    const roles=TEAM_ROLES.filter(r=>{ const el=$('#team_role_'+safe+'_'+r.id); return el && el.checked; }).map(r=>r.id);
    const activeEl=$('#team_active_'+safe);
    const active=activeEl ? !!activeEl.checked : true;
    if(!roles.length){ toast('Selecione pelo menos um cargo para este funcionário.', 'red'); return; }
    const current=(state.adminProfiles||[]).find(u=>u.id===id)||{};
    if(isOwnerEmail(current.email||'')){ toast('A conta principal não pode ser alterada por segurança.', 'red'); return; }
    try{
      await rpc('tp_company_set_member_roles', { p_target_user:id, p_roles:roles, p_active:active });
    }catch(err){
      console.warn('RPC de cargos V114 indisponível, usando liberação antiga.', err);
      await adminSetUserAccess(id,{ role:roles.includes('owner') || roles.includes('manager') ? 'admin' : 'user', active });
    }
    state.adminProfiles=(state.adminProfiles||[]).map(u=>u.id===id?Object.assign({},u,{roles,active,company_active:active,role:roles.includes('owner')||roles.includes('manager')?'admin':'user'}):u);
    await logAction('empresa_cargos_usuario',{id,roles,active});
    await afterSave('Cargos do funcionário salvos.');
    setTimeout(()=>loadAdminUsers(true).catch(err=>console.warn('Falha ao recarregar equipe.',err)),500);
  }

  async function updateUserRole(id, role){ if(!await adminSetUserAccess(id,{role})) return; await logAction('usuario_role',{id,role}); toast(role==='admin'?'Usuário virou administrador.':'Usuário voltou para acesso comum.'); }
  async function updateUserActive(id, active){ if(!await adminSetUserAccess(id,{active})) return; await logAction('usuario_active',{id,active}); toast(active?'Usuário liberado.':'Usuário bloqueado.'); }
  async function makeUserAdmin(id){ if(!await adminSetUserAccess(id,{role:'admin',active:true})) return; await logAction('usuario_admin_liberado',{id}); toast('Usuário liberado como administrador.'); }
  async function makeUserRegular(id){ if(!await adminSetUserAccess(id,{role:'user'})) return; await logAction('usuario_user',{id}); toast('Usuário voltou para comum.'); }
  async function activateUser(id){ if(!await adminSetUserAccess(id,{active:true})) return; await logAction('usuario_ativado',{id}); toast('Usuário liberado.'); }
  async function deactivateUser(id){ if(!confirm('Bloquear este usuário? Ele não conseguirá entrar até ser liberado novamente.')) return; if(!await adminSetUserAccess(id,{active:false})) return; if(state.adminActingUserId===id) stopAccessUser(false); await logAction('usuario_bloqueado',{id}); toast('Usuário bloqueado.'); }
  async function accessUserData(id){
    if(!isAdmin()) return;
    const u=(state.adminProfiles||[]).find(x=>x.id===id) || {};
    if(!u.id){ toast('Usuário não encontrado na lista admin.', 'red'); return; }
    if(!u.active && !confirm('Este usuário está bloqueado. Deseja acessar os dados dele mesmo assim?')) return;
    state.adminActingUserId = id;
    localStorage.setItem('tp_admin_acting_user_id', id);
    state.current = 'leaderboard';
    await loadAll();
    render();
    toast('Acessando dados de '+(u.name||u.email||'usuário')+'.');
  }
  async function stopAccessUser(shouldReload=true){
    state.adminActingUserId = '';
    localStorage.removeItem('tp_admin_acting_user_id');
    if(shouldReload){ await loadAll(); render(); toast('Você voltou para sua própria conta.'); }
  }

  function setContractSplit(entry,delivery,note){ const ea=$('#contractEntryPct'), eb=$('#contractDeliveryPct'); if(ea) ea.value=entry; if(eb) eb.value=delivery; if(note && $('#contractPayment')) $('#contractPayment').value=note; syncReceiptPaymentFromContract(true); }
  function setContractSupplierSplit(){ setContractSplit(50,50,supplierSplitText()); toast('Forma 50% fornecedor/loja + 50% entrega aplicada ao contrato.'); }
  function printContractPdf(){ const out=$('#contractOutput'); if(!out || !out.innerHTML.trim()){ alert('Gere o contrato primeiro.'); return; } printDocument('Contrato', out.innerHTML); }
  function printDocument(title, htmlContent){ const win=window.open('','_blank'); win.document.write(`<html><head><title>${html(title)}</title><style>${contractPrintCss()}</style></head><body><button class="printBtn" onclick="window.print()">Imprimir / salvar PDF</button><div class="contract">${htmlContent}</div><script>setTimeout(()=>window.print(),350)<\/script></body></html>`); win.document.close(); }

  function generateReceipt(){
    const c = getClient($('#contractClient').value), p = getProject($('#contractProject').value), s = getService($('#contractService').value), comp = state.company || defaultCompany();
    const amount = num($('#receiptAmount') && $('#receiptAmount').value) || num($('#contractValue') && $('#contractValue').value) || num(s.value) || num(p.budget_value) || projectTotal(p).final;
    const serviceName = ($('#receiptReference') && $('#receiptReference').value.trim()) || ($('#contractProjectName') && $('#contractProjectName').value.trim()) || s.title || p.name || 'serviço de móveis planejados';
    const payment = ($('#receiptPayment') && $('#receiptPayment').value.trim()) || ($('#contractPayment') && $('#contractPayment').value.trim()) || budgetPaymentPlainText(p) || 'Conforme combinado';
    const date = $('#contractStart') && $('#contractStart').value ? new Date($('#contractStart').value+'T00:00:00') : new Date();
    const items = (p.budget_items||[]).length ? (p.budget_items||[]).map((i,idx)=>`<tr><td>${idx+1}</td><td>${html(i.desc||i.name||'-')}</td><td>${num(i.qty)||1}</td><td>${Math.round(num(i.width)||0)} x ${Math.round(num(i.height)||0)} mm</td><td>${money(itemTotal(i))}</td></tr>`).join('') : `<tr><td colspan="5">${html(serviceName)}</td></tr>`;
    const logo = comp.logo_url ? `<img class="receiptLogo" src="${html(comp.logo_url)}" alt="Logo">` : `<div class="receiptLogoFallback">${html((comp.company_name||'TP').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'TP')}</div>`;
    $('#contractOutput').innerHTML = `<div class="receiptSheet" ${contractStyleAttr(comp)}><div class="receiptTop">${logo}<div><h1>Recibo de Prestação de Serviços</h1><p>Emitido em: ${dateFmt.format(date)} às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p></div><div class="receiptAmountBox">${money(amount)}</div></div><table class="receiptTable"><tr><th colspan="2">Empresa responsável</th></tr><tr><td><b>Nome</b><br>${html(comp.company_name||'Top Planejados')}</td><td><b>Contato</b><br>${html(comp.phone||comp.whatsapp||'-')}<br>${html(comp.instagram||'')}</td></tr><tr><td><b>CPF/CNPJ</b><br>${html(comp.document_number||'-')}</td><td><b>Endereço</b><br>${html(comp.address||'-')}</td></tr><tr><th colspan="2">Cliente</th></tr><tr><td><b>Nome</b><br>${html(c.name||'Cliente selecionado')}</td><td><b>Contato</b><br>${html(c.phone||'-')}</td></tr><tr><td><b>CPF/CNPJ</b><br>${html(c.document_number||'-')}</td><td><b>Endereço</b><br>${html(c.address||'-')} ${c.city?' - '+html(c.city):''}</td></tr><tr><th colspan="2">Informações do serviço</th></tr><tr><td><b>Referente</b><br>${html(serviceName)}</td><td><b>Forma de pagamento</b><br>${html(payment)}</td></tr><tr><td><b>Valor recebido</b><br><span class="receiptStrong">${money(amount)}</span></td><td><b>Data</b><br>${dateFmt.format(date)}</td></tr></table><table class="receiptTable receiptItems"><tr><th>Cód.</th><th>Serviço / item</th><th>Qtd.</th><th>Medida</th><th>Valor</th></tr>${items}</table><div class="receiptDeclaration">Declaramos para os devidos fins que recebemos de <b>${html(c.name||'Cliente selecionado')}</b> o valor de <b>${money(amount)}</b>, referente a <b>${html(serviceName)}</b>, na forma de pagamento informada acima.</div><div class="receiptSigs"><div>Assinatura da empresa/responsável<br><br>_____________________________________<br>${html(comp.company_name||'Top Planejados')}</div><div>Assinatura do cliente/responsável<br><br>_____________________________________<br>${html(c.name||'Cliente')}</div></div></div>`;
    toast('Recibo gerado com forma de pagamento atualizada.');
  }

  function printReceiptPdf(){ const out=$('#contractOutput'); if(!out || !out.innerHTML.trim() || !out.innerHTML.includes('RECIBO')) generateReceipt(); const out2=$('#contractOutput'); printDocument('Recibo', out2.innerHTML); }
  function syncContractFromProject(){
    const p = getProject($('#contractProject') ? $('#contractProject').value : '');
    if(!p || !p.id) return;
    const c = getClient(p.client_id);
    if(c.id && $('#contractClient')) $('#contractClient').value = c.id;
    const tt = projectTotal(p);
    const val = tt.final || p.budget_value || 0;
    if($('#contractValue')) $('#contractValue').value = num(val).toFixed(2);
    if($('#contractProjectName')) $('#contractProjectName').value = p.name || '';
    if($('#contractEnvironments')) $('#contractEnvironments').value = p.environment || '';
    if($('#contractPayment')) $('#contractPayment').value = budgetPaymentPlainText(p);
    if($('#contractDiscount')) $('#contractDiscount').value = num(p.budget_discount || 0);
    if($('#contractEntryPct')) $('#contractEntryPct').value = num(p.entry_pct || state.company.entry_pct || 50);
    if($('#contractDeliveryPct')) $('#contractDeliveryPct').value = num(p.delivery_pct || state.company.delivery_pct || 50);
    if($('#contractDays')) $('#contractDays').value = num(p.delivery_days || 30);
    if($('#receiptAmount')) $('#receiptAmount').value = num(projectTotal(p).final || p.budget_value || 0).toFixed(2);
    if($('#receiptReference')) $('#receiptReference').value = p.name || 'Serviço de móveis planejados';
    syncReceiptPaymentFromContract(true);
    toast('Dados do orçamento/projeto puxados para contrato e recibo.');
  }

  function syncContractFromService(){
    const s=getService($('#contractService') ? $('#contractService').value : '');
    if(!s || !s.id) return;
    if(s.client_id && $('#contractClient')) $('#contractClient').value = s.client_id;
    if(s.project_id && $('#contractProject')) $('#contractProject').value = s.project_id;
    if($('#contractValue') && num(s.value)>0) $('#contractValue').value = num(s.value).toFixed(2);
    if($('#contractDays')) $('#contractDays').value = num(getProject(s.project_id).delivery_days || $('#contractDays').value || 30);
    if($('#receiptAmount') && num(s.value)>0) $('#receiptAmount').value = num(s.value).toFixed(2);
    if($('#receiptReference')) $('#receiptReference').value = s.title || getProject(s.project_id).name || 'Serviço de móveis planejados';
    syncReceiptPaymentFromContract(true);
  }

  function generateContract(){
    const c = getClient($('#contractClient').value), p = getProject($('#contractProject').value), s = getService($('#contractService').value), comp = state.company || defaultCompany();
    if(p.id && normalizeStatus('budget',p.status)!=='aprovado'){ toast('Contrato só deve ser gerado depois que o orçamento estiver aprovado.', 'red'); return; }
    const projectVal = p.id ? projectTotal(p).final : 0;
    const rawValue = num($('#contractValue').value) || num(s.value) || num(p.budget_value) || projectVal;
    const discount = num($('#contractDiscount').value);
    const baseValue = Math.max(0, rawValue-discount);
    const entryPct = num($('#contractEntryPct').value) || 0;
    const deliveryPct = num($('#contractDeliveryPct').value) || Math.max(0,100-entryPct);
    const entry = baseValue*(entryPct/100), remaining = baseValue*(deliveryPct/100);
    const startDate = $('#contractStart').value ? new Date($('#contractStart').value+'T00:00:00') : new Date();
    const days = Number($('#contractDays').value || p.delivery_days || 30);
    const end = new Date(startDate.getTime()+days*86400000);
    const serviceName = ($('#contractProjectName')&&$('#contractProjectName').value.trim()) || s.title || p.name || 'móveis planejados sob medida';
    const envText = ($('#contractEnvironments')&&$('#contractEnvironments').value.trim()) || p.environment || 'conforme projeto aprovado';
    const paymentText = ($('#contractPayment')&&$('#contractPayment').value.trim()) || 'Conforme combinado';
    const supplierClause = /fornecedor|loja/i.test(paymentText) ? sectionHtml('Pagamento no fornecedor/loja',`<p>${html(supplierSplitText())}</p>`) : '';
    const itemRows = (p.budget_items||[]).length ? sectionHtml('Itens aprovados', table(['Item','Qtd','Medida','Valor'], (p.budget_items||[]).map(i=>[html(i.desc||i.name||'-'), num(i.qty)||1, `${Math.round(num(i.width)||0)} x ${Math.round(num(i.height)||0)} mm`, money(itemTotal(i))]))) : '';
    const annex = p.id ? quoteBudgetAnnexHtml(p,c) : '';
    const annexPhrase = annex ? 'O serviço seguirá orçamento aprovado, medidas, materiais, imagens anexas e observações registradas.' : 'O serviço seguirá orçamento aprovado, medidas, materiais e observações registradas.';
    const contractNote = cleanDocNote($('#contractNotes').value || p.notes || s.notes || '');
    const model = comp.contract_model || 'comercial';
    const objectSec = sectionHtml('1. Objeto',`<p>A CONTRATADA realizará fabricação, montagem e/ou instalação de <b>${html(serviceName)}</b>, contemplando os ambientes:</p><p><b>${html(envText).replace(/\n/g,'<br>')}</b></p><p>${annexPhrase}</p>`);
    const paySec = sectionHtml('2. Valor e pagamento',`<div class="paymentCards"><div><b>Valor total</b><br><span class="moneyStrong">${money(baseValue)}</span></div><div><b>Forma de pagamento</b><br>${html(paymentText).replace(/\n/g,'<br>')}</div><div><b>Entrada/sinal</b><br>${money(entry)} (${entryPct}%)</div><div><b>Saldo na entrega</b><br>${money(remaining)} (${deliveryPct}%)</div></div>${discount?`<p>Desconto aplicado: <b>${money(discount)}</b>.</p>`:''}`);
    const deadlineSec = sectionHtml('3. Prazo de entrega',`<p>Prazo estimado: <b>${days} dias úteis</b>, contado da assinatura e confirmação do pagamento inicial, com previsão até <b>${dateFmt.format(end)}</b>.</p>`);
    const warrantySec = sectionHtml('4. Garantia',`<p>${html(comp.quote_warranty || defaultCompany().quote_warranty)}</p>`);
    const obsSec = contractNote ? sectionHtml('5. Observações',`<p>${html(contractNote).replace(/\n/g,'<br>')}</p>`) : '';
    const clausesSec = contractClausesHtml();
    let body = objectSec + itemRows + paySec + supplierClause + deadlineSec + warrantySec + obsSec + clausesSec + annex;
    if(model==='compacto') body = objectSec + paySec + deadlineSec + clausesSec + annex;
    if(model==='formal') body = contractPartiesHtml(comp,c) + body;
    const header = contractHeaderHtml(comp, model==='compacto'?'CONTRATO RESUMIDO DE SERVIÇO':'CONTRATO DE SERVIÇO','Móveis planejados');
    const parties = model==='formal' ? '' : contractPartiesHtml(comp,c);
    $('#contractOutput').innerHTML = `<div class="contractDoc model-${html(model)}" ${contractStyleAttr(comp)}>${header}${parties}${body}<p class="contractCity">${html(comp.contract_city||'Porto Velho - RO')}, ${dateFmt.format(startDate)}.</p><div class="contractSigs"><div>_____________________________________<br>${html(comp.company_name||'Contratada')}</div><div>_____________________________________<br>${html(c.name||'Contratante')}</div></div></div>`;
    syncReceiptPaymentFromContract(false);
  }

  async function readRenderFile(e){ const file = e.target.files && e.target.files[0]; if(!file) return; try{ assertSafeFile(file, 14); state.imageName = cleanText(file.name,120); const val = await imageFileToDataUrl(file,{maxWidth:2200,maxHeight:2200,quality:.9,type:'image/webp',maxMb:14}); state.imageBase64 = val; $('#renderPreview').innerHTML = `<img loading="lazy" decoding="async" alt="Prévia" src="${html(val)}">`; }catch(err){ toast(err.message || 'Não foi possível ler a imagem.', 'red'); } finally{ if(e.target) e.target.value=''; } }
  function buildRenderPrompt(){ return `Transforme a imagem enviada em uma renderização extremamente realista de móveis planejados, mas mantenha 100% fiel ao projeto original.\n\nRegras obrigatórias:\n- Não alterar layout, medidas, proporções, posição dos móveis, bancada, nichos, gavetas, portas, puxadores, perfil gola ou cava.\n- Não inventar módulos novos e não remover elementos do projeto.\n- Manter as cores e materiais principais: ${$('#renderMaterials') ? $('#renderMaterials').value : ''}.\n- Ambiente: ${$('#renderEnvironment') ? $('#renderEnvironment').value : ''}.\n- Qualidade visual: ${$('#renderQuality') ? $('#renderQuality').value : ''}.\n- Iluminação: ${$('#renderLight') ? $('#renderLight').value : ''}.\n- Fidelidade: ${$('#renderFidelity') ? $('#renderFidelity').value : ''}.\n- Resultado com aparência de foto real, catálogo profissional, sombras naturais, textura de MDF realista, reflexos moderados e escala correta.\n\nInstruções extras: ${$('#renderExtra') ? $('#renderExtra').value : ''}`; }
  function generateRenderPrompt(){ const p = buildRenderPrompt(); $('#renderPrompt').value = p; navigator.clipboard && navigator.clipboard.writeText(p).catch(()=>{}); toast('Prompt técnico gerado e copiado.'); }
  async function callRenderApi(){ generateRenderPrompt(); const rs = state.renderSettings || {}; if(!rs.ready){ toast('A API de render ainda não foi marcada como pronta na aba Admin.', 'red'); return; } if(!rs.public_endpoint){ toast('Nenhum endpoint público/proxy configurado na aba Admin.', 'red'); return; } if(!state.imageBase64){ toast('Envie uma imagem antes de testar a API.', 'red'); return; } $('#renderPreview').innerHTML = '<div>Enviando para API...</div>'; try{ const data = await rawFetch(rs.public_endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ image:state.imageBase64, file_name:state.imageName, prompt:$('#renderPrompt').value, provider:rs.provider||'myarchitectai-proxy', plan:null, source:'top-planejados-v114' }) }); await trackRenderUsage(); await loadAll(); const img = data && (data.image_url || data.output_url || data.url || data.image_base64); $('#renderPreview').innerHTML = img ? `<img alt="Render" src="${html(img)}">` : `<pre class="copyarea">${html(JSON.stringify(data,null,2))}</pre>`; toast('Resposta da API recebida.'); }catch(e){ $('#renderPreview').innerHTML = '<div class="red">Erro na API: '+html(e.message)+'</div>'; } }

  function openProjectBudget(id){ state.budgetProjectId=id; state.current='budget'; render(); }
  function openProjectDesigner(id){ state.designer.projectId=id; state.designer.selectedId=''; state.current='designer'; render(); }

  function bindAuth(){
    $$('.auth-tabs button').forEach(btn=>btn.addEventListener('click',()=>{ const login=btn.dataset.authTab==='login'; $('#loginTab').classList.toggle('active',login); $('#signupTab').classList.toggle('active',!login); $('#loginForm').classList.toggle('hidden',!login); $('#signupForm').classList.toggle('hidden',login); setMsg('#authMsg',''); }));
    $('#loginForm').addEventListener('submit', async e=>{ e.preventDefault(); setMsg('#authMsg','Entrando...'); try{ const data = await authFetch('/token?grant_type=password', { email:$('#loginEmail').value.trim(), password:$('#loginPassword').value }); saveSession(data); await bootApp(); } catch(err){ setMsg('#authMsg', 'Erro no login: ' + err.message, 'error'); } });
    $('#signupForm').addEventListener('submit', async e=>{ e.preventDefault(); setMsg('#authMsg','Criando acesso...'); try{ const data = await authFetch('/signup', { email:$('#signupEmail').value.trim(), password:$('#signupPassword').value, data:{ name:$('#signupName').value.trim() } }); if(data && data.session) saveSession(Object.assign({}, data.session, { user:data.user })); if(data && data.user && state.session){ state.user = data.user; try{ await insert('profiles', { id:data.user.id, email:data.user.email || $('#signupEmail').value.trim(), name:$('#signupName').value.trim(), role:'user', active:false }); }catch(err){ console.warn('Perfil será criado por trigger/RPC. Rode migration_v103.sql se não aparecer no Admin.', err); try{ await rpc('tp_ensure_current_profile', {}); }catch(_){ } } showOnly('pendingScreen'); }else{ setMsg('#authMsg','Conta criada. Se o Supabase exigir confirmação por e-mail, confirme antes de entrar. Depois ela aparecerá na aba Admin para liberar.', 'ok'); } }catch(err){ setMsg('#authMsg', 'Erro ao criar acesso: ' + err.message, 'error'); } });
    $('#pendingLogout').addEventListener('click', logout); $('#logoutBtn').addEventListener('click', logout); $('#refreshBtn').addEventListener('click', async()=>{ await bootApp(true); }); if($('#themeBtn')) $('#themeBtn').addEventListener('click', toggleTheme); applyTheme();
  }
  async function bootApp(force){
    try{
      if(!configured()){ showOnly('setupScreen'); return; }
      if(!state.session && !readStoredSession()){ showOnly('authScreen'); return; }
      // Mostra alguma tela imediatamente para nunca ficar tudo preto enquanto a nuvem responde.
      showOnly('app');
      $('#pageTitle').textContent = 'Carregando';
      $('#pageSubtitle').textContent = 'Conectando ao Supabase...';
      $('#content').innerHTML = '<div class="notice goldline"><b>Carregando dados da nuvem...</b><br>Se demorar demais, clique em Sair ou limpe o login salvo.</div>';
      await withTimeout(refreshSessionIfNeeded(), 30000, 'Não foi possível renovar a sessão do Supabase dentro do tempo limite.');
      if(!state.session){ showOnly('authScreen'); return; }
      const ok = await withTimeout(loadAll(), 35000, 'O Supabase não respondeu dentro do tempo limite. Confira URL/key no src/config.js e sua internet.');
      if(!ok) return;
      if(isAdmin()) { try{ await withTimeout(loadAdminUsers(false), 20000, 'Falha ao carregar usuários admin.'); }catch(_){ state.adminProfiles=[]; } }
      showOnly('app'); render(); if(force) toast('Dados atualizados da nuvem.');
    }catch(e){
      console.error(e); setCloud(false, 'Erro na nuvem');
      if(String(e.message).toLowerCase().includes('jwt') || String(e.message).toLowerCase().includes('token')){ await logout(); return; }
      $('#pageTitle').textContent = 'Erro ao carregar';
      $('#pageSubtitle').textContent = 'O app abriu, mas a nuvem não respondeu corretamente.';
      $('#content').innerHTML = `<div class="notice redline"><b>Erro ao carregar:</b> ${html(e.message)}<br><br><b>O que tentar:</b><br>1. Confirme se <span class="kbd">src/config.js</span> está com sua Project URL e anon key.<br>2. Rode <span class="kbd">supabase/migration_v103.sql</span> no SQL Editor.<br>3. Clique em <b>Limpar login salvo</b> e entre de novo.<br><br><button class="ghost" onclick="localStorage.removeItem('tp_session'); location.reload()">Limpar login salvo</button> <button class="ghost" onclick="location.reload()">Recarregar</button></div>`;
      showOnly('app');
    }
  }

  window.TP = { toggleTheme, editClient, deleteClient, clearClientForm, editProject, deleteProject, clearProjectForm, editService, deleteService, clearServiceForm, markServiceDelivered, deleteTx, saveProviderPurchase, clearSupplierForm, editSupplier, saveSupplier, deleteSupplier, setProductionStatus, updateProjectStatus, updateBudgetStatus, seedDefaultInventory, prefillInventory, previewBudgetClient, openClientBudget, clearInventoryForm, editInventoryItem, deleteInventoryItem, clearAllInventory, clearPayrollForm, editPayroll, markPayrollPaid, markPayrollPending, deletePayroll, editPayrollEmployee, deletePayrollEmployee, markServicePayrollPaid, markServicePayrollPending, toggleTab, toggleUserTab, loadAdminUsers, saveCompanyMemberRoles, updateUserRole, updateUserActive, makeUserAdmin, makeUserRegular, activateUser, deactivateUser, accessUserData, stopAccessUser, generateContract, setContractSplit, setContractSupplierSplit, syncReceiptPaymentFromContract, printContractPdf, generateReceipt, printReceiptPdf, addContractClause, removeContractClause, resetContractClauses, applyPaymentPreset, generateRenderPrompt, callRenderApi, requestRenderPlan, updatePlanStatus, createQuickBudget, addBudgetItem, removeBudgetItem, updateBudgetItemFactor, updateBudgetItem, duplicateBudgetItem, markBudgetApproved, saveBudgetFields, setPaymentSplit, setSupplierSplit, exportBudgetHtml, openProjectBudget, openProjectDesigner, openTabKey, saveDesignerEnvironment, applyDesignerModule, duplicateDesignerModule, deleteDesignerModule, moveDesigner, alignDesigner, clearDesignerEnvironment, setDesignerMode, setDesignerZoom, fitDesignerZoom, toggleDesignerOption, toggleDesignerOpen, changeDesignerCount, addKitchenPreset, generatePiecesForCurrentDesign, designerToBudget, exportDesignerSvg, exportDesignerPng, printDesignerProject };
  Object.keys(window.TP).forEach(key=>{
    const fn=window.TP[key];
    if(typeof fn!=='function') return;
    window.TP[key]=function(...args){
      try{ const r=fn.apply(null,args); if(r && typeof r.catch==='function') r.catch(err=>{ console.error(err); setCloud(false,'Erro na nuvem'); toast(friendlyDbError(err),'red'); }); return r; }
      catch(err){ console.error(err); setCloud(false,'Erro na nuvem'); toast(friendlyDbError(err),'red'); return null; }
    };
  });


  function hardenExternalLinks(){
    $$('a[target="_blank"]').forEach(a=>{
      const rel = String(a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      ['noopener','noreferrer'].forEach(v=>{ if(!rel.includes(v)) rel.push(v); });
      a.setAttribute('rel', rel.join(' '));
    });
  }

function bindPwaLifecycle(){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if(window.__tpPwaReloading) return;
    window.__tpPwaReloading = true;
    setTimeout(() => location.reload(), 250);
  });
}
  document.addEventListener('DOMContentLoaded', ()=>{ applyTheme(); hardenExternalLinks(); bindPwaLifecycle(); bindAuth(); bindDesignerKeyboard(); bindTabSearch(); bootApp(); });
})();
