(function () {
    window.StudentsTab = ({ students, onImport, onUpdateStudent, onDeleteStudent, onClearRoster }) => {
        const [importText, setImportText] = React.useState('');
        const [showImport, setShowImport] = React.useState(false);

        const handleBulkImport = () => {
            if (!importText.trim()) return;
            const lines = importText.split(/\n/).map(s => s.trim()).filter(Boolean);
            if (lines.length > 0) {
                onImport(lines);
                setImportText('');
                setShowImport(false);
            }
        };

        const sections = [
            { id: 1, label: 'Trenger støtte', color: 'bg-red-50 text-red-700 border-red-100' },
            { id: 2, label: 'Middels', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
            { id: 3, label: 'Sterk', color: 'bg-green-50 text-green-700 border-green-100' }
        ];

        return (
            <div className="p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Elever ({students.length})</h2>
                        <p className="text-slate-500">Administrer klasselisten og sett individuelle behov.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClearRoster}
                            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                            Slett alle
                        </button>
                        <button
                            onClick={() => setShowImport(!showImport)}
                            className="px-4 py-2 text-sm bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-2"
                        >
                            <window.Icon name="list" size={16} /> Importer liste
                        </button>
                        <button
                            onClick={() => onImport(['Ny Elev'])}
                            className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2"
                        >
                            <window.Icon name="plus" size={16} /> Legg til elev
                        </button>
                    </div>
                </div>

                {/* Import Area */}
                {showImport && (
                    <div className="mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Lim inn navn (ett per linje)</label>
                        <textarea
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            className="w-full h-32 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                            placeholder="Ola Nordmann&#10;Kari Nordmann..."
                        ></textarea>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Avbryt</button>
                            <button onClick={handleBulkImport} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Importer</button>
                        </div>
                    </div>
                )}

                {/* Student List (Vertical) */}
                {students.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <window.Icon name="users" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Ingen elever ennå</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-1">Start med å legge til elever manuelt eller importer en liste fra Excel/Word.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">#</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Navn</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Nivå / Kjønn</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40 text-right">Valg</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-3 text-slate-400 font-mono text-xs">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                                                    ${student.gender === 'M' ? 'bg-blue-50 text-blue-600' : student.gender === 'F' ? 'bg-pink-50 text-pink-600' : 'bg-slate-100 text-slate-500'}
                                                `}>
                                                    {student.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={student.name}
                                                    onChange={(e) => onUpdateStudent(student.id, { name: e.target.value })}
                                                    className="font-medium text-slate-900 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded px-2 py-1 w-full max-w-[200px]"
                                                />

                                                {/* Indicators */}
                                                <div className="flex gap-1 ml-2">
                                                    {(student.buddies || []).length > 0 && (
                                                        <window.Icon name="heart" size={12} className="text-green-500" />
                                                    )}
                                                    {(student.enemies || []).length > 0 && (
                                                        <window.Icon name="ban" size={12} className="text-red-500" />
                                                    )}
                                                    {(student.constraints || []).length > 0 && (
                                                        <window.Icon name="lock" size={12} className="text-amber-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={student.level || 2}
                                                    onChange={(e) => onUpdateStudent(student.id, { level: parseInt(e.target.value) })}
                                                    className="text-xs border border-slate-200 rounded px-2 py-1 bg-white outline-none focus:border-indigo-300"
                                                >
                                                    <option value={1}>Trenger støtte</option>
                                                    <option value={2}>Middels</option>
                                                    <option value={3}>Sterk</option>
                                                </select>
                                                <select
                                                    value={student.gender || 'O'}
                                                    onChange={(e) => onUpdateStudent(student.id, { gender: e.target.value })}
                                                    className="text-xs border border-slate-200 rounded px-2 py-1 bg-white outline-none focus:border-indigo-300 w-20"
                                                >
                                                    <option value="O">Ukjent</option>
                                                    <option value="M">Gutt</option>
                                                    <option value="F">Jente</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => onUpdateStudent(student.id, { _openEdit: true })}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                                                >
                                                    <window.Icon name="settings" size={14} />
                                                    Innstillinger
                                                </button>
                                                <button
                                                    onClick={() => onDeleteStudent(student.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-100 rounded hover:bg-red-50 hover:border-red-200 transition-all"
                                                    title="Slett elev"
                                                >
                                                    <window.Icon name="trash-2" size={14} />
                                                    Slett
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };
})();
