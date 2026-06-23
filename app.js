const STORAGE_KEY = 'top-visita-tecnica-v1';
const DB_NAME = 'top-visita-tecnica-db';
const DB_STORE = 'state';
const DB_KEY = 'main';
// Menor para salvar melhor no celular e evitar travar o navegador com fotos grandes.
const MAX_IMAGE_SIDE = 1200;

const $ = (id) => document.getElementById(id);
const els = {
  toast: $('toast'),
  installBtn: $('installBtn'),
  addClientBtn: $('addClientBtn'),
  clientSearch: $('clientSearch'),
  clientList: $('clientList'),
  emptyDetail: $('emptyDetail'),
  clientDetail: $('clientDetail'),
  detailName: $('detailName'),
  detailMeta: $('detailMeta'),
  detailNotes: $('detailNotes'),
  editClientBtn: $('editClientBtn'),
  deleteClientBtn: $('deleteClientBtn'),
  addRoomBtn: $('addRoomBtn'),
  roomList: $('roomList'),
  clientDialog: $('clientDialog'),
  clientForm: $('clientForm'),
  clientDialogTitle: $('clientDialogTitle'),
  clientName: $('clientName'),
  clientPhone: $('clientPhone'),
  clientAddress: $('clientAddress'),
  clientNotes: $('clientNotes'),
  roomDialog: $('roomDialog'),
  roomForm: $('roomForm'),
  roomDialogTitle: $('roomDialogTitle'),
  roomName: $('roomName'),
  roomStatus: $('roomStatus'),
  roomDeadline: $('roomDeadline'),
  roomNotes: $('roomNotes'),
  editorDialog: $('editorDialog'),
  editorTitle: $('editorTitle'),
  editorSubtitle: $('editorSubtitle'),
  closeEditorBtn: $('closeEditorBtn'),
  photoInput: $('photoInput'),
  sketchToggle: $('sketchToggle'),
  calibrateBtn: $('calibrateBtn'),
  measureBtn: $('measureBtn'),
  viewBtn: $('viewBtn'),
  moveBtn: $('moveBtn'),
  deleteMarkerBtn: $('deleteMarkerBtn'),
  deleteMeasureBtn: $('deleteMeasureBtn'),
  undoBtn: $('undoBtn'),
  exportBtn: $('exportBtn'),
  fitBtn: $('fitBtn'),
  shareBtn: $('shareBtn'),
  whatsAppBtn: $('whatsAppBtn'),
  exportProjectBtn: $('exportProjectBtn'),
  importProjectBtn: $('importProjectBtn'),
  importProjectInput: $('importProjectInput'),
  workCanvas: $('workCanvas'),
  canvasArea: document.querySelector('.canvas-area'),
  viewInfoPanel: $('viewInfoPanel'),
  canvasEmpty: $('canvasEmpty'),
  objectDialog: $('objectDialog'),
  objectForm: $('objectForm'),
  objectName: $('objectName'),
  objectHeight: $('objectHeight'),
  objectDistance: $('objectDistance'),
  objectLeftDistance: $('objectLeftDistance'),
  objectRightDistance: $('objectRightDistance'),
  objectFloorDistance: $('objectFloorDistance'),
  objectCeilingDistance: $('objectCeilingDistance'),
  objectAutoDistances: $('objectAutoDistances'),
  objectNotes: $('objectNotes'),
  deleteObjectBtn: $('deleteObjectBtn'),
  measureNotesInput: $('measureNotesInput'),
  saveMeasureNotesBtn: $('saveMeasureNotesBtn'),
  measureNotesStatus: $('measureNotesStatus'),
  measureDialog: $('measureDialog'),
  measureForm: $('measureForm'),
  measureDialogTitle: $('measureDialogTitle'),
  measureHelp: $('measureHelp'),
  measureValue: $('measureValue'),
  measureUnit: $('measureUnit'),
  deleteMeasureLineBtn: $('deleteMeasureLineBtn'),
};

let state = loadState();
let selectedClientId = state.clients[0]?.id || null;
let editingClientId = null;
let editingRoomId = null;
let selectedObjectId = null;

let editor = {
  clientId: null,
  roomId: null,
  room: null,
  ctx: els.workCanvas.getContext('2d'),
  img: null,
  sketchImg: null,
  mode: 'view',
  pendingPoints: [],
  drag: null,
  selectedType: null,
  selectedIcon: null,
  fitToScreen: true,
  selectedMeasureId: null,
  selectedMeasureKind: null,
};

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function showToast(message, ms = 2600) {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => els.toast.classList.add('hidden'), ms);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { clients: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.clients)) return { clients: [] };
    return parsed;
  } catch {
    return { clients: [] };
  }
}

function openStateDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB indisponível'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE, { keyPath: 'key' });
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

function saveStateToDb(data) {
  return openStateDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put({ key: DB_KEY, value: data, savedAt: nowIso() });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  }));
}

function loadStateFromDb() {
  return openStateDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get(DB_KEY);
    req.onsuccess = () => resolve(req.result?.value || null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  }));
}

function saveState() {
  const snapshot = JSON.parse(JSON.stringify(state));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.warn('LocalStorage cheio ou bloqueado. Salvando no banco interno.', err);
  }
  saveStateToDb(snapshot).catch(err => {
    console.warn('Falha ao salvar no IndexedDB', err);
    showToast('Não consegui salvar no armazenamento do celular. Exporte o projeto para backup.', 4500);
  });
}

async function hydrateStateFromDb() {
  try {
    const dbState = await loadStateFromDb();
    if (dbState?.clients && Array.isArray(dbState.clients)) {
      const localCount = state.clients?.length || 0;
      const dbCount = dbState.clients.length || 0;
      if (dbCount > localCount || !localCount) {
        state = dbState;
        selectedClientId = state.clients[0]?.id || null;
        render();
      }
    }
  } catch (err) {
    console.warn('Sem dados no banco interno ainda.', err);
  }
}

function findClient(id = selectedClientId) {
  return state.clients.find(c => c.id === id) || null;
}

function findRoom(clientId, roomId) {
  const client = findClient(clientId);
  return client?.rooms?.find(r => r.id === roomId) || null;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}

function formatDate(value) {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return d && m && y ? `${d}/${m}/${y}` : value;
}

function render() {
  renderClients();
  renderDetail();
}

function renderClients() {
  const q = els.clientSearch.value.trim().toLowerCase();
  const clients = state.clients
    .filter(c => `${c.name} ${c.phone} ${c.address}`.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  els.clientList.innerHTML = clients.map(c => `
    <article class="client-card ${c.id === selectedClientId ? 'active' : ''}" data-client-id="${c.id}">
      <strong>${escapeHtml(c.name)}</strong>
      <span>${escapeHtml(c.phone || 'Sem telefone')}</span><br>
      <span>${escapeHtml(c.address || 'Sem endereço')}</span>
      <div class="count">${c.rooms?.length || 0} ambiente(s)</div>
    </article>
  `).join('');

  els.clientList.querySelectorAll('[data-client-id]').forEach(card => {
    card.addEventListener('click', () => {
      selectedClientId = card.dataset.clientId;
      render();
    });
  });
}

function renderDetail() {
  const client = findClient();
  if (!client) {
    els.emptyDetail.classList.remove('hidden');
    els.clientDetail.classList.add('hidden');
    return;
  }
  els.emptyDetail.classList.add('hidden');
  els.clientDetail.classList.remove('hidden');
  els.detailName.textContent = client.name;
  els.detailMeta.textContent = [client.phone, client.address].filter(Boolean).join(' • ') || 'Sem telefone/endereço';
  els.detailNotes.textContent = client.notes || 'Sem observações.';

  const rooms = client.rooms || [];
  if (!rooms.length) {
    els.roomList.innerHTML = `<div class="empty-detail" style="min-height:180px"><p>Nenhum ambiente criado para este cliente.</p></div>`;
    return;
  }

  els.roomList.innerHTML = rooms.map(r => `
    <article class="room-card" data-room-id="${r.id}">
      <div class="room-card-header">
        <div>
          <h3>${escapeHtml(r.name)}</h3>
          <span>${escapeHtml(r.notes || 'Sem observações do ambiente')}</span>
        </div>
        <span class="status">${escapeHtml(r.status || 'Visita feita')}</span>
      </div>
      <div>
        <span>${r.deadline ? `Prazo/data: ${formatDate(r.deadline)} • ` : ''}${r.photoData ? 'Foto adicionada' : 'Sem foto'} • ${(r.markers?.length || 0)} marcações • ${(r.measures?.length || 0)} medidas</span>
      </div>
      <div class="room-actions">
        <button class="primary open-editor">Abrir foto técnica</button>
        <button class="ghost edit-room">Editar ambiente</button>
        <button class="danger ghost delete-room">Excluir</button>
      </div>
    </article>
  `).join('');

  els.roomList.querySelectorAll('.room-card').forEach(card => {
    const roomId = card.dataset.roomId;
    card.querySelector('.open-editor').addEventListener('click', () => openEditor(selectedClientId, roomId));
    card.querySelector('.edit-room').addEventListener('click', () => openRoomDialog(roomId));
    card.querySelector('.delete-room').addEventListener('click', () => deleteRoom(roomId));
  });
}

function openClientDialog(clientId = null) {
  editingClientId = clientId;
  const client = clientId ? findClient(clientId) : null;
  els.clientDialogTitle.textContent = client ? 'Editar cliente' : 'Novo cliente';
  els.clientName.value = client?.name || '';
  els.clientPhone.value = client?.phone || '';
  els.clientAddress.value = client?.address || '';
  els.clientNotes.value = client?.notes || '';
  els.clientDialog.showModal();
}

function saveClientFromForm() {
  const payload = {
    name: els.clientName.value.trim(),
    phone: els.clientPhone.value.trim(),
    address: els.clientAddress.value.trim(),
    notes: els.clientNotes.value.trim(),
    updatedAt: nowIso(),
  };
  if (!payload.name) return;

  if (editingClientId) {
    const client = findClient(editingClientId);
    Object.assign(client, payload);
    showToast('Cliente atualizado.');
  } else {
    const client = { id: uid('client'), ...payload, createdAt: nowIso(), rooms: [] };
    state.clients.push(client);
    selectedClientId = client.id;
    showToast('Cliente criado.');
  }
  saveState();
  render();
}

function deleteClient() {
  const client = findClient();
  if (!client) return;
  if (!confirm(`Excluir o cliente "${client.name}" e todos os ambientes salvos?`)) return;
  state.clients = state.clients.filter(c => c.id !== client.id);
  selectedClientId = state.clients[0]?.id || null;
  saveState();
  render();
  showToast('Cliente excluído.');
}

function openRoomDialog(roomId = null) {
  const client = findClient();
  if (!client) return;
  editingRoomId = roomId;
  const room = roomId ? findRoom(client.id, roomId) : null;
  els.roomDialogTitle.textContent = room ? 'Editar ambiente' : 'Novo ambiente';
  els.roomName.value = room?.name || '';
  els.roomStatus.value = room?.status || 'Visita feita';
  els.roomDeadline.value = room?.deadline || '';
  els.roomNotes.value = room?.notes || '';
  els.roomDialog.showModal();
}

function saveRoomFromForm() {
  const client = findClient();
  if (!client) return;
  const payload = {
    name: els.roomName.value.trim(),
    status: els.roomStatus.value,
    deadline: els.roomDeadline.value,
    notes: els.roomNotes.value.trim(),
    updatedAt: nowIso(),
  };
  if (!payload.name) return;

  if (editingRoomId) {
    const room = findRoom(client.id, editingRoomId);
    Object.assign(room, payload);
    showToast('Ambiente atualizado.');
  } else {
    const room = {
      id: uid('room'), ...payload, createdAt: nowIso(), photoData: '', sketchMode: false,
      markers: [], measures: [], calibration: null, measureNotes: '',
    };
    client.rooms = client.rooms || [];
    client.rooms.push(room);
    showToast('Ambiente criado.');
  }
  client.updatedAt = nowIso();
  saveState();
  render();
}

function deleteRoom(roomId) {
  const client = findClient();
  const room = findRoom(client.id, roomId);
  if (!room) return;
  if (!confirm(`Excluir o ambiente "${room.name}"?`)) return;
  client.rooms = client.rooms.filter(r => r.id !== roomId);
  client.updatedAt = nowIso();
  saveState();
  render();
  showToast('Ambiente excluído.');
}

function setMode(mode, selectedType = null, selectedIcon = null) {
  editor.mode = mode;
  editor.selectedType = selectedType;
  editor.selectedIcon = selectedIcon;
  editor.pendingPoints = [];
  document.querySelectorAll('.tool-btn, .object-btn').forEach(b => b.classList.remove('active'));
  if (mode === 'view') els.viewBtn.classList.add('active');
  if (mode === 'move') els.moveBtn.classList.add('active');
  if (mode === 'delete-marker') els.deleteMarkerBtn.classList.add('active');
  if (mode === 'delete-measure') els.deleteMeasureBtn.classList.add('active');
  if (mode === 'calibrate') els.calibrateBtn.classList.add('active');
  if (mode === 'measure') els.measureBtn.classList.add('active');
  if (mode === 'object') {
    document.querySelectorAll(`.object-btn[data-type="${CSS.escape(selectedType)}"]`).forEach(b => b.classList.add('active'));
  }
  els.workCanvas.classList.toggle('canvas-view-mode', mode === 'view');
  els.canvasArea?.classList.toggle('view-mode', mode === 'view');
  const label = {
    view: 'Visualizar: toque na marcação para ver as medidas sem abrir edição.',
    move: 'Mover / editar: toque e arraste; toque rápido em item ou linha para abrir edição.',
    'delete-marker': 'Remover item: toque em uma tomada, interruptor ou outro item para excluir.',
    'delete-measure': 'Remover medida: toque em uma linha de medida para excluir.',
    calibrate: 'Calibrar: toque em 2 pontos de uma medida conhecida.',
    measure: 'Medida: toque em 2 pontos para criar uma linha.',
    object: `Adicionar: toque na foto para inserir ${selectedType}.`,
  }[mode];
  updateViewInfoPanel();
  drawCanvas();
  showToast(label, 2200);
}

function openEditor(clientId, roomId) {
  editor.clientId = clientId;
  editor.roomId = roomId;
  editor.room = findRoom(clientId, roomId);
  editor.img = null;
  editor.sketchImg = null;
  editor.pendingPoints = [];
  editor.drag = null;
  selectedObjectId = null;
  editor.selectedMeasureId = null;
  editor.selectedMeasureKind = null;

  const client = findClient(clientId);
  els.editorTitle.textContent = editor.room.name;
  els.editorSubtitle.textContent = client ? client.name : 'Foto técnica';
  els.sketchToggle.classList.toggle('active', !!editor.room.sketchMode);
  editor.fitToScreen = true;
  if (els.fitBtn) els.fitBtn.textContent = 'Foto ajustada';
  els.editorDialog.showModal();
  setMode('view');
  if (els.measureNotesInput) {
    els.measureNotesInput.value = editor.room.measureNotes || '';
    els.measureNotesStatus.textContent = 'As anotações ficam salvas nesse ambiente.';
  }
  loadEditorImage();
}

function closeEditor() {
  saveEditorRoom();
  if (els.viewInfoPanel) els.viewInfoPanel.classList.add('hidden');
  els.editorDialog.close();
  render();
}

function saveEditorRoom() {
  if (!editor.room) return;
  if (els.measureNotesInput && els.editorDialog.open) {
    editor.room.measureNotes = els.measureNotesInput.value;
  }
  editor.room.updatedAt = nowIso();
  const client = findClient(editor.clientId);
  if (client) client.updatedAt = nowIso();
  saveState();
}

function loadEditorImage() {
  const room = editor.room;
  els.canvasEmpty.classList.toggle('hidden', !!room.photoData);
  if (!room.photoData) {
    els.workCanvas.width = 1000;
    els.workCanvas.height = 700;
    editor.ctx.clearRect(0, 0, els.workCanvas.width, els.workCanvas.height);
    updateCanvasFit();
    return;
  }

  const img = new Image();
  img.onload = () => {
    editor.img = img;
    els.workCanvas.width = img.naturalWidth;
    els.workCanvas.height = img.naturalHeight;
    editor.sketchImg = null;
    drawCanvas();
    updateCanvasFit();
  };
  img.src = room.photoData;
}

function updateCanvasFit() {
  const c = els.workCanvas;
  if (!c) return;
  if (!editor.fitToScreen || !editor.room?.photoData) {
    c.style.width = c.width ? `${c.width}px` : '';
    c.style.height = c.height ? `${c.height}px` : '';
    return;
  }
  const area = els.canvasArea;
  if (!area || !c.width || !c.height) return;
  requestAnimationFrame(() => {
    const panelVisible = els.viewInfoPanel && !els.viewInfoPanel.classList.contains('hidden');
    const panelH = panelVisible ? els.viewInfoPanel.offsetHeight + 12 : 0;
    const usableW = Math.max(260, area.clientWidth - 28);
    const usableH = Math.max(260, area.clientHeight - 28 - panelH);
    const scale = Math.min(1, usableW / c.width, usableH / c.height);
    c.style.width = `${Math.max(180, Math.round(c.width * scale))}px`;
    c.style.height = 'auto';
  });
}

function toggleCanvasFit() {
  editor.fitToScreen = !editor.fitToScreen;
  if (els.fitBtn) els.fitBtn.textContent = editor.fitToScreen ? 'Foto ajustada' : 'Foto tamanho real';
  updateCanvasFit();
  showToast(editor.fitToScreen ? 'Foto ajustada para caber na tela.' : 'Foto em tamanho real. Role a tela para ver tudo.', 2400);
}

function drawCanvas() {
  const c = els.workCanvas;
  const ctx = editor.ctx;
  ctx.clearRect(0, 0, c.width, c.height);

  if (editor.img) {
    if (editor.room.sketchMode) {
      if (!editor.sketchImg) editor.sketchImg = createSketchCanvas(editor.img);
      ctx.drawImage(editor.sketchImg, 0, 0, c.width, c.height);
    } else {
      ctx.drawImage(editor.img, 0, 0, c.width, c.height);
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      ctx.fillRect(0, 0, c.width, c.height);
    }
  } else {
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, c.width, c.height);
  }

  drawMeasures(ctx);
  drawSelectedMarkerGuides(ctx);
  drawMarkers(ctx);
  drawPending(ctx);
}

function drawMarkers(ctx) {
  const markers = editor.room.markers || [];
  markers.forEach(m => {
    const selected = m.id === selectedObjectId;
    const r = selected ? 27 : 24;
    ctx.save();
    ctx.beginPath();
    ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
    ctx.fillStyle = selected ? '#cf2626' : 'rgba(17,17,17,.88)';
    ctx.fill();
    ctx.lineWidth = selected ? 5 : 3;
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.font = '24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(m.icon || '•', m.x, m.y + 1);

    const text = m.name || m.type || 'Objeto';
    ctx.font = 'bold 18px system-ui, sans-serif';
    const width = ctx.measureText(text).width + 16;
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    roundRect(ctx, m.x - width / 2, m.y + r + 8, width, 30, 10, true, false);
    ctx.fillStyle = '#111';
    ctx.fillText(text, m.x, m.y + r + 25);
    ctx.restore();
  });
}


function drawSelectedMarkerGuides(ctx) {
  if (!selectedObjectId || !editor.room?.photoData) return;
  const marker = (editor.room.markers || []).find(m => m.id === selectedObjectId);
  if (!marker) return;

  const c = els.workCanvas;
  const leftPx = Math.max(0, marker.x);
  const rightPx = Math.max(0, c.width - marker.x);
  const floorPx = Math.max(0, c.height - marker.y);
  const ceilingPx = Math.max(0, marker.y);

  const topY = clamp(marker.y - 82, 42, c.height - 80);
  const bottomY = clamp(marker.y + 82, 72, c.height - 35);
  const sideX = clamp(marker.x + 78, 42, c.width - 42);
  const sideXLeft = clamp(marker.x - 78, 42, c.width - 42);

  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#cf2626';
  ctx.fillStyle = '#cf2626';
  ctx.setLineDash([12, 8]);

  drawDoubleArrow(ctx, 0, topY, marker.x, topY);
  drawDistanceLabel(ctx, marker.x / 2, topY - 18, `Parede esq: ${formatPxDistance(leftPx)}`);

  drawDoubleArrow(ctx, marker.x, bottomY, c.width, bottomY);
  drawDistanceLabel(ctx, (marker.x + c.width) / 2, bottomY + 22, `Parede dir: ${formatPxDistance(rightPx)}`);

  drawDoubleArrow(ctx, sideX, marker.y, sideX, c.height);
  drawDistanceLabel(ctx, sideX + 7, (marker.y + c.height) / 2, `Chão: ${formatPxDistance(floorPx)}`, 'left');

  drawDoubleArrow(ctx, sideXLeft, 0, sideXLeft, marker.y);
  drawDistanceLabel(ctx, sideXLeft + 7, marker.y / 2, `Teto: ${formatPxDistance(ceilingPx)}`, 'left');

  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(207, 38, 38, .35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marker.x, 0);
  ctx.lineTo(marker.x, c.height);
  ctx.moveTo(0, marker.y);
  ctx.lineTo(c.width, marker.y);
  ctx.stroke();
  ctx.restore();
}

function drawDoubleArrow(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  drawArrowHead(ctx, x1, y1, x2, y2);
  drawArrowHead(ctx, x2, y2, x1, y1);
}

function drawArrowHead(ctx, x, y, towardX, towardY) {
  const angle = Math.atan2(y - towardY, x - towardX);
  const size = 14;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawDistanceLabel(ctx, x, y, text, align = 'center') {
  ctx.save();
  ctx.font = 'bold 18px system-ui, sans-serif';
  const padX = 10;
  const width = ctx.measureText(text).width + padX * 2;
  const height = 30;
  let boxX = align === 'left' ? x : x - width / 2;
  boxX = clamp(boxX, 6, els.workCanvas.width - width - 6);
  let boxY = clamp(y - height / 2, 6, els.workCanvas.height - height - 6);
  ctx.fillStyle = 'rgba(255,255,255,.96)';
  roundRect(ctx, boxX, boxY, width, height, 9, true, false);
  ctx.strokeStyle = '#cf2626';
  ctx.lineWidth = 2;
  roundRect(ctx, boxX, boxY, width, height, 9, false, true);
  ctx.fillStyle = '#cf2626';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, boxX + width / 2, boxY + height / 2 + 1);
  ctx.restore();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatPxDistance(px) {
  const cal = editor.room?.calibration;
  if (cal?.pxPerCm) return formatCm(px / cal.pxPerCm);
  return `${Math.round(px)}px`;
}

function getMarkerAutoDistanceData(marker) {
  if (!marker) return null;
  const c = els.workCanvas;
  return {
    left: formatPxDistance(Math.max(0, marker.x)),
    right: formatPxDistance(Math.max(0, c.width - marker.x)),
    floor: formatPxDistance(Math.max(0, c.height - marker.y)),
    ceiling: formatPxDistance(Math.max(0, marker.y)),
    hasScale: !!editor.room?.calibration?.pxPerCm,
  };
}

function getMarkerDisplayDistances(marker) {
  const auto = getMarkerAutoDistanceData(marker) || {};
  return {
    left: marker?.leftDistance || auto.left || '',
    right: marker?.rightDistance || auto.right || '',
    floor: marker?.floorDistance || auto.floor || '',
    ceiling: marker?.ceilingDistance || auto.ceiling || '',
    hasScale: auto.hasScale,
  };
}

function getMarkerAutoDistanceText(marker) {
  const d = getMarkerAutoDistanceData(marker);
  if (!d) return '';
  const scaleText = d.hasScale ? '' : '<br><small>Calibre uma medida para aparecer em cm/m em vez de pixel.</small>';
  return `Automático pela posição na foto:<br>Parede esquerda: ${d.left}<br>Parede direita: ${d.right}<br>Chão: ${d.floor}<br>Teto: ${d.ceiling}${scaleText}`;
}

function updateViewInfoPanel() {
  const panel = els.viewInfoPanel;
  if (!panel) return;
  if (editor.mode !== 'view' || !editor.room?.photoData) {
    panel.classList.add('hidden');
    panel.innerHTML = '';
    updateCanvasFit();
    return;
  }
  const marker = (editor.room.markers || []).find(m => m.id === selectedObjectId);
  if (!marker) {
    panel.classList.add('hidden');
    panel.innerHTML = '';
    updateCanvasFit();
    return;
  }
  const d = getMarkerDisplayDistances(marker);
  panel.classList.remove('hidden');
  panel.innerHTML = `
    <div class="view-panel-head">
      <strong>${escapeHtml(marker.icon || '')} ${escapeHtml(marker.name || marker.type || 'Marcação')}</strong>
      <button type="button" class="mini-icon" data-action="close-view-panel" aria-label="Fechar painel">×</button>
    </div>
    <div class="view-measure-grid four-cols">
      <span>Esq:<b>${escapeHtml(d.left)}</b></span>
      <span>Dir:<b>${escapeHtml(d.right)}</b></span>
      <span>Chão:<b>${escapeHtml(d.floor)}</b></span>
      <span>Teto:<b>${escapeHtml(d.ceiling)}</b></span>
    </div>
    ${(marker.height || marker.distance || marker.notes) ? `<small>${[marker.height ? `Altura: ${escapeHtml(marker.height)}` : '', marker.distance ? `Distância: ${escapeHtml(marker.distance)}` : '', marker.notes ? `Obs: ${escapeHtml(marker.notes)}` : ''].filter(Boolean).join(' • ')}</small>` : ''}
    ${d.hasScale ? '' : '<small>Sem escala calibrada: medidas em pixel.</small>'}
    <div class="view-panel-actions">
      <button type="button" class="panel-edit-btn" data-action="edit-selected-marker">Atualizar medidas</button>
      <button type="button" class="panel-close-btn" data-action="close-view-panel">Fechar</button>
    </div>
  `;
  updateCanvasFit();
}

function drawMeasures(ctx) {
  const measures = editor.room.measures || [];
  measures.forEach(line => drawMeasureLine(ctx, line, false));
  const cal = editor.room.calibration;
  if (cal?.p1 && cal?.p2) drawMeasureLine(ctx, { ...cal, label: `Escala: ${cal.realLabel}` }, true);
}

function drawMeasureLine(ctx, line, calibration = false) {
  const { p1, p2 } = line;
  if (!p1 || !p2) return;
  ctx.save();
  ctx.strokeStyle = calibration ? '#cf2626' : '#111';
  ctx.fillStyle = calibration ? '#cf2626' : '#111';
  ctx.lineWidth = calibration ? 5 : 4;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  drawEndpoint(ctx, p1.x, p1.y, calibration);
  drawEndpoint(ctx, p2.x, p2.y, calibration);

  const label = line.label || line.realLabel || '';
  if (label) {
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    ctx.font = 'bold 20px system-ui, sans-serif';
    const width = ctx.measureText(label).width + 18;
    ctx.fillStyle = 'rgba(255,255,255,.94)';
    roundRect(ctx, mx - width / 2, my - 22, width, 34, 10, true, false);
    ctx.fillStyle = calibration ? '#cf2626' : '#111';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, mx, my - 5);
  }
  ctx.restore();
}

function drawEndpoint(ctx, x, y, calibration) {
  ctx.beginPath();
  ctx.arc(x, y, calibration ? 8 : 6, 0, Math.PI * 2);
  ctx.fillStyle = calibration ? '#cf2626' : '#111';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'white';
  ctx.stroke();
}

function drawPending(ctx) {
  if (!editor.pendingPoints.length) return;
  ctx.save();
  ctx.fillStyle = '#cf2626';
  editor.pendingPoints.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
    ctx.fill();
  });
  if (editor.pendingPoints.length === 2) {
    ctx.strokeStyle = '#cf2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(editor.pendingPoints[0].x, editor.pendingPoints[0].y);
    ctx.lineTo(editor.pendingPoints[1].x, editor.pendingPoints[1].y);
    ctx.stroke();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function createSketchCanvas(img) {
  const temp = document.createElement('canvas');
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  temp.width = w;
  temp.height = h;
  const tctx = temp.getContext('2d', { willReadFrequently: true });
  tctx.drawImage(img, 0, 0, w, h);
  const src = tctx.getImageData(0, 0, w, h);
  const data = src.data;
  const gray = new Uint8ClampedArray(w * h);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  const out = tctx.createImageData(w, h);
  const dst = out.data;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] + gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
      const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
      const mag = Math.sqrt(gx * gx + gy * gy);
      const v = mag > 85 ? 35 : 255;
      const di = i * 4;
      dst[di] = v; dst[di + 1] = v; dst[di + 2] = v; dst[di + 3] = 255;
    }
  }
  tctx.putImageData(out, 0, 0);
  return temp;
}

async function handlePhoto(file) {
  if (!file) return;
  try {
    const dataUrl = await resizeImage(file);
    editor.room.photoData = dataUrl;
    editor.room.markers = editor.room.markers || [];
    editor.room.measures = editor.room.measures || [];
    editor.room.calibration = editor.room.calibration || null;
    editor.room.sketchMode = false;
    els.sketchToggle.classList.remove('active');
    saveEditorRoom();
    loadEditorImage();
    showToast('Foto adicionada.');
  } catch (err) {
    console.error(err);
    showToast('Não consegui carregar essa imagem.');
  } finally {
    els.photoInput.value = '';
  }
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.70));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function getCanvasPoint(evt) {
  const rect = els.workCanvas.getBoundingClientRect();
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return {
    x: (clientX - rect.left) * (els.workCanvas.width / rect.width),
    y: (clientY - rect.top) * (els.workCanvas.height / rect.height),
  };
}

function handleCanvasDown(evt) {
  if (!editor.room?.photoData) return;
  const p = getCanvasPoint(evt);

  if (editor.mode === 'object') {
    evt.preventDefault();
    addMarker(p.x, p.y, editor.selectedType, editor.selectedIcon);
    return;
  }

  if (editor.mode === 'calibrate' || editor.mode === 'measure') {
    evt.preventDefault();

    // Evita travar a criação de novas linhas quando já existem 2 pontos aguardando
    // ou quando o usuário toca de novo enquanto a janela de medida está aberta.
    if (els.measureDialog.open) return;
    if (editor.pendingPoints.length >= 2) editor.pendingPoints = [];

    editor.pendingPoints.push(p);
    if (editor.pendingPoints.length === 2) {
      if (editor.mode === 'calibrate') openMeasureDialog('calibrate');
      else openMeasureDialog('measure');
    }
    drawCanvas();
    return;
  }

  if (editor.mode === 'delete-marker') {
    evt.preventDefault();
    const hit = hitMarker(p.x, p.y);
    if (!hit) return showToast('Toque em um item para remover.');
    deleteMarkerById(hit.id, true);
    return;
  }

  if (editor.mode === 'delete-measure') {
    evt.preventDefault();
    const hitLine = hitMeasure(p.x, p.y);
    if (!hitLine) return showToast('Toque em uma linha de medida para remover.');
    if (hitLine.kind === 'calibration') {
      deleteCalibration(true);
    } else {
      deleteMeasureById(hitLine.id, true);
    }
    return;
  }

  const hit = hitMarker(p.x, p.y);
  selectedObjectId = hit?.id || null;

  if (editor.mode === 'view') {
    editor.drag = null;
    drawCanvas();
    updateViewInfoPanel();
    if (hit && !editor.room?.calibration?.pxPerCm) {
      showToast('Setas em pixel. Use Calibrar medida para aparecer em cm/m.', 2300);
    } else if (hit) {
      showToast('Medidas exibidas. Use Atualizar medidas só se quiser editar.', 1900);
    }
    return;
  }

  evt.preventDefault();
  if (hit) {
    editor.drag = { type: 'marker', id: hit.id, dx: hit.x - p.x, dy: hit.y - p.y, moved: false, startX: p.x, startY: p.y };
  } else {
    const hitLine = hitMeasure(p.x, p.y);
    if (hitLine) {
      editor.drag = { type: 'measure', kind: hitLine.kind, id: hitLine.id, moved: false, startX: p.x, startY: p.y, lastX: p.x, lastY: p.y };
      showToast('Linha selecionada. Arraste para mover.', 1800);
    } else {
      editor.drag = null;
    }
  }
  drawCanvas();
  if (hit && !editor.room?.calibration?.pxPerCm) {
    showToast('Setas em pixel. Use Calibrar medida para aparecer em cm/m.', 2300);
  }
}

function handleCanvasMove(evt) {
  if (!editor.drag || !editor.room) return;
  evt.preventDefault();
  const p = getCanvasPoint(evt);

  if (editor.drag.type === 'marker') {
    const marker = editor.room.markers.find(m => m.id === editor.drag.id);
    if (!marker) return;
    marker.x = p.x + editor.drag.dx;
    marker.y = p.y + editor.drag.dy;
    if (Math.hypot(p.x - editor.drag.startX, p.y - editor.drag.startY) > 5) editor.drag.moved = true;
    drawCanvas();
    return;
  }

  if (editor.drag.type === 'measure') {
    const dx = p.x - editor.drag.lastX;
    const dy = p.y - editor.drag.lastY;
    if (editor.drag.kind === 'calibration' && editor.room.calibration?.p1 && editor.room.calibration?.p2) {
      editor.room.calibration.p1.x += dx;
      editor.room.calibration.p1.y += dy;
      editor.room.calibration.p2.x += dx;
      editor.room.calibration.p2.y += dy;
    } else {
      const line = (editor.room.measures || []).find(m => m.id === editor.drag.id);
      if (!line) return;
      line.p1.x += dx;
      line.p1.y += dy;
      line.p2.x += dx;
      line.p2.y += dy;
    }
    editor.drag.lastX = p.x;
    editor.drag.lastY = p.y;
    if (Math.hypot(p.x - editor.drag.startX, p.y - editor.drag.startY) > 5) editor.drag.moved = true;
    drawCanvas();
  }
}

function handleCanvasUp(evt) {
  if (!editor.drag) return;
  const drag = editor.drag;
  editor.drag = null;
  saveEditorRoom();
  if (!drag.moved && drag.type === 'marker') {
    const marker = editor.room.markers.find(m => m.id === drag.id);
    if (marker) openObjectDialog(marker.id);
    return;
  }
  if (!drag.moved && drag.type === 'measure') {
    openExistingMeasureDialog(drag.kind, drag.id);
  }
}

function hitMarker(x, y) {
  const markers = [...(editor.room.markers || [])].reverse();
  return markers.find(m => Math.hypot(m.x - x, m.y - y) <= 35) || null;
}
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (!dx && !dy) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function hitMeasure(x, y) {
  const measures = [...(editor.room.measures || [])].reverse();
  for (const line of measures) {
    const d = pointToSegmentDistance(x, y, line.p1.x, line.p1.y, line.p2.x, line.p2.y);
    if (d <= 18) return { kind: 'measure', id: line.id, line };
  }
  const cal = editor.room.calibration;
  if (cal?.p1 && cal?.p2) {
    const d = pointToSegmentDistance(x, y, cal.p1.x, cal.p1.y, cal.p2.x, cal.p2.y);
    if (d <= 18) return { kind: 'calibration', id: 'calibration', line: cal };
  }
  return null;
}

function deleteMarkerById(id, askConfirm = false) {
  const marker = editor.room.markers.find(m => m.id === id);
  if (!marker) return;
  if (askConfirm && !confirm(`Remover "${marker.name || marker.type}"?`)) return;
  pushHistorySnapshot();
  editor.room.markers = editor.room.markers.filter(m => m.id !== id);
  if (selectedObjectId === id) selectedObjectId = null;
  saveEditorRoom();
  drawCanvas();
  updateViewInfoPanel();
  if (els.objectDialog.open) els.objectDialog.close();
  showToast('Item removido.');
}

function deleteMeasureById(id, askConfirm = false) {
  const measure = (editor.room.measures || []).find(m => m.id === id);
  if (!measure) return;
  if (askConfirm && !confirm(`Remover a linha de medida ${measure.realLabel || measure.label || ''}?`)) return;
  pushHistorySnapshot();
  editor.room.measures = (editor.room.measures || []).filter(m => m.id !== id);
  saveEditorRoom();
  drawCanvas();
  showToast('Linha de medida removida.');
}

function deleteCalibration(askConfirm = false) {
  if (!editor.room.calibration) return;
  if (askConfirm && !confirm('Remover a escala calibrada?')) return;
  pushHistorySnapshot();
  editor.room.calibration = null;
  saveEditorRoom();
  drawCanvas();
  updateViewInfoPanel();
  showToast('Escala calibrada removida.');
}


function deleteCurrentMeasureLine() {
  const action = els.measureDialog.dataset.action || 'create';
  const kind = els.measureDialog.dataset.kind;
  const measureId = els.measureDialog.dataset.measureId;
  if (action !== 'edit') return;
  if (kind === 'calibrate') {
    deleteCalibration(false);
    els.measureDialog.close();
    return;
  }
  if (!measureId) return;
  deleteMeasureById(measureId, false);
  els.measureDialog.close();
}

function pushHistorySnapshot() {
  editor.room._lastSnapshot = JSON.stringify({
    markers: editor.room.markers || [],
    measures: editor.room.measures || [],
    calibration: editor.room.calibration || null,
  });
}

function addMarker(x, y, type, icon) {
  pushHistorySnapshot();
  const marker = { id: uid('mark'), type, icon, name: type, x, y, height: '', distance: '', leftDistance: '', rightDistance: '', floorDistance: '', ceilingDistance: '', notes: '' };
  editor.room.markers = editor.room.markers || [];
  editor.room.markers.push(marker);
  selectedObjectId = marker.id;
  saveEditorRoom();
  drawCanvas();
  updateViewInfoPanel();
  showToast(`${type} adicionado.`);
}

function openObjectDialog(id) {
  const marker = editor.room.markers.find(m => m.id === id);
  if (!marker) return;
  selectedObjectId = id;
  const auto = getMarkerAutoDistanceData(marker) || {};
  els.objectName.value = marker.name || marker.type || '';
  els.objectHeight.value = marker.height || '';
  els.objectDistance.value = marker.distance || '';
  els.objectLeftDistance.value = marker.leftDistance || auto.left || '';
  els.objectRightDistance.value = marker.rightDistance || auto.right || '';
  els.objectFloorDistance.value = marker.floorDistance || auto.floor || '';
  els.objectCeilingDistance.value = marker.ceilingDistance || auto.ceiling || '';
  els.objectAutoDistances.innerHTML = getMarkerAutoDistanceText(marker);
  els.objectNotes.value = marker.notes || '';
  drawCanvas();
  els.objectDialog.showModal();
}

function saveObjectFromForm() {
  const marker = editor.room.markers.find(m => m.id === selectedObjectId);
  if (!marker) return;
  marker.name = els.objectName.value.trim() || marker.type;
  marker.height = els.objectHeight.value.trim();
  marker.distance = els.objectDistance.value.trim();
  marker.leftDistance = els.objectLeftDistance.value.trim();
  marker.rightDistance = els.objectRightDistance.value.trim();
  marker.floorDistance = els.objectFloorDistance.value.trim();
  marker.ceilingDistance = els.objectCeilingDistance.value.trim();
  marker.notes = els.objectNotes.value.trim();
  saveEditorRoom();
  updateViewInfoPanel();
  drawCanvas();
}

function deleteSelectedObject() {
  if (!selectedObjectId) return;
  deleteMarkerById(selectedObjectId, false);
}

function openMeasureDialog(kind) {
  const [p1, p2] = editor.pendingPoints;
  if (!p1 || !p2) return;
  if (els.measureDialog.open) return;
  const px = Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y));
  els.measureDialog.dataset.kind = kind;
  els.measureDialog.dataset.action = 'create';
  els.measureDialog.dataset.measureId = '';
  els.measureValue.value = '';
  els.measureUnit.value = 'cm';
  els.deleteMeasureLineBtn.classList.add('hidden');
  if (kind === 'calibrate') {
    els.measureDialogTitle.textContent = 'Calibrar escala';
    els.measureHelp.textContent = `A linha marcada tem ${px}px na foto. Digite o tamanho real dessa distância.`;
  } else {
    els.measureDialogTitle.textContent = 'Adicionar medida';
    const auto = estimateRealDistanceCm(p1, p2);
    els.measureHelp.textContent = auto ? `Estimativa pela escala atual: ${formatCm(auto)}. Pode confirmar ou corrigir.` : `Digite a medida real dessa linha. Dica: calibre a escala primeiro para estimar automático.`;
    if (auto) {
      els.measureValue.value = Math.round(auto).toString();
      els.measureUnit.value = 'cm';
    }
  }
  els.measureDialog.showModal();
}

function splitMeasureForForm(line) {
  if (!line) return { value: '', unit: 'cm' };
  if (line.value && line.unit) return { value: String(line.value), unit: line.unit };
  if (line.realLabel) {
    const m = String(line.realLabel).trim().match(/^([\d.,]+)\s*(mm|cm|m)$/i);
    if (m) return { value: m[1].replace(',', '.'), unit: m[2].toLowerCase() };
  }
  if (line.cm != null) return { value: String(Math.round(line.cm)), unit: 'cm' };
  return { value: '', unit: 'cm' };
}

function openExistingMeasureDialog(kind, id) {
  if (els.measureDialog.open) return;
  let line = null;
  if (kind === 'calibration') {
    line = editor.room.calibration;
    if (!line) return;
    els.measureDialogTitle.textContent = 'Editar escala';
    els.measureHelp.textContent = 'Altere o valor da escala calibrada ou exclua a linha.';
    els.measureDialog.dataset.kind = 'calibrate';
  } else {
    line = (editor.room.measures || []).find(m => m.id === id);
    if (!line) return;
    els.measureDialogTitle.textContent = 'Editar linha de medida';
    els.measureHelp.textContent = 'Altere o valor da medida ou exclua a linha.';
    els.measureDialog.dataset.kind = 'measure';
  }
  const formData = splitMeasureForForm(line);
  els.measureValue.value = formData.value;
  els.measureUnit.value = formData.unit || 'cm';
  els.measureDialog.dataset.action = 'edit';
  els.measureDialog.dataset.measureId = id || '';
  els.deleteMeasureLineBtn.classList.remove('hidden');
  els.measureDialog.showModal();
}

function saveMeasureFromForm() {
  const action = els.measureDialog.dataset.action || 'create';
  const valueRaw = String(els.measureValue.value).replace(',', '.');
  const value = Number(valueRaw);
  if (!Number.isFinite(value) || value <= 0) {
    showToast('Digite uma medida válida.');
    return;
  }
  const unit = els.measureUnit.value;
  const cm = unit === 'm' ? value * 100 : unit === 'mm' ? value / 10 : value;
  const realLabel = `${String(els.measureValue.value).trim()}${unit}`;
  const kind = els.measureDialog.dataset.kind;
  pushHistorySnapshot();

  if (action === 'edit') {
    const measureId = els.measureDialog.dataset.measureId;
    if (kind === 'calibrate') {
      const cal = editor.room.calibration;
      if (!cal?.p1 || !cal?.p2) return;
      const px = Math.hypot(cal.p2.x - cal.p1.x, cal.p2.y - cal.p1.y);
      Object.assign(cal, { pixels: px, cm, realLabel, pxPerCm: px / cm, value: String(els.measureValue.value).trim(), unit });
      showToast('Escala atualizada.');
    } else {
      const line = (editor.room.measures || []).find(m => m.id === measureId);
      if (!line?.p1 || !line?.p2) return;
      Object.assign(line, { cm, realLabel, label: realLabel, value: String(els.measureValue.value).trim(), unit });
      showToast('Linha de medida atualizada.');
    }
  } else {
    const [p1, p2] = editor.pendingPoints;
    if (!p1 || !p2) return;
    const px = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (kind === 'calibrate') {
      editor.room.calibration = { p1, p2, pixels: px, cm, realLabel, pxPerCm: px / cm, value: String(els.measureValue.value).trim(), unit };
      showToast('Escala calibrada.');
    } else {
      editor.room.measures = editor.room.measures || [];
      editor.room.measures.push({ id: uid('measure'), p1, p2, cm, realLabel, label: realLabel, value: String(els.measureValue.value).trim(), unit });
      showToast('Medida adicionada. Toque em mais 2 pontos para criar outra linha.', 3200);
    }
  }
  editor.pendingPoints = [];
  saveEditorRoom();
  drawCanvas();
  updateViewInfoPanel();
}

function estimateRealDistanceCm(p1, p2) {
  const cal = editor.room.calibration;
  if (!cal?.pxPerCm) return null;
  const px = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  return px / cal.pxPerCm;
}

function formatCm(cm) {
  if (cm >= 100) return `${(cm / 100).toFixed(2).replace('.', ',')}m`;
  return `${Math.round(cm)}cm`;
}

function undo() {
  const snap = editor.room?._lastSnapshot;
  if (!snap) {
    showToast('Nada para desfazer.');
    return;
  }
  try {
    const data = JSON.parse(snap);
    editor.room.markers = data.markers || [];
    editor.room.measures = data.measures || [];
    editor.room.calibration = data.calibration || null;
    editor.room._lastSnapshot = null;
    selectedObjectId = null;
  editor.selectedMeasureId = null;
  editor.selectedMeasureKind = null;
    saveEditorRoom();
    drawCanvas();
    showToast('Última ação desfeita.');
  } catch {
    showToast('Não foi possível desfazer.');
  }
}

function exportImageBlob() {
  return new Promise(resolve => els.workCanvas.toBlob(resolve, 'image/png', 1));
}

async function downloadImage() {
  if (!editor.room?.photoData) return showToast('Adicione uma foto primeiro.');
  drawCanvas();
  const blob = await exportImageBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const client = findClient(editor.clientId);
  a.href = url;
  a.download = `${safeFileName(client?.name || 'cliente')}-${safeFileName(editor.room.name)}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Imagem salva/baixada.');
}

function buildShareSummary() {
  const client = findClient(editor.clientId);
  const room = editor.room || {};
  const lines = [
    `*Top Visita Técnica*`,
    client?.name ? `Cliente: ${client.name}` : '',
    room.name ? `Ambiente: ${room.name}` : '',
    room.status ? `Status: ${room.status}` : '',
    room.deadline ? `Prazo/data: ${formatDate(room.deadline)}` : '',
    room.notes ? `Obs. ambiente: ${room.notes}` : '',
    room.measureNotes ? `Anotações de medidas: ${room.measureNotes}` : '',
    `Marcações: ${(room.markers || []).length}`,
    `Linhas de medida: ${(room.measures || []).length}`,
  ].filter(Boolean);
  return lines.join('\n');
}

async function shareImage() {
  if (!editor.room?.photoData) return showToast('Adicione uma foto primeiro.');
  drawCanvas();
  const blob = await exportImageBlob();
  const client = findClient(editor.clientId);
  const file = new File([blob], `${safeFileName(client?.name || 'cliente')}-${safeFileName(editor.room.name)}.png`, { type: 'image/png' });
  const text = buildShareSummary();

  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    await navigator.share({ title: 'Top Visita Técnica', text, files: [file] });
    showToast('Compartilhamento aberto.');
    return;
  }
  await downloadImage();
  showToast('A imagem foi baixada para você compartilhar.');
}

async function shareWhatsApp() {
  if (!editor.room?.photoData) return showToast('Adicione uma foto primeiro.');
  drawCanvas();
  const blob = await exportImageBlob();
  const client = findClient(editor.clientId);
  const file = new File([blob], `${safeFileName(client?.name || 'cliente')}-${safeFileName(editor.room.name)}.png`, { type: 'image/png' });
  const text = buildShareSummary();

  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    await navigator.share({ title: 'Top Visita Técnica', text, files: [file] });
    showToast('Escolha o WhatsApp para enviar a imagem.');
    return;
  }

  await downloadImage();
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  showToast('Imagem baixada e WhatsApp aberto com o resumo.');
}

function buildProjectPayload() {
  const client = findClient(editor.clientId);
  const room = editor.room || {};
  return {
    app: 'Top Visita Técnica',
    version: 5,
    exportedAt: nowIso(),
    clientName: client?.name || '',
    room: {
      name: room.name || 'Ambiente importado',
      status: room.status || 'Visita feita',
      deadline: room.deadline || '',
      notes: room.notes || '',
      photoData: room.photoData || '',
      sketchMode: !!room.sketchMode,
      markers: room.markers || [],
      measures: room.measures || [],
      calibration: room.calibration || null,
      measureNotes: room.measureNotes || '',
    },
  };
}

function exportProjectJson() {
  if (!editor.room) return showToast('Abra um ambiente primeiro.');
  const payload = buildProjectPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const client = findClient(editor.clientId);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFileName(client?.name || 'cliente')}-${safeFileName(editor.room.name)}-projeto.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Projeto exportado com foto, medidas e marcações.');
}

function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      try { resolve(JSON.parse(reader.result)); }
      catch (err) { reject(err); }
    };
    reader.readAsText(file);
  });
}

function normalizeImportedRoom(data) {
  const room = data?.room || data;
  if (!room || typeof room !== 'object') return null;
  return {
    name: room.name || editor.room?.name || 'Ambiente importado',
    status: room.status || editor.room?.status || 'Visita feita',
    deadline: room.deadline || '',
    notes: room.notes || '',
    photoData: room.photoData || '',
    sketchMode: !!room.sketchMode,
    markers: Array.isArray(room.markers) ? room.markers : [],
    measures: Array.isArray(room.measures) ? room.measures : [],
    calibration: room.calibration || null,
    measureNotes: room.measureNotes || '',
  };
}

async function importProjectJson(file) {
  if (!file || !editor.room) return;
  try {
    const data = await readJsonFile(file);
    const imported = normalizeImportedRoom(data);
    if (!imported) {
      showToast('Arquivo inválido para importar projeto.');
      return;
    }
    const ok = confirm('Importar este projeto para o ambiente atual? Ele vai substituir foto, marcações, linhas de medida, escala e anotações deste ambiente.');
    if (!ok) return;
    pushHistorySnapshot();
    Object.assign(editor.room, imported, { id: editor.room.id, updatedAt: nowIso() });
    if (els.measureNotesInput) els.measureNotesInput.value = editor.room.measureNotes || '';
    els.sketchToggle.classList.toggle('active', !!editor.room.sketchMode);
    selectedObjectId = null;
  editor.selectedMeasureId = null;
  editor.selectedMeasureKind = null;
    saveEditorRoom();
    setMode('view');
    loadEditorImage();
    showToast('Projeto importado. As medidas e marcações foram carregadas.');
  } catch (err) {
    console.error(err);
    showToast('Não consegui importar esse arquivo JSON.');
  } finally {
    if (els.importProjectInput) els.importProjectInput.value = '';
  }
}

function safeFileName(text) {
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'arquivo';
}

function wireEvents() {
  els.addClientBtn.addEventListener('click', () => openClientDialog());
  els.editClientBtn.addEventListener('click', () => openClientDialog(selectedClientId));
  els.deleteClientBtn.addEventListener('click', deleteClient);
  els.addRoomBtn.addEventListener('click', () => openRoomDialog());
  els.clientSearch.addEventListener('input', renderClients);

  els.clientForm.addEventListener('submit', () => saveClientFromForm());
  els.roomForm.addEventListener('submit', () => saveRoomFromForm());

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => $(btn.dataset.close).close());
  });

  els.closeEditorBtn.addEventListener('click', closeEditor);
  els.photoInput.addEventListener('change', (e) => handlePhoto(e.target.files[0]));
  els.sketchToggle.addEventListener('click', () => {
    if (!editor.room?.photoData) return showToast('Adicione uma foto primeiro.');
    editor.room.sketchMode = !editor.room.sketchMode;
    editor.sketchImg = null;
    els.sketchToggle.classList.toggle('active', editor.room.sketchMode);
    saveEditorRoom();
    drawCanvas();
  });
  els.calibrateBtn.addEventListener('click', () => setMode('calibrate'));
  els.measureBtn.addEventListener('click', () => setMode('measure'));
  els.viewBtn.addEventListener('click', () => setMode('view'));
  els.moveBtn.addEventListener('click', () => setMode('move'));
  els.deleteMarkerBtn.addEventListener('click', () => setMode('delete-marker'));
  els.deleteMeasureBtn.addEventListener('click', () => setMode('delete-measure'));
  els.undoBtn.addEventListener('click', undo);
  els.exportBtn.addEventListener('click', downloadImage);
  if (els.fitBtn) els.fitBtn.addEventListener('click', toggleCanvasFit);
  els.whatsAppBtn.addEventListener('click', shareWhatsApp);
  els.shareBtn.addEventListener('click', shareImage);
  els.exportProjectBtn.addEventListener('click', exportProjectJson);
  els.importProjectBtn.addEventListener('click', () => els.importProjectInput.click());
  els.importProjectInput.addEventListener('change', (e) => importProjectJson(e.target.files?.[0]));
  if (els.viewInfoPanel) {
    els.viewInfoPanel.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'close-view-panel') {
        selectedObjectId = null;
  editor.selectedMeasureId = null;
  editor.selectedMeasureKind = null;
        updateViewInfoPanel();
        drawCanvas();
        return;
      }
      if (action === 'edit-selected-marker') {
        if (!selectedObjectId) return;
        openObjectDialog(selectedObjectId);
      }
    });
  }
  if (els.saveMeasureNotesBtn) {
    els.saveMeasureNotesBtn.addEventListener('click', () => {
      saveEditorRoom();
      els.measureNotesStatus.textContent = 'Anotações salvas agora.';
      showToast('Anotações de medidas salvas.');
    });
  }
  if (els.measureNotesInput) {
    els.measureNotesInput.addEventListener('input', () => {
      if (!editor.room) return;
      editor.room.measureNotes = els.measureNotesInput.value;
      editor.room.updatedAt = nowIso();
      const client = findClient(editor.clientId);
      if (client) client.updatedAt = nowIso();
      saveState();
      els.measureNotesStatus.textContent = 'Salvando automaticamente...';
      clearTimeout(els.measureNotesInput._timer);
      els.measureNotesInput._timer = setTimeout(() => {
        els.measureNotesStatus.textContent = 'Anotações salvas automaticamente.';
      }, 500);
    });
  }

  document.querySelectorAll('.object-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode('object', btn.dataset.type, btn.dataset.icon));
  });

  els.workCanvas.addEventListener('pointerdown', handleCanvasDown);
  els.workCanvas.addEventListener('pointermove', handleCanvasMove);
  els.workCanvas.addEventListener('pointerup', handleCanvasUp);
  els.workCanvas.addEventListener('pointercancel', handleCanvasUp);
  els.workCanvas.addEventListener('dblclick', (e) => {
    const p = getCanvasPoint(e);
    const hit = hitMarker(p.x, p.y);
    if (hit) openObjectDialog(hit.id);
  });

  els.objectForm.addEventListener('submit', saveObjectFromForm);
  els.deleteObjectBtn.addEventListener('click', deleteSelectedObject);
  els.measureForm.addEventListener('submit', (e) => {
    saveMeasureFromForm();
  });
  els.deleteMeasureLineBtn?.addEventListener('click', deleteCurrentMeasureLine);
  els.measureDialog.addEventListener('close', () => {
    editor.pendingPoints = [];
    els.measureDialog.dataset.action = '';
    els.measureDialog.dataset.measureId = '';
    els.deleteMeasureLineBtn?.classList.add('hidden');
    drawCanvas();
  });

  els.editorDialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeEditor();
  });
}

let deferredInstallPrompt = null;
window.addEventListener('resize', () => updateCanvasFit());
window.addEventListener('orientationchange', () => setTimeout(updateCanvasFit, 300));

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  els.installBtn.classList.remove('hidden');
});
els.installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  els.installBtn.classList.add('hidden');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

wireEvents();
render();
hydrateStateFromDb();
