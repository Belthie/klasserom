
(function () {
    window.Sidebar = ({
        students,
        unassigned,
        onImport,
        onUpdateStudent,
        roomConfig,
        onUpdateConfig,
        onGenerate
    }) => {
        const [tab, setTab] = React.useState('roster'); // roster | settings
        const [importText, setImportText] = React.useState('');
        const [editingId, setEditingId] = React.useState(null);

        const handleImport = () => {
            const names = importText.split('\n').filter(n => n.trim().length > 0);
            if (names.length) onImport(names);
            setImportText('');
        };

        return (
            <div className="w-80 flex flex-col bg-white border-r border-slate-200 h-screen overflow-hidden print:hidden fixed left-0 top-0 bottom-0 z-40">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h1 className="font-bold text-slate-800 flex items-center gap-2">
                        <window.Icon name="layout-grid" className="text-brand-600" />
                        Classroom
                    </h1>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setTab('roster')} className={`p-1.5 rounded-md transition-all ${tab === 'roster' ? 'bg-white shadow text-brand-600' : 'text-slate-500'}`}><window.Icon name="users" size={16} /></button>
                        <button onClick={() => setTab('settings')} className={`p-1.5 rounded-md transition-all ${tab === 'settings' ? 'bg-white shadow text-brand-600' : 'text-slate-500'}`}><window.Icon name="settings-2" size={16} /></button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {tab === 'roster' ? (
                        <div className="p-4 space-y-6">
                            {/* Generator Action */}
                            <div className="p-4 bg-brand-50 rounded-xl border border-brand-100 shadow-sm">
                                <button onClick={onGenerate} className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2">
                                    <window.Icon name="wand-2" size={18} />
                                    Generate Plan
                                </button>
                            </div>

                            {/* Import */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><window.Icon name="user-plus" size={12} /> Bulk Add Students</h3>
                                <div className="relative group">
                                    <textarea
                                        className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none transition-all focus:bg-white"
                                        rows="3"
                                        placeholder="Paste names here (one per line)..."
                                        value={importText}
                                        onChange={e => setImportText(e.target.value)}
                                    />
                                    <button
                                        onClick={handleImport}
                                        disabled={!importText.trim()}
                                        className="absolute bottom-2 right-2 p-1.5 bg-white text-brand-600 rounded-md shadow-sm border border-slate-100 hover:bg-brand-50 disabled:opacity-50 transition-all"
                                        title="Add Students"
                                    >
                                        <window.Icon name="plus" size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Unassigned List */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                                    <span>Roster ({unassigned.length}/{students.length})</span>
                                </h3>
                                <div className="space-y-2 min-h-[100px] pb-10"
                                    onDragOver={e => e.preventDefault()}
                                >
                                    {unassigned.map(s => (
                                        <div
                                            key={s.id}
                                            draggable="true"
                                            className="cursor-grab active:cursor-grabbing"
                                            onDragStart={e => {
                                                e.dataTransfer.setData('type', 'sidebar_student');
                                                e.dataTransfer.setData('studentId', s.id);
                                            }}
                                        >
                                            <window.StudentCard
                                                student={s}
                                                onEdit={() => setEditingId(s.id)}
                                            />
                                        </div>
                                    ))}
                                    {unassigned.length === 0 && students.length > 0 && <div className="text-center py-4 text-slate-400 text-xs italic bg-slate-50 rounded-lg border border-dashed">All students seated</div>}
                                    {students.length === 0 && <div className="text-center py-4 text-slate-400 text-xs italic">No students yet. Import some!</div>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 space-y-6">
                            {/* Room Config */}
                            <section>
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><window.Icon name="grid-3x3" size={16} /> Room Dimensions</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1 font-medium">Rows</label>
                                        <input type="number" min="1" max="20" value={roomConfig.rows} onChange={e => onUpdateConfig('rows', +e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1 font-medium">Columns</label>
                                        <input type="number" min="1" max="20" value={roomConfig.cols} onChange={e => onUpdateConfig('cols', +e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-slate-400 text-center">Total Seats: {roomConfig.rows * roomConfig.cols}</div>
                            </section>
                        </div>
                    )}
                </div>

                {/* Edit Modal (Portal-like) */}
                {editingId && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setEditingId(null)}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden scale-100" onClick={e => e.stopPropagation()}>
                            {(() => {
                                const s = students.find(x => x.id === editingId);
                                if (!s) return null;
                                return (
                                    <div>
                                        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg">
                                                    {s.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{s.name}</h3>
                                                    <p className="text-xs text-slate-500">Edit Settings</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setEditingId(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><window.Icon name="x" size={20} /></button>
                                        </div>
                                        <div className="p-5 space-y-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Zone Constraints</label>
                                                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-brand-600">
                                                        <input type="checkbox" checked={s.constraints.includes('lock_front')}
                                                            onChange={e => {
                                                                // Toggle mutex locks
                                                                let newC = s.constraints.filter(x => x !== 'lock_front' && x !== 'lock_back');
                                                                if (e.target.checked) newC.push('lock_front');
                                                                onUpdateStudent(s.id, { constraints: newC });
                                                            }}
                                                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300" />
                                                        Lock to Front Row
                                                    </label>
                                                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-brand-600">
                                                        <input type="checkbox" checked={s.constraints.includes('lock_back')}
                                                            onChange={e => {
                                                                let newC = s.constraints.filter(x => x !== 'lock_front' && x !== 'lock_back');
                                                                if (e.target.checked) newC.push('lock_back');
                                                                onUpdateStudent(s.id, { constraints: newC });
                                                            }}
                                                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300" />
                                                        Lock to Back Row
                                                    </label>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Relationships</label>
                                                <div className="text-xs text-slate-500 mb-2">Select students to avoid (Separation):</div>
                                                <div className="relative">
                                                    <select
                                                        className="w-full p-2.5 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                                                        onChange={e => {
                                                            if (e.target.value && !s.enemies?.includes(e.target.value)) {
                                                                onUpdateStudent(s.id, { enemies: [...(s.enemies || []), e.target.value] });
                                                            }
                                                            e.target.value = "";
                                                        }}
                                                    >
                                                        <option value="">+ Add Person to Switch With</option>
                                                        {students.filter(x => x.id !== s.id && !(s.enemies || []).includes(x.id)).map(o => (
                                                            <option key={o.id} value={o.id}>{o.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                                                        <window.Icon name="chevron-down" size={16} />
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {(s.enemies || []).map(enId => {
                                                        const en = students.find(x => x.id === enId);
                                                        return (
                                                            <span key={enId} className="flex items-center gap-1 bg-red-50 border border-red-100 text-red-700 pl-2 pr-1 py-1 rounded-full text-xs font-medium">
                                                                <window.Icon name="ban" size={12} className="text-red-400" />
                                                                {en?.name || 'Unknown'}
                                                                <button onClick={() => onUpdateStudent(s.id, { enemies: s.enemies.filter(x => x !== enId) })} className="p-0.5 hover:bg-red-200 rounded-full ml-1"><window.Icon name="x" size={12} /></button>
                                                            </span>
                                                        );
                                                    })}
                                                    {(s.enemies || []).length === 0 && <span className="text-xs text-slate-400 italic">No separation rules set.</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 border-t bg-slate-50 flex justify-end">
                                            <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-100 shadow-sm">Done</button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        );
    };
})();
