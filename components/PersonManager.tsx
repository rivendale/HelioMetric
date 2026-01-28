'use client';

import React, { useState } from 'react';
import {
  useSystemState,
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_LABELS,
  type RelationshipType,
  type FamilyNode,
} from '@/context/SystemState';
import { UserPlus, Pencil, Trash2, Check, Clock, Calendar, Users } from 'lucide-react';

// Element color utilities
const ELEMENT_COLOR: Record<string, string> = {
  Fire: 'text-red-400',
  Earth: 'text-amber-400',
  Metal: 'text-gray-300',
  Water: 'text-blue-400',
  Wood: 'text-green-400',
};

const ELEMENT_BG: Record<string, string> = {
  Fire: 'bg-red-950/40',
  Earth: 'bg-amber-950/40',
  Metal: 'bg-gray-800/40',
  Water: 'bg-blue-950/40',
  Wood: 'bg-green-950/40',
};

// Relationship badge colors
const RELATIONSHIP_COLOR: Record<string, string> = {
  Self: 'bg-cyan-950/50 text-cyan-400 border-cyan-800/50',
  Partner: 'bg-pink-950/50 text-pink-400 border-pink-800/50',
  Spouse: 'bg-pink-950/50 text-pink-400 border-pink-800/50',
  Parent: 'bg-purple-950/50 text-purple-400 border-purple-800/50',
  Child: 'bg-green-950/50 text-green-400 border-green-800/50',
  Sibling: 'bg-amber-950/50 text-amber-400 border-amber-800/50',
  Grandparent: 'bg-violet-950/50 text-violet-400 border-violet-800/50',
  Grandchild: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50',
  Friend: 'bg-blue-950/50 text-blue-400 border-blue-800/50',
  Colleague: 'bg-slate-800/50 text-slate-300 border-slate-700/50',
  Other: 'bg-gray-800/50 text-gray-400 border-gray-700/50',
};

interface PersonFormData {
  name: string;
  birthDate: string;
  birthTime: string;
  relationship: RelationshipType;
}

function PersonForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: PersonFormData;
  onSubmit: (data: PersonFormData) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<PersonFormData>(
    initial || { name: '', birthDate: '', birthTime: '', relationship: 'Other' }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.birthDate) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-950 border border-gray-700 rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Name */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter name"
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:border-cyan-600 focus:outline-none"
            required
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Relationship</label>
          <select
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value as RelationshipType })}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:border-cyan-600 focus:outline-none"
          >
            {RELATIONSHIP_OPTIONS.map((rel) => (
              <option key={rel} value={rel}>
                {RELATIONSHIP_LABELS[rel]}
              </option>
            ))}
          </select>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            <Calendar className="w-3 h-3 inline mr-1" />
            Date of Birth
          </label>
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:border-cyan-600 focus:outline-none"
            required
          />
        </div>

        {/* Time of Birth (optional) */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            <Clock className="w-3 h-3 inline mr-1" />
            Time of Birth <span className="text-gray-600">(optional)</span>
          </label>
          <input
            type="time"
            value={form.birthTime}
            onChange={(e) => setForm({ ...form, birthTime: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:border-cyan-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!form.name.trim() || !form.birthDate}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-900/50 border border-cyan-700 text-cyan-300 rounded text-sm font-medium hover:bg-cyan-800/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function PersonCard({
  node,
  onEdit,
  onRemove,
}: {
  node: FamilyNode;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const relColor = RELATIONSHIP_COLOR[node.relationship] || RELATIONSHIP_COLOR.Other;
  const elemColor = ELEMENT_COLOR[node.zodiacSign.element] || 'text-gray-400';
  const elemBg = ELEMENT_BG[node.zodiacSign.element] || 'bg-gray-900';

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${elemBg}`}>
            {node.zodiacSign.name === 'Rat' ? '🐀' :
             node.zodiacSign.name === 'Ox' ? '🐂' :
             node.zodiacSign.name === 'Tiger' ? '🐅' :
             node.zodiacSign.name === 'Rabbit' ? '🐇' :
             node.zodiacSign.name === 'Dragon' ? '🐉' :
             node.zodiacSign.name === 'Snake' ? '🐍' :
             node.zodiacSign.name === 'Horse' ? '🐎' :
             node.zodiacSign.name === 'Goat' ? '🐐' :
             node.zodiacSign.name === 'Monkey' ? '🐒' :
             node.zodiacSign.name === 'Rooster' ? '🐓' :
             node.zodiacSign.name === 'Dog' ? '🐕' :
             node.zodiacSign.name === 'Pig' ? '🐖' : '?'}
          </div>
          <div>
            <div className="font-semibold text-gray-100">{node.name}</div>
            <div className={`text-xs px-2 py-0.5 rounded border inline-block ${relColor}`}>
              {RELATIONSHIP_LABELS[node.relationship]}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {node.relationship !== 'Self' && (
            <button
              onClick={onRemove}
              className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Chinese Zodiac */}
        <div className="bg-gray-950 rounded p-2">
          <div className="text-gray-500 mb-0.5">Chinese Zodiac</div>
          <div className={`font-semibold ${elemColor}`}>
            {node.zodiacSign.name}
          </div>
          <div className="text-gray-500">
            {node.zodiacSign.element} Element
          </div>
        </div>

        {/* Western Zodiac */}
        <div className="bg-gray-950 rounded p-2">
          <div className="text-gray-500 mb-0.5">Western Zodiac</div>
          {node.westernZodiac ? (
            <>
              <div className="font-semibold text-indigo-400">
                {node.westernZodiac.symbol} {node.westernZodiac.name}
              </div>
              <div className="text-gray-500">
                {node.westernZodiac.element} - {node.westernZodiac.modality}
              </div>
            </>
          ) : (
            <div className="text-gray-600 italic">Add DOB to see</div>
          )}
        </div>
      </div>

      {/* Birth info */}
      <div className="mt-2 text-xs text-gray-500 flex gap-3">
        {node.birthDate && (
          <span>
            <Calendar className="w-3 h-3 inline mr-1" />
            {new Date(node.birthDate + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        )}
        {node.birthTime && (
          <span>
            <Clock className="w-3 h-3 inline mr-1" />
            {node.birthTime}
          </span>
        )}
        {!node.birthDate && (
          <span>Year: {node.birthYear}</span>
        )}
      </div>
    </div>
  );
}

export function PersonManager() {
  const { state, addNode, updateNode, removeNode } = useSystemState();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = (data: PersonFormData) => {
    const dateObj = new Date(data.birthDate + 'T12:00:00');
    addNode({
      name: data.name,
      birthYear: dateObj.getFullYear(),
      birthDate: data.birthDate,
      birthTime: data.birthTime || undefined,
      birthHour: data.birthTime ? parseInt(data.birthTime.split(':')[0], 10) : undefined,
      role: data.relationship === 'Self' ? 'Primary' : 'Dependent',
      relationship: data.relationship,
    });
    setShowAddForm(false);
  };

  const handleUpdate = (id: string, data: PersonFormData) => {
    const dateObj = new Date(data.birthDate + 'T12:00:00');
    updateNode(id, {
      name: data.name,
      birthYear: dateObj.getFullYear(),
      birthDate: data.birthDate,
      birthTime: data.birthTime || undefined,
      birthHour: data.birthTime ? parseInt(data.birthTime.split(':')[0], 10) : undefined,
      role: data.relationship === 'Self' ? 'Primary' : 'Dependent',
      relationship: data.relationship,
    });
    setEditingId(null);
  };

  const handleRemove = (id: string) => {
    removeNode(id);
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800">
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-cyan-400 font-[family-name:var(--font-geist-mono)]">
              People
            </h2>
            <p className="text-xs text-gray-500">
              {state.nodes.length} {state.nodes.length === 1 ? 'person' : 'people'} tracked
            </p>
          </div>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-900/30 border border-cyan-800 text-cyan-400 rounded text-sm font-medium hover:bg-cyan-900/50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Person
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-4">
          <PersonForm
            onSubmit={handleAdd}
            onCancel={() => setShowAddForm(false)}
            submitLabel="Add Person"
          />
        </div>
      )}

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {state.nodes.map((node) =>
          editingId === node.id ? (
            <PersonForm
              key={node.id}
              initial={{
                name: node.name,
                birthDate: node.birthDate || '',
                birthTime: node.birthTime || '',
                relationship: node.relationship,
              }}
              onSubmit={(data) => handleUpdate(node.id, data)}
              onCancel={() => setEditingId(null)}
              submitLabel="Save"
            />
          ) : (
            <PersonCard
              key={node.id}
              node={node}
              onEdit={() => setEditingId(node.id)}
              onRemove={() => handleRemove(node.id)}
            />
          )
        )}
      </div>

      {state.nodes.length === 0 && !showAddForm && (
        <div className="text-center py-8">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No people added yet.</p>
          <p className="text-gray-600 text-xs mt-1">
            Add yourself and your family to see zodiac profiles and compatibility.
          </p>
        </div>
      )}
    </section>
  );
}
