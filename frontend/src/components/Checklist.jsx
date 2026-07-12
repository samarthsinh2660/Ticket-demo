import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Check, Plus, Trash2, Edit2, ChevronUp, ChevronDown, CheckSquare, Square, Save, X } from 'lucide-react';

export default function Checklist({ ticketId, readOnly = false }) {
  const [items, setItems] = useState([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChecklist();
  }, [ticketId]);

  const fetchChecklist = async () => {
    try {
      const response = await api.get(`/tickets/${ticketId}/checklist`);
      setItems(response.data.data.items || []);
    } catch (err) {
      console.error('Error fetching checklist:', err);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    try {
      setLoading(true);
      setError('');
      const response = await api.post(`/tickets/${ticketId}/checklist`, {
        title: newItemTitle.trim(),
      });
      setItems((prev) => [...prev, response.data.data.item]);
      setNewItemTitle('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add checklist item.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompleted = async (item) => {
    if (readOnly) return;
    try {
      const response = await api.patch(`/checklist/${item.id}`, {
        completed: !item.completed,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? response.data.data.item : i))
      );
    } catch (err) {
      console.error('Error toggling checklist item:', err);
    }
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditingTitle(item.title);
  };

  const handleSaveEdit = async (id) => {
    if (!editingTitle.trim()) return;
    try {
      setLoading(true);
      const response = await api.patch(`/checklist/${id}`, {
        title: editingTitle.trim(),
      });
      setItems((prev) =>
        prev.map((i) => (i.id === id ? response.data.data.item : i))
      );
      setEditingItemId(null);
    } catch (err) {
      console.error('Error updating checklist item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (readOnly) return;
    try {
      await api.delete(`/checklist/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error('Error deleting checklist item:', err);
    }
  };

  // Reordering checklist items
  const handleMoveOrder = async (index, direction) => {
    if (readOnly) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const listCopy = [...items];
    
    // Swap order values in DB
    const currentItem = listCopy[index];
    const targetItem = listCopy[targetIndex];

    try {
      // Swap local orders
      const tempOrder = currentItem.order;
      currentItem.order = targetItem.order;
      targetItem.order = tempOrder;

      // Update both items on DB
      await Promise.all([
        api.patch(`/checklist/${currentItem.id}`, { order: currentItem.order }),
        api.patch(`/checklist/${targetItem.id}`, { order: targetItem.order }),
      ]);

      // Re-sort list copy
      listCopy.sort((a, b) => a.order - b.order);
      setItems(listCopy);
    } catch (err) {
      console.error('Error swapping checklist order:', err);
      // Fallback
      fetchChecklist();
    }
  };

  // Compute stats
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 transition-colors duration-200">
      
      {/* Header and Progress */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200">Task Checklist</h5>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {completedCount} / {totalCount} Completed ({completionPercent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist items list */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 py-3 italic">
            No checklist items added.
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-sm ${
                item.completed
                  ? 'bg-slate-50/50 border-gray-200 dark:bg-slate-900/10 dark:border-gray-850 opacity-70'
                  : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-750'
              }`}
            >
              <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                {/* Checkbox */}
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleToggleCompleted(item)}
                  className={`mt-0.5 text-indigo-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {item.completed ? (
                    <CheckSquare className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Square className="w-4.5 h-4.5 text-gray-400 dark:text-gray-650" />
                  )}
                </button>

                {/* Title or Edit Input */}
                <div className="flex-1 min-w-0">
                  {editingItemId === item.id ? (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 px-2 py-0.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id)}
                        className="p-1 text-emerald-600 hover:text-emerald-500"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItemId(null)}
                        className="p-1 text-red-600 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p
                        className={`text-sm truncate text-gray-850 dark:text-gray-200 ${
                          item.completed ? 'line-through text-gray-450 dark:text-gray-500' : ''
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.completed && item.completedBy && (
                        <p className="text-[10px] text-gray-405 dark:text-gray-500 mt-0.5">
                          Checked by {item.completedBy.name} ({item.completedBy.role}){' '}
                          {item.completedAt &&
                            new Date(item.completedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons (Edit/Delete/Order) */}
              {!readOnly && editingItemId !== item.id && (
                <div className="flex items-center space-x-1.5 ml-2">
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white disabled:opacity-30"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'down')}
                    disabled={index === items.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white disabled:opacity-30"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1 text-gray-400 hover:text-amber-500 transition-colors"
                    title="Edit Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Item form */}
      {!readOnly && (
        <form onSubmit={handleAddItem} className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <input
            type="text"
            required
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            placeholder="Add task to checklist..."
          />
          <button
            type="submit"
            disabled={loading || !newItemTitle.trim()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
