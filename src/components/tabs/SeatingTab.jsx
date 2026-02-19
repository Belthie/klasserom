(function () {
    window.SeatingTab = ({
        layout,
        students,
        roomConfig,
        onUpdateConfig,
        onGenerate,
        onSwap,
        onAssign,
        score,
        customGroups
    }) => {
        return (
            <div className="flex h-full">
                {/* Sidebar Controls */}
                <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col h-full overflow-y-auto shrink-0 z-10">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <window.Icon name="map" size={24} className="text-indigo-600" />
                        Plassering
                    </h2>

                    <div className="space-y-6">
                        <button
                            onClick={onGenerate}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <window.Icon name="sparkles" size={18} />
                            Generer Plassering
                        </button>

                        <div className="border-t border-slate-100 pt-6">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-4">Algoritme Innstillinger</label>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors bg-white">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${roomConfig.enableGenderBalance ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                        {roomConfig.enableGenderBalance && <window.Icon name="check" size={14} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={roomConfig.enableGenderBalance}
                                        onChange={e => onUpdateConfig('enableGenderBalance', e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-slate-700">Kjønnsbalanse</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors bg-white">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${roomConfig.enableAcademicDiversity ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                        {roomConfig.enableAcademicDiversity && <window.Icon name="check" size={14} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={roomConfig.enableAcademicDiversity}
                                        onChange={e => onUpdateConfig('enableAcademicDiversity', e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-slate-700">Faglig spredning</span>
                                </label>
                            </div>
                        </div>

                        {score && (
                            <div className={`mt-6 p-4 rounded-xl border ${score.violations.length === 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                <h4 className={`font-bold text-sm mb-2 ${score.violations.length === 0 ? 'text-green-800' : 'text-red-800'}`}>
                                    Status
                                </h4>
                                {score.violations.length === 0 ? (
                                    <p className="text-xs text-green-700 flex items-center gap-2">
                                        <window.Icon name="check-circle" size={14} />
                                        Alle regler er oppfylt!
                                    </p>
                                ) : (
                                    <ul className="space-y-1">
                                        {score.violations.map((v, i) => (
                                            <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                                                <window.Icon name="x-circle" size={12} className="mt-0.5 shrink-0" />
                                                <span>{v.student.name} må flyttes</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 bg-slate-50 p-8 overflow-auto flex flex-col items-center">
                    <div className="w-full max-w-5xl">
                        <div className="w-full h-10 mb-6 bg-slate-200/50 rounded-lg flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em] border border-dashed border-slate-300">
                            Tavle
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                            <window.GridMap
                                layout={layout}
                                roomConfig={roomConfig}
                                students={students}
                                onSwap={onSwap}
                                onAssign={onAssign}
                                customGroups={customGroups}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };
})();
