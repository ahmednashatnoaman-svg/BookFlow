'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Settings, Plus, Trash2, Edit2, ChevronLeft, Loader2, Check, X } from 'lucide-react';
import { categoriesApi } from '@/lib/api';
import type { Category } from '@/types';

const ICONS = ['📚', '📖', '🔬', '💻', '🎨', '📝', '🌍', '🏛️', '💡', '🎯', '⚗️', '🧘', '🏃', '🍳', '💰', '🌱'];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const emptyForm = { name_en: '', name_ar: '', slug: '', icon: '📚' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    categoriesApi.list().then(setCategories).finally(() => setLoading(false));
  }, []);

  const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSaveNew = async () => {
    if (!form.name_en) return;
    setSaving(true);
    try {
      const cat = await categoriesApi.create({ ...form, slug: form.slug || slugify(form.name_en) });
      setCategories(prev => [...prev, cat]);
      setAddingNew(false);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    try {
      const updated = await categoriesApi.update(id, form);
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Listings in this category will lose their category.')) return;
    setDeleting(id);
    try {
      await categoriesApi.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (cat: Category) => {
    setForm({ name_en: cat.name_en, name_ar: cat.name_ar, slug: cat.slug, icon: cat.icon });
    setEditingId(cat.id);
    setAddingNew(false);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="page-container py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Categories</h1>
              <p className="text-muted-foreground text-sm">{categories.length} categories</p>
            </div>
          </div>
          <button type="button" onClick={() => { setAddingNew(true); setEditingId(null); setForm(emptyForm); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {/* Add new form */}
        {addingNew && (
          <div className="glass-card p-4 mb-4 border-primary/30">
            <p className="text-sm font-semibold mb-3">New Category</p>
            <CategoryForm form={form} setForm={setForm} />
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={handleSaveNew} disabled={saving || !form.name_en}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
              </button>
              <button type="button" onClick={() => setAddingNew(false)}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" /></div>
        ) : (
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="glass-card p-4">
                {editingId === cat.id ? (
                  <div>
                    <CategoryForm form={form} setForm={setForm} />
                    <div className="flex gap-2 mt-3">
                      <button type="button" onClick={() => handleSaveEdit(cat.id)} disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                      >Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{cat.name_en}</p>
                      <p className="text-xs text-muted-foreground">{cat.name_ar} · /{cat.slug}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button type="button" onClick={() => startEdit(cat)}
                        className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDelete(cat.id)} disabled={deleting === cat.id}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                      >
                        {deleting === cat.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryForm({
  form,
  setForm,
}: {
  form: { name_en: string; name_ar: string; slug: string; icon: string };
  setForm: (f: any) => void;
}) {
  const ICONS = ['📚', '📖', '🔬', '💻', '🎨', '📝', '🌍', '🏛️', '💡', '🎯', '⚗️', '🧘', '🏃', '🍳', '💰', '🌱'];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Name (EN) *</label>
          <input type="text" value={form.name_en}
            onChange={e => setForm((p: any) => ({ ...p, name_en: e.target.value }))}
            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="Fiction"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Name (AR) *</label>
          <input type="text" value={form.name_ar} dir="rtl"
            onChange={e => setForm((p: any) => ({ ...p, name_ar: e.target.value }))}
            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="روايات"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Slug</label>
          <input type="text" value={form.slug}
            onChange={e => setForm((p: any) => ({ ...p, slug: e.target.value }))}
            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="fiction"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Icon</label>
          <select value={form.icon}
            onChange={e => setForm((p: any) => ({ ...p, icon: e.target.value }))}
            className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
