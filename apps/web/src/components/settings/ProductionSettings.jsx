import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';

const ProductionSettings = ({ settings, updateSettings }) => {
    const [columns, setColumns] = useState(settings?.production?.columns || [
        { id: 'artwork_prep', label: 'Artwork Prep', color: '#3b82f6' },
        { id: 'laser_engraving', label: 'Laser Engraving', color: '#eab308' },
        { id: 'quality_check', label: 'Quality Check', color: '#22c55e' }
    ]);

    const handleSave = () => {
        updateSettings({
            ...settings,
            production: {
                ...settings.production,
                columns
            }
        });
    };

    const addColumn = () => {
        const id = `col_${Date.now()}`;
        setColumns([...columns, { id, label: 'New Stage', color: '#94a3b8' }]);
    };

    const removeColumn = (id) => {
        setColumns(columns.filter(c => c.id !== id));
    };

    const updateColumn = (id, field, value) => {
        setColumns(columns.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Production Pipeline</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure the stages for your production Kanban board.
                    </p>
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>

            <div className="bg-card border rounded-lg p-6 space-y-4">
                {columns.map((col, index) => (
                    <div key={col.id} className="flex items-center gap-4 bg-muted/30 p-3 rounded-md border">
                        <GripVertical className="text-muted-foreground cursor-move" size={20} />

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                placeholder="Stage Label"
                                className="bg-background border rounded px-3 py-2 text-sm"
                                value={col.label}
                                onChange={(e) => updateColumn(col.id, 'label', e.target.value)}
                            />

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Color:</span>
                                <input
                                    type="color"
                                    className="h-9 w-20 cursor-pointer rounded border p-1"
                                    value={col.color}
                                    onChange={(e) => updateColumn(col.id, 'color', e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Slug:</span>
                                <code className="bg-muted px-2 py-1 rounded text-xs text-muted-foreground">
                                    {col.id}
                                </code>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeColumn(col.id)}
                        >
                            <Trash2 size={18} />
                        </Button>
                    </div>
                ))}

                <Button variant="outline" className="w-full border-dashed" onClick={addColumn}>
                    <Plus size={16} className="mr-2" /> Add Production Stage
                </Button>
            </div>
        </div>
    );
};

export default ProductionSettings;
