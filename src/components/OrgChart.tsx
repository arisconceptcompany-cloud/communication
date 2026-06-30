"use client";

import { useState, useCallback, useRef } from "react";
import { Pencil, Trash2, Plus, X, Save, UserPlus, Move, ChevronDown, ChevronRight } from "lucide-react";

export type OrgNode = {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  department: string;
  children: OrgNode[];
};

const SKILL_TAGS: Record<string, string[]> = {
  RH: ["#Recrutement", "#Management", "#Paie"],
  Direction: ["#Stratégie", "#Management"],
  Opérations: ["#Data", "#Process", "#Qualité"],
  Technique: ["#Flutter", "#DevOps", "#Sécurité"],
  Commercial: ["#Vente", "#Relation client"],
};

function getSkills(department: string) {
  return SKILL_TAGS[department] || SKILL_TAGS[department.split(" ")[0]] || ["#Collaboration", "#VALUE-IT"];
}

type Toast = { id: number; type: "success" | "error"; message: string };
let toastId = 0;

type DragHandlers = {
  dragNodeId: string | null;
  dropZoneId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (id: string) => void;
  onDragLeave: () => void;
  onDrop: (targetId: string) => void;
};

function OrgNodeCard({
  node,
  onSelect,
  canEdit,
  onEdit,
  onDelete,
  onAddMember,
  drag,
  isExpanded,
  onToggle,
  hasChildren,
}: {
  node: OrgNode;
  onSelect: (node: OrgNode) => void;
  canEdit?: boolean;
  onEdit?: (node: OrgNode) => void;
  onDelete?: (node: OrgNode) => void;
  onAddMember?: (parentId: string) => void;
  drag?: DragHandlers;
  isExpanded?: boolean;
  onToggle?: (id: string) => void;
  hasChildren?: boolean;
}) {
  const isDragging = drag?.dragNodeId === node.id;
  const isDropTarget = drag?.dropZoneId === node.id && drag?.dragNodeId !== node.id;

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", node.id);
    e.dataTransfer.effectAllowed = "move";
    drag?.onDragStart(node.id);
  }

  function handleDragOver(e: React.DragEvent) {
    if (!drag?.dragNodeId || drag.dragNodeId === node.id) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    drag?.onDragOver(node.id);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.stopPropagation();
    drag?.onDragLeave();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!drag?.dragNodeId || drag.dragNodeId === node.id) return;
    drag?.onDrop(node.id);
  }

  return (
    <div className={`org-node ${hasChildren ? "has-children" : ""}`} draggable={!!canEdit} onDragStart={handleDragStart} onDragEnd={() => drag?.onDragEnd()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <div className="org-node-card-wrap">
        {hasChildren && (
          <button type="button" className="org-toggle-btn" onClick={(e) => { e.stopPropagation(); onToggle?.(node.id); }} title={isExpanded ? "Replier" : "Déplier"}>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
        <div role="button" tabIndex={0} className={`org-node-card ${isDragging ? "org-node-card--dragging" : ""} ${isDropTarget ? "org-node-card--drop-target" : ""}`} onClick={() => !isDragging && onSelect(node)} onKeyDown={(e) => e.key === "Enter" && onSelect(node)}>
          <span className="org-node-avatar" aria-hidden>
            {node.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("")}
          </span>
          <span className="org-node-name">{node.name}</span>
          <span className="org-node-title">{node.title || node.department}</span>
          {node.email && <span className="org-node-email">{node.email}</span>}
          {canEdit && <span className="org-node-drag-hint"><Move size={11} /></span>}
        </div>
        {canEdit && (
          <div className="org-node-actions">
            <button type="button" className="org-node-action" onClick={() => onEdit?.(node)} title="Modifier"><Pencil size={13} /></button>
            <button type="button" className="org-node-action" onClick={() => onAddMember?.(node.id)} title="Ajouter membres"><UserPlus size={13} /></button>
            <button type="button" className="org-node-action delete" onClick={() => onDelete?.(node)} title="Supprimer"><Trash2 size={13} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function OrgSubTree({
  node,
  onSelect,
  canEdit,
  onEdit,
  onDelete,
  onAddMember,
  drag,
  isExpanded,
  onToggle,
}: {
  node: OrgNode;
  onSelect: (node: OrgNode) => void;
  canEdit?: boolean;
  onEdit?: (node: OrgNode) => void;
  onDelete?: (node: OrgNode) => void;
  onAddMember?: (parentId: string) => void;
  drag?: DragHandlers;
  isExpanded?: boolean;
  onToggle?: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const showChildren = hasChildren && isExpanded;

  function handleChildrenDragOver(e: React.DragEvent) {
    if (!drag?.dragNodeId || drag.dragNodeId === node.id) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    drag?.onDragOver(`children-${node.id}`);
  }

  function handleChildrenDragLeave(e: React.DragEvent) {
    e.stopPropagation();
    drag?.onDragLeave();
  }

  function handleChildDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!drag?.dragNodeId || drag.dragNodeId === node.id) return;
    drag?.onDrop(node.id);
  }

  const isChildrenDrop = drag?.dropZoneId === `children-${node.id}` && drag?.dragNodeId !== node.id;

  return (
    <div className={`org-branch ${hasChildren ? "has-children" : ""}`}>
      <OrgNodeCard node={node} onSelect={onSelect} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} onAddMember={onAddMember} drag={drag} isExpanded={isExpanded} onToggle={onToggle} hasChildren={hasChildren} />
      {showChildren && (
        <>
          <div className="org-connector-v" />
          <div className={`org-children ${isChildrenDrop ? "org-children--drop" : ""}`} onDragOver={handleChildrenDragOver} onDragLeave={handleChildrenDragLeave} onDrop={handleChildDrop}>
            {node.children.map((child) =>
              child.children.length > 0 ? (
                <OrgSubTree key={child.id} node={child} onSelect={onSelect} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} onAddMember={onAddMember} drag={drag} isExpanded={isExpanded} onToggle={onToggle} />
              ) : (
                <OrgNodeCard key={child.id} node={child} onSelect={onSelect} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} onAddMember={onAddMember} drag={drag} />
              )
            )}
            {canEdit && (
              <button type="button" className="org-node-add" onClick={() => onAddMember?.(node.id)}>
                <Plus size={14} /> Ajouter membres
              </button>
            )}
          </div>
        </>
      )}
      {!showChildren && hasChildren && !canEdit && (
        <button type="button" className="org-toggle-collapsed" onClick={() => onToggle?.(node.id)} title="Afficher les membres">
          <ChevronRight size={14} /> {node.children.length} membre{node.children.length > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

type OrgFormData = { name: string; title: string; email: string; department: string };
const emptyForm: OrgFormData = { name: "", title: "", email: "", department: "" };

function findNode(nodes: OrgNode[], id: string): OrgNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

function isDescendant(nodes: OrgNode[], ancestorId: string, targetId: string): boolean {
  const ancestor = findNode(nodes, ancestorId);
  if (!ancestor) return false;
  for (const child of ancestor.children) {
    if (child.id === targetId) return true;
    if (isDescendant(child.children, child.id, targetId)) return true;
  }
  return false;
}

export function OrgChart({ nodes: initialNodes, canEdit = false }: { nodes: OrgNode[]; canEdit?: boolean }) {
  const [nodes, setNodes] = useState<OrgNode[]>(initialNodes);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const canEditRef = useRef(canEdit);
  canEditRef.current = canEdit;
  const [selected, setSelected] = useState<OrgNode | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<OrgFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgNode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dropZoneId, setDropZoneId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const set = new Set<string>();
    initialNodes.forEach((n) => set.add(n.id));
    return set;
  });

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const refreshTree = useCallback(async () => {
    try {
      const res = await fetch("/api/org");
      if (res.ok) {
        const data: OrgNode[] = await res.json();
        setNodes(data);
      }
    } catch { addToast("error", "Erreur lors du rafraîchissement"); }
  }, [addToast]);

  function toggleExpand(id: string) {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const drag: DragHandlers = {
    dragNodeId,
    dropZoneId,
    onDragStart: (id) => setDragNodeId(id),
    onDragEnd: () => { setDragNodeId(null); setDropZoneId(null); },
    onDragOver: (id) => setDropZoneId(id),
    onDragLeave: () => setDropZoneId(null),
    onDrop: async (targetId) => {
      const sourceId = dragNodeId;
      if (!sourceId) { setDragNodeId(null); setDropZoneId(null); return; }
      const currentNodes = nodesRef.current;
      if (isDescendant(currentNodes, sourceId, targetId)) {
        addToast("error", "Impossible de déplacer un élément vers ses descendants");
        setDragNodeId(null); setDropZoneId(null);
        return;
      }
      const actualParentId = targetId.startsWith("children-") ? targetId.slice(9) : targetId;
      setDragNodeId(null); setDropZoneId(null);
      try {
        const res = await fetch(`/api/org/${sourceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId: targetId === sourceId ? null : actualParentId }),
        });
        if (res.ok) {
          addToast("success", "Élément déplacé");
          await refreshTree();
        } else {
          addToast("error", "Erreur lors du déplacement");
        }
      } catch {
        addToast("error", "Erreur lors du déplacement");
      }
    },
  };

  function openAdd(parent?: string | null) {
    setFormData(emptyForm);
    setEditingId(null);
    setParentId(parent ?? null);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(node: OrgNode) {
    setFormData({ name: node.name, title: node.title || "", email: node.email || "", department: node.department });
    setEditingId(node.id);
    setParentId(null);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formData.name.trim() || !formData.department.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        const res = await fetch(`/api/org/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(), title: formData.title.trim() || null,
            email: formData.email.trim() || null, department: formData.department.trim(),
          }),
        });
        if (!res.ok) { const err = await res.json().catch(() => ({})); setFormError(err.error || "Erreur"); return; }
        addToast("success", "Élément modifié");
      } else {
        const res = await fetch("/api/org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(), title: formData.title.trim() || null,
            email: formData.email.trim() || null, department: formData.department.trim(), parentId: parentId,
          }),
        });
        if (!res.ok) { const err = await res.json().catch(() => ({})); setFormError(err.error || "Erreur"); return; }
        addToast("success", "Élément ajouté");
      }
      setShowForm(false);
      await refreshTree();
    } finally { setSaving(false); }
  }

  function confirmDelete(node: OrgNode) { setDeleteTarget(node); }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/org/${deleteTarget.id}`, { method: "DELETE" });
      addToast("success", res.ok ? `${deleteTarget.name} supprimé` : "Erreur");
      setDeleteTarget(null);
      if (res.ok) await refreshTree();
    } catch { addToast("error", "Erreur"); setDeleteTarget(null); }
    finally { setDeleting(false); }
  }

  function renderDeleteConfirm() {
    if (!deleteTarget) return null;
    return (
      <div className="org-confirm-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
        <div className="org-confirm-card" onClick={(e) => e.stopPropagation()}>
          <h3>Confirmer la suppression</h3>
          <p>Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget.name}</strong>{deleteTarget.children.length > 0 && " ainsi que ses sous-éléments"} ?</p>
          <div className="org-confirm-actions">
            <button type="button" className="btn" onClick={() => setDeleteTarget(null)} disabled={deleting}>Annuler</button>
            <button type="button" className="btn btn-primary" style={{ background: "var(--danger, #dc2626)" }} onClick={handleDelete} disabled={deleting}>
              {deleting ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderForm() {
    if (!showForm) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowForm(false)}>
        <div className="modal-card org-form-card" onClick={(e) => e.stopPropagation()}>
          <div className="org-form-header">
            <h3>{editingId ? "Modifier" : "Ajouter"} un élément</h3>
            <button type="button" className="modal-close" onClick={() => setShowForm(false)} aria-label="Fermer"><X size={18} /></button>
          </div>
          <div className="org-form">
            {formError && <p className="org-form-error">{formError}</p>}
            <label>Nom *<input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></label>
            <label>Titre / Poste<input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></label>
            <label>Email<input type="text" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></label>
            <label>Département *<input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required /></label>
            <div className="org-form-actions">
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || !formData.name.trim() || !formData.department.trim()}>
                <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderToasts() {
    if (toasts.length === 0) return null;
    return (
      <div className="org-toast-container">
        {toasts.map((t) => <div key={t.id} className={`org-toast ${t.type}`}>{t.message}</div>)}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div>
        <p style={{ color: "var(--text-muted)" }}>Organigramme en cours de mise à jour.</p>
        {canEdit && (
          <button type="button" className="btn btn-primary" onClick={() => openAdd(null)} style={{ marginTop: "1rem" }}>
            <Plus size={16} /> Créer le premier département
          </button>
        )}
        {renderForm()}
        {renderToasts()}
      </div>
    );
  }

  return (
    <>
      <div className="org-toolbar">
        {canEdit && (
          <>
            <button type="button" className={`btn ${editMode ? "btn-primary" : ""}`} onClick={() => setEditMode(!editMode)}>
              <Pencil size={16} /> {editMode ? "Mode édition actif" : "Mode édition"}
            </button>
            {editMode && (
              <button type="button" className="btn btn-primary" onClick={() => openAdd(null)}>
                <Plus size={16} /> Ajouter un département
              </button>
            )}
          </>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => setExpandedNodes(new Set(nodes.map((n) => n.id)))}>
          Tout déplier
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setExpandedNodes(new Set())}>
          Tout replier
        </button>
      </div>

      <div className="org-tree" onDragOver={(e) => { if (canEdit && editMode) { e.preventDefault(); e.stopPropagation(); } }} onDrop={async (e) => { if (!dragNodeId || !editMode) return; e.preventDefault(); e.stopPropagation(); drag.onDrop(dragNodeId); }}>
        {nodes.map((dept) => (
          <section key={dept.id} className="org-department">
            <OrgSubTree
              node={dept}
              onSelect={setSelected}
              canEdit={editMode}
              onEdit={openEdit}
              onDelete={confirmDelete}
              onAddMember={openAdd}
              drag={canEdit && editMode ? drag : undefined}
              isExpanded={expandedNodes.has(dept.id)}
              onToggle={toggleExpand}
            />
          </section>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <article className="modal-card org-profile-modal" onClick={(e) => e.stopPropagation()}>
            <header className="org-profile-header">
              <span className="org-profile-avatar" aria-hidden>
                {selected.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("")}
              </span>
              <div>
                <h2>{selected.name}</h2>
                <p>{selected.title || selected.department}</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelected(null)} aria-label="Fermer"><X size={20} /></button>
            </header>
            <section className="org-profile-body">
              <p>Collaborateur du département <strong>{selected.department}</strong> chez VALUE-IT.</p>
              {selected.email && <p>Email : <a href={`mailto:${selected.email}`}>{selected.email}</a></p>}
              <h3>Compétences</h3>
              <div className="org-skill-tags">
                {getSkills(selected.department).map((tag) => <span key={tag} className="org-skill-tag">{tag}</span>)}
              </div>
              <h3>Projets en cours</h3>
              <p className="org-profile-projects">Contribution aux initiatives {selected.department} — portail intranet, qualité SOC 2 et satisfaction client.</p>
            </section>
          </article>
        </div>
      )}

      {renderForm()}
      {renderDeleteConfirm()}
      {renderToasts()}
    </>
  );
}
